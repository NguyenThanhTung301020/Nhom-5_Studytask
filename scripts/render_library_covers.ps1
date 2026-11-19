<#
  Vẽ trang bìa (trang 1) của từng tệp PDF thành ảnh JPEG nhỏ, bằng bộ đọc PDF có sẵn của Windows 10 (Windows.Data.Pdf), không cần cài thêm gì.
  Đầu vào: tệp danh mục JSON do scripts/prepare_library.py tạo (mỗi sách có id và đường dẫn tệp nguồn).
  Đầu ra: <Out>\<id>.jpg (rộng 360 px) và <Out>\pages.json ({id: số trang}). Sách nào không đọc được (PDF lỗi, có mật khẩu) thì
  vẽ bìa thay thế có tên sách (System.Drawing) và ghi số trang 0.

  Dùng:  powershell -NoProfile -ExecutionPolicy Bypass -File scripts\render_library_covers.ps1 -Manifest du-lieu-thu\library-staging\manifest.json -Out du-lieu-thu\library-staging\covers
#>
param([Parameter(Mandatory = $true)][string]$Manifest, [Parameter(Mandatory = $true)][string]$Out, [int]$Width = 360, [switch]$Overwrite)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Runtime.WindowsRuntime
Add-Type -AssemblyName System.Drawing
[void][Windows.Storage.StorageFile, Windows.Storage, ContentType = WindowsRuntime]
[void][Windows.Data.Pdf.PdfDocument, Windows.Data.Pdf, ContentType = WindowsRuntime]
[void][Windows.Storage.Streams.InMemoryRandomAccessStream, Windows.Storage.Streams, ContentType = WindowsRuntime]
[void][Windows.Data.Pdf.PdfPageRenderOptions, Windows.Data.Pdf, ContentType = WindowsRuntime]

$asTaskOp = ([System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object {
    $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1' })[0]
$asTaskAct = ([System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object {
    $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncAction' })[0]
function Wait-Task($t) { try { $t.Wait(-1) | Out-Null } catch { throw $t.Exception.InnerException } }
function Await($op, $type) { $t = $asTaskOp.MakeGenericMethod($type).Invoke($null, @($op)); Wait-Task $t; $t.Result }
function AwaitAction($op) { $t = $asTaskAct.Invoke($null, @($op)); Wait-Task $t }

New-Item -ItemType Directory -Force -Path $Out | Out-Null
$books = Get-Content -Raw -Encoding UTF8 $Manifest | ConvertFrom-Json
$jpeg = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
$pagesFile = Join-Path $Out 'pages.json'
$pages = @{}
if ((Test-Path $pagesFile) -and -not $Overwrite) { (Get-Content -Raw -Encoding UTF8 $pagesFile | ConvertFrom-Json).PSObject.Properties | ForEach-Object { $pages[$_.Name] = $_.Value } }

function Fallback-Cover($title, $dest) {
    $bmp = New-Object System.Drawing.Bitmap $Width, ([int]($Width * 1.4))
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.Clear([System.Drawing.Color]::FromArgb(52, 73, 120))
    $g.TextRenderingHint = 'AntiAliasGridFit'
    $font = New-Object System.Drawing.Font 'Segoe UI', 20, ([System.Drawing.FontStyle]::Bold)
    $rect = New-Object System.Drawing.RectangleF 24, 40, ($Width - 48), ($Width * 1.4 - 80)
    $g.DrawString($title, $font, [System.Drawing.Brushes]::White, $rect)
    $ep = New-Object System.Drawing.Imaging.EncoderParameters 1
    $ep.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter ([System.Drawing.Imaging.Encoder]::Quality), 85L
    $bmp.Save($dest, $jpeg, $ep); $g.Dispose(); $bmp.Dispose()
}

$ok = 0; $fb = 0; $skip = 0
foreach ($b in $books) {
    $dest = Join-Path $Out ($b.id + '.jpg')
    if ((Test-Path $dest) -and -not $Overwrite -and $pages.ContainsKey($b.id)) { $skip++; continue }
    try {
        $file = Await ([Windows.Storage.StorageFile]::GetFileFromPathAsync((Resolve-Path -LiteralPath $b.source).Path)) ([Windows.Storage.StorageFile])
        $doc = Await ([Windows.Data.Pdf.PdfDocument]::LoadFromFileAsync($file)) ([Windows.Data.Pdf.PdfDocument])
        $page = $doc.GetPage(0)
        $opt = New-Object Windows.Data.Pdf.PdfPageRenderOptions
        $opt.DestinationWidth = [uint32]$Width
        $ms = New-Object Windows.Storage.Streams.InMemoryRandomAccessStream
        AwaitAction ($page.RenderToStreamAsync($ms, $opt))                         # PNG; bộ mã hóa JPEG của Windows.Data.Pdf báo E_FAIL nên đổi sang JPEG bằng System.Drawing
        $bytes = New-Object byte[] $ms.Size
        $reader = New-Object Windows.Storage.Streams.DataReader $ms.GetInputStreamAt(0)
        [void](Await ($reader.LoadAsync([uint32]$ms.Size)) ([uint32]))
        $reader.ReadBytes($bytes)
        $img = [System.Drawing.Image]::FromStream((New-Object System.IO.MemoryStream (, $bytes)))
        $flat = New-Object System.Drawing.Bitmap $img.Width, $img.Height
        $g = [System.Drawing.Graphics]::FromImage($flat); $g.Clear([System.Drawing.Color]::White); $g.DrawImage($img, 0, 0, $img.Width, $img.Height)   # nền trắng (PDF trong suốt)
        $ep = New-Object System.Drawing.Imaging.EncoderParameters 1
        $ep.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter ([System.Drawing.Imaging.Encoder]::Quality), 85L
        $flat.Save($dest, $jpeg, $ep)
        $g.Dispose(); $flat.Dispose(); $img.Dispose()
        $pages[$b.id] = [int]$doc.PageCount
        $page.Dispose(); $ms.Dispose(); $ok++
    } catch {
        Write-Warning ("{0}: {1}" -f $b.id, $_.Exception.Message)
        Fallback-Cover $b.title $dest
        $pages[$b.id] = 0; $fb++
    }
}
$pages | ConvertTo-Json | Set-Content -Encoding UTF8 $pagesFile
Write-Host ("Xong: {0} bìa từ PDF, {1} bìa thay thế, {2} đã có sẵn → {3}" -f $ok, $fb, $skip, $Out)
