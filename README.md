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
- [Node.js](https://nodejs.org/en/) (v16+ recommended)
- [Python 3.9+](https://www.python.org/downloads/)
- `npm` or `yarn` package managers

---

### Step 1: Run the FastAPI Backend
The backend utilizes WebSockets and a lightweight SQLite database for threat telemetry.

1. Open a new terminal and navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Install the Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Start the FastAPI server (it runs on Port 8000 by default):
   ```bash
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```
> The API will now be accessible at `http://localhost:8000`

---

### Step 2: Start the Real Bank Frontend
1. Open a new terminal and navigate to the bank frontend folder:
   ```bash
   cd frontend-bank
   ```
2. Install Node dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev -- --port 5000
   ```
> The Real Bank is now accessible at `http://localhost:5000`

---

### Step 3: Start the Honeypot Decoy Frontend
1. Open a new terminal and navigate to the honeypot folder:
   ```bash
   cd frontend-honeypot
   ```
2. Install Node dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev -- --port 5001
   ```
> The Honeypot Decoy is now accessible at `http://localhost:5001`
*(Try accessing `/admin` or `/phpmyadmin` to trigger honeypot alarms!)*

---

### Step 4: Start the SOC Analyst Dashboard
1. Open a new terminal and navigate to the dashboard folder:
   ```bash
   cd frontend-dashboard
   ```
2. Install Node dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev -- --port 5002
   ```
> The SOC Dashboard is now accessible at `http://localhost:5002`

---

## Demo Users & Capabilities

### Real Bank (`localhost:5000`)
- **Customer ID:** `40021234567` / **IPIN:** `123456`
- Simulates standard, secured banking flows. Transactions are not forwarded to threat intelligence.

### Decoy Bank (`localhost:5001`)
- Accepts **ANY credential combination**. It represents a purposely vulnerable system.
- Includes hidden directories like `localhost:5001/admin` and `localhost:5001/phpmyadmin` modeled strictly to trap attackers.
- Injects a silent fingerprinting trap leveraging WebRTC/Canvas APIs to reveal an attacker's originating ISP/hardware despite basic VPN usage.

### SOC Dashboard (`localhost:5002`)
- Monitors the `frontend-honeypot` live events. Shows Threat gauges mapped via MITRE ATT&CK framework, and alerts via WebSockets.

---

## 🚀 One-Command Deployment (Optional script)

If you'd like to run all four services inside the same terminal automatically via a combined start script, you can execute the bash file located in the root directory:

```bash
chmod +x start.sh
./start.sh
```
*(Note: Requires checking `start.sh` configuration ports beforehand).*
