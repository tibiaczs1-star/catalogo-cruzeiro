$ErrorActionPreference = "Stop"

$root = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$source = Join-Path $PSScriptRoot "RayXLauncher.cs"
$outDir = Join-Path $root "dist\rayx"
$outFile = Join-Path $outDir "RayX.exe"

New-Item -ItemType Directory -Force -Path $outDir | Out-Null

Add-Type `
  -TypeDefinition (Get-Content -Raw -LiteralPath $source) `
  -OutputAssembly $outFile `
  -OutputType ConsoleApplication `
  -ReferencedAssemblies "System.dll"

Write-Output $outFile
