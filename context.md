Data from port 4000 to port 8000 is going straight from the browser, not through another frontend server. The honeypot React app hardcodes http://localhost:8000 and calls it with axios/fetch from files like HoneyLogin.jsx (line 18), HoneyDashboard.jsx (line 25), AdminPanel.jsx (line 35), PhpMyAdmin.jsx (line 14), and fingerprint.js (line 83). FastAPI explicitly allows this cross-origin traffic with allow_origins=["*"] in backend/main.py (line 81).
The data being transferred is a mix of attacker input, tracking metadata, and fake bait data. Login sends { username, password } to /honey/auth, and the backend creates or updates a session and returns { session_id, token, user } from backend/main.py (line 226). Page probes send { session_id, path, signal } to /honey/event from backend/main.py (line 254). Honeytoken fetches use session_id as a query param to pull /api/config, /files/.env, /api/users, /api/transactions, /api/internal-docs, and /api/export-users from backend/main.py (line 266). The OTP overlay silently posts telemetry to /api/telemetry: timezone, language, screen size, cores, RAM, user agent, touch points, WebRTC IP, and canvas hash from fingerprint.js (line 10).

Not everything visible on 4000 comes from 8000. The normal honeypot dashboard data is mostly local constants in HoneyDashboard.jsx (line 10), the statement page generates rows locally in HoneyStatement.jsx (line 9), and the transfer form only logs a visit signal, not the entered beneficiary/account values, in HoneyTransfer.jsx (line 19). The big fake datasets are mainly pulled in the admin/phpMyAdmin views.

MITRE ATT&CK mapping happens in two layers. First, every signal is scored and tagged immediately in backend/scorer.py (line 18): for example admin_access -> T1595.003, login_attempt -> T1078, honeytoken_config -> T1530, bulk_user_harvest -> T1213, env_file_download -> T1048, otp_trap_triggered -> T1041, attack_tool_ua -> T1036, and tor_vpn_detected -> T1090. log_event_and_score() stores that MITRE technique on each Event row and includes it in the live WebSocket payload in backend/main.py (line 121).
Second, dossier generation re-maps the session into ATT&CK techniques using the static table in backend/mitre_mapper.py (line 6) and map_techniques() in backend/mitre_mapper.py (line 73). The PDF step in backend/main.py (line 477) builds a triggered_signals list and passes it into that mapper.

Important nuance: the live event-level MITRE tag is the accurate one; the PDF remapping is somewhat lossy. In backend/main.py (line 495), it adds stored technique IDs like T1213 into triggered_signals, but map_techniques() expects signal keys like bulk_user_harvest, so those entries do not match directly. It then falls back to a coarse event_type -> signal map, which can flatten several different attacks into the same ATT&CK result. Also multi_cred_attempt, rapid_path_scan, and extended_session exist in the rule tables but are never emitted anywhere in the current codebase, so those mappings are defined but unreachable right now.

If by “honeypot tokens” you mean the auth token returned by /honey/auth, port 4000 does not actually use it. The frontend stores only honey_user and honey_session in session storage in frontend-honeypot/src/App.jsx (line 12), and HoneyLogin.jsx (line 22) ignores res.data.token. The real correlation key across 4000 -> 8000 is session_id, not the returned honey_jwt_*.
If you mean honeytokens, they are used mainly in the admin-style trap surfaces. AdminPanel.jsx (line 282) loads /api/config and downloads /files/.env; AdminPanel.jsx (line 200) loads /api/users; AdminPanel.jsx (line 239) loads /api/transactions; AdminPanel.jsx (line 323) exposes /api/config, /api/users, and /api/internal-docs in the fake API explorer; PhpMyAdmin.jsx (line 21) loads users and transactions into the fake DB UI. The actual fake payloads come from backend/honeytoken.py (line 16): FAKE_CONFIG, FAKE_ENV_FILE, FAKE_INTERNAL_DOCS, cached fake users, and cached fake transactions.

