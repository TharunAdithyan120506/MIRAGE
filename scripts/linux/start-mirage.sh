#!/bin/bash
# ════════════════════════════════════════════════════════════════════════════
# MIRAGE — Single-command startup script (Linux / Debian / macOS)
# Starts all five services in parallel with live multiplexed log output
# Run from anywhere: bash scripts/linux/start-mirage.sh
# ════════════════════════════════════════════════════════════════════════════

set -euo pipefail

# Always resolve paths relative to the MIRAGE repo root (two levels up from this script)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$ROOT_DIR"

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                    MIRAGE — Starting Up                      ║"
echo "║     Multi-layer Intelligent Reactive Adaptive Grid Engine    ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# ── Cleanup: kill every child process on exit / Ctrl+C ───────────────────────
cleanup() {
  echo ""
  echo "[MIRAGE] Shutting down all services..."
  # kill the whole process group so background subshells die too
  kill -- -$$ 2>/dev/null || kill $(jobs -p) 2>/dev/null || true
  exit 0
}
trap cleanup SIGINT SIGTERM EXIT

# ── Dependency checks ─────────────────────────────────────────────────────────
if ! command -v python3 &>/dev/null; then
  echo "[ERROR] python3 not found. Install Python 3.11+  (sudo apt install python3)"
  exit 1
fi

if ! command -v node &>/dev/null; then
  echo "[ERROR] node not found. Install Node.js 18+  (https://nodejs.org)"
  exit 1
fi

if ! command -v npm &>/dev/null; then
  echo "[ERROR] npm not found. Install Node.js 18+  (https://nodejs.org)"
  exit 1
fi

# ── Python virtual environment ─────────────────────────────────────────────────
echo "[MIRAGE] Setting up Python environment..."
cd "$ROOT_DIR/backend"

if [ ! -d ".venv" ]; then
  echo "[MIRAGE] Creating virtual environment..."
  python3 -m venv .venv
fi

echo "[MIRAGE] Installing Python dependencies..."
.venv/bin/pip install -r requirements.txt -q

cd "$ROOT_DIR"

# ── Node dependencies (only if node_modules is missing) ──────────────────────
for app in frontend-bank frontend-honeypot frontend-dashboard; do
  if [ ! -d "$app/node_modules" ]; then
    echo "[MIRAGE] Installing npm deps for $app..."
    npm install --prefix "$app" --silent
  fi
done

echo ""
echo "[MIRAGE] Starting all services..."
echo ""

# ── Service 1: FastAPI Backend (:8000) ────────────────────────────────────────
echo "  ● Backend API     → http://localhost:8000"
(cd "$ROOT_DIR/backend" && .venv/bin/uvicorn main:app \
    --host 0.0.0.0 --port 8000 --reload 2>&1 | sed 's/^/[backend]  /') &

sleep 2   # Give backend time to initialise DB before other services start

# ── Service 2: Admin Portal (:5000) ───────────────────────────────────────────
echo "  ● Admin Portal    → http://localhost:5000"
(cd "$ROOT_DIR/backend" && .venv/bin/uvicorn admin_portal:app \
    --host 0.0.0.0 --port 5000 --reload 2>&1 | sed 's/^/[admin]    /') &

# ── Service 3: Real Bank Frontend (:3000) ─────────────────────────────────────
echo "  ● Real Bank       → http://localhost:3000"
(cd "$ROOT_DIR/frontend-bank" && npm run dev -- --port 3000 2>&1 | sed 's/^/[bank]     /') &

# ── Service 4: Honeypot Frontend (:4000) ──────────────────────────────────────
echo "  ● Honeypot        → http://localhost:4000"
(cd "$ROOT_DIR/frontend-honeypot" && npm run dev -- --port 4000 2>&1 | sed 's/^/[honeypot] /') &

# ── Service 5: SOC Dashboard (:8080) ──────────────────────────────────────────
echo "  ● SOC Dashboard   → http://localhost:8080"
(cd "$ROOT_DIR/frontend-dashboard" && npm run dev -- --port 8080 2>&1 | sed 's/^/[dashboard]/') &

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║  All services starting... (allow ~10 seconds)                ║"
echo "║                                                              ║"
echo "║  Real Bank    http://localhost:3000  (demo: 40021234567)     ║"
echo "║  Honeypot     http://localhost:4000  (any credentials work)  ║"
echo "║  Admin Portal http://localhost:5000  (export portal)         ║"
echo "║  Backend API  http://localhost:8000/docs                     ║"
echo "║  Dashboard    http://localhost:8080  (SOC analyst view)      ║"
echo "║                                                              ║"
echo "║  OTP Exploit: bash scripts/linux/demo-exploit.sh             ║"
echo "║  Kill all:    bash scripts/linux/kill-mirage.sh              ║"
echo "║                                                              ║"
echo "║  Press Ctrl+C to stop all services                           ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Wait for all background processes (exits when Ctrl+C hits the trap)
wait
