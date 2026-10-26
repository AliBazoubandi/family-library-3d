# PowerShell launcher for Family Library
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "       Starting Family Library (3D & 2D)" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

Set-Location $PSScriptRoot

# 1. Check Node.js
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "[ERROR] Node.js is not found in PATH! Please install Node.js from https://nodejs.org/" -ForegroundColor Red
    Pause
    exit 1
}

# 2. Check dependencies
if (-not (Test-Path "node_modules")) {
    Write-Host "[1/4] Installing dependencies with npm install..." -ForegroundColor Yellow
    npm install
} else {
    Write-Host "[1/4] Node.js dependencies verified." -ForegroundColor Green
}

# 3. Check PocketBase binary
if (-not (Test-Path "pocketbase.exe")) {
    Write-Host "[2/4] Downloading PocketBase v0.40.6 for Windows..." -ForegroundColor Yellow
    Invoke-WebRequest -Uri "https://github.com/pocketbase/pocketbase/releases/download/v0.40.6/pocketbase_0.40.6_windows_amd64.zip" -OutFile "pocketbase.zip"
    Expand-Archive -Path "pocketbase.zip" -DestinationPath "." -Force
    Remove-Item "pocketbase.zip"
} else {
    Write-Host "[2/4] PocketBase executable verified." -ForegroundColor Green
}

# 4. Run Migrations
Write-Host "[3/4] Ensuring database migrations are applied..." -ForegroundColor Yellow
.\pocketbase.exe migrate up

# 5. Launch Servers
Write-Host "[4/4] Launching PocketBase and Vite dev server..." -ForegroundColor Yellow
Start-Process -FilePath ".\pocketbase.exe" -ArgumentList "serve --http=127.0.0.1:8090" -WindowStyle Minimized
Start-Process -FilePath "cmd.exe" -ArgumentList "/k title Vite Dev Server & npm run dev"

Start-Sleep -Seconds 2

Write-Host "Opening browser at http://localhost:5173/..." -ForegroundColor Green
Start-Process "http://localhost:5173/"

Write-Host ""
Write-Host "App is running at: http://localhost:5173/" -ForegroundColor Green
Write-Host "PocketBase Admin:  http://127.0.0.1:8090/_/" -ForegroundColor Green
Write-Host "Run stop.bat to stop all background services." -ForegroundColor Cyan
