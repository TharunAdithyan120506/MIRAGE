@echo off
echo [MIRAGE] Terminating all zombie background processes...

powershell -Command "Get-Process -Name node*, uvicorn*, python* -ErrorAction SilentlyContinue | Stop-Process -Force"
echo [MIRAGE] All processes killed.

pause
