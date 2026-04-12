#!/bin/bash
# ════════════════════════════════════════════════════════════════════════════
# MIRAGE — Full Attack Flow Demo Script (Linux / Debian / macOS)
# Shows the complete hacker journey: Real Bank → Honeypot → Admin Portal
# Run from anywhere: bash scripts/linux/demo-script.sh
# ════════════════════════════════════════════════════════════════════════════

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$ROOT_DIR"

RED='\033[91m'
GREEN='\033[92m'
YELLOW='\033[93m'
CYAN='\033[96m'
BOLD='\033[1m'
DIM='\033[2m'
RESET='\033[0m'

echo ""
echo -e "${RED}${BOLD}╔══════════════════════════════════════════════════════════════╗${RESET}"
echo -e "${RED}${BOLD}║${RESET}           ${CYAN}${BOLD}MIRAGE — Live Attack Demo Script${RESET}                 ${RED}${BOLD}║${RESET}"
echo -e "${RED}${BOLD}║${RESET}  ${DIM}Full hacker journey: Real Bank → Honeypot → Admin Portal${RESET}  ${RED}${BOLD}║${RESET}"
echo -e "${RED}${BOLD}╚══════════════════════════════════════════════════════════════╝${RESET}"
echo ""

# ── PHASE 1: FAILED LOGIN ON REAL BANK ────────────────────────────────────────
echo -e "${YELLOW}${BOLD}[PHASE 1: RECONNAISSANCE — Attacking Real Bank (port 3000)]${RESET}"
echo -e "${DIM}──────────────────────────────────────────────────────${RESET}"
echo ""
echo -e "${DIM}>>> Hacker tries SQL injection on real bank login...${RESET}"

for i in 1 2 3; do
    echo -e "${DIM}  Attempt $i: admin' OR '1'='1 / password123${RESET}"
    RESULT=$(curl -s -w "\n%{http_code}" -X POST http://localhost:8000/real/auth \
        -H "Content-Type: application/json" \
        -d "{\"account_number\": \"admin' OR '1'='1\", \"ipin\": \"password$i\"}" 2>/dev/null)
    HTTP_CODE=$(echo "$RESULT" | tail -1)
    BODY=$(echo "$RESULT" | head -1)
    echo -e "  ${RED}Response: HTTP $HTTP_CODE — Login failed${RESET}"

    if echo "$BODY" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('_debug_failover_notice',''))" 2>/dev/null | grep -q "Debug portal"; then
        echo -e "  ${GREEN}${BOLD}>>> DEBUG CLUE FOUND IN RESPONSE!${RESET}"
        echo "$BODY" | python3 -c "import sys,json; d=json.load(sys.stdin); print('  → ' + d.get('_debug_failover_notice', ''))" 2>/dev/null
    fi
    sleep 0.5
done

echo ""
echo -e "${GREEN}${BOLD}>>> Hacker notices debug info pointing to port 4000!${RESET}"
echo ""

# ── PHASE 2: NMAP SCAN — DISCOVER HONEYPOT ────────────────────────────────────
echo -e "${YELLOW}${BOLD}[PHASE 2: PORT SCANNING — Discovering Services]${RESET}"
echo -e "${DIM}──────────────────────────────────────────────────────${RESET}"
echo ""
echo -e "${DIM}>>> Running nmap to scan for additional services...${RESET}"
echo ""

echo "Starting Nmap 7.94 ( https://nmap.org ) at $(date '+%Y-%m-%d %H:%M')"
echo "Nmap scan report for localhost (127.0.0.1)"
echo ""
echo "PORT     STATE SERVICE           VERSION"
echo -e "3000/tcp open  http              ${RED}Node.js (HDFC Bank NetBanking)${RESET}"
echo -e "4000/tcp open  http              ${GREEN}${BOLD}Node.js (Banking Debug Portal)${RESET}"
echo -e "5000/tcp open  http              ${GREEN}${BOLD}Python/FastAPI (Admin Export Service)${RESET}"
echo "8000/tcp open  http-proxy        Python/FastAPI (Internal API Gateway)"
echo "8080/tcp open  http-alt          Node.js (SOC Dashboard)"
echo ""
echo -e "Nmap done: 1 IP address (1 host up) scanned in 2.34 seconds"
echo ""
echo -e "${GREEN}${BOLD}>>> Found exposed services: port 4000 (debug) and port 5000 (admin export)!${RESET}"
echo ""
sleep 1

# ── PHASE 3: ATTACK HONEYPOT ─────────────────────────────────────────────────
echo -e "${YELLOW}${BOLD}[PHASE 3: BYPASSING LOGIN — Honeypot (port 4000)]${RESET}"
echo -e "${DIM}──────────────────────────────────────────────────────${RESET}"
echo ""
echo -e "${DIM}>>> Trying same SQL injection on debug portal...${RESET}"

LOGIN_RESULT=$(curl -s -X POST http://localhost:8000/honey/auth \
    -H "Content-Type: application/json" \
    -d '{"username": "admin", "password": "admin123"}' 2>/dev/null)
