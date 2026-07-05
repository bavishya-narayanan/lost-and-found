# ─────────────────────────────────────────────────────────────
#  start-qdrant.ps1  –  Download & run Qdrant on Windows
#  Usage: .\backend\start-qdrant.ps1
# ─────────────────────────────────────────────────────────────

$QdrantDir  = "$PSScriptRoot\qdrant-bin"
$QdrantExe  = "$QdrantDir\qdrant.exe"
$StorageDir = "$PSScriptRoot\qdrant-storage"
$Version    = "v1.9.4"   # bump this when a newer release is needed
$DownloadUrl = "https://github.com/qdrant/qdrant/releases/download/$Version/qdrant-x86_64-pc-windows-msvc.zip"

# Create directories if they don't exist
if (!(Test-Path $QdrantDir))   { New-Item -ItemType Directory -Path $QdrantDir   | Out-Null }
if (!(Test-Path $StorageDir))  { New-Item -ItemType Directory -Path $StorageDir  | Out-Null }

# Download if the binary is missing
if (!(Test-Path $QdrantExe)) {
    Write-Host "⬇️  Downloading Qdrant $Version ..." -ForegroundColor Cyan
    $ZipPath = "$QdrantDir\qdrant.zip"
    Invoke-WebRequest -Uri $DownloadUrl -OutFile $ZipPath -UseBasicParsing
    Expand-Archive -Path $ZipPath -DestinationPath $QdrantDir -Force
    Remove-Item $ZipPath
    Write-Host "✅ Qdrant downloaded to $QdrantDir" -ForegroundColor Green
}

# Write a minimal config file so Qdrant uses the local storage directory
$ConfigFile = "$QdrantDir\config.yaml"
@"
storage:
  storage_path: $($StorageDir -replace '\\','/')

service:
  host: 0.0.0.0
  http_port: 6333
  grpc_port: 6334
"@ | Set-Content -Path $ConfigFile -Encoding UTF8

# Start Qdrant
Write-Host ""
Write-Host "🚀 Starting Qdrant on http://localhost:6333 ..." -ForegroundColor Green
Write-Host "   Storage : $StorageDir"
Write-Host "   Config  : $ConfigFile"
Write-Host "   Press Ctrl+C to stop."
Write-Host ""

& $QdrantExe --config-path $ConfigFile
