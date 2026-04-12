#!/bin/bash
# ════════════════════════════════════════════════════════════════════════════
# MIRAGE — Fully Automated Hackathon Demo Script (Linux / Debian / macOS)
# Installs Playwright if needed, then runs the automated API demo
# Run from anywhere: bash scripts/linux/auto-demo.sh
# ════════════════════════════════════════════════════════════════════════════

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$ROOT_DIR"

PYTHON="$ROOT_DIR/backend/.venv/bin/python3"

echo ""
echo "[MIRAGE] Checking UI automation dependencies..."

# Ensure venv exists
if [ ! -f "$PYTHON" ]; then
  echo "[ERROR] Python venv not found. Run start-mirage.sh first."
  exit 1
fi

# Install Playwright into the venv if not already present
if ! "$PYTHON" -c "import playwright" 2>/dev/null; then
  echo "[MIRAGE] Installing Playwright for automated browser control..."
  "$ROOT_DIR/backend/.venv/bin/pip" install playwright -q
  "$PYTHON" -m playwright install chromium
fi

echo ""
echo "[MIRAGE] Launching automated demo sequence..."
echo ""

"$PYTHON" "$ROOT_DIR/auto_api_demo.py"

echo ""
echo "[MIRAGE] Auto-demo complete."
echo ""
