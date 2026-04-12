$ErrorActionPreference = "Stop"

$SCRIPT_DIR = Split-Path -Parent $MyInvocation.MyCommand.Definition
$ROOT_DIR   = Split-Path -Parent (Split-Path -Parent $SCRIPT_DIR)
Set-Location $ROOT_DIR

Write-Host ""
Write-Host "=============================================================="
Write-Host "                MIRAGE - Starting Up"
Write-Host "   Multi-layer Intelligent Reactive Adaptive Grid Engine"
Write-Host "=============================================================="
Write-Host ""

function Cleanup {
    Write-Host ""
    Write-Host "[MIRAGE] Shutting down all services..."
    Get-Job | Stop-Job -PassThru | Remove-Job -Force
    exit
}

Register-EngineEvent PowerShell.Exiting -Action { Cleanup } | Out-Null

if (-not (Get-Command python -ErrorAction SilentlyContinue)) {
    Write-Host "[ERROR] Python not found. Install Python 3.11+"
    exit 1
}

Write-Host "[MIRAGE] Setting up Python environment..."
Set-Location backend

if (-not (Test-Path ".\.venv")) {
    Write-Host "[MIRAGE] Creating virtual environment..."
    python -m venv .venv
}

Write-Host "[MIRAGE] Installing Python dependencies..."
& .\.venv\Scripts\python.exe -m pip install -r requirements.txt -q

Set-Location $ROOT_DIR

$apps = @("frontend-bank", "frontend-honeypot", "frontend-dashboard")

foreach ($app in $apps) {
    if (-not (Test-Path "$app\node_modules")) {
        Write-Host "[MIRAGE] Installing npm deps for $app..."
        Push-Location $app
        npm install | Out-Null
        Pop-Location
    }
}

Write-Host ""
Write-Host "[MIRAGE] Starting all services..."
Write-Host ""

Write-Host "Backend API     -> http://localhost:8000"
Start-Job -Name Backend -ScriptBlock {
    Set-Location "$using:ROOT_DIR\backend"
    .\.venv\Scripts\uvicorn.exe main:app --host 0.0.0.0 --port 8000 --reload 2>&1 | ForEach-Object { "$_" }
}

Start-Sleep -Seconds 2

Write-Host "Admin Portal    -> http://localhost:5000"
Start-Job -Name AdminPortal -ScriptBlock {
    Set-Location "$using:ROOT_DIR\backend"
    .\.venv\Scripts\uvicorn.exe admin_portal:app --host 0.0.0.0 --port 5000 --reload 2>&1 | ForEach-Object { "$_" }
}

Write-Host "Real Bank       -> http://localhost:3000"
Start-Job -Name Bank -ScriptBlock {
    Set-Location "$using:ROOT_DIR\frontend-bank"
    npx vite --port 3000 2>&1 | ForEach-Object { "$_" }
}

Write-Host "Honeypot        -> http://localhost:4000"
Start-Job -Name Honeypot -ScriptBlock {
    Set-Location "$using:ROOT_DIR\frontend-honeypot"
    npx vite --port 4000 2>&1 | ForEach-Object { "$_" }
}

Write-Host "SOC Dashboard   -> http://localhost:8080"
Start-Job -Name Dashboard -ScriptBlock {
    Set-Location "$using:ROOT_DIR\frontend-dashboard"
    npx vite --port 8080 2>&1 | ForEach-Object { "$_" }
}

Write-Host ""
Write-Host "=============================================================="
Write-Host "All services starting... Allow ~10 seconds"
Write-Host ""
Write-Host "Real Bank:      http://localhost:3000  (demo: 40021234567)"
Write-Host "Honeypot:       http://localhost:4000  (any credentials work)"
Write-Host "Admin Portal:   http://localhost:5000  (export portal)"
Write-Host "Backend API:    http://localhost:8000/docs"
Write-Host "Dashboard:      http://localhost:8080  (SOC analyst view)"
Write-Host ""
Write-Host "OTP Exploit:    python backend\otp_exploit.py"
Write-Host "Press Ctrl+C to stop all services"
Write-Host "=============================================================="
Write-Host ""

try {
    while ($true) {
        foreach ($j in Get-Job) {
            $output = Receive-Job $j -ErrorAction Continue
            if ($output) {
                $prefix = "[$($j.Name.PadRight(12))] "
                $output | ForEach-Object { Write-Host "$prefix$_" }
            }
        }
        Start-Sleep -Milliseconds 500
    }
} catch {
    Write-Host "[ERROR] $_"
} finally {
    Cleanup
}
