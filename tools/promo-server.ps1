# Local server for tools/promo_maker.html (dev only). This file is ASCII-only on purpose:
# Windows PowerShell 5.1 reads BOM-less UTF-8 as ANSI and chokes on CJK text.
#   /           -> project folder (tools/, assets/ ...)
#   /shots/     -> folder with the simulator screenshots (default: Desktop\<game screenshots>)
#   /chars/     -> promo/chars (character art, background not yet removed)
#   POST /out/x -> saves the posted bytes to <shots>\<promo images>\x, so the page can write finished JPGs to disk
# Usage: powershell -ExecutionPolicy Bypass -File tools\promo-server.ps1   then open http://localhost:8130/tools/promo_maker.html
param([int]$Port = 8130, [string]$Shots = '')
function CJK([int[]]$codes) { -join ($codes | ForEach-Object { [char]$_ }) }
if (-not $Shots) { $Shots = Join-Path (Join-Path $env:USERPROFILE 'Desktop') (CJK 0x904A, 0x6232, 0x622A, 0x5716) }
$root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$out = Join-Path $Shots (CJK 0x5BA3, 0x50B3, 0x5716)
$maps = @(@{ p = '/shots/'; d = $Shots }, @{ p = '/chars/'; d = (Join-Path $root 'promo\chars') }, @{ p = '/'; d = $root })
$types = @{ '.html' = 'text/html; charset=utf-8'; '.js' = 'text/javascript'; '.css' = 'text/css'; '.json' = 'application/json'; '.png' = 'image/png'; '.jpg' = 'image/jpeg'; '.jpeg' = 'image/jpeg'; '.webp' = 'image/webp'; '.ttf' = 'font/ttf'; '.woff2' = 'font/woff2' }
$l = New-Object Net.HttpListener
$l.Prefixes.Add("http://localhost:$Port/")
$l.Start()
Write-Host "promo server: http://localhost:$Port/  (out: $out)"
while ($l.IsListening) {
  $c = $l.GetContext(); $req = $c.Request; $res = $c.Response
  try {
    $path = [Uri]::UnescapeDataString($req.Url.AbsolutePath)
    if ($req.HttpMethod -eq 'POST' -and $path.StartsWith('/out/')) {
      $rel = ($path.Substring(5) -replace '\.\.', '') -replace '/', '\'
      $dst = Join-Path $out $rel
      New-Item -ItemType Directory -Force -Path (Split-Path $dst) | Out-Null
      $fs = [IO.File]::Create($dst); $req.InputStream.CopyTo($fs); $fs.Close()
      $res.StatusCode = 200
    } else {
      $m = $maps | Where-Object { $path.StartsWith($_.p) } | Select-Object -First 1
      $file = Join-Path $m.d (($path.Substring($m.p.Length) -replace '\.\.', '') -replace '/', '\')
      if (Test-Path -LiteralPath $file -PathType Leaf) {
        $bytes = [IO.File]::ReadAllBytes($file)
        $ext = [IO.Path]::GetExtension($file).ToLower()
        $res.ContentType = if ($types.ContainsKey($ext)) { $types[$ext] } else { 'application/octet-stream' }
        $res.AddHeader('Cache-Control', 'no-store')
        $res.ContentLength64 = $bytes.Length
        $res.OutputStream.Write($bytes, 0, $bytes.Length)
      } else { $res.StatusCode = 404 }
    }
  } catch { $res.StatusCode = 500 }
  $res.Close()
}
