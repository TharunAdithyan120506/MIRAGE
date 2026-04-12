@echo off
REM ════════════════════════════════════════════════════════════════════════════
REM MIRAGE — Fully Automated Hackathon Demo Script
REM ════════════════════════════════════════════════════════════════════════════

echo.
echo [MIRAGE] Checking UI automation dependencies...
if not exist "backend\.venv\Lib\site-packages\playwright" (
    echo [MIRAGE] Installing Playwright for automated browser control...
    backend\.venv\Scripts\pip.exe install playwright -q
    backend\.venv\Scripts\playwright.exe install chromium
)

echo.
echo [MIRAGE] Launching automated demo sequence...
echo.

backend\.venv\Scripts\python.exe auto_api_demo.py

pause
