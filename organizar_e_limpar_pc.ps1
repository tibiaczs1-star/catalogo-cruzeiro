$ErrorActionPreference = 'Stop'

$desktop = [Environment]::GetFolderPath('Desktop')
$destinationRoot = Join-Path $desktop 'para mover pra hd'
$manifestPath = Join-Path $destinationRoot 'manifesto.csv'
$workspaceRoot = 'C:\Users\junio\projeto codex'
$sourceRoots = @(
    (Join-Path $env:USERPROFILE 'Desktop'),
    (Join-Path $env:USERPROFILE 'Downloads'),
    (Join-Path $env:USERPROFILE 'Documents'),
    (Join-Path $env:USERPROFILE 'Music'),
    (Join-Path $env:USERPROFILE 'Pictures'),
    (Join-Path $env:USERPROFILE 'Videos')
) | Where-Object { Test-Path $_ }

$categoryMap = [ordered]@{
    'zipados' = @('.zip', '.rar', '.7z', '.tar', '.gz', '.bz2')
    'fotos' = @('.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.tif', '.tiff', '.heic', '.raw', '.svg')
    'videos' = @('.mp4', '.mkv', '.avi', '.mov', '.wmv', '.webm', '.flv', '.mpeg', '.mpg', '.m4v')
    'documentos' = @('.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.rtf', '.odt', '.ods', '.odp', '.csv')
    'musicas' = @('.mp3', '.wav', '.flac', '.aac', '.m4a', '.ogg', '.wma', '.opus', '.aiff', '.alac')
    'apks' = @('.apk')
}

function Get-Category {
    param(
        [string]$Extension
    )

    $normalized = $Extension.ToLowerInvariant()
    foreach ($entry in $categoryMap.GetEnumerator()) {
        if ($entry.Value -contains $normalized) {
            return $entry.Key
        }
    }

    return $null
}

function Get-UniqueDestination {
    param(
        [string]$Directory,
        [string]$FileName
    )

    $baseName = [System.IO.Path]::GetFileNameWithoutExtension($FileName)
    $extension = [System.IO.Path]::GetExtension($FileName)
    $candidate = Join-Path $Directory $FileName
    $counter = 1

    while (Test-Path -LiteralPath $candidate) {
        $candidate = Join-Path $Directory ("{0} ({1}){2}" -f $baseName, $counter, $extension)
        $counter++
    }

    return $candidate
}

function Get-FolderBytes {
    param(
        [string]$Path
    )

    if (-not (Test-Path -LiteralPath $Path)) {
        return 0L
    }

    $sum = (Get-ChildItem -LiteralPath $Path -Recurse -File -Force -ErrorAction SilentlyContinue |
        Measure-Object Length -Sum).Sum

    if ($null -eq $sum) {
        return 0L
    }

    return [int64]$sum
}

function Convert-ToInt64 {
    param(
        [string]$Value
    )

    $parsed = 0L
    if ([int64]::TryParse($Value, [ref]$parsed)) {
        return $parsed
    }

    return $null
}

function Convert-SizeMBStringToBytes {
    param(
        [string]$Value
    )

    if ([string]::IsNullOrWhiteSpace($Value)) {
        return 0L
    }

    $parsed = 0.0
    if ([double]::TryParse($Value, [System.Globalization.NumberStyles]::Float, [System.Globalization.CultureInfo]::InvariantCulture, [ref]$parsed)) {
        return [int64][math]::Round($parsed * 1MB)
    }

    $normalized = $Value.Replace(',', '.')
    if ([double]::TryParse($normalized, [System.Globalization.NumberStyles]::Float, [System.Globalization.CultureInfo]::InvariantCulture, [ref]$parsed)) {
        return [int64][math]::Round($parsed * 1MB)
    }

    return 0L
}

function Clear-FolderContents {
    param(
        [string]$Path
    )

    if (-not (Test-Path -LiteralPath $Path)) {
        return [PSCustomObject]@{
            Path = $Path
            FreedBytes = 0L
        }
    }

    $before = Get-FolderBytes -Path $Path

    Get-ChildItem -LiteralPath $Path -Force -ErrorAction SilentlyContinue |
        ForEach-Object {
            Remove-Item -LiteralPath $_.FullName -Recurse -Force -ErrorAction SilentlyContinue
        }

    $after = Get-FolderBytes -Path $Path

    return [PSCustomObject]@{
        Path = $Path
        FreedBytes = [math]::Max(0, ($before - $after))
    }
}

