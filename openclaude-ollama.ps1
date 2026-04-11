param(
    [string]$Model = "mistral"
)

$ErrorActionPreference = "Stop"

$workspace = $PSScriptRoot
if (-not $workspace) {
    $workspace = "c:\Users\junio\projeto codex"
}

Set-Location -LiteralPath $workspace

$env:OLLAMA_VULKAN = "1"
$env:CLAUDE_CODE_USE_OPENAI = "1"
$env:OPENAI_BASE_URL = "http://localhost:11434/v1"
$env:OPENAI_MODEL = $Model

function Test-OllamaReady {
    try {
        Invoke-WebRequest -UseBasicParsing "http://localhost:11434/" -TimeoutSec 2 | Out-Null
        return $true
    } catch {
        return $false
    }
}

if (-not (Get-Command ollama -ErrorAction SilentlyContinue)) {
    throw "ollama nao foi encontrado no PATH."
}

if (-not (Get-Command openclaude -ErrorAction SilentlyContinue)) {
    throw "openclaude nao foi encontrado no PATH."
}

if (-not (Test-OllamaReady)) {
    $ollamaExe = Join-Path $env:LOCALAPPDATA "Programs\Ollama\ollama.exe"
    if (-not (Test-Path $ollamaExe)) {
        throw "Nao encontrei o executavel do Ollama em $ollamaExe."
    }

    Start-Process $ollamaExe | Out-Null

    for ($i = 0; $i -lt 15; $i++) {
        Start-Sleep -Seconds 1
        if (Test-OllamaReady) {
            break
        }
    }

    if (-not (Test-OllamaReady)) {
        throw "Ollama nao respondeu em http://localhost:11434."
    }
}

Write-Host "Iniciando OpenClaude com modelo: $Model"
openclaude
