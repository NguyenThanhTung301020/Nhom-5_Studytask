# scripts/prepare_avatars.ps1 – Chuẩn bị ảnh đại diện từ một thư mục ảnh (chạy trên Windows, PowerShell 5.1)
# Làm đúng như giao diện (components/AccountCards.js, toAvatarBlob): cắt vuông ở giữa, thu về 256×256, JPEG chất lượng 0,88
# (kèm xoay theo EXIF, nền trắng cho ảnh PNG trong suốt) để ảnh trên máy chủ nhẹ và đồng nhất như ảnh người dùng tự tải lên.
# Ví dụ:
#   powershell -File scripts\prepare_avatars.ps1 -Src <thư mục ảnh CÓ GIẤY PHÉP rõ ràng> -Dst du-lieu-thu\avatars-256
# Không dùng ảnh tải từ kết quả tìm kiếm (chưa rõ bản quyền). Bộ ảnh mặc định của dữ liệu mẫu do scripts/generate_avatars.py tự vẽ.
# Kết quả: <Dst>\avNNNN.jpg và <Dst>\manifest.csv (tên mới, tên gốc, kích thước gốc, kích thước mới); ảnh lỗi được liệt kê, không dừng cả mẻ.
param(
  [Parameter(Mandatory = $true)][string]$Src,
  [Parameter(Mandatory = $true)][string]$Dst,
  [int]$Size = 256,
  [int]$Quality = 88
)
Add-Type -AssemblyName System.Drawing
$ErrorActionPreference = 'Stop'
New-Item -ItemType Directory -Force -Path $Dst | Out-Null
$codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
$ep = New-Object System.Drawing.Imaging.EncoderParameters(1)
$ep.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, [long]$Quality)

$files = Get-ChildItem -LiteralPath $Src -File | Where-Object { $_.Extension -match '^\.(jpe?g|png|webp|gif|bmp)$' } | Sort-Object Name
$rows = New-Object System.Collections.Generic.List[string]
$rows.Add('file,original,original_bytes,bytes')
$bad = @(); $n = 0; $total = 0
foreach ($f in $files) {
  $img = $null; $bmp = $null; $g = $null
  try {
    $img = [System.Drawing.Image]::FromFile($f.FullName)
    if ($img.PropertyIdList -contains 0x0112) {              # chiều xoay EXIF (ảnh chụp bằng điện thoại)
      switch ($img.GetPropertyItem(0x0112).Value[0]) {
        3 { $img.RotateFlip([System.Drawing.RotateFlipType]::Rotate180FlipNone) }
        6 { $img.RotateFlip([System.Drawing.RotateFlipType]::Rotate90FlipNone) }
        8 { $img.RotateFlip([System.Drawing.RotateFlipType]::Rotate270FlipNone) }
      }
    }
    $side = [Math]::Min($img.Width, $img.Height)
    if ($side -lt 8) { throw 'ảnh quá nhỏ' }
    $x = [int](($img.Width - $side) / 2); $y = [int](($img.Height - $side) / 2)
    $bmp = New-Object System.Drawing.Bitmap $Size, $Size
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.Clear([System.Drawing.Color]::White)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.DrawImage($img, (New-Object System.Drawing.Rectangle 0, 0, $Size, $Size), $x, $y, $side, $side, [System.Drawing.GraphicsUnit]::Pixel)
    $n++
    $name = 'av{0:D4}.jpg' -f $n
    $out = Join-Path $Dst $name
    $bmp.Save($out, $codec, $ep)
    $len = (Get-Item -LiteralPath $out).Length; $total += $len
    $rows.Add(('{0},"{1}",{2},{3}' -f $name, $f.Name.Replace('"', '""'), $f.Length, $len))
  } catch {
    $bad += ('{0}: {1}' -f $f.Name, $_.Exception.Message)
  } finally {
    if ($g) { $g.Dispose() }; if ($bmp) { $bmp.Dispose() }; if ($img) { $img.Dispose() }
  }
}
[System.IO.File]::WriteAllLines((Join-Path $Dst 'manifest.csv'), $rows, (New-Object System.Text.UTF8Encoding($false)))
'Đã xử lý {0}/{1} ảnh, tổng {2:N1} MB (trung bình {3:N1} KB/ảnh); lỗi: {4}' -f $n, $files.Count, ($total / 1MB), ($total / [Math]::Max(1, $n) / 1KB), $bad.Count
$bad | ForEach-Object { 'LỖI ' + $_ }