function Resolve-ExecutablePath {
    param(
        [string]$Command
    )

    if ([string]::IsNullOrWhiteSpace($Command)) {
        return $null
    }

    $expanded = [Environment]::ExpandEnvironmentVariables($Command.Trim())

    if ($expanded -match '^"([^"]+?\.exe)"') {
        return $matches[1]
    }

    if ($expanded -match '^(.+?\.exe)\b') {
        return $matches[1].Trim()
    }

    return $null
}

function Remove-EmptyParentFolders {
    param(
        [string]$StartDirectory,
        [string[]]$StopRoots
    )

    $current = $StartDirectory

    while ($current -and (Test-Path -LiteralPath $current)) {
        if ($StopRoots -contains $current) {
            break
        }

        $children = @(Get-ChildItem -LiteralPath $current -Force -ErrorAction SilentlyContinue)
        if ($children.Count -gt 0) {
            break
        }

        $parent = Split-Path -Path $current -Parent
        Remove-Item -LiteralPath $current -Force -ErrorAction SilentlyContinue
        $current = $parent
    }
}

if (-not (Test-Path -LiteralPath $destinationRoot)) {
    New-Item -ItemType Directory -Path $destinationRoot | Out-Null
}

$existingManifestRows = New-Object System.Collections.Generic.List[object]
$knownSources = New-Object 'System.Collections.Generic.HashSet[string]' ([System.StringComparer]::OrdinalIgnoreCase)

if (Test-Path -LiteralPath $manifestPath) {
    $importedRows = Import-Csv -LiteralPath $manifestPath
    foreach ($row in $importedRows) {
        $source = [string]$row.Source
        if (-not [string]::IsNullOrWhiteSpace($source)) {
            [void]$knownSources.Add($source)
        }

        $existingManifestRows.Add([PSCustomObject]@{
            Category = [string]$row.Category
            Source = $source
            Destination = [string]$row.Destination
            SizeBytes = if ($row.PSObject.Properties.Name -contains 'SizeBytes') {
                Convert-ToInt64 -Value ([string]$row.SizeBytes)
            }
            else {
                Convert-SizeMBStringToBytes -Value ([string]$row.SizeMB)
            }
        })
    }
}

$newManifestRows = New-Object System.Collections.Generic.List[object]

foreach ($category in $categoryMap.Keys) {
    $categoryDir = Join-Path $destinationRoot $category
    if (-not (Test-Path -LiteralPath $categoryDir)) {
        New-Item -ItemType Directory -Path $categoryDir | Out-Null
    }
}

foreach ($root in $sourceRoots) {
    Get-ChildItem -LiteralPath $root -Recurse -File -ErrorAction SilentlyContinue |
        Where-Object {
            $_.FullName -notlike "$destinationRoot*" -and
            $_.FullName -notlike "$workspaceRoot*"
        } |
        ForEach-Object {
            $category = Get-Category -Extension $_.Extension
            if ($null -ne $category -and -not $knownSources.Contains($_.FullName)) {
                $targetDir = Join-Path $destinationRoot $category
                $targetPath = Get-UniqueDestination -Directory $targetDir -FileName $_.Name
                Copy-Item -LiteralPath $_.FullName -Destination $targetPath -ErrorAction SilentlyContinue

                if (Test-Path -LiteralPath $targetPath) {
                    [void]$knownSources.Add($_.FullName)
                    $newManifestRows.Add([PSCustomObject]@{
                        Category = $category
                        Source = $_.FullName
                        Destination = $targetPath
                        SizeBytes = [int64]$_.Length
                    })
                }
            }
        }
}

$combinedManifest = @($existingManifestRows.ToArray()) + @($newManifestRows.ToArray())
$combinedManifest |
    Sort-Object Category, Source |
    Export-Csv -LiteralPath $manifestPath -NoTypeInformation -Encoding UTF8

