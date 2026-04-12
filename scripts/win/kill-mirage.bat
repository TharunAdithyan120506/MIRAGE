@echo off
REM ════════════════════════════════════════════════════════════════════════════
REM MIRAGE — Kill All Background Processes (Windows)
REM ════════════════════════════════════════════════════════════════════════════

echo.
echo [MIRAGE] Terminating all zombie background processes...
echo.

powershell -Command "Get-Process -Name node*, uvicorn*, python* -ErrorAction SilentlyContinue | Stop-Process -Force"

echo [MIRAGE] All processes killed.
echo.
pause
