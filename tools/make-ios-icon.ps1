# 產生 iOS App 圖示 1024x1024(不透明、沒有 alpha 通道;Apple 規定,圓角由系統裁切)
# 來源:assets/images/icons/icon-maskable-512.png(圓形徽章 + 純色底),放大兩倍後存成 24 位元 PNG
# 如果之後有 1024 以上的原稿,把 $src 換掉再執行即可。用法:powershell -ExecutionPolicy Bypass -File tools\make-ios-icon.ps1
Add-Type -AssemblyName System.Drawing
$root = Split-Path -Parent $PSScriptRoot
$src = Join-Path $root 'assets\images\icons\icon-maskable-512.png'
$dst = Join-Path $root 'ios\icons\AppIcon-1024.png'
$img = [System.Drawing.Image]::FromFile($src)
$bmp = New-Object System.Drawing.Bitmap 1024, 1024, ([System.Drawing.Imaging.PixelFormat]::Format24bppRgb)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.Clear([System.Drawing.Color]::FromArgb(24, 27, 34)) # 來源圖的底色(透明處用它墊底)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$g.DrawImage($img, 0, 0, 1024, 1024)
$g.Dispose(); $img.Dispose()
$bmp.Save($dst, [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()
Write-Host "Wrote $dst"