$cleanupTargets = @(
    $env:TEMP,
    'C:\Windows\Temp',
    (Join-Path $env:LOCALAPPDATA 'AMD\DxCache'),
    (Join-Path $env:LOCALAPPDATA 'D3DSCache'),
    (Join-Path $env:LOCALAPPDATA 'CrashDumps'),
    (Join-Path $env:ProgramData 'Microsoft\Windows\WER\ReportArchive'),
    (Join-Path $env:ProgramData 'Microsoft\Windows\WER\ReportQueue')
) | Where-Object { Test-Path $_ }

$cleanupResults = foreach ($target in $cleanupTargets) {
    Clear-FolderContents -Path $target
}

$shortcutRoots = @(
    $desktop,
    (Join-Path $env:APPDATA 'Microsoft\Windows\Start Menu\Programs'),
    (Join-Path $env:ProgramData 'Microsoft\Windows\Start Menu\Programs')
) | Where-Object { Test-Path $_ }

$wsh = New-Object -ComObject WScript.Shell
$brokenShortcuts = New-Object System.Collections.Generic.List[object]

foreach ($root in $shortcutRoots) {
    Get-ChildItem -LiteralPath $root -Recurse -Filter *.lnk -File -ErrorAction SilentlyContinue |
        ForEach-Object {
            try {
                $shortcut = $wsh.CreateShortcut($_.FullName)
                $targetPath = $shortcut.TargetPath
                if ($targetPath -and -not (Test-Path -LiteralPath $targetPath)) {
                    $brokenShortcuts.Add([PSCustomObject]@{
                        ShortcutPath = $_.FullName
                        ParentPath = Split-Path -Path $_.FullName -Parent
                    })
                }
            }
            catch {
            }
        }
}

foreach ($item in $brokenShortcuts) {
    Remove-Item -LiteralPath $item.ShortcutPath -Force -ErrorAction SilentlyContinue
    Remove-EmptyParentFolders -StartDirectory $item.ParentPath -StopRoots $shortcutRoots
}

$runKeys = @(
    'HKCU:\Software\Microsoft\Windows\CurrentVersion\Run',
    'HKLM:\Software\Microsoft\Windows\CurrentVersion\Run',
    'HKLM:\Software\WOW6432Node\Microsoft\Windows\CurrentVersion\Run'
)

$removedRunEntries = New-Object System.Collections.Generic.List[object]

foreach ($key in $runKeys) {
    if (-not (Test-Path $key)) {
        continue
    }

    $props = Get-ItemProperty -Path $key
    foreach ($prop in $props.PSObject.Properties) {
        if ($prop.Name -in 'PSPath', 'PSParentPath', 'PSChildName', 'PSDrive', 'PSProvider') {
            continue
        }

        $exePath = Resolve-ExecutablePath -Command ([string]$prop.Value)
        if ($exePath -and -not (Test-Path -LiteralPath $exePath)) {
            Remove-ItemProperty -Path $key -Name $prop.Name -ErrorAction SilentlyContinue
            $removedRunEntries.Add([PSCustomObject]@{
                Key = $key
                Name = $prop.Name
                Path = $exePath
            })
        }
    }
}

$copySummary = ($combinedManifest |
    Group-Object Category |
    Sort-Object Name |
    ForEach-Object {
        [PSCustomObject]@{
            Tipo = $_.Name
            Arquivos = $_.Count
            TamanhoGB = [math]::Round((($_.Group | Measure-Object SizeBytes -Sum).Sum / 1GB), 2)
        }
    })

$freedBytes = ($cleanupResults | Measure-Object FreedBytes -Sum).Sum
if ($null -eq $freedBytes) {
    $freedBytes = 0L
}

$freeSpace = Get-PSDrive -Name C

Write-Output 'Arquivos pessoais reunidos em:'
Write-Output $destinationRoot
Write-Output ''
$copySummary | Format-Table -AutoSize
Write-Output ''
Write-Output ('Atalhos quebrados removidos: {0}' -f $brokenShortcuts.Count)
Write-Output ('Entradas de inicializacao orfas removidas: {0}' -f $removedRunEntries.Count)
Write-Output ('Espaco liberado em limpeza segura: {0} GB' -f ([math]::Round($freedBytes / 1GB, 2)))
Write-Output ('Espaco livre atual no C:: {0} GB' -f ([math]::Round($freeSpace.Free / 1GB, 2)))
