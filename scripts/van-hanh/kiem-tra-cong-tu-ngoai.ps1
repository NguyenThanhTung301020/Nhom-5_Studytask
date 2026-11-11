<#
  Kiểm tra từ NGOÀI mạng nhà: các cổng của máy chủ có bị lộ ra Internet không (việc 6 tuần 6).
  Phải chạy khi máy tính đang dùng mạng khác (phát 4G từ điện thoại), KHÔNG phải mạng LAN của máy chủ.
  Cách dùng (PowerShell, tại thư mục gốc repo):
      # Bước 1, khi còn ở mạng nhà: lấy địa chỉ IP công cộng của mạng nhà
      (Invoke-RestMethod https://api.ipify.org)
      # Bước 2: chuyển sang 4G, rồi chạy
      .\scripts\van-hanh\kiem-tra-cong-tu-ngoai.ps1 -Ip <ĐỊA_CHỈ_IP_Ở_BƯỚC_1>
  Chỉ thử kết nối TCP (không gửi dữ liệu, không dò mật khẩu). Kết quả ghi vào docs\van-hanh\bang-chung\<ngày>\
  với địa chỉ IP đã che octet cuối (repo công khai).
  Đạt khi không cổng nào ở trạng thái MỞ và trang web qua Cloudflare vẫn vào được.
#>
param(
  [Parameter(Mandatory = $true)][string]$Ip,
  [int[]]$Ports = @(22, 80, 443, 8787, 20241),
  [string]$Site = 'https://sutdytask.io.vn',
  [int]$TimeoutMs = 5000
)
$ErrorActionPreference = 'Stop'
if ($Ip -notmatch '^\d{1,3}(\.\d{1,3}){3}$') { throw "Địa chỉ IP không hợp lệ: $Ip" }
if ($Ip -match '^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|127\.)') { throw "$Ip là địa chỉ nội bộ. Cần IP công cộng (Bước 1 ở đầu tệp)." }

$mine = try { (Invoke-RestMethod 'https://api.ipify.org' -TimeoutSec 10).ToString().Trim() } catch { '' }
if (-not $mine) { throw 'Không xác định được IP hiện tại của máy này (không có Internet?).' }
if ($mine -eq $Ip) { throw "Máy này đang dùng chính mạng của máy chủ ($Ip). Chuyển sang 4G rồi chạy lại, kết quả hiện tại không có giá trị." }
function Mask($x) { ($x -split '\.')[0..2] -join '.' | ForEach-Object { "$_.x" } }

function Test-Tcp([string]$ip, [int]$port, [int]$ms) {
  $c = New-Object Net.Sockets.TcpClient
  try {
    $a = $c.BeginConnect($ip, $port, $null, $null)
    if (-not $a.AsyncWaitHandle.WaitOne($ms)) { return 'KHONG PHAN HOI' }
    try { $c.EndConnect($a); return 'MO' } catch { return 'TU CHOI' }
  } finally { $c.Close() }
}

$day = (Get-Date).ToUniversalTime().ToString('yyyy-MM-dd')
$repo = (Resolve-Path "$PSScriptRoot\..\..").Path
$dest = Join-Path $repo "docs\van-hanh\bang-chung\$day"
New-Item -ItemType Directory -Force $dest | Out-Null
$out = New-Object System.Collections.Generic.List[string]
$out.Add("Kiểm tra cổng từ ngoài - $((Get-Date).ToUniversalTime().ToString('yyyy-MM-dd HH:mm:ss')) UTC")
$out.Add("Mục tiêu: $(Mask $Ip) | Máy kiểm tra dùng IP: $(Mask $mine) (khác mục tiêu)")

$fail = $false
$rows = foreach ($p in $Ports) {
  $r = Test-Tcp $Ip $p $TimeoutMs
  if ($r -eq 'MO') { $fail = $true }
  [pscustomobject]@{ Cong = $p; KetQua = $r; Danh_gia = if ($r -eq 'MO') { 'LỖI: cổng mở ra Internet' } else { 'Đạt' } }
}
$tbl = ($rows | Format-Table -AutoSize | Out-String).TrimEnd()
$out.Add($tbl)

try {
  $sw = [Diagnostics.Stopwatch]::StartNew()
  $resp = Invoke-WebRequest $Site -UseBasicParsing -TimeoutSec 15
  $sw.Stop()
  $out.Add("Trang web qua Cloudflare ($Site): HTTP $($resp.StatusCode), $([math]::Round($sw.Elapsed.TotalSeconds, 2)) giây")
} catch { $out.Add("Trang web qua Cloudflare ($Site): LỖI $($_.Exception.Message)"); $fail = $true }

$out.Add($(if ($fail) { 'KẾT QUẢ: CÓ LỖI' } else { 'KẾT QUẢ: ĐẠT (không cổng nào mở từ ngoài; web vẫn vào được qua Cloudflare)' }))
$text = $out -join "`r`n"
Write-Host $text
$text | Out-File (Join-Path $dest 'kiem-tra-cong-tu-ngoai.txt') -Encoding utf8
Write-Host "Đã lưu: $dest\kiem-tra-cong-tu-ngoai.txt (IP đã che octet cuối)"
if ($fail) { exit 1 }