One subtlety: some buttons only open the OTP overlay locally and do not call /api/export-users. That is true for the dashboard “Export Data” button in HoneyDashboard.jsx (line 89), the config tab’s “Export All Credentials” button in AdminPanel.jsx (line 307), and the API Explorer’s /api/export-users entry in AdminPanel.jsx (line 337). They still trigger fingerprinting because the OTP component posts /api/telemetry on mount.

The backend is a single FastAPI intelligence engine, not a microservice mesh. On startup it initializes SQLite, warms the fake user/transaction caches, and tries to load Tor exit nodes in the background from backend/main.py (line 64). Its persistent state is two tables in backend/database.py (line 18): sessions holds IPs, WebRTC IP, user agent, canvas hash, device profile, score, tier, timestamps, and dossier path; events holds event type, severity, path, payload JSON, score delta, MITRE technique, and timestamp.
Operationally, almost every honeypot request follows the same pipeline in backend/main.py (line 97): get_or_create_session() identifies the attacker session, log_event_and_score() updates score/tier, stores the event, and broadcasts a live event to WebSocket clients. The scorer in backend/scorer.py (line 69) is deterministic and tiered (Script Kiddie, Opportunist, Targeted Attacker, APT-Level). The enrichment layer adds attack-tool detection, SQLi detection, and Tor/VPN checks via backend/scorer.py (line 59) and backend/tor_checker.py (line 47).

Feature-wise, the backend has four jobs. It handles the real-bank demo auth in /real/auth; it runs the honeypot APIs in /honey/auth, /honey/event, /api/config, /api/users, /api/transactions, /api/internal-docs, /db/query, /api/payment-gateway, /api/export-users, and /api/telemetry; it feeds the SOC dashboard through /api/sessions, /api/session/{id}, and ws://localhost:8000/ws/events from frontend-dashboard/src/hooks/useWebSocket.js (line 3); and it generates the PDF dossier through backend/report.py (line 93) and /api/generate-dossier/{session_id}. The dossier includes summary, attacker identity, timeline, MITRE table, IOCs, and recommendations.

If helpful, I can turn this into a one-page sequence diagram showing 4000 -> 8000 -> SQLite/WebSocket -> 8080 with each endpoint and payload.


1:35 PM
give full projevt context in detailll
2:12 PM



Project Shape

MIRAGE is a monorepo for a deception-driven banking honeypot. It has four running parts:

frontend-bank on port 3000: the “legitimate” banking UI for normal users.
frontend-honeypot on port 4000: a visually similar fake bank designed to attract attackers.
backend on port 8000: the central FastAPI engine that logs, scores, enriches, stores, streams, and reports attacker activity.
frontend-dashboard on port 8080: the SOC analyst console that watches sessions in real time.
The startup scripts in start-mirage.ps1 (line 55) and start.sh (line 52) make that topology explicit. The original intent is also documented in README.md (line 1) and the larger PRD in MIRAGE_PRD_v3.md (line 108).

Core Idea

The product’s core trick is not “a bank app with alerts”; it is “a fake bank that collects attacker intelligence.”

The real bank uses controlled demo accounts and basic auth via /real/auth in backend/main.py (line 194).
The honeypot accepts any credentials via /honey/auth in backend/main.py (line 226).
Once the attacker touches trap pages or honeytoken endpoints, the backend assigns score, severity, MITRE ATT&CK tags, and session tier in backend/scorer.py (line 18).
Every important honeypot interaction is persisted to SQLite in backend/database.py (line 18) and broadcast to the dashboard over WebSocket from backend/main.py (line 149) and backend/main.py (line 545).
How The System Actually Runs

The runtime model is browser-to-API, not frontend-to-frontend.

The honeypot app directly calls http://localhost:8000 from the browser using axios or fetch.
The backend enables broad CORS in backend/main.py (line 81), so all frontends can call it.
The dashboard also directly calls http://localhost:8000 and separately opens ws://localhost:8000/ws/events via frontend-dashboard/src/hooks/useWebSocket.js (line 3).
The central flow is:

