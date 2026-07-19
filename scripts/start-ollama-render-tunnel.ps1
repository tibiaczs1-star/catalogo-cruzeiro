$ErrorActionPreference = "Stop"

$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $root

while ($true) {
  Write-Host "Iniciando ponte segura Ollama -> Render..."
  node scripts/ollama-render-tunnel.js --deploy
  Write-Host "Ponte encerrada; reiniciando em 5 segundos."
  Start-Sleep -Seconds 5
}
