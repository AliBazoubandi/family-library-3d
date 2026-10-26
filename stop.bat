@echo off
title Stop Family Library
echo ========================================================
echo        Stopping Family Library Services
echo ========================================================
echo.

echo [1/2] Terminating PocketBase backend server...
taskkill /f /im pocketbase.exe 2>nul
if %errorlevel% equ 0 (
    echo       PocketBase stopped successfully.
) else (
    echo       PocketBase was not running.
)

echo [2/2] Terminating Vite dev server window...
taskkill /f /fi "WINDOWTITLE eq Vite Dev Server*" 2>nul
if %errorlevel% equ 0 (
    echo       Vite dev server window closed.
) else (
    echo       Vite window was already closed or run from another shell.
)

echo.
echo All services have been stopped.
timeout /t 3 >nul
