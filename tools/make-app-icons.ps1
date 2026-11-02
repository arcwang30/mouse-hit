# 由 APP 圖示原稿產生所有尺寸的圖示(網頁分頁、PWA、iOS 主畫面、iOS App)
# 原稿:assets/images/icons/source/app-icon-1024.jpg(1024x1024,圓角方形外框貼齊四邊,四角外面是白底)
#   一般圖示(favicon-64 / icon-192 / icon-512):沿外框把四角挖成透明,只留圓角方形
#   系統會自己裁形狀的(apple-touch-icon 180 / icon-maskable-512 / iOS AppIcon-1024):不透明滿版,四角填外框的深色
#   iOS AppIcon 依 Apple 規定存成沒有 alpha 通道的 24 位元 PNG
# 用法:powershell -ExecutionPolicy Bypass -File tools\make-app-icons.ps1
Add-Type -AssemblyName System.Drawing
$root = Split-Path -Parent $PSScriptRoot
$icons = Join-Path $root 'assets\images\icons'
$src = [System.Drawing.Image]::FromFile((Join-Path $icons 'source\app-icon-1024.jpg'))
$N = 1024
$R = 172   # 外框的圓角半徑(原稿量到約 174,往內收 2 像素避開白邊)
$INSET = 2
$DARK = [System.Drawing.Color]::FromArgb(27, 21, 18) # 外框的深色,用來填不透明版本的四角

# 在 1024 的畫布上畫出圓角方形的原稿(透明或深色底)
function New-Master([bool]$opaque) {
  $bmp = New-Object System.Drawing.Bitmap $N, $N, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  if ($opaque) { $g.Clear($DARK) } else { $g.Clear([System.Drawing.Color]::Transparent) }
  $a = $INSET; $b = $N - $INSET; $d = $R * 2
  $path = New-Object System.Drawing.Drawing2D.GraphicsPath
  $path.AddArc($a, $a, $d, $d, 180, 90)
  $path.AddArc($b - $d, $a, $d, $d, 270, 90)
  $path.AddArc($b - $d, $b - $d, $d, $d, 0, 90)
  $path.AddArc($a, $b - $d, $d, $d, 90, 90)
  $path.CloseFigure()
  $brush = New-Object System.Drawing.TextureBrush $src
  $g.FillPath($brush, $path)
  $brush.Dispose(); $path.Dispose(); $g.Dispose()
  return $bmp
}

# 把原稿縮成 size 存檔;rgb24 = 存成沒有 alpha 的 24 位元
function Save-Icon($master, [int]$size, [string]$out, [bool]$rgb24) {
  $fmt = if ($rgb24) { [System.Drawing.Imaging.PixelFormat]::Format24bppRgb } else { [System.Drawing.Imaging.PixelFormat]::Format32bppArgb }
  $bmp = New-Object System.Drawing.Bitmap $size, $size, $fmt
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  if ($rgb24) { $g.Clear($DARK) }
  $g.DrawImage($master, 0, 0, $size, $size)
  $g.Dispose()
  $bmp.Save($out, [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp.Dispose()
  Write-Host "Wrote $out ($size)"
}

$clear = New-Master $false
$solid = New-Master $true
Save-Icon $clear 64  (Join-Path $icons 'favicon-64.png') $false
Save-Icon $clear 192 (Join-Path $icons 'icon-192.png') $false
Save-Icon $clear 512 (Join-Path $icons 'icon-512.png') $false
Save-Icon $solid 180 (Join-Path $icons 'apple-touch-icon.png') $true
Save-Icon $solid 512 (Join-Path $icons 'icon-maskable-512.png') $true
Save-Icon $solid 1024 (Join-Path $root 'ios\icons\AppIcon-1024.png') $true
$clear.Dispose(); $solid.Dispose(); $src.Dispose()
