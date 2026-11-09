<#
  Thu bằng chứng kiểm tra máy chủ từ máy Windows (mốc T+7 / T+15).
  Cách dùng (PowerShell, tại thư mục gốc repo):
      .\scripts\van-hanh\thu-bang-chung.ps1 -Moc T7            # cửa sổ nhật ký 7 ngày
      .\scripts\van-hanh\thu-bang-chung.ps1 -Moc T15           # cửa sổ nhật ký 15 ngày
  Việc script làm: chép deploy/*.sh lên máy chủ -> chạy evidence-check.sh qua SSH (hỏi mật khẩu sudo)
  -> kéo gói kết quả về docs/van-hanh/bang-chung/<ngày>/ -> kiểm tra SHA256 -> so hash tệp trên máy chủ với repo.
  Chỉ đọc là chính; ngoại lệ có chủ đích: chạy tự kiểm tra SMART ngắn và studytask-restore-test.sh (thử khôi phục).
#>
param(
  [ValidateSet('T7', 'T15')][string]$Moc = 'T7',
  [string]$Server = 'studytask@192.168.2.187'
)
$ErrorActionPreference = 'Stop'
$repo = (Resolve-Path "$PSScriptRoot\..\..").Path
$since = if ($Moc -eq 'T15') { '-15 days' } else { '-7 days' }
$day = (Get-Date).ToUniversalTime().ToString('yyyy-MM-dd')
$dest = Join-Path $repo "docs\van-hanh\bang-chung\$day"
New-Item -ItemType Directory -Force $dest | Out-Null

Write-Host "1/4 Chép script lên máy chủ ($Server)..." -ForegroundColor Cyan
scp "$repo\deploy\evidence-check.sh" "$repo\deploy\health-check.sh" "${Server}:~/"
if ($LASTEXITCODE) { throw 'scp thất bại: kiểm tra mạng LAN, địa chỉ máy chủ, khóa/mật khẩu SSH.' }

Write-Host "2/4 Chạy thu bằng chứng (mất khoảng 4-5 phút, có hỏi mật khẩu sudo)..." -ForegroundColor Cyan
ssh -t $Server "sed -i 's/\r$//' ~/evidence-check.sh ~/health-check.sh && bash ~/evidence-check.sh '$since'"
if ($LASTEXITCODE) { throw 'Chạy trên máy chủ thất bại, xem thông báo ở trên.' }

Write-Host "3/4 Kéo kết quả về $dest ..." -ForegroundColor Cyan
scp "${Server}:~/health-logs/bang-chung-$day.tar.gz" "${Server}:~/health-logs/bang-chung-$day.tar.gz.sha256" $dest
if ($LASTEXITCODE) { throw 'Không kéo được gói kết quả.' }
$want = ((Get-Content "$dest\bang-chung-$day.tar.gz.sha256") -split '\s+')[0]
$got = (Get-FileHash "$dest\bang-chung-$day.tar.gz" -Algorithm SHA256).Hash.ToLower()
if ($want -ne $got) { throw "SHA256 không khớp (máy chủ $want, máy này $got)." }
tar -xzf "$dest\bang-chung-$day.tar.gz" -C $dest
Write-Host "   SHA256 khớp: $got" -ForegroundColor Green

Write-Host "4/4 So hash tệp đang chạy trên máy chủ với repo (master hiện tại)..." -ForegroundColor Cyan
$f16 = Get-Content "$dest\bang-chung-$day\16-api-dang-chay-ban-nao.txt" -Raw
$rows = foreach ($p in @(@('/opt/studytask/studytask_api.py', 'server\studytask_api.py'), @('/var/www/studytask/app.js', 'app.js'),
                          @('/var/www/studytask/pages/Profile.js', 'pages\Profile.js'), @('/var/www/studytask/pages/Graduation.js', 'pages\Graduation.js'))) {
  $m = [regex]::Match($f16, '([0-9a-f]{64})\s+' + [regex]::Escape($p[0]))
  $local = (Get-FileHash (Join-Path $repo $p[1]) -Algorithm SHA256).Hash.ToLower()
  [pscustomobject]@{ Tep = $p[0]; KhopRepo = if ($m.Success) { $m.Groups[1].Value -eq $local } else { 'không đọc được' } }
}
$rows | Format-Table -AutoSize | Out-String | Tee-Object "$dest\so-hash-voi-repo.txt"
Write-Host "Xong. Minh chứng nằm ở: $dest" -ForegroundColor Green
Write-Host "Việc còn lại bằng tay: chụp ảnh theo danh sách ở docs/van-hanh/03-huong-dan-kiem-tra-may-chu.md mục 5."
