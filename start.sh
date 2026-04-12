#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# MIRAGE — Single-command startup script (no Docker required)
# Starts all five services in parallel
# ─────────────────────────────────────────────────────────────────────────────

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                    MIRAGE — Starting Up                     ║"
echo "║     Multi-layer Intelligent Reactive Adaptive Grid Engine    ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Cleanup function — kill all child processes on exit
cleanup() {
  echo ""
  echo "[MIRAGE] Shutting down all services..."
  kill $(jobs -p) 2>/dev/null || true
  exit 0
}
trap cleanup SIGINT SIGTERM EXIT

# ── Check Python ──────────────────────────────────────────────────────────────
if ! command -v python3 &>/dev/null; then
  echo "[ERROR] python3 not found. Install Python 3.11+"
  exit 1
fi

# ── Install Python backend deps ───────────────────────────────────────────────
echo "[MIRAGE] Installing Python dependencies..."
cd backend
.venv/bin/pip install -r requirements.txt -q
cd "$SCRIPT_DIR"

# ── Install Node deps for all frontends (if needed) ──────────────────────────
for app in frontend-bank frontend-honeypot frontend-dashboard; do
  if [ ! -d "$app/node_modules" ]; then
    echo "[MIRAGE] Installing npm deps for $app..."
    npm install --prefix "$app" -q
  fi
done

echo ""
echo "[MIRAGE] Starting all services..."
echo ""

# ── Service 1: FastAPI Backend (:8000) ────────────────────────────────────────
echo "  ● Backend API     → http://localhost:8000"
(cd backend && .venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000 --reload 2>&1 | \
  sed 's/^/[backend] /') &

sleep 2  # Give backend time to start and init DB

# ── Service 2: Admin Portal (:5000) ───────────────────────────────────────────
echo "  ● Admin Portal    → http://localhost:5000"
(cd backend && .venv/bin/uvicorn admin_portal:app --host 0.0.0.0 --port 5000 --reload 2>&1 | \
  sed 's/^/[admin]   /') &

# ── Service 3: Real Bank Frontend (:3000) ─────────────────────────────────────
echo "  ● Real Bank       → http://localhost:3000"
(cd frontend-bank && npm run dev -- --port 3000 2>&1 | sed 's/^/[bank]    /') &

# ── Service 4: Honeypot Frontend (:4000) ──────────────────────────────────────
echo "  ● Honeypot        → http://localhost:4000"
(cd frontend-honeypot && npm run dev -- --port 4000 2>&1 | sed 's/^/[honey]   /') &

# ── Service 5: SOC Dashboard (:8080) ──────────────────────────────────────────
echo "  ● SOC Dashboard   → http://localhost:8080"
(cd frontend-dashboard && npm run dev -- --port 8080 2>&1 | sed 's/^/[dash]    /') &

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║  All services starting... (allow ~10 seconds)               ║"
echo "║                                                              ║"
echo "║  Real Bank    http://localhost:3000  (demo: 40021234567)     ║"
echo "║  Honeypot     http://localhost:4000  (any credentials work)  ║"
echo "║  Admin Portal http://localhost:5000  (export portal)         ║"
echo "║  Backend API  http://localhost:8000/docs                     ║"
echo "║  Dashboard    http://localhost:8080  (SOC analyst view)      ║"
echo "║                                                              ║"
echo "║  OTP Exploit: python3 backend/otp_exploit.py                 ║"
echo "║                                                              ║"
echo "║  Press Ctrl+C to stop all services                          ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Wait for all background processes
wait
