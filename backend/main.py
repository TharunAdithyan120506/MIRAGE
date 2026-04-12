"""
MIRAGE Backend — FastAPI Main Entrypoint
PRD Section 5.1 — All REST endpoints + WebSocket event stream

PRODUCTION UPDATE:
- Dedup-aware scoring (no premature 100)
- Login failure tracking with console clues for port 3000
- Geolocation resolution from IP
- Port 5000 admin portal event logging
- Fixed double-scoring in telemetry
"""
import uuid
import json
import asyncio
from datetime import datetime, timedelta
from typing import Optional, List
from contextlib import asynccontextmanager
from collections import defaultdict

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from sqlalchemy.orm import Session as DBSession
from pydantic import BaseModel

from database import init_db, get_db, Session as SessionModel, Event as EventModel
from scorer import compute_score_delta, detect_attack_tool, detect_sqli, get_tier, is_endpoint_unlocked
from honeytoken import (
    FAKE_CONFIG, FAKE_ENV_FILE, FAKE_PAYMENT_GATEWAY, FAKE_INTERNAL_DOCS,
    get_users, get_transactions
)
from mitre_mapper import map_techniques
from tor_checker import check_ip, load_tor_exit_nodes_from_url
from report import generate_dossier
from geo_resolver import resolve_ip

# ── Hardcoded Real Bank Users (PRD Section 3.2) ───────────────────────────────
REAL_USERS = {
    "40021234567": {"pin": "123456", "name": "Arjun Sharma",   "account": "XXXX XXXX 4521",
                    "balance": 142500.75, "ifsc": "HDFC0001234"},
    "40029876543": {"pin": "654321", "name": "Priya Menon",    "account": "XXXX XXXX 9832",
                    "balance": 87320.50, "ifsc": "HDFC0005678"},
    "40035551234": {"pin": "112233", "name": "Rahul Verma",    "account": "XXXX XXXX 3310",
                    "balance": 320000.00, "ifsc": "HDFC0009012"},
}

# ── Login failure tracking (per IP) ───────────────────────────────────────────
_LOGIN_FAILURES: dict[str, dict] = defaultdict(lambda: {"count": 0, "locked_until": None})

# ── WebSocket Connection Manager ───────────────────────────────────────────────
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, data: dict):
        dead = []
        for ws in self.active_connections:
            try:
                await ws.send_json(data)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.disconnect(ws)

manager = ConnectionManager()


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    # Pre-warm data caches
    get_users()
    get_transactions()
    # Attempt to load Tor exit nodes (non-blocking)
    try:
        import threading
        threading.Thread(target=load_tor_exit_nodes_from_url, daemon=True).start()
    except Exception:
        pass
    yield


