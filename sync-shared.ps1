$ErrorActionPreference = "Stop"

$sharedRoot = Join-Path $PSScriptRoot "shared"
$adapterRoot = Join-Path $sharedRoot "site-adapters"
$adapterFiles = Get-ChildItem -LiteralPath $adapterRoot -Filter "*.js" -File | Sort-Object Name
if (-not $adapterFiles) {
    throw "No site adapters found in $adapterRoot."
}
$adapterBundle = ($adapterFiles | ForEach-Object {
    Get-Content -LiteralPath $_.FullName -Raw
}) -join [Environment]::NewLine

foreach ($browser in @("chrome", "firefox")) {
    $destinationRoot = Join-Path (Join-Path $PSScriptRoot $browser) "shared"
    Get-ChildItem -LiteralPath $sharedRoot -File | ForEach-Object {
        $relativePath = $_.FullName.Substring($sharedRoot.Length + 1)
        $destinationPath = Join-Path $destinationRoot $relativePath
        $destinationDirectory = Split-Path -Parent $destinationPath
        if (-not (Test-Path -LiteralPath $destinationDirectory)) {
            New-Item -ItemType Directory -Path $destinationDirectory -Force | Out-Null
        }
        Copy-Item -LiteralPath $_.FullName -Destination $destinationPath -Force
    }

    $bundlePath = Join-Path $destinationRoot "site-adapters.js"
    if (-not (Test-Path -LiteralPath $destinationRoot)) {
        New-Item -ItemType Directory -Path $destinationRoot -Force | Out-Null
    }
    Set-Content -LiteralPath $bundlePath -Value $adapterBundle -Encoding UTF8
}
