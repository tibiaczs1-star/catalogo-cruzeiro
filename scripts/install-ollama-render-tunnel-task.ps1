$ErrorActionPreference = "Stop"

$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$script = Join-Path $root "scripts\start-ollama-render-tunnel.ps1"
$logDir = Join-Path $root ".codex-temp\ollama-render-tunnel"
$logFile = Join-Path $logDir "scheduled-task.log"

New-Item -ItemType Directory -Force -Path $logDir | Out-Null

$action = New-ScheduledTaskAction `
  -Execute "powershell.exe" `
  -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$script`" *> `"$logFile`""

$trigger = New-ScheduledTaskTrigger -AtLogOn
$settings = New-ScheduledTaskSettingsSet `
  -AllowStartIfOnBatteries `
  -DontStopIfGoingOnBatteries `
  -ExecutionTimeLimit ([TimeSpan]::Zero) `
  -RestartCount 999 `
  -RestartInterval (New-TimeSpan -Minutes 2)

try {
  Register-ScheduledTask `
    -TaskName "CZS Ollama Render Tunnel" `
    -Action $action `
    -Trigger $trigger `
    -Settings $settings `
    -Description "Mantem o proxy seguro do Ollama local ligado e atualiza o Render com o tunnel atual." `
    -Force | Out-Null

  Write-Host "Tarefa instalada: CZS Ollama Render Tunnel"
  Write-Host "Log: $logFile"
} catch {
  $startup = [Environment]::GetFolderPath("Startup")
  $launcher = Join-Path $startup "czs-ollama-render-tunnel.vbs"
  $escapedScript = $script.Replace("\", "\\").Replace('"', '""')
  $escapedLog = $logFile.Replace("\", "\\").Replace('"', '""')
  $command = "powershell.exe -NoProfile -ExecutionPolicy Bypass -File ""$escapedScript"" *> ""$escapedLog"""
  $vbs = @"
Set shell = CreateObject("WScript.Shell")
shell.Run "$command", 0, False
"@
  Set-Content -Path $launcher -Value $vbs -Encoding ASCII
  Write-Host "Agendador negou acesso; inicializador instalado no Startup do usuario."
  Write-Host "Inicializador: $launcher"
  Write-Host "Log: $logFile"
}
