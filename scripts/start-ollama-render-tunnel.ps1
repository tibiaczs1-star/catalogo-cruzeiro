$ErrorActionPreference = "Stop"

$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $root

Write-Host "Iniciando ponte segura Ollama -> Render..."
Write-Host "Mantenha esta janela aberta enquanto o site online precisar da IA local."

node scripts/ollama-render-tunnel.js --deploy
