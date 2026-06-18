@echo off
title DenceWance - Website Setup
color 0A

echo ============================================
echo    DenceWance Website - Auto Setup
echo ============================================
echo.

cd /d "%~dp0"

echo [1/3] Cleaning old files...
if exist node_modules (
    echo      Deleting node_modules...
    rmdir /s /q node_modules
)
if exist package-lock.json (
    del /f package-lock.json
)
echo      Done!
echo.

echo [2/3] Installing packages (please wait 2-5 min)...
echo      This may take a few minutes on first run...
call npm install --no-audit --no-fund
if errorlevel 1 (
    echo.
    echo ERROR: npm install failed! Check your internet connection.
    echo Press any key to exit...
    pause >nul
    exit /b 1
)
echo      Done!
echo.

echo [3/3] Starting website on http://localhost:3000 ...
echo.
echo ============================================
echo    Website is LIVE! Open in browser:
echo    http://localhost:3000
echo ============================================
echo.
echo    Press Ctrl+C to stop the server.
echo.

call npx vite --port 3000 --host