app = FastAPI(title="MIRAGE Engine", version="2.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Helpers ───────────────────────────────────────────────────────────────────
def get_client_ip(request: Request) -> str:
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def get_or_create_session(session_id: Optional[str], request: Request, db: DBSession) -> SessionModel:
    ip = get_client_ip(request)
    ua = request.headers.get("User-Agent", "")
    if session_id:
        sess = db.query(SessionModel).filter(SessionModel.id == session_id).first()
        if sess:
            sess.last_seen = datetime.utcnow()
            db.commit()
            return sess
    sess = SessionModel(
        id=str(uuid.uuid4()),
        ip_header=ip,
        user_agent=ua,
        threat_score=0,
        tier="Script Kiddie",
        started_at=datetime.utcnow(),
        last_seen=datetime.utcnow(),
        scored_signals=[],
    )
    db.add(sess)
    db.commit()
    db.refresh(sess)
    return sess


async def log_event_and_score(
    sess: SessionModel,
    signal_key: str,
    event_type: str,
    path: str,
    payload: dict,
    db: DBSession,
) -> dict:
    """Log event and update score with dedup-aware scoring."""
    current_signals = sess.scored_signals or []
    delta, new_tier, severity, mitre, updated_signals = compute_score_delta(
        sess.threat_score, signal_key, current_signals
    )
    sess.threat_score = min(sess.threat_score + delta, 100)
    sess.tier = get_tier(sess.threat_score)
    sess.scored_signals = updated_signals
    sess.last_seen = datetime.utcnow()
    db.commit()

    event = EventModel(
        session_id=sess.id,
        event_type=event_type,
        severity=severity,
        path=path,
        payload=payload,
        score_delta=delta,
        mitre_technique=mitre,
        timestamp=datetime.utcnow(),
    )
    db.add(event)
    db.commit()
    db.refresh(event)

    broadcast_payload = {
        "type": "new_event",
        "session_id": sess.id,
        "session_ip": sess.ip_header,
        "event_id": event.id,
        "event_type": event_type,
        "severity": severity,
        "path": path,
        "score_delta": delta,
        "threat_score": sess.threat_score,
        "tier": sess.tier,
        "mitre_technique": mitre,
        "timestamp": event.timestamp.isoformat(),
    }
    await manager.broadcast(broadcast_payload)
    return broadcast_payload


# ── Pydantic Models ───────────────────────────────────────────────────────────
class RealAuthRequest(BaseModel):
    account_number: str
    ipin: str

class HoneyAuthRequest(BaseModel):
    username: str
    password: str
    session_id: Optional[str] = None

class TelemetryPayload(BaseModel):
    session_id: Optional[str] = None
    timezone: Optional[str] = None
    language: Optional[str] = None
    screen: Optional[str] = None
    cores: Optional[int] = None
    memory: Optional[float] = None
    userAgent: Optional[str] = None
    touchPoints: Optional[int] = None
    webrtcIP: Optional[str] = None
    canvasHash: Optional[str] = None

class AdminPortalEvent(BaseModel):
    session_id: Optional[str] = None
    signal: str
    path: str
    payload: Optional[dict] = None


# ════════════════════════════════════════════════════════════════════════════
# REAL BANK ENDPOINTS
# ════════════════════════════════════════════════════════════════════════════

@app.post("/real/auth")
async def real_auth(body: RealAuthRequest, request: Request):
    client_ip = get_client_ip(request)
    tracker = _LOGIN_FAILURES[client_ip]

    # Check if IP is locked
    if tracker["locked_until"] and datetime.utcnow() < tracker["locked_until"]:
        remaining = int((tracker["locked_until"] - datetime.utcnow()).total_seconds())
        return JSONResponse(
            status_code=429,
            content={
                "success": False,
                "error": "too_many_attempts",
                "message": f"Account temporarily locked. Try again in {remaining} seconds.",
                "locked_until": tracker["locked_until"].isoformat(),
                "debug_trace": "Internal security audit: review http://localhost:4000/admin for debug logs",
            },
            headers={
                "X-Debug-Service": "internal-banking-audit.securebank.in:4000",
                "X-RateLimit-Remaining": "0",
                "X-Internal-Redirect": "http://localhost:4000",
            }
        )

    user = REAL_USERS.get(body.account_number)
    if not user or user["pin"] != body.ipin:
        tracker["count"] += 1
        attempt_num = tracker["count"]

        # Build escalating debug info based on attempt number
        debug_info = {}
        response_headers = {}

        if attempt_num >= 1:
            debug_info["_debug_auth_failure"] = f"AUTH_FAIL_{attempt_num}: credential validation failed"
            debug_info["_internal_trace_id"] = f"TRC-{uuid.uuid4().hex[:8].upper()}"
            response_headers["X-Debug-TraceId"] = debug_info["_internal_trace_id"]

        if attempt_num >= 2:
            debug_info["_debug_service_map"] = {
                "banking_portal": "localhost:3000",
                "internal_debug": "localhost:4000",
                "admin_export": "localhost:5000",
                "api_gateway": "localhost:8000",
            }
            debug_info["_security_audit_url"] = "http://localhost:4000/admin"
            response_headers["X-Debug-Service"] = "internal-banking-debug.securebank.in:4000"

        if attempt_num >= 3:
            debug_info["_debug_failover_notice"] = (
                "SECURITY NOTICE: Multiple auth failures detected. "
                "Debug portal available at http://localhost:4000 — "
                "Admin export at http://localhost:5000"
            )
            debug_info["_internal_network_topology"] = {
                "3000": "production-banking-frontend",
                "4000": "debug-banking-portal (exposed)",
                "5000": "admin-data-export-service",
                "8000": "internal-api-gateway",
            }
            response_headers["X-Failover-Node"] = "http://localhost:4000"
            response_headers["X-Admin-Portal"] = "http://localhost:5000"

        if attempt_num >= 5:
            tracker["locked_until"] = datetime.utcnow() + timedelta(seconds=60)

        return JSONResponse(
            status_code=401,
            content={
                "success": False,
                "error": "invalid_credentials",
                "message": "Invalid account number or IPIN. Please try again.",
                "attempts_remaining": max(0, 5 - attempt_num),
                **debug_info,
            },
            headers=response_headers,
        )

    # Success — reset failure count
    _LOGIN_FAILURES[client_ip] = {"count": 0, "locked_until": None}
    return {
        "success": True,
        "token": f"real_jwt_{body.account_number}_{uuid.uuid4().hex[:12]}",
        "user": {
            "name": user["name"],
            "account": user["account"],
            "balance": user["balance"],
            "ifsc": user["ifsc"],
        }
    }

@app.get("/real/transactions")
async def real_transactions():
    txns = [
        {"date":"2024-03-15","desc":"Salary Credit","type":"CREDIT","amount":85000,"balance":142500.75},
        {"date":"2024-03-12","desc":"Amazon Purchase","type":"DEBIT","amount":2499,"balance":57500.75},
        {"date":"2024-03-10","desc":"Netflix Subscription","type":"DEBIT","amount":649,"balance":59999.75},
        {"date":"2024-03-08","desc":"UPI Transfer to Priya","type":"DEBIT","amount":5000,"balance":60648.75},
        {"date":"2024-03-05","desc":"Electricity Bill","type":"DEBIT","amount":1250,"balance":65648.75},
    ]
    return txns


# ════════════════════════════════════════════════════════════════════════════
# HONEYPOT ENDPOINTS
# ════════════════════════════════════════════════════════════════════════════

@app.post("/honey/auth")
async def honey_auth(body: HoneyAuthRequest, request: Request, db: DBSession = Depends(get_db)):
    await asyncio.sleep(0.8)  # Realistic delay
    sess = get_or_create_session(body.session_id, request, db)

    # Detect attack tools
    ua = request.headers.get("User-Agent", "")
    if detect_attack_tool(ua):
        await log_event_and_score(sess, "attack_tool_ua", "LOGIN_ATTEMPT", "/honey/auth",
                                  {"username": body.username, "user_agent": ua}, db)

    await log_event_and_score(sess, "login_attempt", "LOGIN_ATTEMPT", "/honey/auth",
                              {"username": body.username, "password": body.password[:3]+"***"}, db)

    return {
        "success": True,
        "session_id": sess.id,
        "token": f"honey_jwt_{uuid.uuid4().hex}",
        "user": {
            "name": body.username,
            "account": "XXXX XXXX 8847",
            "balance": 284730.55,
            "greeting": f"Welcome back, {body.username}",
        }
    }


@app.post("/honey/event")
async def honey_event(request: Request, db: DBSession = Depends(get_db)):
    """Generic event logger for path visits from the honeypot frontend."""
    body = await request.json()
    session_id = body.get("session_id")
    path = body.get("path", "/")
    signal = body.get("signal", "dashboard_visit")
    sess = get_or_create_session(session_id, request, db)
    result = await log_event_and_score(sess, signal, "PATH_PROBE", path, {"path": path}, db)
    return {"session_id": sess.id, "threat_score": sess.threat_score, "tier": sess.tier}


@app.get("/api/config")
async def get_config(session_id: Optional[str] = None, request: Request = None,
                     db: DBSession = Depends(get_db)):
    sess = get_or_create_session(session_id, request, db)
    await log_event_and_score(sess, "honeytoken_config", "HONEYTOKEN_ACCESS", "/api/config",
                              {"honeytoken": "aws_credentials"}, db)
    return FAKE_CONFIG


@app.get("/files/.env")
async def get_env(session_id: Optional[str] = None, request: Request = None,
                  db: DBSession = Depends(get_db)):
    sess = get_or_create_session(session_id, request, db)
    await log_event_and_score(sess, "env_file_download", "HONEYTOKEN_ACCESS", "/files/.env",
                              {"honeytoken": "env_file"}, db)
    return Response(content=FAKE_ENV_FILE, media_type="text/plain",
                    headers={"Content-Disposition": "attachment; filename=.env"})


@app.get("/api/users")
async def get_users_endpoint(session_id: Optional[str] = None, request: Request = None,
                             db: DBSession = Depends(get_db)):
    sess = get_or_create_session(session_id, request, db)
    if not is_endpoint_unlocked("bulk_user_harvest", sess.threat_score):
        # Still log the attempt
        await log_event_and_score(sess, "bulk_user_harvest", "HONEYTOKEN_ACCESS", "/api/users",
                                  {"note": "attempted before unlock"}, db)
        return get_users()[:50]
    await log_event_and_score(sess, "bulk_user_harvest", "HONEYTOKEN_ACCESS", "/api/users",
                              {"count": 500}, db)
    return get_users()


@app.get("/api/transactions")
async def get_transactions_endpoint(session_id: Optional[str] = None, request: Request = None,
                                    db: DBSession = Depends(get_db)):
    sess = get_or_create_session(session_id, request, db)
    await log_event_and_score(sess, "transfer_attempt", "HONEYTOKEN_ACCESS", "/api/transactions",
                              {"count": 2000}, db)
    return get_transactions()


@app.get("/api/internal-docs")
async def get_internal_docs(session_id: Optional[str] = None, request: Request = None,
                            db: DBSession = Depends(get_db)):
    sess = get_or_create_session(session_id, request, db)
    if not is_endpoint_unlocked("internal_docs_access", sess.threat_score):
        raise HTTPException(status_code=403, detail="Access denied")
    await log_event_and_score(sess, "internal_docs_access", "HONEYTOKEN_ACCESS", "/api/internal-docs",
                              {"honeytoken": "internal_api_docs"}, db)
    return FAKE_INTERNAL_DOCS


@app.get("/db/query")
async def db_query(session_id: Optional[str] = None, q: Optional[str] = None,
                   request: Request = None, db: DBSession = Depends(get_db)):
    sess = get_or_create_session(session_id, request, db)
    if not is_endpoint_unlocked("db_query_access", sess.threat_score):
        raise HTTPException(status_code=403, detail="Access denied")
    # Detect SQL injection
    if q and detect_sqli(q):
        await log_event_and_score(sess, "sqli_pattern", "PATH_PROBE", "/db/query",
                                  {"query": q, "sqli_detected": True}, db)
    await log_event_and_score(sess, "db_query_access", "HONEYTOKEN_ACCESS", "/db/query",
                              {"query": q}, db)
    return {"result": [{"id": 1, "table": "users", "rows": 12847},
                        {"id": 2, "table": "transactions", "rows": 4200142},
                        {"id": 3, "table": "audit_log", "rows": 892341}]}


@app.get("/api/payment-gateway")
async def get_payment_gateway(session_id: Optional[str] = None, request: Request = None,
                              db: DBSession = Depends(get_db)):
    sess = get_or_create_session(session_id, request, db)
    if not is_endpoint_unlocked("payment_gateway_access", sess.threat_score):
        raise HTTPException(status_code=403, detail="Access denied")
    await log_event_and_score(sess, "payment_gateway_access", "HONEYTOKEN_ACCESS",
                              "/api/payment-gateway", {"honeytoken": "payment_gateway"}, db)
    return FAKE_PAYMENT_GATEWAY


@app.get("/api/export-users")
async def trigger_otp_trap(session_id: Optional[str] = None, request: Request = None,
                           db: DBSession = Depends(get_db)):
    """Crown jewel — triggers OTP trap, does NOT return data."""
    sess = get_or_create_session(session_id, request, db)
    await log_event_and_score(sess, "otp_trap_triggered", "OTP_TRAP", "/api/export-users",
                              {"trap": "otp_overlay_triggered"}, db)
    return JSONResponse(
        status_code=403,
        content={
            "error": "security_verification_required",
            "message": "Unusual activity detected. OTP verification required.",
            "otp_endpoint": "/api/verify-otp",
            "session_id": sess.id,
        }
    )


@app.post("/api/telemetry")
async def receive_telemetry(payload: TelemetryPayload, request: Request,
                            db: DBSession = Depends(get_db)):
    sess = get_or_create_session(payload.session_id, request, db)

    # Update fingerprint data on session
    device_profile = {
        "timezone": payload.timezone,
        "language": payload.language,
        "screen": payload.screen,
        "cores": payload.cores,
        "memory": payload.memory,
        "userAgent": payload.userAgent,
        "touchPoints": payload.touchPoints,
    }
    if payload.webrtcIP:
        sess.webrtc_ip = payload.webrtcIP
    if payload.canvasHash:
        sess.canvas_hash = payload.canvasHash
    sess.device_profile = device_profile

    # ── Geolocation resolution ──────────────────────────────────────────────
    ip_to_resolve = payload.webrtcIP or sess.ip_header
    geo_data = resolve_ip(ip_to_resolve)
    sess.geo_data = geo_data
    db.commit()

    # Check Tor/VPN
    ip_to_check = payload.webrtcIP or sess.ip_header
    tor_result = check_ip(ip_to_check)
    if tor_result["is_suspicious"]:
        await log_event_and_score(sess, "tor_vpn_detected", "TELEMETRY", "/api/telemetry",
                                  {"ip": ip_to_check, **tor_result}, db)

    # Log telemetry capture (FIX: use telemetry_captured instead of otp_trap_triggered)
    await log_event_and_score(sess, "telemetry_captured", "TELEMETRY", "/api/telemetry",
                              {"fingerprint": device_profile, "webrtc_ip": payload.webrtcIP,
                               "geo": geo_data}, db)

    # Broadcast fingerprint + geo to dashboard
    await manager.broadcast({
        "type": "fingerprint_captured",
        "session_id": sess.id,
        "webrtc_ip": payload.webrtcIP,
        "canvas_hash": payload.canvasHash,
        "device_profile": device_profile,
        "geo_data": geo_data,
        "threat_score": sess.threat_score,
        "tier": sess.tier,
    })
    return {"status": "received", "session_id": sess.id}


# ════════════════════════════════════════════════════════════════════════════
# ADMIN PORTAL EVENT LOGGING (called by port 5000 service)
# ════════════════════════════════════════════════════════════════════════════

@app.post("/internal/admin-portal-event")
async def admin_portal_event(body: AdminPortalEvent, request: Request,
                             db: DBSession = Depends(get_db)):
    """Internal endpoint for port 5000 admin portal to log events."""
    sess = get_or_create_session(body.session_id, request, db)
    result = await log_event_and_score(
        sess, body.signal, "HONEYTOKEN_ACCESS", body.path,
        body.payload or {}, db
    )
    return {"session_id": sess.id, "threat_score": sess.threat_score, "tier": sess.tier}


@app.post("/api/verify-otp")
async def verify_otp(request: Request, db: DBSession = Depends(get_db)):
    """OTP verification endpoint — always fails, logs attempt."""
    body = await request.json()
    session_id = body.get("session_id")
    otp_value = body.get("otp", "")
    sess = get_or_create_session(session_id, request, db)
    await log_event_and_score(sess, "otp_verify_attempt", "OTP_TRAP", "/api/verify-otp",
                              {"otp_entered": otp_value}, db)
    return JSONResponse(
        status_code=403,
        content={
            "success": False,
            "error": "invalid_otp",
            "message": "Invalid OTP. Your session has been flagged for review.",
            "session_id": sess.id,
        }
    )


# ════════════════════════════════════════════════════════════════════════════
# SESSION & DOSSIER ENDPOINTS
# ════════════════════════════════════════════════════════════════════════════

@app.get("/api/sessions")
async def list_sessions(db: DBSession = Depends(get_db)):
    sessions = db.query(SessionModel).order_by(SessionModel.last_seen.desc()).all()
    return [
        {
            "id": s.id,
            "ip_header": s.ip_header,
            "webrtc_ip": s.webrtc_ip,
            "threat_score": s.threat_score,
            "tier": s.tier,
            "started_at": s.started_at.isoformat() if s.started_at else None,
            "last_seen": s.last_seen.isoformat() if s.last_seen else None,
            "has_dossier": bool(s.dossier_path),
            "geo_data": s.geo_data,
        }
        for s in sessions
    ]


@app.get("/api/session/{session_id}")
async def get_session(session_id: str, db: DBSession = Depends(get_db)):
    sess = db.query(SessionModel).filter(SessionModel.id == session_id).first()
    if not sess:
        raise HTTPException(status_code=404, detail="Session not found")
    events = db.query(EventModel).filter(EventModel.session_id == session_id)\
               .order_by(EventModel.timestamp.asc()).all()
    return {
        "session": {
            "id": sess.id,
            "ip_header": sess.ip_header,
            "webrtc_ip": sess.webrtc_ip,
            "user_agent": sess.user_agent,
            "canvas_hash": sess.canvas_hash,
            "device_profile": sess.device_profile,
            "threat_score": sess.threat_score,
            "tier": sess.tier,
            "started_at": sess.started_at.isoformat() if sess.started_at else None,
            "last_seen": sess.last_seen.isoformat() if sess.last_seen else None,
            "dossier_path": sess.dossier_path,
            "geo_data": sess.geo_data,
            "scored_signals": sess.scored_signals or [],
        },
        "events": [
            {
                "id": e.id,
                "event_type": e.event_type,
                "severity": e.severity,
                "path": e.path,
                "payload": e.payload,
                "score_delta": e.score_delta,
                "mitre_technique": e.mitre_technique,
                "timestamp": e.timestamp.isoformat() if e.timestamp else None,
            }
            for e in events
        ]
    }


@app.get("/api/score/{session_id}")
async def get_score(session_id: str, db: DBSession = Depends(get_db)):
    sess = db.query(SessionModel).filter(SessionModel.id == session_id).first()
    if not sess:
        raise HTTPException(status_code=404, detail="Session not found")
    return {"session_id": session_id, "threat_score": sess.threat_score, "tier": sess.tier}


@app.post("/api/generate-dossier/{session_id}")
async def generate_pdf(session_id: str, db: DBSession = Depends(get_db)):
    sess = db.query(SessionModel).filter(SessionModel.id == session_id).first()
    if not sess:
        raise HTTPException(status_code=404, detail="Session not found")

    events_raw = db.query(EventModel).filter(EventModel.session_id == session_id)\
                    .order_by(EventModel.timestamp.asc()).all()
    events_list = [
        {
            "event_type": e.event_type, "severity": e.severity, "path": e.path,
            "payload": e.payload, "score_delta": e.score_delta,
            "mitre_technique": e.mitre_technique,
            "timestamp": e.timestamp.isoformat() if e.timestamp else "",
        }
        for e in events_raw
    ]

    triggered_signals = [e.payload.get("signal","") for e in events_raw if isinstance(e.payload, dict)]
    triggered_signals += [e.mitre_technique or "" for e in events_raw]
    # Map from event_type to signal keys
    signal_map = {
        "PATH_PROBE": "admin_access", "LOGIN_ATTEMPT": "login_attempt",
        "HONEYTOKEN_ACCESS": "honeytoken_config", "OTP_TRAP": "otp_trap_triggered",
        "TELEMETRY": "telemetry_captured",
    }
    for e in events_raw:
        sig = signal_map.get(e.event_type)
        if sig:
            triggered_signals.append(sig)
    triggered_signals = list(set(triggered_signals))

    mitre_techniques = map_techniques(triggered_signals)

    session_dict = {
        "id": sess.id, "ip_header": sess.ip_header, "webrtc_ip": sess.webrtc_ip,
        "user_agent": sess.user_agent, "canvas_hash": sess.canvas_hash,
        "device_profile": sess.device_profile, "threat_score": sess.threat_score,
        "tier": sess.tier,
        "started_at": sess.started_at.isoformat() if sess.started_at else "",
        "last_seen": sess.last_seen.isoformat() if sess.last_seen else "",
        "geo_data": sess.geo_data,
    }

    try:
        filepath = generate_dossier(session_dict, events_list, mitre_techniques)
        sess.dossier_path = filepath
        db.commit()
        return {"status": "generated", "path": filepath, "session_id": session_id}
    except Exception as ex:
        raise HTTPException(status_code=500, detail=f"PDF generation failed: {str(ex)}")


@app.get("/api/dossier/{session_id}")
async def download_dossier(session_id: str, db: DBSession = Depends(get_db)):
    sess = db.query(SessionModel).filter(SessionModel.id == session_id).first()
    if not sess or not sess.dossier_path:
        raise HTTPException(status_code=404, detail="Dossier not found — generate it first")
    import os
    if not os.path.exists(sess.dossier_path):
        raise HTTPException(status_code=404, detail="Dossier file missing on disk")
    return FileResponse(sess.dossier_path, media_type="application/pdf",
                        filename=f"MIRAGE_dossier_{session_id[:8]}.pdf")


# ════════════════════════════════════════════════════════════════════════════
# WEBSOCKET
# ════════════════════════════════════════════════════════════════════════════

@app.websocket("/ws/events")
async def ws_event_stream(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Keep connection alive; server pushes events via manager.broadcast()
            await asyncio.sleep(30)
    except WebSocketDisconnect:
        manager.disconnect(websocket)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "MIRAGE Backend", "timestamp": datetime.utcnow().isoformat()}
