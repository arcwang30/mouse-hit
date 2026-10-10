# Local helper for tools/steam-art.html: serves the project (GET) and saves rendered images (PUT /save/<name>)
# into steam/store-art/. Usage: powershell -ExecutionPolicy Bypass -File tools/art-server.ps1 [-Port 8124]
# then open http://localhost:8124/tools/steam-art.html and press "Export all".
param([int]$Port = 8124)
$root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$out = Join-Path $root 'steam\store-art'
New-Item -ItemType Directory -Force $out | Out-Null
$types = @{ '.html' = 'text/html; charset=utf-8'; '.js' = 'text/javascript; charset=utf-8'; '.css' = 'text/css; charset=utf-8'
  '.png' = 'image/png'; '.jpg' = 'image/jpeg'; '.webp' = 'image/webp'; '.svg' = 'image/svg+xml'; '.ttf' = 'font/ttf' }
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Port/")
$listener.Start()
Write-Host "Art server: http://localhost:$Port/tools/steam-art.html  (saves to $out)"
try {
  while ($listener.IsListening) {
    $ctx = $listener.GetContext(); $req = $ctx.Request; $res = $ctx.Response
    $path = [Uri]::UnescapeDataString($req.Url.AbsolutePath)
    try {
      if ($req.HttpMethod -eq 'PUT' -and $path -match '^/save/([\w./-]+)$') {
        $name = $Matches[1]
        if ($name -match '\.\.') { $res.StatusCode = 400 } else {
          $file = Join-Path $out $name
          New-Item -ItemType Directory -Force (Split-Path $file) | Out-Null
          $ms = New-Object IO.MemoryStream; $req.InputStream.CopyTo($ms)
          [IO.File]::WriteAllBytes($file, $ms.ToArray())
          Write-Host "saved $name ($($ms.Length) bytes)"
        }
      } else {
        $file = [IO.Path]::GetFullPath((Join-Path $root $path.TrimStart('/')))
        if ($file.StartsWith($root) -and (Test-Path $file -PathType Leaf)) {
          $bytes = [IO.File]::ReadAllBytes($file)
          $ext = [IO.Path]::GetExtension($file).ToLower()
          $res.ContentType = if ($types[$ext]) { $types[$ext] } else { 'application/octet-stream' }
          $res.Headers.Add('Cache-Control', 'no-store')
          $res.OutputStream.Write($bytes, 0, $bytes.Length)
        } else { $res.StatusCode = 404 }
      }
    } catch { Write-Host "error $path $_" } finally { $res.Close() }
  }
} finally { $listener.Stop() }
