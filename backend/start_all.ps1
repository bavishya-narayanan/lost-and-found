# start_all.ps1 - Launch all services for the AI Matching Engine
# Run from the project root: .\backend\start_all.ps1

$ROOT = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "=======================================" -ForegroundColor Cyan
Write-Host " Campus Lost & Found - AI Stack Startup" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan

# 1. Start Qdrant
Write-Host "`n[1/3] Starting Qdrant vector database..." -ForegroundColor Yellow
$qdrantExe = Join-Path $ROOT "qdrant-bin\qdrant.exe"
if (Test-Path $qdrantExe) {
    Start-Process -FilePath $qdrantExe -WorkingDirectory (Join-Path $ROOT "qdrant-bin") -WindowStyle Minimized
    Write-Host "      Qdrant started on http://localhost:6333" -ForegroundColor Green
} else {
    Write-Host "      WARNING: qdrant.exe not found. Run: python backend/download_qdrant.py" -ForegroundColor Red
}

Start-Sleep -Seconds 2

# 2. Start FastAPI AI Service
Write-Host "`n[2/3] Starting FastAPI AI service..." -ForegroundColor Yellow
$aiServiceDir = Join-Path $ROOT "ai_service"
$pythonExe = Join-Path $aiServiceDir "venv\Scripts\python.exe"
if (Test-Path $pythonExe) {
    $env:PYTHONIOENCODING = "utf-8"
    Start-Process -FilePath $pythonExe -ArgumentList "-m uvicorn app:app --host 0.0.0.0 --port 8000" -WorkingDirectory $aiServiceDir -WindowStyle Minimized
    Write-Host "      FastAPI AI service started on http://localhost:8000" -ForegroundColor Green
    Write-Host "      (Models loading in background - may take 30-60s first run)" -ForegroundColor DarkYellow
} else {
    Write-Host "      WARNING: Python venv not found. Run: python -m venv backend/ai_service/venv" -ForegroundColor Red
}

Start-Sleep -Seconds 2

# 3. Start Node.js Backend
Write-Host "`n[3/3] Starting Node.js backend..." -ForegroundColor Yellow
$backendDir = $ROOT
$nodemon = Get-Command nodemon -ErrorAction SilentlyContinue
if ($nodemon) {
    Start-Process -FilePath "nodemon" -ArgumentList "server.js" -WorkingDirectory $backendDir -WindowStyle Normal
} else {
    Start-Process -FilePath "node" -ArgumentList "server.js" -WorkingDirectory $backendDir -WindowStyle Normal
}
Write-Host "      Node.js backend started on http://localhost:5000" -ForegroundColor Green

Write-Host "`n=======================================" -ForegroundColor Cyan
Write-Host " All services started!" -ForegroundColor Green
Write-Host " Frontend: cd frontend && npm run dev" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan
