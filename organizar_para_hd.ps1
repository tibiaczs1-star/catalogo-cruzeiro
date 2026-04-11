$ErrorActionPreference = 'Stop'

$desktop = [Environment]::GetFolderPath('Desktop')
$destinationRoot = Join-Path $desktop 'para mover pra hd'
$sourceRoots = @(
    (Join-Path $env:USERPROFILE 'Desktop'),
    (Join-Path $env:USERPROFILE 'Downloads'),
    (Join-Path $env:USERPROFILE 'Documents'),
    (Join-Path $env:USERPROFILE 'Pictures'),
    (Join-Path $env:USERPROFILE 'Videos')
) | Where-Object { Test-Path $_ }

$categoryMap = @{
    'zipados' = @('.zip', '.rar', '.7z', '.tar', '.gz', '.bz2')
    'fotos' = @('.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.tif', '.tiff', '.heic', '.raw', '.svg')
    'videos' = @('.mp4', '.mkv', '.avi', '.mov', '.wmv', '.webm', '.flv', '.mpeg', '.mpg', '.m4v')
    'documentos' = @('.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.rtf', '.odt', '.ods', '.odp', '.csv')
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

if (-not (Test-Path -LiteralPath $destinationRoot)) {
    New-Item -ItemType Directory -Path $destinationRoot | Out-Null
}

$collected = New-Object System.Collections.Generic.List[object]

foreach ($root in $sourceRoots) {
    Get-ChildItem -LiteralPath $root -Recurse -File -ErrorAction SilentlyContinue |
        Where-Object { $_.FullName -notlike "$destinationRoot*" } |
        ForEach-Object {
            $category = Get-Category -Extension $_.Extension
            if ($null -ne $category) {
                $collected.Add([PSCustomObject]@{
                    Category = $category
                    Source = $_.FullName
                    Name = $_.Name
                    Size = $_.Length
                })
            }
        }
}

$manifest = New-Object System.Collections.Generic.List[object]

foreach ($category in $categoryMap.Keys) {
    $categoryDir = Join-Path $destinationRoot $category
    if (-not (Test-Path -LiteralPath $categoryDir)) {
        New-Item -ItemType Directory -Path $categoryDir | Out-Null
    }

    $items = $collected | Where-Object { $_.Category -eq $category }
    foreach ($item in $items) {
        $target = Get-UniqueDestination -Directory $categoryDir -FileName $item.Name
        Copy-Item -LiteralPath $item.Source -Destination $target

        $manifest.Add([PSCustomObject]@{
            Category = $item.Category
            Source = $item.Source
            Destination = $target
            SizeMB = [math]::Round($item.Size / 1MB, 2)
        })
    }
}

$manifestPath = Join-Path $destinationRoot 'manifesto.csv'
$manifest |
    Sort-Object Category, Destination |
    Export-Csv -LiteralPath $manifestPath -NoTypeInformation -Encoding UTF8

$summary = $manifest |
    Group-Object Category |
    Sort-Object Name |
    ForEach-Object {
        [PSCustomObject]@{
            Categoria = $_.Name
            Arquivos = $_.Count
            TamanhoGB = [math]::Round((($_.Group | Measure-Object SizeMB -Sum).Sum / 1024), 2)
        }
    }

$summary | Format-Table -AutoSize
"Manifesto salvo em: $manifestPath"
