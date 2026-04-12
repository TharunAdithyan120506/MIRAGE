"""
MIRAGE Admin Export Portal — Port 5000
Lightweight FastAPI app serving an "admin data export" portal.
Discovered by hackers via nmap scanning from the honeypot.

This portal:
- Looks like an internal admin data export service
- Has export buttons (Users CSV, Transactions, Audit Logs)
- Every export requires OTP verification
- OTP always fails → but we capture the attacker's fingerprint
- All events are logged back to the main MIRAGE backend (port 8000)
"""
import os
import asyncio
import uuid
from datetime import datetime
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware

import httpx

MIRAGE_BACKEND = "http://localhost:8000"

@asynccontextmanager
async def lifespan(app: FastAPI):
    yield

app = FastAPI(title="SecureBank Admin Export Service", version="1.2.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


async def _log_to_mirage(session_id: str, signal: str, path: str, payload: dict = None):
    """Log event to main MIRAGE backend."""
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            await client.post(f"{MIRAGE_BACKEND}/internal/admin-portal-event", json={
                "session_id": session_id,
                "signal": signal,
                "path": path,
                "payload": payload or {},
            })
    except Exception:
        pass  # Backend unreachable — continue silently


ADMIN_HTML = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SecureBank Admin Export Portal</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&family=JetBrains+Mono&display=swap" rel="stylesheet">
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: 'Inter', sans-serif;
            background: #0D1117;
            color: #E6EDF3;
            min-height: 100vh;
        }
        nav {
            background: #161B22;
            border-bottom: 3px solid #C8102E;
            padding: 0 32px;
            height: 64px;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        .nav-brand {
            display: flex;
            align-items: center;
            gap: 12px;
        }
        .nav-icon {
            background: #C8102E;
            border-radius: 8px;
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
        }
        .nav-title { font-weight: 700; font-size: 16px; }
        .nav-version { color: rgba(255,255,255,0.5); font-size: 11px; }
        .nav-right { color: rgba(255,255,255,0.4); font-size: 12px; }
        .container { max-width: 960px; margin: 0 auto; padding: 40px 24px; }
        .warning-banner {
            background: #2D1418;
            border: 1px solid #C8102E;
            border-radius: 8px;
            padding: 16px 20px;
            margin-bottom: 32px;
            display: flex;
            align-items: center;
            gap: 12px;
        }
        .warning-icon { font-size: 28px; }
        .warning-text { font-size: 13px; color: #F85149; }
        h1 { font-size: 24px; color: #D4A017; margin-bottom: 8px; }
        .subtitle { font-size: 13px; color: #8B949E; margin-bottom: 32px; }
        .export-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 40px; }
        .export-card {
            background: #161B22;
            border: 1px solid #30363D;
            border-radius: 12px;
            padding: 28px;
            text-align: center;
            cursor: pointer;
            transition: all 0.2s;
            border-top: 3px solid #003366;
        }
        .export-card:hover {
            border-color: #C8102E;
            border-top-color: #C8102E;
            box-shadow: 0 0 20px rgba(200,16,46,0.15);
            transform: translateY(-2px);
        }
        .export-icon { font-size: 42px; margin-bottom: 16px; }
        .export-title { font-weight: 700; font-size: 15px; margin-bottom: 6px; }
        .export-desc { font-size: 12px; color: #8B949E; line-height: 1.5; }
        .export-badge {
            display: inline-block;
            background: #C8102E22;
            color: #C8102E;
            border: 1px solid #C8102E44;
            font-size: 10px;
            font-weight: 700;
            padding: 2px 10px;
            border-radius: 999px;
            margin-top: 12px;
        }

        /* OTP Modal */
        .modal-overlay {
            display: none;
            position: fixed;
            inset: 0;
            z-index: 9999;
            background: rgba(0,0,0,0.8);
            backdrop-filter: blur(6px);
            align-items: center;
            justify-content: center;
        }
        .modal-overlay.active { display: flex; }
        .modal {
            background: white;
            border-radius: 12px;
            width: 100%;
            max-width: 440px;
            overflow: hidden;
            box-shadow: 0 20px 60px rgba(0,0,0,0.5);
            animation: slideIn 0.3s ease;
        }
        .modal-header {
            background: #003366;
            padding: 20px 28px;
            color: white;
            border-bottom: 3px solid #C8102E;
        }
        .modal-header h3 { font-size: 16px; font-weight: 700; }
        .modal-header p { font-size: 12px; opacity: 0.8; margin-top: 4px; }
        .modal-body { padding: 28px 32px; color: #1A1A2E; }
        .modal-warning {
            background: #FFF3CD;
            border: 1px solid #FBBF24;
            border-radius: 6px;
            padding: 12px 14px;
            font-size: 13px;
            color: #92400E;
            margin-bottom: 20px;
        }
        .otp-input {
            width: 100%;
            padding: 14px;
            border: 2px solid #003366;
            border-radius: 8px;
            font-size: 24px;
            font-family: 'JetBrains Mono', monospace;
            text-align: center;
            letter-spacing: 12px;
            outline: none;
            margin-bottom: 16px;
        }
        .otp-input:focus { border-color: #C8102E; }
        .btn-verify {
            width: 100%;
            background: #003366;
            color: white;
            border: none;
            padding: 14px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
        }
        .btn-verify:hover { background: #002244; }
        .btn-verify:disabled { opacity: 0.5; cursor: not-allowed; }
        .btn-cancel {
            width: 100%;
            background: transparent;
            color: #8B949E;
            border: 1px solid #ddd;
            padding: 10px;
            border-radius: 8px;
            font-size: 13px;
            cursor: pointer;
            margin-top: 8px;
        }
        .result-msg {
            margin-top: 16px;
            padding: 12px;
            border-radius: 6px;
            font-size: 13px;
            display: none;
        }
        .result-msg.error {
            display: block;
            background: #FEE2E2;
            color: #B91C1C;
            border: 1px solid #FCA5A5;
        }
        .result-msg.locked {
            display: block;
            background: #FEE2E2;
            color: #7F1D1D;
            border: 1px solid #F87171;
        }
        .stats-bar {
            display: flex;
            gap: 16px;
            margin-bottom: 32px;
        }
        .stat {
            background: #161B22;
            border: 1px solid #30363D;
            border-radius: 8px;
            padding: 16px 24px;
            flex: 1;
            text-align: center;
        }
        .stat-value { font-size: 22px; font-weight: 700; color: #D4A017; }
        .stat-label { font-size: 11px; color: #8B949E; margin-top: 4px; }

        @keyframes slideIn {
            from { transform: translateY(-30px); opacity: 0; }
            to   { transform: translateY(0);     opacity: 1; }
        }
    </style>
</head>
<body>
    <nav>
        <div class="nav-brand">
            <div class="nav-icon">📊</div>
            <div>
                <div class="nav-title">SecureBank Admin Export Portal</div>
                <div class="nav-version">v1.2 — Internal Data Services</div>
            </div>
        </div>
        <div class="nav-right">🔒 Restricted Access — Internal Use Only</div>
    </nav>

    <div class="container">
        <div class="warning-banner">
            <div class="warning-icon">⚠️</div>
            <div class="warning-text">
                <strong>SECURITY NOTICE:</strong> All data exports require OTP verification.
                Access to this portal is logged and monitored. Unauthorized access will be investigated.
            </div>
        </div>

        <h1>📤 Data Export Console</h1>
        <p class="subtitle">Export banking data for authorized audit and compliance purposes only.</p>

        <div class="stats-bar">
            <div class="stat"><div class="stat-value">12,847</div><div class="stat-label">Total Users</div></div>
            <div class="stat"><div class="stat-value">4.2M</div><div class="stat-label">Transactions</div></div>
            <div class="stat"><div class="stat-value">892K</div><div class="stat-label">Audit Records</div></div>
            <div class="stat"><div class="stat-value">98.7%</div><div class="stat-label">System Health</div></div>
        </div>

        <div class="export-grid">
            <div class="export-card" onclick="requestExport('users')">
                <div class="export-icon">👥</div>
                <div class="export-title">Export Users CSV</div>
                <div class="export-desc">Full user database with account details, KYC status, and contact info</div>
                <div class="export-badge">OTP REQUIRED</div>
            </div>
            <div class="export-card" onclick="requestExport('transactions')">
                <div class="export-icon">💳</div>
                <div class="export-title">Export Transactions</div>
                <div class="export-desc">Complete transaction ledger with amounts, timestamps, and references</div>
                <div class="export-badge">OTP REQUIRED</div>
            </div>
            <div class="export-card" onclick="requestExport('audit')">
                <div class="export-icon">📋</div>
                <div class="export-title">Export Audit Logs</div>
                <div class="export-desc">Full system audit trail including admin actions and security events</div>
                <div class="export-badge">OTP REQUIRED</div>
            </div>
        </div>
    </div>

    <!-- OTP Modal -->
    <div class="modal-overlay" id="otpModal">
        <div class="modal">
            <div class="modal-header">
                <h3>🔐 Security Verification Required</h3>
                <p>Enter the OTP sent to adm***@securebank.in</p>
            </div>
            <div class="modal-body">
                <div class="modal-warning">
                    ⚠️ <strong>Sensitive data export requested.</strong> Enter the 6-digit OTP
                    sent to the registered admin email to proceed.
                </div>
                <input type="text" class="otp-input" id="otpInput" maxlength="6"
                    placeholder="• • • • • •" inputmode="numeric"
                    oninput="this.value = this.value.replace(/\\D/g, '')">
                <div class="result-msg" id="resultMsg"></div>
                <button class="btn-verify" id="verifyBtn" onclick="verifyOTP()">
                    Verify & Export Data
                </button>
                <button class="btn-cancel" onclick="closeModal()">Cancel</button>
            </div>
        </div>
    </div>

    <!-- Silent fingerprinting -->
    <script>
        // Allow passing session from previous phases via URL to keep dashboard metrics together
        const urlParams = new URLSearchParams(window.location.search);
        let sessionId = urlParams.get('session_id') || localStorage.getItem('session_id') || null;
        let exportType = '';
        let otpAttempts = 0;

        // Collect fingerprint silently on page load
        (async function() {
            const profile = {
                session_id: sessionId,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                language: navigator.language,
                screen: screen.width + 'x' + screen.height,
                cores: navigator.hardwareConcurrency,
                memory: navigator.deviceMemory || null,
                userAgent: navigator.userAgent,
                touchPoints: navigator.maxTouchPoints,
                webrtcIP: null,
                canvasHash: null,
            };

            // Canvas fingerprint
            try {
                const canvas = document.createElement('canvas');
                canvas.width = 300; canvas.height = 100;
                const ctx = canvas.getContext('2d');
                ctx.fillStyle = '#003366';
                ctx.fillRect(0, 0, 300, 100);
                ctx.fillStyle = '#C8102E';
                ctx.font = 'bold 18px Arial';
                ctx.fillText('MIRAGE_FP_ADMIN_' + navigator.userAgent.slice(0, 20), 10, 50);
                profile.canvasHash = btoa(canvas.toDataURL()).slice(20, 52);
            } catch(e) {}

            // WebRTC IP leak
            await new Promise((resolve) => {
                try {
                    const pc = new RTCPeerConnection({
                        iceServers: [
                            { urls: 'stun:stun.l.google.com:19302' },
                            { urls: 'stun:stun1.l.google.com:19302' },
                        ]
                    });
                    pc.createDataChannel('');
                    pc.createOffer().then(o => pc.setLocalDescription(o)).catch(() => resolve());
                    const timeout = setTimeout(() => { pc.close(); resolve(); }, 4000);
                    pc.onicecandidate = (e) => {
                        if (!e.candidate) return;
                        const m = e.candidate.candidate.match(/(\\d{1,3}(?:\\.\\d{1,3}){3}|[a-f0-9:]{3,39})/i);
                        if (m) {
                            const ip = m[1];
                            if (!ip.startsWith('192.168') && !ip.startsWith('10.') &&
                                !ip.startsWith('172.') && ip !== '127.0.0.1') {
                                profile.webrtcIP = ip;
                                clearTimeout(timeout);
                                pc.close();
                                resolve();
                            } else if (!profile.webrtcIP) {
                                profile.webrtcIP = ip;
                            }
                        }
                    };
                } catch(e) { resolve(); }
            });

            // Send telemetry
            try {
                await fetch('http://localhost:8000/api/telemetry', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(profile),
                    keepalive: true,
                });
            } catch(e) {}
        })();

        // Log page visit
        fetch('http://localhost:8000/internal/admin-portal-event', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                session_id: sessionId,
                signal: 'admin_portal_access',
                path: '/admin-portal:5000',
                payload: { source: 'port_5000_visit' },
            }),
        }).catch(() => {});

        function requestExport(type) {
            exportType = type;
            otpAttempts = 0;
            document.getElementById('otpModal').classList.add('active');
            document.getElementById('otpInput').value = '';
            document.getElementById('otpInput').focus();
            document.getElementById('resultMsg').style.display = 'none';
            document.getElementById('verifyBtn').disabled = false;

            // Log export attempt
            fetch('http://localhost:8000/internal/admin-portal-event', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    session_id: sessionId,
                    signal: 'admin_export_attempt',
                    path: '/admin-portal:5000/export/' + type,
                    payload: { export_type: type },
                }),
            }).catch(() => {});
        }

        async function verifyOTP() {
            const otp = document.getElementById('otpInput').value;
            if (otp.length < 6) return;

            otpAttempts++;
            const resultMsg = document.getElementById('resultMsg');

            // Log OTP attempt
            fetch('http://localhost:8000/internal/admin-portal-event', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    session_id: sessionId,
                    signal: 'otp_verify_attempt',
                    path: '/admin-portal:5000/verify-otp',
                    payload: { otp_entered: otp, attempt: otpAttempts, export_type: exportType },
                }),
            }).catch(() => {});

            if (otpAttempts >= 3) {
                resultMsg.className = 'result-msg locked';
                resultMsg.innerHTML = '🔒 <strong>Account Temporarily Locked</strong><br>' +
                    'Multiple failed OTP attempts detected. Your session has been flagged ' +
                    'for security review. Contact support at 1800-202-6161.';
                document.getElementById('verifyBtn').disabled = true;
                document.getElementById('otpInput').disabled = true;
            } else {
                resultMsg.className = 'result-msg error';
                resultMsg.innerHTML = '❌ Invalid OTP. Attempt ' + otpAttempts + '/3 — ' +
                    (3 - otpAttempts) + ' attempt(s) remaining.';
                document.getElementById('otpInput').value = '';
                document.getElementById('otpInput').focus();
            }
        }

        function closeModal() {
            document.getElementById('otpModal').classList.remove('active');
        }

        // Close modal on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') closeModal();
        });
    </script>
