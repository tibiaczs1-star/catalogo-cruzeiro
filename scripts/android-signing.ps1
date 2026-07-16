param(
  [ValidateSet("Ensure", "Build", "Fingerprint")]
  [string]$Action = "Ensure"
)

$ErrorActionPreference = "Stop"
$secretDir = Join-Path $env:USERPROFILE ".codex\secrets\catalogo-czs-android"
$keystorePath = Join-Path $secretDir "catalogo-czs-release.keystore"
$passwordPath = Join-Path $secretDir "keystore-password.dpapi"
$alias = "catalogo-czs"
$bubblewrapConfigPath = Join-Path $env:USERPROFILE ".bubblewrap\config.json"
$androidProject = Join-Path (Split-Path $PSScriptRoot -Parent) "android"

function Get-PlainPassword {
  New-Item -ItemType Directory -Force -Path $secretDir | Out-Null

  if (-not (Test-Path -LiteralPath $passwordPath)) {
    $bytes = New-Object byte[] 36
    $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    try {
      $rng.GetBytes($bytes)
    } finally {
      $rng.Dispose()
    }
    $plain = [Convert]::ToBase64String($bytes)
    $secure = ConvertTo-SecureString $plain -AsPlainText -Force
    $secure | ConvertFrom-SecureString | Set-Content -LiteralPath $passwordPath -Encoding utf8 -NoNewline
  }

  $encrypted = Get-Content -LiteralPath $passwordPath -Raw
  $securePassword = ConvertTo-SecureString $encrypted
  $pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
  try {
    return [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer)
  } finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer)
  }
}

function Get-JavaTool([string]$name) {
  if (-not (Test-Path -LiteralPath $bubblewrapConfigPath)) {
    throw "Configuracao do Bubblewrap nao encontrada em $bubblewrapConfigPath"
  }
  $config = Get-Content -LiteralPath $bubblewrapConfigPath -Raw | ConvertFrom-Json
  $tool = Join-Path $config.jdkPath "bin\$name.exe"
  if (-not (Test-Path -LiteralPath $tool)) {
    throw "Ferramenta Java nao encontrada: $tool"
  }
  return $tool
}

function Get-JdkPath {
  if (-not (Test-Path -LiteralPath $bubblewrapConfigPath)) {
    throw "Configuracao do Bubblewrap nao encontrada em $bubblewrapConfigPath"
  }
  $config = Get-Content -LiteralPath $bubblewrapConfigPath -Raw | ConvertFrom-Json
  if (-not (Test-Path -LiteralPath $config.jdkPath)) {
    throw "JDK nao encontrado: $($config.jdkPath)"
  }
  return $config.jdkPath
}

function Ensure-Keystore([string]$password) {
  if (Test-Path -LiteralPath $keystorePath) { return }
  $keytool = Get-JavaTool "keytool"
  & $keytool -genkeypair -v -keystore $keystorePath -alias $alias -keyalg RSA -keysize 2048 `
    -validity 10000 -storepass $password -keypass $password `
    -dname "CN=Catalogo CZS, OU=Redacao Digital, O=Catalogo CZS, C=BR"
  if ($LASTEXITCODE -ne 0 -or -not (Test-Path -LiteralPath $keystorePath)) {
    throw "Falha ao gerar a chave de assinatura Android."
  }
}

$password = Get-PlainPassword
try {
  Ensure-Keystore $password

  if ($Action -eq "Build") {
    $jdkPath = Get-JdkPath
    $previousJavaHome = $env:JAVA_HOME
    $previousPath = $env:PATH
    $env:JAVA_HOME = $jdkPath
    $env:PATH = (Join-Path $jdkPath "bin") + [IO.Path]::PathSeparator + $env:PATH
    $env:BUBBLEWRAP_KEYSTORE_PASSWORD = $password
    $env:BUBBLEWRAP_KEY_PASSWORD = $password
    Push-Location $androidProject
    try {
      & npx --yes '@bubblewrap/cli' build --skipPwaValidation
      if ($LASTEXITCODE -ne 0) { throw "Bubblewrap build falhou com codigo $LASTEXITCODE" }
    } finally {
      Pop-Location
      Remove-Item Env:BUBBLEWRAP_KEYSTORE_PASSWORD -ErrorAction SilentlyContinue
      Remove-Item Env:BUBBLEWRAP_KEY_PASSWORD -ErrorAction SilentlyContinue
      if ($null -eq $previousJavaHome) {
        Remove-Item Env:JAVA_HOME -ErrorAction SilentlyContinue
      } else {
        $env:JAVA_HOME = $previousJavaHome
      }
      $env:PATH = $previousPath
    }
  }

  if ($Action -eq "Fingerprint") {
    $keytool = Get-JavaTool "keytool"
    $details = & $keytool -list -v -keystore $keystorePath -alias $alias -storepass $password 2>&1
    if ($LASTEXITCODE -ne 0) { throw "Nao foi possivel ler o certificado Android." }
    $match = [regex]::Match(($details -join "`n"), "SHA256:\s*([0-9A-F:]+)", "IgnoreCase")
    if (-not $match.Success) { throw "Fingerprint SHA-256 nao encontrado." }
    $match.Groups[1].Value.ToUpperInvariant()
  }
} finally {
  $password = $null
}
