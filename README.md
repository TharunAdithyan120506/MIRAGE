# MIRAGE: Dual-Fidelity Cybersecurity Honeypot

MIRAGE is a modern, full-stack cybersecurity deception platform designed to capture, track, and profile attackers targeting financial infrastructure.

This project consists of 4 core services working together:
1. **FastAPI Backend (`/backend`)**: Handles all authentication logic, event streaming, Tor proxy detection, attacker fingerprinting, threat scoring, and honeypot monitoring.
2. **Real Bank (`/frontend-bank`)**: A flawless UI clone of a modern banking portal for typical customers to access legally.
3. **Decoy Bank (`/frontend-honeypot`)**: An identical clone of the Real Bank purposely exposing security vulnerabilities and admin portals. When attackers infiltrate this site, their actions are logged.
4. **SOC Dashboard (`/frontend-dashboard`)**: A command-and-control dashboard for blue team analysts to monitor live attacks, attacker infrastructure mapping, and live event websockets.

---

## Local Development & Setup Instructions

Follow these steps to spin up the entire ecosystem on your local machine.

### Prerequisites
- [Node.js 18+](https://nodejs.org/en/)
- [Python 3.11+](https://www.python.org/downloads/)
- `npm` package manager

---

## 🚀 One-Command Startup

All scripts live in `scripts/` — one subfolder per OS. They auto-install all dependencies on first run.

### 🐧 Linux / Debian / macOS

```bash
# Start all 5 services
bash scripts/linux/start-mirage.sh

# OTP exploit (second terminal, during demo)
bash scripts/linux/demo-exploit.sh

# Full colourised attack walkthrough
bash scripts/linux/demo-script.sh

# Playwright automated demo
bash scripts/linux/auto-demo.sh

# Kill everything
bash scripts/linux/kill-mirage.sh
```

### 🪟 Windows (PowerShell)

```powershell
# Start all 5 services
powershell -ExecutionPolicy Bypass -File scripts\win\start-mirage.ps1

# OTP exploit (second terminal)
scripts\win\demo-exploit.bat

# Playwright automated demo
scripts\win\auto-demo.bat

# Kill everything
scripts\win\kill-mirage.bat
```

> See [`scripts/README.md`](scripts/README.md) for full details.

---

## Service URLs

| URL | Service |
|-----|---------|
| http://localhost:3000 | Real Bank (demo: `40021234567` / `123456`) |
| http://localhost:4000 | Honeypot Decoy (any credentials accepted) |
| http://localhost:5000 | Admin Export Portal |
| http://localhost:8000/docs | Backend API (Swagger) |
| http://localhost:8080 | SOC Analyst Dashboard |

---

## Demo Capabilities

### Real Bank (`localhost:3000`)
- **Customer ID:** `40021234567` / **IPIN:** `123456`
- Simulates standard secured banking flows. Failed logins inject subtle debug breadcrumbs to lure attackers toward the honeypot.

### Honeypot Decoy (`localhost:4000`)
- Accepts **any** credential combination — presents as a vulnerable debug portal.
- Silently fingerprints attackers via WebRTC / Canvas APIs to reveal real IP behind VPNs.
- Every action is logged to the SOC Dashboard in real time.

### SOC Dashboard (`localhost:8080`)
- Live WebSocket event feed, MITRE ATT&CK kill-chain mapping, threat scoring, and one-click PDF dossier generation.
