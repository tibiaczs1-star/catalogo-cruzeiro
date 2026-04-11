$ErrorActionPreference = 'Stop'

$desktop = [Environment]::GetFolderPath('Desktop')
$timestamp = Get-Date -Format 'yyyyMMdd_HHmmss'
$backupRoot = Join-Path $desktop ("backup_inicializacao_{0}" -f $timestamp)
$shortcutBackupRoot = Join-Path $backupRoot 'atalhos'

$runTargets = @(
    [PSCustomObject]@{
        Key = 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Run'
        Name = 'Discord'
    },
    [PSCustomObject]@{
        Key = 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Run'
        Name = 'Opera GX Stable'
    },
    [PSCustomObject]@{
        Key = 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Run'
        Name = 'electron.app.BlueStacks Services'
    },
    [PSCustomObject]@{
        Key = 'HKLM:\Software\Microsoft\Windows\CurrentVersion\Run'
        Name = 'UrbanVPN'
    },
    [PSCustomObject]@{
        Key = 'HKLM:\Software\WOW6432Node\Microsoft\Windows\CurrentVersion\Run'
        Name = 'Wondershare Helper Compact.exe'
    }
)

$shortcutTargets = @(
    (Join-Path $env:APPDATA 'Microsoft\Windows\Start Menu\Programs\Startup\Firemin.lnk'),
    (Join-Path $env:APPDATA 'Microsoft\Windows\Start Menu\Programs\Startup\Ollama.lnk'),
    (Join-Path $env:ProgramData 'Microsoft\Windows\Start Menu\Programs\Startup\AnyDesk.lnk'),
    (Join-Path $env:ProgramData 'Microsoft\Windows\Start Menu\Programs\Startup\FxSound.lnk')
)

function Get-ExistingRunEntries {
    param(
        [object[]]$Targets
    )

    foreach ($target in $Targets) {
        if (-not (Test-Path -LiteralPath $target.Key)) {
            continue
        }

        $value = (Get-ItemProperty -Path $target.Key -Name $target.Name -ErrorAction SilentlyContinue).($target.Name)
        if ($null -ne $value) {
            [PSCustomObject]@{
                Key = $target.Key
                Name = $target.Name
                Value = [string]$value
            }
        }
    }
}

function Get-ExistingShortcuts {
    param(
        [string[]]$Targets
    )

    foreach ($target in $Targets) {
        if (Test-Path -LiteralPath $target) {
            [PSCustomObject]@{
                OriginalPath = $target
                FileName = Split-Path -Path $target -Leaf
            }
        }
    }
}

function Get-UniquePath {
    param(
        [string]$Directory,
        [string]$FileName
    )

    $candidate = Join-Path $Directory $FileName
    $baseName = [System.IO.Path]::GetFileNameWithoutExtension($FileName)
    $extension = [System.IO.Path]::GetExtension($FileName)
    $counter = 1

    while (Test-Path -LiteralPath $candidate) {
        $candidate = Join-Path $Directory ("{0} ({1}){2}" -f $baseName, $counter, $extension)
        $counter++
    }

    return $candidate
}

New-Item -ItemType Directory -Path $backupRoot -Force | Out-Null
New-Item -ItemType Directory -Path $shortcutBackupRoot -Force | Out-Null

$runEntries = @(Get-ExistingRunEntries -Targets $runTargets)
$shortcutEntries = @(Get-ExistingShortcuts -Targets $shortcutTargets)
$movedShortcuts = New-Object System.Collections.Generic.List[object]

$runEntries |
    ConvertTo-Json -Depth 4 |
    Set-Content -LiteralPath (Join-Path $backupRoot 'run_entries.json') -Encoding UTF8

