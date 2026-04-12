#!/bin/bash
# MIRAGE Demo Script — Run this for the live hackathon demo
# PRD Section 11.2

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║              MIRAGE — Live Demo Script                      ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

echo "[PHASE 1: RECONNAISSANCE]"
echo ">>> Hacker scans the network — finds port 4000..."
echo ""
nmap -p 3000-4100 localhost 2>/dev/null || echo "(nmap not installed — simulating port scan result)"
echo ""
echo ">>> Probing the unknown port for admin panels..."
curl -s http://localhost:4000/admin | head -5 2>/dev/null || echo "(open browser: http://localhost:4000/admin)"
echo ""

echo "[PHASE 2: HONEYTOKEN HARVEST]"
echo ">>> Attacker discovers fake AWS credentials..."
echo ""
curl -s http://localhost:8000/api/config | python3 -m json.tool 2>/dev/null
echo ""
echo ">>> Attacker harvests user records..."
curl -s "http://localhost:8000/api/users" 2>/dev/null | \
  python3 -c "import sys,json; d=json.load(sys.stdin); print(f'✓ {len(d)} users harvested')" 2>/dev/null
echo ""

echo "[PHASE 3: OTP TRAP TRIGGERED — check the browser and MIRAGE Dashboard!]"
echo ""
curl -s "http://localhost:8000/api/export-users" | python3 -m json.tool 2>/dev/null
echo ""
echo ">>> OTP Trap engaged. Attacker is being fingerprinted."
echo ">>> Check http://localhost:8080 — score should be climbing!"
echo ""

sleep 3

echo "[PHASE 4: GENERATE DOSSIER]"
echo ">>> Click 'Generate Threat Dossier' on the dashboard at http://localhost:8080"
echo ">>> Or run: curl -X POST http://localhost:8000/api/generate-dossier/<session-id>"
echo ""

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║  Demo complete! The attacker left with nothing.             ║"
echo "║  MIRAGE left with their complete profile.                   ║"
echo "╚══════════════════════════════════════════════════════════════╝"
