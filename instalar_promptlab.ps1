param([string]$Repo)
$ErrorActionPreference = 'Stop'
$src = $PSScriptRoot
if ([string]::IsNullOrWhiteSpace($Repo)) { $Repo = (Get-Location).Path }
$Repo = $Repo.Trim().Trim('"')
$index = Join-Path $Repo 'index.html'
if (-not (Test-Path $index)) { throw "No encontre index.html en: $Repo" }

# 1. Copiar los 3 archivos (buscandolos junto a este script, en esta carpeta o en js\)
$wanted = @(
  @{ Name = 'promptlab.css';          Dest = 'promptlab.css' },
  @{ Name = 'promptlab-catalog.js';   Dest = 'js\promptlab-catalog.js' },
  @{ Name = 'promptlab.js';           Dest = 'js\promptlab.js' }
)
New-Item -ItemType Directory -Force -Path (Join-Path $Repo 'js') | Out-Null
foreach ($w in $wanted) {
  $from = Get-ChildItem -Path $src -Recurse -Filter $w.Name -File | Select-Object -First 1
  if (-not $from) { throw "Falta el archivo $($w.Name) junto a este script." }
  $to = Join-Path $Repo $w.Dest
  if ((Test-Path $to) -and ((Resolve-Path $to).Path -eq $from.FullName)) {
    Write-Host "  = $($w.Dest) ya esta en su lugar"
  } else {
    Copy-Item $from.FullName $to -Force
    Write-Host "  + $($w.Dest) copiado"
  }
}

# 2. Editar index.html (con copia de seguridad, y sin duplicar si ya estaba hecho)
$utf8 = New-Object System.Text.UTF8Encoding($false)
$html = [IO.File]::ReadAllText($index, $utf8)
$nl = if ($html.Contains("`r`n")) { "`r`n" } else { "`n" }
$changed = $false

if (-not $html.Contains('promptlab.css')) {
  $cssTag = '<link rel="stylesheet" href="promptlab.css">'
  $anchor = '<link rel="stylesheet" href="styles.css">'
  if ($html.Contains($anchor)) { $html = $html.Replace($anchor, $anchor + $nl + $cssTag) }
  else { $html = $html.Replace('</head>', $cssTag + $nl + '</head>') }
  $changed = $true
}
if (-not $html.Contains('promptlab.js')) {
  $jsTags = '<script src="js/promptlab-catalog.js"></script><script src="js/promptlab.js"></script>'
  $anchor = '<script src="js/document-editor.js"></script>'
  if ($html.Contains($anchor)) { $html = $html.Replace($anchor, $anchor + $nl + $jsTags) }
  else { $html = $html.Replace('</body>', $jsTags + $nl + '</body>') }
  $changed = $true
}

if ($changed) {
  Copy-Item $index "$index.bak" -Force
  [IO.File]::WriteAllText($index, $html, $utf8)
  Write-Host "  + index.html actualizado (copia de seguridad: index.html.bak)"
} else {
  Write-Host "  = index.html ya tenia el Disenador de prompts instalado"
}

Write-Host ""
Write-Host "Listo. Abri DOCULAB y presiona Ctrl+F5 para recargar sin cache."
Write-Host "Despues, en GitHub Desktop, revisa los cambios y hace commit/push."