foreach ($shortcut in $shortcutEntries) {
    $backupPath = Get-UniquePath -Directory $shortcutBackupRoot -FileName $shortcut.FileName
    Copy-Item -LiteralPath $shortcut.OriginalPath -Destination $backupPath -Force

    $movedShortcuts.Add([PSCustomObject]@{
        OriginalPath = $shortcut.OriginalPath
        BackupPath = $backupPath
    })
}

$movedShortcuts |
    ConvertTo-Json -Depth 4 |
    Set-Content -LiteralPath (Join-Path $backupRoot 'atalhos.json') -Encoding UTF8

$restoreLines = @(
    '$ErrorActionPreference = ''Stop'''
    ('$backupRoot = ''{0}''' -f $backupRoot.Replace("'", "''"))
    '$runEntriesPath = Join-Path $backupRoot ''run_entries.json'''
    '$shortcutsPath = Join-Path $backupRoot ''atalhos.json'''
    ''
    'if (Test-Path -LiteralPath $runEntriesPath) {'
    '    $runEntries = Get-Content -LiteralPath $runEntriesPath -Raw | ConvertFrom-Json'
    '    foreach ($entry in @($runEntries)) {'
    '        New-ItemProperty -Path $entry.Key -Name $entry.Name -PropertyType String -Value $entry.Value -Force | Out-Null'
    '    }'
    '}'
    ''
    'if (Test-Path -LiteralPath $shortcutsPath) {'
    '    $shortcuts = Get-Content -LiteralPath $shortcutsPath -Raw | ConvertFrom-Json'
    '    foreach ($shortcut in @($shortcuts)) {'
    '        $targetDir = Split-Path -Path $shortcut.OriginalPath -Parent'
    '        if (-not (Test-Path -LiteralPath $targetDir)) {'
    '            New-Item -ItemType Directory -Path $targetDir -Force | Out-Null'
    '        }'
    '        if (Test-Path -LiteralPath $shortcut.BackupPath) {'
    '            Move-Item -LiteralPath $shortcut.BackupPath -Destination $shortcut.OriginalPath -Force'
    '        }'
    '    }'
    '}'
)

Set-Content -LiteralPath (Join-Path $backupRoot 'restaurar_inicializacao.ps1') -Value $restoreLines -Encoding UTF8

foreach ($entry in $runEntries) {
    Remove-ItemProperty -Path $entry.Key -Name $entry.Name -ErrorAction SilentlyContinue
}

foreach ($shortcut in $movedShortcuts) {
    if (Test-Path -LiteralPath $shortcut.OriginalPath) {
        Remove-Item -LiteralPath $shortcut.OriginalPath -Force -ErrorAction SilentlyContinue
    }
}

$remainingRuns = foreach ($target in $runTargets) {
    if (Test-Path -LiteralPath $target.Key) {
        $value = (Get-ItemProperty -Path $target.Key -Name $target.Name -ErrorAction SilentlyContinue).($target.Name)
        if ($null -ne $value) {
            [PSCustomObject]@{
                Tipo = 'Run'
                Nome = $target.Name
                Status = 'Ainda ativo'
            }
        }
    }
}

$remainingShortcuts = foreach ($target in $shortcutTargets) {
    if (Test-Path -LiteralPath $target) {
        [PSCustomObject]@{
            Tipo = 'Atalho'
            Nome = Split-Path -Path $target -Leaf
            Status = 'Ainda ativo'
        }
    }
}

$summary = @(
    [PSCustomObject]@{
        Item = 'Entradas Run removidas'
        Quantidade = $runEntries.Count
    },
    [PSCustomObject]@{
        Item = 'Atalhos Startup removidos'
        Quantidade = $movedShortcuts.Count
    }
)

$summary | Format-Table -AutoSize
Write-Output ('Backup salvo em: {0}' -f $backupRoot)

$remaining = @($remainingRuns) + @($remainingShortcuts)
if ($remaining.Count -gt 0) {
    Write-Output ''
    Write-Output 'Itens que permaneceram ativos:'
    $remaining | Format-Table -AutoSize
}
