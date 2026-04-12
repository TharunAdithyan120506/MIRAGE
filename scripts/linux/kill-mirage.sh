#!/bin/bash
# ════════════════════════════════════════════════════════════════════════════
# MIRAGE — Kill All Background Processes (Linux / Debian / macOS)
# Run from anywhere: bash scripts/linux/kill-mirage.sh
# ════════════════════════════════════════════════════════════════════════════

echo ""
echo "[MIRAGE] Terminating all MIRAGE background processes..."
echo ""

# Kill by process name — covers uvicorn workers and vite dev servers
pkill -f "uvicorn main:app"       2>/dev/null && echo "  ✓ Killed: uvicorn main:app        (Backend API)"      || echo "  – Not running: uvicorn main:app"
pkill -f "uvicorn admin_portal"   2>/dev/null && echo "  ✓ Killed: uvicorn admin_portal    (Admin Portal)"    || echo "  – Not running: uvicorn admin_portal"
pkill -f "vite --port 3000"       2>/dev/null && echo "  ✓ Killed: vite --port 3000        (Real Bank)"       || echo "  – Not running: vite --port 3000"
pkill -f "vite --port 4000"       2>/dev/null && echo "  ✓ Killed: vite --port 4000        (Honeypot)"        || echo "  – Not running: vite --port 4000"
pkill -f "vite --port 8080"       2>/dev/null && echo "  ✓ Killed: vite --port 8080        (SOC Dashboard)"   || echo "  – Not running: vite --port 8080"

# Fallback: free any lingering port holders via fuser (if installed)
for port in 8000 5000 3000 4000 8080; do
  fuser -k "${port}/tcp" 2>/dev/null && echo "  ✓ Freed port $port" || true
done

echo ""
echo "[MIRAGE] All processes terminated."
echo ""