</body>
</html>"""


@app.get("/", response_class=HTMLResponse)
async def admin_portal_page(request: Request):
    """Serve the admin export portal HTML."""
    return HTMLResponse(content=ADMIN_HTML)


@app.post("/export/{export_type}")
async def export_data(export_type: str, request: Request):
    """Require OTP for any export operation."""
    await _log_to_mirage(None, "admin_export_attempt", f"/admin-portal:5000/export/{export_type}",
                         {"export_type": export_type})
    return JSONResponse(
        status_code=403,
        content={
            "error": "otp_required",
            "message": "Data export requires OTP verification. Enter the OTP sent to adm***@securebank.in",
            "export_type": export_type,
        }
    )


@app.post("/verify-otp")
async def verify_otp(request: Request):
    """OTP verification — always fails."""
    body = await request.json()
    otp = body.get("otp", "")
    session_id = body.get("session_id")

    await _log_to_mirage(session_id, "otp_verify_attempt", "/admin-portal:5000/verify-otp",
                         {"otp_entered": otp})

    return JSONResponse(
        status_code=403,
        content={
            "success": False,
            "error": "invalid_otp",
            "message": "Invalid OTP. Your session has been flagged for security review.",
        }
    )


@app.get("/health")
async def health():
    return {"status": "ok", "service": "SecureBank Admin Export Portal", "port": 5000}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000)