SESSION_ID=$(echo "$LOGIN_RESULT" | python3 -c "import sys,json; print(json.load(sys.stdin).get('session_id',''))" 2>/dev/null)

echo -e "${GREEN}${BOLD}  ✓ LOGIN SUCCESSFUL!${RESET} Session ID: ${CYAN}${SESSION_ID:0:8}...${RESET}"
echo -e "${DIM}  (Honeypot accepts any credentials — hacker thinks they bypassed auth)${RESET}"
echo ""

echo -e "${DIM}>>> Harvesting credentials and user data...${RESET}"
curl -s "http://localhost:8000/api/config?session_id=$SESSION_ID" | python3 -m json.tool 2>/dev/null | head -8
echo "  ..."
echo ""

USERS=$(curl -s "http://localhost:8000/api/users?session_id=$SESSION_ID" 2>/dev/null | \
    python3 -c "import sys,json; d=json.load(sys.stdin); print(f'{len(d)} users harvested')" 2>/dev/null)
echo -e "${GREEN}  ✓ $USERS${RESET}"
echo ""

# ── PHASE 4: DISCOVER ADMIN PORTAL ───────────────────────────────────────────
echo -e "${YELLOW}${BOLD}[PHASE 4: ADMIN PORTAL — Export Service (port 5000)]${RESET}"
echo -e "${DIM}──────────────────────────────────────────────────────${RESET}"
echo ""
echo -e "${DIM}>>> Accessing admin export portal at port 5000...${RESET}"
curl -s http://localhost:5000/health 2>/dev/null | python3 -m json.tool 2>/dev/null
echo ""
echo -e "${GREEN}>>> Admin export portal is live! Clicking export...${RESET}"
echo ""
echo -e "${DIM}>>> Export requires OTP verification. Running MITM exploit...${RESET}"
echo ""
sleep 1

# ── PHASE 5: OTP EXPLOIT ─────────────────────────────────────────────────────
echo -e "${YELLOW}${BOLD}[PHASE 5: MITM OTP INTERCEPT]${RESET}"
echo -e "${DIM}──────────────────────────────────────────────────────${RESET}"
echo ""
echo -e "${DIM}>>> Launching MITM-OTP exploit script...${RESET}"
echo ""

python3 "$ROOT_DIR/backend/otp_exploit.py" 2>/dev/null || python3 backend/otp_exploit.py 2>/dev/null || true
echo ""

# ── PHASE 6: ENTER OTP — GETS REJECTED ───────────────────────────────────────
echo -e "${YELLOW}${BOLD}[PHASE 6: OTP ENTRY — Hacker enters intercepted OTP]${RESET}"
echo -e "${DIM}──────────────────────────────────────────────────────${RESET}"
echo ""
echo -e "${DIM}>>> Entering intercepted OTP 847293 on admin portal...${RESET}"

OTP_RESULT=$(curl -s -X POST http://localhost:8000/api/verify-otp \
    -H "Content-Type: application/json" \
    -d "{\"session_id\": \"$SESSION_ID\", \"otp\": \"847293\"}" 2>/dev/null)
echo "$OTP_RESULT" | python3 -m json.tool 2>/dev/null
echo ""
echo -e "${RED}${BOLD}>>> OTP REJECTED! But MIRAGE already has everything.${RESET}"
echo ""

# ── PHASE 7: RESULT ──────────────────────────────────────────────────────────
echo -e "${YELLOW}${BOLD}[PHASE 7: GENERATE DOSSIER]${RESET}"
echo -e "${DIM}──────────────────────────────────────────────────────${RESET}"
echo ""
echo -e "${DIM}>>> Check the MIRAGE Dashboard at http://localhost:8080${RESET}"
echo -e "${DIM}>>> Click 'Generate Threat Dossier' to create the PDF report${RESET}"
echo ""

if [ -n "$SESSION_ID" ]; then
    echo -e "${DIM}>>> Or run: curl -X POST http://localhost:8000/api/generate-dossier/$SESSION_ID${RESET}"
fi

echo ""
echo -e "${GREEN}${BOLD}╔══════════════════════════════════════════════════════════════╗${RESET}"
echo -e "${GREEN}${BOLD}║  Demo complete!                                              ║${RESET}"
echo -e "${GREEN}${BOLD}║                                                              ║${RESET}"
echo -e "${GREEN}${BOLD}║  The attacker left with NOTHING.                             ║${RESET}"
echo -e "${GREEN}${BOLD}║  MIRAGE left with their COMPLETE profile:                    ║${RESET}"
echo -e "${GREEN}${BOLD}║  • Real IP (WebRTC bypass)                                   ║${RESET}"
echo -e "${GREEN}${BOLD}║  • Physical Location (City, Country, ISP)                    ║${RESET}"
echo -e "${GREEN}${BOLD}║  • Device Fingerprint                                        ║${RESET}"
echo -e "${GREEN}${BOLD}║  • MITRE ATT&CK Kill Chain                                   ║${RESET}"
echo -e "${GREEN}${BOLD}║  • Complete Threat Actor Dossier                              ║${RESET}"
echo -e "${GREEN}${BOLD}╚══════════════════════════════════════════════════════════════╝${RESET}"
echo ""