Attacker opens the honeypot on :4000.
The honeypot sends login/probe/API calls to :8000.
The backend creates or updates a session in backend/main.py (line 97).
The backend writes an event row and updates threat score/tier in backend/main.py (line 121).
The backend pushes a live event to the dashboard with score, severity, path, and MITRE technique.
Analysts inspect /api/session/{id} or generate a PDF dossier from /api/generate-dossier/{id}.
Backend Walkthrough

The backend is the real heart of the project.

backend/main.py (line 1) is the entrypoint and orchestration layer.
backend/database.py (line 12) defines SQLite persistence.
backend/scorer.py (line 9) defines threat tiers and scoring rules.
backend/mitre_mapper.py (line 6) maps signals to ATT&CK tactics/techniques.
backend/honeytoken.py (line 15) manufactures fake secrets, users, transactions, and internal docs.
backend/tor_checker.py (line 9) performs lightweight Tor/VPN enrichment.
backend/report.py (line 93) generates the final dossier PDF.
The database schema is simple and intentional:

sessions stores attacker identity context: header IP, WebRTC IP, user agent, canvas hash, device profile JSON, threat score, tier, timestamps, and generated dossier path in backend/database.py (line 18).
events stores individual actions: event type, severity, path, payload JSON, score delta, MITRE tag, and timestamp in backend/database.py (line 36).
The common backend pattern is get_or_create_session() plus log_event_and_score() in backend/main.py (line 97) and backend/main.py (line 121). That pair is what turns raw browser activity into a tracked threat timeline.

Real Bank Context

The real bank is mostly a credibility layer for demos.

Login page posts account number and PIN to /real/auth from frontend-bank/src/pages/Login.jsx (line 20).
The backend validates against the hardcoded REAL_USERS store in backend/main.py (line 28).
The returned user object is displayed in the bank dashboard in frontend-bank/src/pages/Dashboard.jsx (line 65).
It does not feed the threat engine the way the honeypot does.
This means the real bank exists to establish “normal user behavior,” while the honeypot exists to collect “malicious behavior.”

Honeypot Frontend Context

The honeypot app is deliberately thin and deceptive.

Routing is in frontend-honeypot/src/App.jsx (line 31).
Normal-looking pages are /, /dashboard, /transfer, and /statement.
Trap-only pages are /admin and /phpmyadmin.
Important behavior by page:

HoneyLogin.jsx (line 18) posts arbitrary credentials to /honey/auth. The backend always returns success and creates a session.
HoneyDashboard.jsx (line 23) logs /dashboard visits with dashboard_visit.
HoneyTransfer.jsx (line 19) logs transfer_attempt, but the actual entered transfer form fields stay local in the browser.
HoneyStatement.jsx (line 35) logs statement_access and renders synthetic statement rows.
PhpMyAdmin.jsx (line 13) logs phpmyadmin_visit and fetches fake users/transactions from the backend.
AdminPanel.jsx (line 33) is the richest trap surface: it logs /admin, accepts fake admin login, fetches config, users, transactions, and internal docs, and can trigger the OTP trap.
A key design point: the honeypot does not really use the returned auth token. The backend sends a fake honey_jwt_* in backend/main.py (line 241), but the frontend mostly lives off session_id stored in session storage in frontend-honeypot/src/App.jsx (line 12).

Honeytokens And Bait Data

The fake sensitive data lives centrally in backend/honeytoken.py (line 15).

It provides:

FAKE_CONFIG: AWS key, DB password, JWT secret, Stripe key, internal API key, Redis password, SMTP password.
FAKE_ENV_FILE: plaintext .env style secret dump.
FAKE_PAYMENT_GATEWAY: fake merchant and webhook credentials.
FAKE_INTERNAL_DOCS: internal endpoint docs and internal URLs.
get_users(): 500 deterministic fake users.
get_transactions(): 2000 deterministic fake transactions.
Where those are used:

