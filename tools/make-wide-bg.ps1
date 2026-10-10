# Portrait background -> 16:9 wide version (for the PC / Steam build)
# The original sits in the middle (fit to height). Next to the seam each side continues it with a mirrored copy
# that turns blurry and fades out; further out there is only a heavily blurred, darkened "cover" version of the
# picture, so nothing recognisable (hero, arch, signs) is repeated.
# Usage: powershell -ExecutionPolicy Bypass -File tools/make-wide-bg.ps1 -SrcPath assets/images/backgrounds/title.jpg -DstPath assets/images/backgrounds/title_wide.jpg [-CropL 90 -CropR 90]
param(
  [Parameter(Mandatory)][string]$SrcPath,
  [Parameter(Mandatory)][string]$DstPath,
  [int]$Width = 1920, [int]$Height = 1080,
  [int]$CropL = 0, [int]$CropR = 0,   # source pixels to drop on the left / right (e.g. a corner watermark)
  [double]$Dark = 0.55,               # darkness at the outer edge (0-1)
  [double]$MirrorReach = 0.42              # how far (share of the side) the mirrored copy reaches before fading out
)
Add-Type -AssemblyName System.Drawing
$root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$orig = [System.Drawing.Image]::FromFile((Resolve-Path (Join-Path $root $SrcPath)).Path)

function New-Canvas([int]$w, [int]$h) {
  $b = New-Object System.Drawing.Bitmap $w, $h
  $g = [System.Drawing.Graphics]::FromImage($b)
  $g.InterpolationMode = 'HighQualityBicubic'; $g.SmoothingMode = 'HighQuality'; $g.PixelOffsetMode = 'HighQuality'; $g.CompositingQuality = 'HighQuality'
  return , @($b, $g)
}
# Downscale then upscale = soft blur
function Blur-Image($img, [int]$k) {
  $sw = [Math]::Max(2, [int]($img.Width / $k)); $sh = [Math]::Max(2, [int]($img.Height / $k))
  $c = New-Canvas $sw $sh; $c[1].DrawImage($img, 0, 0, $sw, $sh); $c[1].Dispose()
  $o = New-Canvas $img.Width $img.Height
  $attr = New-Object System.Drawing.Imaging.ImageAttributes; $attr.SetWrapMode('TileFlipXY')
  $o[1].DrawImage($c[0], (New-Object System.Drawing.Rectangle 0, 0, $img.Width, $img.Height), 0, 0, $sw, $sh, 'Pixel', $attr)
  $o[1].Dispose(); $c[0].Dispose()
  return $o[0]
}
# Copy columns [x, x+w) of $img onto graphics $g with a per-column alpha 0..1 given by scriptblock $alpha(distance from the seam)
function Draw-Faded($g, $img, [int]$x, [int]$w, [bool]$seamOnRight, [scriptblock]$alpha) {
  if ($w -le 0) { return }
  $bmp = New-Object System.Drawing.Bitmap $w, $Height, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $bg = [System.Drawing.Graphics]::FromImage($bmp)
  $bg.DrawImage($img, (New-Object System.Drawing.Rectangle 0, 0, $w, $Height), $x, 0, $w, $Height, 'Pixel'); $bg.Dispose()
  $data = $bmp.LockBits((New-Object System.Drawing.Rectangle 0, 0, $w, $Height), 'ReadWrite', 'Format32bppArgb')
  $bytes = New-Object byte[] ($data.Stride * $Height)
  [System.Runtime.InteropServices.Marshal]::Copy($data.Scan0, $bytes, 0, $bytes.Length)
  for ($xx = 0; $xx -lt $w; $xx++) {
    $dist = if ($seamOnRight) { $w - $xx } else { $xx + 1 }
    $a = [Math]::Max(0.0, [Math]::Min(1.0, (& $alpha $dist)))
    $ab = [byte][int](255 * $a); $off = $xx * 4 + 3
    for ($yy = 0; $yy -lt $Height; $yy++) { $bytes[$yy * $data.Stride + $off] = $ab }
  }
  [System.Runtime.InteropServices.Marshal]::Copy($bytes, 0, $data.Scan0, $bytes.Length)
  $bmp.UnlockBits($data)
  $g.DrawImage($bmp, $x, 0); $bmp.Dispose()
}
# Draw an image into a rectangle without the 1px soft edge GDI+ adds at the borders
function Draw-Clamped($g, $img, [int]$x, [int]$y, [int]$w, [int]$h) {
  $attr = New-Object System.Drawing.Imaging.ImageAttributes; $attr.SetWrapMode('TileFlipXY')
  $g.DrawImage($img, (New-Object System.Drawing.Rectangle $x, $y, $w, $h), 0, 0, $img.Width, $img.Height, 'Pixel', $attr)
}
function Smooth([double]$t) { $t = [Math]::Max(0.0, [Math]::Min(1.0, $t)); return $t * $t * (3 - 2 * $t) }

