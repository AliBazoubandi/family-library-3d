@echo off
setlocal enabledelayedexpansion
title Family Library Launcher
echo ========================================================
echo        Starting Family Library (3D & 2D)
echo ========================================================
echo.

cd /d "%~dp0"

:: 1. Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not found in PATH!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

:: 2. Check dependencies (node_modules)
if not exist "node_modules\" (
    echo [1/4] node_modules not detected. Installing dependencies (npm install)...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] npm install encountered an error.
        pause
        exit /b 1
    )
) else (
    echo [1/4] Node.js dependencies verified.
)

:: 3. Check PocketBase binary
if not exist "pocketbase.exe" (
    echo [2/4] pocketbase.exe not found. Downloading PocketBase v0.40.6 for Windows...
    powershell -NoProfile -ExecutionPolicy Bypass -Command "Invoke-WebRequest -Uri 'https://github.com/pocketbase/pocketbase/releases/download/v0.40.6/pocketbase_0.40.6_windows_amd64.zip' -OutFile 'pocketbase.zip'; Expand-Archive -Path 'pocketbase.zip' -DestinationPath '.' -Force; Remove-Item 'pocketbase.zip'"
    if not exist "pocketbase.exe" (
        echo [ERROR] Failed to download PocketBase executable automatically.
        echo Please download pocketbase.exe from https://pocketbase.io/ and place it in this directory.
        pause
        exit /b 1
    )
) else (
    echo [2/4] PocketBase executable verified.
)

:: 4. Apply Database Migrations
echo [3/4] Ensuring database migrations are up to date...
pocketbase.exe migrate up

:: 5. Launch Servers
echo [4/4] Starting backend and frontend dev server...
echo   - Launching PocketBase on http://127.0.0.1:8090...
start "PocketBase Backend" /min pocketbase.exe serve --http="127.0.0.1:8090"

echo   - Launching Vite Dev Server on http://localhost:5173...
start "Vite Dev Server" cmd /k npm run dev

echo.
echo Waiting 2 seconds for services to initialize...
timeout /t 2 /nobreak >nul

echo.
echo Opening Family Library in your default web browser...
start http://localhost:5173/

echo.
echo ========================================================
echo  All services are up and running!
echo  - 🌐 Web Application:   http://localhost:5173/
echo  - 🗄️ PocketBase API:    http://127.0.0.1:8090/
echo  - 🛠️ PocketBase Admin:  http://127.0.0.1:8090/_/
echo.
echo  Default Demo Accounts:
echo    - Ali (Family Owner): owner@library.local / Password123456!
echo    - Sara (Family):      sara@library.local  / Password123456!
echo    - Reza (Family):      reza@library.local  / Password123456!
echo.
echo  To shut down services cleanly, run stop.bat
echo ========================================================
echo.
pause
