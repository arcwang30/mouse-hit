# Local test server (no Node/Python needed)
# Usage: powershell -ExecutionPolicy Bypass -File tools/serve.ps1 [-Port 8080]
param([int]$Port = 8080)

# Serve the project root, but only the src/ and assets/ folders (page lives at /src/index.html)
$root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$allowed = @((Join-Path $root 'src'), (Join-Path $root 'assets'))
$types = @{
  '.html' = 'text/html; charset=utf-8'; '.css' = 'text/css; charset=utf-8'; '.js' = 'text/javascript; charset=utf-8'
  '.json' = 'application/json'; '.png' = 'image/png'; '.jpg' = 'image/jpeg'; '.webp' = 'image/webp'; '.svg' = 'image/svg+xml'
  '.mp3' = 'audio/mpeg'; '.ogg' = 'audio/ogg'; '.wav' = 'audio/wav'
}

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Port/")
$listener.Start()
Write-Host "Game server: http://localhost:$Port/  (Ctrl+C to stop)"

try {
  while ($listener.IsListening) {
    $ctx = $listener.GetContext()
    $path = [Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath)
    $res = $ctx.Response
    if ($path -eq '/') {
      $res.Redirect('/src/index.html')
      $res.Close()
      continue
    }
    $file = [IO.Path]::GetFullPath((Join-Path $root $path.TrimStart('/')))
    $ok = @($allowed | Where-Object { $file.StartsWith($_ + '\') }).Count -gt 0
    try {
      if ($ok -and (Test-Path $file -PathType Leaf)) {
        $bytes = [IO.File]::ReadAllBytes($file)
        $ext = [IO.Path]::GetExtension($file).ToLower()
        $res.ContentType = if ($types[$ext]) { $types[$ext] } else { 'application/octet-stream' }
        $res.Headers.Add('Cache-Control', 'no-store')
        $res.ContentLength64 = $bytes.Length
        if ($ctx.Request.HttpMethod -ne 'HEAD') { $res.OutputStream.Write($bytes, 0, $bytes.Length) }
      } else {
        $res.StatusCode = 404
      }
    } catch {
      Write-Host "Request failed: $path $_"
    } finally {
      $res.Close()
    }
  }
} finally {
  $listener.Stop()
}