# Cropped source
$srcW = $orig.Width - $CropL - $CropR
$c = New-Canvas $srcW $orig.Height
$c[1].DrawImage($orig, (New-Object System.Drawing.Rectangle 0, 0, $srcW, $orig.Height), $CropL, 0, $srcW, $orig.Height, 'Pixel'); $c[1].Dispose()
$src = $c[0]

$cw = [int][Math]::Round($srcW * $Height / $orig.Height)   # width of the centred original
$x0 = [int](($Width - $cw) / 2)
$side = $x0

# 1. Far background: the picture scaled to cover the frame, heavily blurred
$cover = New-Canvas $Width $Height
$ch = [int]($orig.Height * $Width / $srcW)
$cover[1].DrawImage($src, 0, [int](($Height - $ch) / 2), $Width, $ch); $cover[1].Dispose()
$far = Blur-Image $cover[0] 36
$cover[0].Dispose()

# 2. Mirrored continuation (sharp and blurred versions)
$m = New-Canvas $Width $Height
Draw-Clamped $m[1] $src $x0 0 $cw $Height
$flip = $src.Clone(); $flip.RotateFlip('RotateNoneFlipX')
Draw-Clamped $m[1] $flip ($x0 - $cw) 0 $cw $Height
Draw-Clamped $m[1] $flip ($x0 + $cw) 0 $cw $Height
$m[1].Dispose()
$mirror = $m[0]
$mirrorBlur = Blur-Image $mirror 10

# 3. Compose
$o = New-Canvas $Width $Height
$g = $o[1]
$g.DrawImage($far, 0, 0)
$reach = [Math]::Max(1, $side * $MirrorReach)
$sharp = [Math]::Max(1, $side * 0.12)
foreach ($left in @($true, $false)) {
  $sx = if ($left) { 0 } else { $x0 + $cw }
  $sw = if ($left) { $x0 } else { $Width - $x0 - $cw }
  Draw-Faded $g $mirrorBlur $sx $sw $left { param($d) 1 - (Smooth ($d / $reach)) }
  Draw-Faded $g $mirror $sx $sw $left { param($d) 1 - (Smooth ($d / $sharp)) }
  # Darken toward the outer edge
  $inner = if ($left) { $x0 } else { $x0 + $cw }
  $outer = if ($left) { -1 } else { $Width + 1 }
  $lg = New-Object System.Drawing.Drawing2D.LinearGradientBrush (New-Object System.Drawing.Point $inner, 0), (New-Object System.Drawing.Point $outer, 0), ([System.Drawing.Color]::FromArgb(40, 8, 4, 16)), ([System.Drawing.Color]::FromArgb([int](255 * $Dark), 8, 4, 16))
  $g.FillRectangle($lg, $sx, 0, $sw, $Height); $lg.Dispose()
}
Draw-Clamped $g $src $x0 0 $cw $Height
$g.Dispose()

# Save as JPEG (quality 88)
$enc = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
$ep = New-Object System.Drawing.Imaging.EncoderParameters 1
$ep.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter ([System.Drawing.Imaging.Encoder]::Quality), 88L
$outFile = Join-Path $root $DstPath
$o[0].Save($outFile, $enc, $ep)
$o[0].Dispose(); $far.Dispose(); $mirror.Dispose(); $mirrorBlur.Dispose(); $flip.Dispose(); $src.Dispose(); $orig.Dispose()
Write-Host "Saved $outFile ($Width x $Height, original $cw px wide at x=$x0)"