/api/config in backend/main.py (line 266)
/files/.env in backend/main.py (line 275)
/api/users in backend/main.py (line 285)
/api/transactions in backend/main.py (line 299)
/api/internal-docs in backend/main.py (line 308)
/db/query in backend/main.py (line 319)
/api/payment-gateway in backend/main.py (line 336)
These endpoints are the actual “loot” the attacker thinks they are harvesting.

Scoring And Threat Model

The scoring engine is deterministic and easy to explain.

Tiers are in backend/scorer.py (line 10): Script Kiddie, Opportunist, Targeted Attacker, APT-Level.
Rules are in backend/scorer.py (line 18).
Each signal defines points, severity, and a MITRE technique.
Examples:
admin_access = +15, HIGH, T1595.003
honeytoken_config = +20, CRITICAL, T1530
bulk_user_harvest = +15, HIGH, T1213
env_file_download = +15, CRITICAL, T1048
otp_trap_triggered = +20, CRITICAL, T1041
tor_vpn_detected = +10, HIGH, T1090
There is also gated progression in backend/scorer.py (line 80):

/api/internal-docs and /db/query unlock at score 31.
/api/payment-gateway unlocks at score 61.
That means the attacker gets deeper bait only if they behave suspiciously enough first.

MITRE ATT&CK Context

MITRE mapping exists in two forms.

Immediate event tagging happens through the scorer: every event can carry a single mitre_technique column in the DB via backend/main.py (line 135).
Session-level ATT&CK mapping for reports happens in backend/mitre_mapper.py (line 6).
The ATT&CK table covers:

Reconnaissance: T1595.003
Initial Access: T1078, T1190
Collection: T1530, T1213
Exfiltration: T1048, T1041
Defense Evasion: T1036, T1090
The PDF generator calls map_techniques() in backend/main.py (line 509) and renders the table in backend/report.py (line 240).

One implementation detail worth knowing: some rules exist but are not actually triggered anywhere in the current codebase, including multi_cred_attempt, rapid_path_scan, and extended_session. So the ATT&CK model is broader than the currently emitted behavior.

OTP Trap And Fingerprinting Context

This is the project’s most interesting feature.

The OTP modal UI is in frontend-honeypot/src/components/OTPTrap.jsx (line 6).
On mount, it runs collectFingerprint(sessionId) from frontend-honeypot/src/traps/fingerprint.js (line 9).
That collects timezone, language, screen, CPU cores, RAM, user agent, touch points, canvas hash, and WebRTC-discovered IP.
It posts the full profile to /api/telemetry in frontend-honeypot/src/traps/fingerprint.js (line 83).
The backend saves that into the session record and optionally flags Tor/VPN use in backend/main.py (line 365).
The dashboard reacts specially to this. When it sees OTP_TRAP or fingerprint_captured, it shows a prominent modal in frontend-dashboard/src/App.jsx (line 75).

One nuance: not every OTP overlay opening currently calls the backend’s /api/export-users. Some UI actions open the overlay locally and still send telemetry, so fingerprint capture can happen even without the export endpoint having been hit first.

Dashboard Context

The dashboard is the analyst-facing intelligence console.

It polls /api/sessions every 3 seconds in frontend-dashboard/src/App.jsx (line 35).
It fetches selected session details from /api/session/{id} in frontend-dashboard/src/App.jsx (line 53).
It listens for live events over WebSocket via useWebSocket.js (line 6).
It surfaces threat gauge, session list, event feed, infra map, and attacker identity details.
It can generate and auto-download a dossier through DossierButton.jsx (line 11).
So the backend is the source of truth, and the dashboard is effectively a live read model on top of it.

Reporting Context

The dossier generator in backend/report.py (line 93) is a structured intelligence export.

It builds:

Cover page
Executive summary
Attacker identity profile
Attack timeline
MITRE ATT&CK kill chain
Indicators of compromise
SOC recommendations
It uses the session row, full event history, and mapped ATT&CK techniques. Generated files are saved under backend/dossiers.