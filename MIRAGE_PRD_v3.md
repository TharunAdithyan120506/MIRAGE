# MIRAGE
## Multi-layer Intelligent Reactive Adaptive Grid Engine
### Adaptive Cybersecurity using Intelligent Honeypots

**PRODUCTION-GRADE BUILD DOCUMENT v3.0**
*AI Agent Construction Guide • Design System • Architecture • Full Implementation*

---

| FIELD | DETAILS |
|-------|---------|
| Document Type | Production Build PRD — AI Agent Instruction Manual |
| Project | MIRAGE — PS7: Adaptive Cybersecurity Honeypot |
| Event | ACM Hackathon, Manipal Institute of Technology |
| Version | v3.0 — Dual-Site Edition with HDFC Clone + Full Demo Flow |
| Build Window | 12–24 Hour Hackathon Sprint |
| Team Size | 4 Members |
| Design Theme | HDFC Bank Clone — Navy / Red / Gold Premium Banking UI |
| Core Innovation | Dual-Site Deception: Real Bank + Honeypot with Reverse Fingerprinting |
| Demo Readiness | 100% — Script, Narrative, and Dossier Pre-built |

> **PRIME DIRECTIVE:** You are building two sites that look identical to the human eye — one is a real bank, one is a trap. Hackers walk into the trap on their own. When they do, MIRAGE profiles them completely and silently.

---

## 01 — DESIGN SYSTEM & VISUAL LANGUAGE

This is the single source of truth for every visual decision. Every component, every color, every font choice must derive from this system. Do not deviate. Consistency is what makes the demo look production-grade.

### 1.1 Brand Identity — HDFC Bank Clone

The Real Bank site is a faithful visual clone of HDFC Bank's internet banking portal. The Honeypot site is pixel-identical. Judges must be unable to distinguish them visually. The only difference is behavioral — what happens under the hood.

### Color Palette

| TOKEN | HEX VALUE | USAGE |
|-------|-----------|-------|
| `--brand-navy` | `#003366` | Primary brand, navbars, headings, CTA buttons |
| `--brand-red` | `#C8102E` | Accent, alerts, active states, section badges |
| `--brand-gold` | `#D4A017` | Premium tier highlights, badges, borders |
| `--brand-white` | `#FFFFFF` | Backgrounds, card surfaces, form fields |
| `--text-primary` | `#1A1A2E` | All body text, labels, table content |
| `--text-secondary` | `#4A4A6A` | Subheadings, captions, placeholder text |
| `--surface-light` | `#F0F4F8` | Page backgrounds, alternating table rows |
| `--surface-card` | `#FFFFFF` | Card backgrounds with navy border shadow |
| `--mirage-green` | `#1A7A4A` | Dashboard: safe / low-threat indicators |
| `--mirage-orange` | `#E05C00` | Dashboard: medium-threat indicators |
| `--mirage-red` | `#B00020` | Dashboard: high-threat / APT indicators |
| `--mirage-dark` | `#0D1117` | MIRAGE dashboard background (dark mode) |

### Typography

| ELEMENT | FONT | SIZE | WEIGHT | COLOR |
|---------|------|------|--------|-------|
| Bank Logo Text | Arial Black / Inter 900 | 28px | 900 | `--brand-navy` |
| Page H1 | Inter | 32px | 700 | `--brand-navy` |
| Page H2 | Inter | 22px | 600 | `--brand-navy` |
| Nav Links | Inter | 15px | 500 | `--brand-navy` |
| Body / Labels | Inter | 14px | 400 | `--text-primary` |
| Table Data | Inter | 13px | 400 | `--text-primary` |
| Buttons | Inter | 14px | 600 | `--brand-white` |
| Footer Text | Inter | 12px | 400 | `--text-secondary` |
| Dashboard Score | Inter Mono | 64px | 700 | dynamic (green/orange/red) |
| Dashboard Labels | Inter | 11px | 500 | `--text-secondary` |
| Code / Endpoints | JetBrains Mono | 13px | 400 | `--brand-red` |

### Component Design Rules

- **Navbar:** Deep navy (`#003366`) background, white text, HDFC-style red bottom border 3px. Left: logo + bank name. Right: user greeting + logout.
- **Cards:** White background, 1px `#003366` border, 6px border-radius, 12px padding, subtle `box-shadow: 0 2px 12px rgba(0,51,102,0.10)`.
- **Buttons Primary:** `#003366` fill, white text, 6px radius, 14px font, hover state darkens to `#002244`.
- **Buttons Danger:** `#C8102E` fill for MIRAGE dashboard alerts only.
- **Form Inputs:** 1px `#CCCCCC` border, 4px radius, focus ring `#003366` 2px, placeholder in `--text-secondary`.
- **Tables:** Navy header row (white text), alternating `#F0F4F8` / white rows, 1px `#CCCCCC` borders.
- **Badges:** Pill-shaped, colored by severity. LOW=green, MEDIUM=orange, HIGH=red, CRITICAL=dark red with pulse animation.
- **MIRAGE Dashboard Only:** Dark mode (`#0D1117` background), neon-accent threat gauge (green-to-red radial), monospace data feeds.

### 1.2 UI Component Library (Both Sites Share These)

Use Tailwind CSS utility classes throughout. Import Inter font from Google Fonts. Use shadcn/ui for base components. Every component must be pixel-consistent across both sites.

| COMPONENT | FILE | USED IN |
|-----------|------|---------|
| NavBar | `components/NavBar.jsx` | Real Bank + Honeypot |
| AccountCard | `components/AccountCard.jsx` | Real Bank + Honeypot |
| TransactionTable | `components/TransactionTable.jsx` | Real Bank + Honeypot |
| LoginForm | `components/LoginForm.jsx` | Real Bank + Honeypot (different logic) |
| AdminDashboard | `components/AdminPanel.jsx` | Honeypot only |
| OTPOverlay | `components/OTPTrap.jsx` | Honeypot only |
| ThreatGauge | `components/ThreatGauge.jsx` | MIRAGE Dashboard only |
| EventFeed | `components/EventFeed.jsx` | MIRAGE Dashboard only |
| InfraMap | `components/InfraMap.jsx` | MIRAGE Dashboard only |
| DossierButton | `components/DossierButton.jsx` | MIRAGE Dashboard only |

---

## 02 — SYSTEM ARCHITECTURE

### 2.1 The Big Picture — Dual-Site Model

> **CORE CONCEPT:** There is one real bank and one fake bank. They look identical. Real customers use the real one. Hackers, while scanning the network, discover the fake one and walk into a trap. The moment they do anything suspicious, MIRAGE starts fingerprinting them.

### Network Layout (Local Demo)

| SERVICE | PORT | WHAT IT IS | WHO SEES IT |
|---------|------|-----------|-------------|
| Real Bank Frontend | `:3000` | Authentic HDFC-clone banking site with real auth | Demonstrated as 'legitimate user path' |
| Honeypot Frontend | `:4000` | Pixel-identical clone — but everything is fake | Hackers find this via scanning |
| MIRAGE Backend API | `:8000` | FastAPI engine: scoring, logging, telemetry | Internal only (both frontends call it) |
| MIRAGE Dashboard | `:8080` | SOC analyst view: live events, score, dossier | Defender / Judge view |
| WebSocket Server | `:8001` | Real-time event push to dashboard | Internal to MIRAGE backend |

### How a Hacker Ends Up on the Honeypot

1. Real bank customers navigate directly to `localhost:3000` (or `realbank.com` in prod). They are authenticated users with known accounts.
2. A hacker scans the network using nmap or a port scanner. They discover `localhost:4000` as an open HTTP service.
3. They probe it. It looks like a banking portal. They try `/admin`. It lets them in. They think they found a vulnerability.
4. Every action from this point is logged, scored, and fed to the MIRAGE dashboard in real time.
5. They never get real data. They never leave with anything. But MIRAGE leaves with their complete profile.

### 2.2 Three-Layer Architecture

| LAYER | NAME | COMPONENTS | RESPONSIBILITY |
|-------|------|-----------|----------------|
| Layer 1 | Deception Surface | Honeypot React App (`:4000`) | The bait. Looks real, is fake. Accepts any login. Serves fake data. |
| Layer 1b | Real Surface | Real Bank React App (`:3000`) | Legitimate demo site. Shows what a real user experience looks like. |
| Layer 2 | MIRAGE Engine | FastAPI + SQLite + Scorer | Intercepts all honeypot interactions. Scores. Classifies. Triggers traps. |
| Layer 3 | Intelligence Output | Dashboard + PDF Generator | Presents attacker profile. Generates Threat Actor Dossier on demand. |

### 2.3 Repository Structure

Full monorepo. Single `docker-compose up` starts all four services.

```
mirage/
├── frontend-bank/          ← Real HDFC-Clone Bank (:3000)
│   ├── src/pages/          ← Home, Login, Dashboard, Transfer, Statement
│   ├── src/components/     ← Shared NavBar, Cards, Tables
│   └── src/styles/theme.css ← HDFC design tokens (CSS variables)
├── frontend-honeypot/      ← MIRAGE Bait Site (:4000)
│   ├── src/pages/          ← Same pages + /admin, /phpmyadmin, /export
│   ├── src/traps/          ← OTPTrap.jsx, WebRTCFingerprint.js, CanvasHash.js
│   └── src/components/     ← AdminDashboard, InfraMap, FakeAPIExplorer
├── frontend-dashboard/     ← MIRAGE SOC Dashboard (:8080)
│   ├── src/components/     ← ThreatGauge, EventFeed, SessionList, InfraMap
│   └── src/hooks/          ← useWebSocket.js, useThreatScore.js
├── backend/
│   ├── main.py             ← FastAPI entrypoint + CORS + WebSocket manager
│   ├── scorer.py           ← Rule-based threat scorer (0-100)
│   ├── mitre_mapper.py     ← ATT&CK technique mapper
│   ├── honeytoken.py       ← Faker-generated fake data factory
│   ├── report.py           ← ReportLab PDF dossier generator
│   ├── database.py         ← SQLite models: Session, Event, Fingerprint
│   └── tor_checker.py      ← Tor exit node + VPN range lookup
├── docker-compose.yml
└── demo_script.sh          ← Pre-written attacker commands for live demo
```

---

## 03 — REAL BANK SITE — `frontend-bank/` (`:3000`)

> **PURPOSE:** This site exists to establish credibility in the demo. Show judges a legitimate user flow first. Real auth. Real session. Normal banking experience. Then switch to the hacker perspective.

### 3.1 Pages to Build

| PAGE | ROUTE | DESCRIPTION |
|------|-------|-------------|
| Landing / Login | `/` | HDFC-style login: Account number + IPIN + OTP mock. Validates against a small hardcoded user store. |
| Account Dashboard | `/dashboard` | Account summary: savings balance, recent 5 transactions, quick links. Greeting: "Good morning, Arjun Sharma". |
| Fund Transfer | `/transfer` | NEFT/IMPS transfer form. Accepts input, shows "Transfer Initiated" confirmation. No real transaction. |
| Statement | `/statement` | 12-month transaction history table. Downloadable as PDF (ReportLab). Realistic bank statement format. |
| Profile | `/profile` | Account holder info, KYC status, registered mobile, linked Aadhaar (last 4 only). |
| Logout | `/logout` | Clears session, redirects to login with success toast. |

### 3.2 Authentication (Real Site)

- Hardcoded user store: 3 demo accounts (account numbers, PINs, names, balances).
- Login: account number field + IPIN (password) field. On submit: validate against store, set JWT in httpOnly cookie, redirect to `/dashboard`.
- Protected routes: Any route except `/` requires valid JWT. Redirect to login if missing.
- Session timeout: 15 minutes of inactivity, auto-logout with warning modal at 14 min.
- All auth requests go to FastAPI backend at `POST /real/auth` (separate from honeypot routes).

### 3.3 HDFC Clone Visual Checklist

- **Navbar:** HDFC logo placeholder (blue shield icon + "HDFCBank" in Arial Black). Navy background. Nav items: Accounts, Payments, Cards, Investments, Help.
- **Hero card:** Account number partially masked (`XXXX XXXX 4521`), balance in large font, green "Account Active" badge.
- **Transaction rows:** Debit in red (`#C8102E`), Credit in green (`#1A7A4A`), date, description, running balance.
- **Footer:** 3-column layout. Links, regulatory text (RBI license number), DICGC badge. Dark navy background.
- **Mobile responsive:** All pages work at 375px width (judges may check).

---

## 04 — HONEYPOT SITE — `frontend-honeypot/` (`:4000`)

> **PURPOSE:** Pixel-identical to the real site. Hackers cannot tell the difference visually. But every interaction triggers logging, scoring, and intelligence collection. Any credential works. All data is fake. All exits are traps.

### 4.1 Shared Pages (Identical Visual, Different Logic)

| PAGE | REAL SITE BEHAVIOR | HONEYPOT BEHAVIOR |
|------|-------------------|-------------------|
| `/` (Login) | Validates credentials against real user store | ANY username + ANY password succeeds. 800ms fake delay. Logs credentials to SQLite. |
| `/dashboard` | Shows real user's actual account data | Shows fake account data (Faker-generated). Score +5 for visiting. |
| `/transfer` | Validates transfer, shows confirmation | Accepts any transfer, shows success. Logs all field inputs. Score +10. |
| `/statement` | Real transactions | 500 fake transactions. Accessing this: Score +15. |

### 4.2 Honeypot-Only Pages (The Trap Layers)

#### 4.2.1 `/admin` — Fake Admin Console

- **Visual:** "SecureBank Admin Console v2.3" branding. Navy header. Admin-specific nav items.
- **Login:** Accepts any credentials after 800ms delay. Returns fake JWT. Logs attempted username + password.
- **Dashboard content:** Fake user count (12,847), total transaction volume (₹4.2Cr today), server health meters, active sessions counter. All animated with Recharts.
- **Score impact:** Visiting `/admin` = +15 points. Successful login = +10 additional.
- **Welcome message** uses the username they typed: *"Welcome back, [their_username]. You have 3 pending alerts."*

#### 4.2.2 `/phpmyadmin` — Fake Database Console

- Shows a convincing phpMyAdmin-style interface. Fake database browser with table names: `users`, `transactions`, `audit_log`, `admin_sessions`.
- Clicking any table shows fake data (pulled from `/api/users` or `/api/transactions`).
- Score impact: +15 points on visit.

#### 4.2.3 Honeytoken API Endpoints

| ENDPOINT | RESPONSE | SCORE IMPACT | SEVERITY |
|----------|----------|-------------|----------|
| `GET /api/config` | JSON with fake `AWS_ACCESS_KEY_ID`, `AWS_SECRET`, `DB_PASSWORD`, `JWT_SECRET`, `STRIPE_KEY` | +20 | CRITICAL |
| `GET /files/.env` | Downloadable `.env` file with 12 realistic fake credentials | +20 | CRITICAL |
| `GET /api/users` | JSON array: 500 fake users (name, email, phone, aadhaar_last4, hashed_pw) | +15 | HIGH |
| `GET /api/transactions` | JSON array: 2000 fake transactions with account numbers and amounts | +15 | HIGH |
| `GET /api/internal-docs` | Fake internal API documentation with endpoint list | +10 | MEDIUM |
| `GET /db/query` | Fake SQL query interface (unlocked at score 31+) | +10 | MEDIUM |
| `GET /api/payment-gateway` | Fake payment gateway config with merchant keys (unlocked at score 61+) | +20 | CRITICAL |
| `GET /api/export-users` | **TRIGGERS OTP TRAP.** Does not return data immediately. | +20 | CRITICAL |

### 4.3 The OTP Trap — Crown Jewel Feature

> **MECHANISM:** When attacker hits `/api/export-users` or `/export`, MIRAGE serves an OTP verification overlay. While they read it, JavaScript silently harvests their complete device fingerprint. They never get the data. We get their dossier.

#### OTP Overlay UI Specification

- Full-screen modal overlay, z-index 9999, semi-transparent dark backdrop.
- Card: White, 480px wide, centered, navy top border 4px, HDFC branding.
- Header: Red warning icon + "Security Verification Required".
- Body: *"Unusual activity detected on your session. For your security, please enter the OTP sent to `adm***@securebank.in`"*.
- OTP input: 6-digit, auto-focus, monospace font.
- Submit button: Navy. On any input: 30-second countdown, *"Incorrect OTP. Please retry in 30 seconds."* Keeps attacker on page.
- After 3 attempts: *"Account temporarily locked. Please contact support."* — session continues logging.

#### Silent JavaScript Fingerprinting (Runs on OTP Page Load)

```javascript
// ─── WEBRTC IP LEAK (bypasses VPN) ─────────────────────────────────────────
const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
pc.createDataChannel('');
pc.createOffer().then(o => pc.setLocalDescription(o));
pc.onicecandidate = e => { /* extract IP from e.candidate.candidate */ };

// ─── CANVAS FINGERPRINT ─────────────────────────────────────────────────────
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
ctx.fillText('MIRAGE_FP_⚠️', 10, 50); // unique per GPU/browser
const hash = btoa(canvas.toDataURL()).slice(0, 32);

// ─── DEVICE PROFILE ─────────────────────────────────────────────────────────
const profile = {
  timezone:    Intl.DateTimeFormat().resolvedOptions().timeZone,
  language:    navigator.language,
  screen:      `${screen.width}x${screen.height}`,
  cores:       navigator.hardwareConcurrency,
  memory:      navigator.deviceMemory,
  userAgent:   navigator.userAgent,
  touchPoints: navigator.maxTouchPoints,
  webrtcIP:    /* extracted above */,
  canvasHash:  hash,
};

// POST silently to /api/telemetry — attacker never sees this network call
fetch('/api/telemetry', { method: 'POST', body: JSON.stringify(profile) });
```

---

## 05 — MIRAGE ENGINE — `backend/` (`:8000`)

### 5.1 API Endpoint Map

| METHOD | ENDPOINT | HANDLER | PURPOSE |
|--------|----------|---------|---------|
| POST | `/real/auth` | `real_auth()` | Real bank login validation |
| POST | `/honey/auth` | `honey_auth()` | Honeypot login — always succeeds, logs creds |
| GET | `/api/config` | `get_config()` | Returns fake AWS/DB credentials (honeytoken) |
| GET | `/files/.env` | `get_env()` | Serves fake `.env` file download |
| GET | `/api/users` | `get_users()` | Returns 500 Faker-generated user records |
| GET | `/api/transactions` | `get_transactions()` | Returns 2000 fake transactions |
| GET | `/api/export-users` | `trigger_otp_trap()` | Sets OTP trap flag, returns 403 with OTP required |
| POST | `/api/telemetry` | `receive_telemetry()` | Receives WebRTC + canvas fingerprint payload |
| GET | `/api/session/{id}` | `get_session()` | Returns full session data for dashboard |
| GET | `/api/sessions` | `list_sessions()` | All honeypot sessions with scores |
| POST | `/api/generate-dossier/{id}` | `generate_pdf()` | Triggers ReportLab PDF generation |
| GET | `/api/dossier/{id}` | `download_dossier()` | Downloads generated PDF |
| WS | `/ws/events` | `ws_event_stream()` | WebSocket: pushes events to dashboard in real time |
| GET | `/api/score/{session_id}` | `get_score()` | Current threat score for a session |

### 5.2 Threat Scoring Engine (`scorer.py`)

> **DESIGN PRINCIPLE:** The scorer is a pure Python function. It receives a session object and an event, updates the score, returns the new score and the tier. Zero ML, zero training data, 100% deterministic and explainable to judges.

| BEHAVIOUR SIGNAL | POINTS | TIER UNLOCK |
|-----------------|--------|-------------|
| Accessed `/admin` or `/phpmyadmin` | +15 | Script Kiddie (15) |
| Tried 3+ different credential pairs | +10 | — |
| Accessed `/api/config` or `/.env` (honeytoken) | +20 | Opportunist (31) |
| Accessed `/api/users` (bulk harvest attempt) | +15 | — |
| Attempted SQL injection pattern in any field | +25 | — |
| User-agent matches attack tool (sqlmap, nmap, Nikto, Burp) | +20 | — |
| Scanned 10+ unique paths in under 60 seconds | +15 | Targeted Attacker (61) |
| OTP trap triggered (`/api/export-users` accessed) | +20 | — |
| Time on target exceeds 5 minutes | +10 | — |
| Accessed from Tor exit node or known VPN IP range | +10 | APT-Level (86) |
| Accessed `/api/payment-gateway` (high-value honeytoken) | +20 | — |
| Downloaded `.env` file (completed exfil attempt) | +15 | — |

### 5.3 Adaptive Surface — Score-Gated Endpoints

| SCORE TIER | TIER NAME | WHAT UNLOCKS |
|-----------|-----------|-------------|
| 0–30 | Script Kiddie | Basic fake admin panel, static `.env` file visible in directory listing |
| 31–60 | Opportunist | Fake DB endpoint `/db/query`, fake internal API docs, 500 user records at `/api/users` |
| 61–85 | Targeted Attacker | Fake microservices map in dashboard, fake internal Slack webhook config, fake payment gateway |
| 86–100 | APT-Level | Fake internal network topology rendered in InfraMap, OTP trap activates on any export, full fingerprinting engaged |

### 5.4 Database Schema (SQLite)

#### Table: `sessions`

| COLUMN | TYPE | DESCRIPTION |
|--------|------|-------------|
| `id` | TEXT (UUID) | Session identifier, generated on first honeypot hit |
| `ip_header` | TEXT | IP from HTTP `X-Forwarded-For` / `REMOTE_ADDR` |
| `webrtc_ip` | TEXT | Real IP extracted via WebRTC (may differ from header IP) |
| `user_agent` | TEXT | Raw User-Agent string |
| `canvas_hash` | TEXT | 32-char canvas fingerprint hash |
| `device_profile` | JSON | Full device profile JSON from telemetry |
| `threat_score` | INTEGER | Current 0–100 score, updated on each event |
| `tier` | TEXT | Script Kiddie / Opportunist / Targeted / APT-Level |
| `started_at` | DATETIME | Session start timestamp |
| `last_seen` | DATETIME | Last activity timestamp |
| `dossier_path` | TEXT | Path to generated PDF if created |

#### Table: `events`

| COLUMN | TYPE | DESCRIPTION |
|--------|------|-------------|
| `id` | INTEGER | Auto-increment primary key |
| `session_id` | TEXT | Foreign key to `sessions.id` |
| `event_type` | TEXT | `PATH_PROBE` / `LOGIN_ATTEMPT` / `HONEYTOKEN_ACCESS` / `OTP_TRAP` / `TELEMETRY` |
| `severity` | TEXT | `LOW` / `MEDIUM` / `HIGH` / `CRITICAL` |
| `path` | TEXT | URL path that was accessed |
| `payload` | JSON | Event-specific data (credentials, SQL pattern, etc.) |
| `score_delta` | INTEGER | Points added by this event |
| `mitre_technique` | TEXT | Mapped ATT&CK technique ID (e.g. `T1190`) |
| `timestamp` | DATETIME | Event timestamp |

---

## 06 — MIRAGE SOC DASHBOARD — (`:8080`)

> **PURPOSE:** This is the defender's command center. It runs in dark mode. It shows the live attack in real time. When a judge sees the threat score climb from green to red while the hacker thinks they are succeeding, the demo wins.

### 6.1 Dashboard Layout

Full dark mode. Background: `#0D1117`. Single-page application with 4 panels arranged in a 2×2 grid on desktop.

| PANEL | POSITION | CONTENT |
|-------|----------|---------|
| Threat Score Gauge | Top-left, 30% width | Recharts `RadialBarChart`. 0–100. Colors: 0–30 green, 31–60 orange, 61–85 red, 86–100 pulsing crimson. Large score number in center. Tier label below. |
| Live Event Feed | Top-right, 70% width | Scrolling list of events. Each row: timestamp, severity badge (colored pill), event type, path accessed, points delta. New events slide in from top with animation. |
| Session List | Bottom-left, 30% width | Active and past honeypot sessions. Each row: session ID (truncated), IP, score, tier, start time. Click to select and view detail. |
| Infrastructure Map | Bottom-right, 70% width | React Flow / D3 node graph. Nodes appear as score thresholds unlock. Edges animate with data flow. Red nodes = compromised. Gray = not yet discovered. |

### 6.2 Real-time Updates via WebSocket

- Backend pushes event payload over WebSocket on every honeypot interaction.
- Frontend `useWebSocket` hook receives payload, updates React state.
- Event feed auto-scrolls. Score gauge animates smoothly (CSS transition 0.5s).
- Severity CRITICAL events: full-width red flash animation on event row. Dashboard header flashes red for 2 seconds.
- When OTP trap fires: modal overlay on dashboard reads *"OTP TRAP ENGAGED — Fingerprinting in progress..."* with spinner.

### 6.3 Dossier Generation Button

- Navy button: "Generate Threat Dossier". Disabled until at least one event is logged.
- On click: `POST /api/generate-dossier/{session_id}`. Button shows spinner.
- On response: PDF download link appears. Auto-downloads. Toast: *"Dossier generated successfully."*
- Generation must complete in under 5 seconds. Pre-build static MITRE table to ensure speed.

---

## 07 — THREAT ACTOR DOSSIER — PDF OUTPUT

> **PURPOSE:** This is your proof. A judge who sees nothing else but this PDF should understand that MIRAGE captured a complete attacker profile. Design it like a real intelligence report. It must look professional enough to be mistaken for a real SOC deliverable.

### 7.1 PDF Page Structure

| PAGE | TITLE | CONTENT |
|------|-------|---------|
| 1 | Cover / Classification | MIRAGE logo, "THREAT ACTOR DOSSIER", session ID, timestamp, classification: CONFIDENTIAL, threat tier badge (large, colored) |
| 2 | Executive Summary | Threat score (large), tier, session duration, total events, honeytokens accessed, risk level narrative paragraph |
| 3 | Attacker Identity Profile | Real IP (WebRTC), header IP, ISP lookup, timezone, geographic region hint, browser, OS, screen resolution, canvas fingerprint hash, device memory, CPU cores |
| 4 | Attack Timeline | Chronological table of all events: timestamp, action, path, severity, score delta, cumulative score |
| 5 | MITRE ATT&CK Kill Chain | Table: Tactic, Technique ID, Technique Name, Observed Evidence. Minimum 4 techniques mapped. |
| 6 | Indicators of Compromise | Accessed endpoints, harvested honeytoken types, attempted credentials, detected tools |
| 7 | SOC Recommendations | 3–5 actionable bullet points based on detected techniques |

### 7.2 MITRE ATT&CK Mapping Table

| MIRAGE EVENT | TACTIC | TECHNIQUE ID | TECHNIQUE NAME |
|-------------|--------|-------------|----------------|
| Path scanning (`/admin`, `/phpmyadmin`) | Reconnaissance | T1595.003 | Active Scanning: Wordlist Scanning |
| Admin login with any credentials | Initial Access | T1078 | Valid Accounts |
| Exploit Public-Facing Application probe | Initial Access | T1190 | Exploit Public-Facing Application |
| Accessing `/api/config` (AWS keys) | Collection | T1530 | Data from Cloud Storage Object |
| Accessing `/api/users` (bulk harvest) | Collection | T1213 | Data from Information Repositories |
| Downloading `.env` file | Exfiltration | T1048 | Exfiltration Over Alternative Protocol |
| SQL injection attempt | Initial Access | T1190 | Exploit Public-Facing Application |
| Attack tool user-agent detected | Defense Evasion | T1036 | Masquerading |
| Tor/VPN detected | Defense Evasion | T1090 | Proxy |
| OTP trap triggered (export attempt) | Exfiltration | T1041 | Exfiltration Over C2 Channel |

---

## 08 — COMPLETE TECHNOLOGY STACK

| COMPONENT | TECHNOLOGY | VERSION | PURPOSE |
|-----------|-----------|---------|---------|
| Real Bank Frontend | React 18 + Vite | 18.x | HDFC-clone legitimate banking site |
| Honeypot Frontend | React 18 + Vite | 18.x | Decoy site, trap triggers, OTP overlay |
| MIRAGE Dashboard | React 18 + Vite | 18.x | SOC dashboard, dark mode, real-time |
| Styling | Tailwind CSS | 3.x | Utility-first, design token-driven |
| UI Components | shadcn/ui | latest | Base components (dialogs, toasts, tables) |
| Charts (Bank) | Recharts | 2.x | Transaction trend charts |
| Charts (Dashboard) | Recharts RadialBar | 2.x | Threat score gauge |
| Flow Diagram | React Flow | 11.x | Infrastructure map node graph |
| Backend API | FastAPI (Python) | 0.110+ | All business logic, REST + WebSocket |
| Database | SQLite + SQLAlchemy | built-in | Session and event persistence |
| Fake Data | Python Faker | 24.x | 500 users, 2000 transactions, credentials |
| PDF Generation | ReportLab | 4.x | Threat actor dossier |
| WebSocket | FastAPI WebSocket | native | Real-time dashboard push |
| Containerization | Docker + Compose | latest | Single-command startup |
| Font | Inter (Google Fonts) | variable | All UI text (matches HDFC aesthetics) |
| Monospace Font | JetBrains Mono | latest | Code, fingerprint hashes, endpoints |

---

## 09 — 12-HOUR BUILD TIMELINE

| PHASE | TIME | DELIVERABLE | OWNER | NEVER CUT |
|-------|------|-------------|-------|-----------|
| 0: Setup | H+0:00–0:30 | Monorepo scaffold, docker-compose, all 3 Vite apps running, FastAPI running, SQLite initialized | All parallel | Yes |
| 1: Real Bank | H+0:30–2:00 | HDFC-clone login, dashboard, transfer, statement pages. Real auth against hardcoded users. Full HDFC visual design. | Dev A + B | Yes |
| 2: Honeypot Base | H+2:00–3:30 | Honeypot site (clone of real bank), any-creds login, /admin panel, all honeytoken API endpoints returning Faker data, event logging to SQLite | Dev A + B | Yes |
| 3: Scorer + WebSocket | H+3:30–5:00 | Rule-based scorer, score-gated endpoint unlocking, WebSocket event push from backend to dashboard | Dev C | Yes |
| 4: OTP Trap | H+5:00–6:30 | OTP overlay UI, WebRTC IP extraction JS, canvas fingerprint, telemetry POST, all stored in SQLite | Dev B + D | Yes |
| 5: Dashboard | H+4:00–7:30 | MIRAGE dark-mode dashboard: RadialBar gauge, event feed with WebSocket, session list, InfraMap (parallel with phase 4) | Dev D | Yes |
| 6: PDF Dossier | H+7:30–9:30 | ReportLab 7-page dossier, all sections populated from SQLite session data, MITRE table, download endpoint | Dev C | Yes |
| 7: Integration | H+9:30–11:00 | Full E2E: run `demo_script.sh` 3x, fix bugs, verify PDF, verify WebSocket stability, verify OTP trap fires correctly | All | Yes |
| 8: Polish + Demo Prep | H+11:00–12:00 | UI polish, demo script rehearsal ×2, annotate terminal with phase labels, prepare split-screen layout for projection | All | — |

### 9.1 Minimum Viable Demo (If Behind Schedule)

| PRIORITY | ITEM | CUT? |
|----------|------|------|
| NEVER CUT | Real bank site (at least Login + Dashboard pages) | NO |
| NEVER CUT | Honeypot with any-creds login + `/admin` panel | NO |
| NEVER CUT | Honeytoken endpoints (`/api/config`, `/.env`) | NO |
| NEVER CUT | OTP trap with WebRTC IP extraction | NO |
| NEVER CUT | Threat score 0–100 outputting correctly | NO |
| NEVER CUT | PDF dossier generation (even with static MITRE table) | NO |
| NEVER CUT | Dashboard with score gauge | NO |
| Cut 1st | Infrastructure map (replace with static image) | IF NEEDED |
| Cut 2nd | WebSocket (replace with 3-second polling) | IF NEEDED |
| Cut 3rd | Canvas fingerprint (keep WebRTC only) | IF NEEDED |
| Cut 4th | Statement + Transfer pages on real bank site | IF NEEDED |

---

## 10 — 4-MINUTE DEMO SCRIPT — WORD-FOR-WORD

> **SETUP:** 3 browser tabs open before demo starts. Tab 1: `localhost:3000` (Real Bank). Tab 2: `localhost:4000` (Honeypot — NOT YET SHOWN). Tab 3: `localhost:8080` (MIRAGE Dashboard). Attacker terminal in split screen left. Dashboard on right.

### MINUTE 1 — Problem + Hook (0:00–1:00)

**Narrator says:** *"4.5 billion cyberattacks happen every single day. Traditional honeypots get bypassed in under 60 seconds — attackers recognize them and leave. MIRAGE doesn't wait for attackers. It hunts them."*

**Show Tab 1 (Real Bank).** *"This is a real banking portal. A customer logs in, checks their balance, makes a transfer. Normal. Secure. Real."*

Log in as demo customer. Show dashboard. Show a transfer. 30 seconds total.

**Switch to split screen.** *"Now — meet the attacker. On the left, a hacker scanning our network. On the right, MIRAGE watching every move."*

### MINUTE 2 — Reconnaissance + Initial Access (1:00–2:30)

**[PHASE 1: RECONNAISSANCE]** Run in terminal:

```bash
# Hacker scans the network — finds port 4000
nmap -p 3000-4100 localhost

# Probes the unknown port for admin panels
curl -s http://localhost:4000/admin
```

MIRAGE Dashboard: Score jumps to 15. Tier: Script Kiddie. Event feed shows `PATH_PROBE` event.

**[PHASE 2: INITIAL ACCESS]** Open `localhost:4000/admin` in browser.

Login with `admin:admin123`. Dashboard shows fake admin panel. Narrator: *"They think they're in."*

Navigate to API Explorer. Call `/api/config`. Fake AWS keys appear. Score: 50. CRITICAL event fires in dashboard. Event feed lights up red.

### MINUTE 3 — OTP Trap (2:30–3:30)

**[PHASE 3: DATA EXFILTRATION ATTEMPT]** Click "Export User Data" button.

OTP overlay appears. Narrator: *"The attacker sees a security check. They think they triggered a 2FA prompt."*

**PAUSE 5 seconds.** Let dashboard update. Score: 82. Tier: APT-Level. Dashboard header flashes red. InfraMap shows all nodes unlocked.

**Narrator:** *"While they stare at that OTP form — MIRAGE just extracted their real IP address, even through their VPN. Their browser fingerprint. Their device specs. Their timezone. In silence. In under 200 milliseconds."*

Show dashboard Fingerprint panel: Real IP, Chrome 124, Windows 11, Asia/Kolkata, canvas hash.

### MINUTE 4 — Dossier + Close (3:30–4:00)

Click "Generate Threat Dossier" on dashboard. PDF downloads in under 5 seconds.

Open PDF. Flip to Threat Actor Profile page. Point to each field:

- Real IP address — extracted via WebRTC, bypassing their VPN
- Device: Chrome 124, Windows 11, Asia/Kolkata timezone
- MITRE ATT&CK kill chain: T1595, T1078, T1190, T1530, T1048
- Credential Harvest: `AWS_ACCESS_KEY_ID`, `JWT_SECRET`, `DB_PASSWORD`

**Close:** *"The attacker left with nothing. We left with their complete profile — ready for your SOC team to act on within minutes. MIRAGE doesn't just detect attackers. It builds their dossier. Thank you."*

---

## 11 — PRE-HACKATHON CHECKLIST

### 11.1 Night-Before Setup

1. Install: Node.js 20+, Python 3.11+, Docker Desktop on demo laptop.
2. Run: `npm create vite@latest` — verify all 3 React apps start without errors.
3. Run: `pip install fastapi uvicorn sqlalchemy faker reportlab websockets python-multipart` — test all imports.
4. Verify: `python -c "from reportlab.lib.pagesizes import letter; print('ReportLab OK')"`
5. Install Inter and JetBrains Mono fonts locally as fallback if no internet at venue.
6. Test `docker-compose up` — all 4 services start, no port conflicts.
7. Run `demo_script.sh` once — full flow works, PDF generates, score reaches 82.
8. Clone repo to USB drive as backup.

### 11.2 `demo_script.sh` — Write This Verbatim

```bash
#!/bin/bash
# MIRAGE Demo Script — Run this for the live demo

echo '[PHASE 1: RECONNAISSANCE]'
nmap -p 3000-4100 localhost
curl -s http://localhost:4000/admin | head -20

echo '[PHASE 2: HONEYTOKEN HARVEST]'
curl -s http://localhost:8000/api/config | python3 -m json.tool
curl -s http://localhost:8000/api/users | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'{len(d)} users harvested')"

echo '[PHASE 3: OTP TRAP TRIGGERED — check the browser]'
curl -s http://localhost:8000/api/export-users

echo '[PHASE 4: GENERATE DOSSIER]'
# Click 'Generate Dossier' on the dashboard at localhost:8080
```

### 11.3 Presentation Deck (5 Slides)

| SLIDE | TITLE | CONTENT |
|-------|-------|---------|
| 1 | The Problem | Stat: 4.5B attacks/day. Traditional honeypots fail in 60s. One line: *"What if the trap fought back?"* |
| 2 | MIRAGE Architecture | 3-layer diagram: Deception Surface / MIRAGE Engine / Intelligence Output. Two-site model explained simply. |
| 3 | How It Works | 4-step flow: Hacker scans → Walks into honeypot → OTP trap fires → Dossier generated. Icon-driven, no walls of text. |
| 4 | Live Demo | (Stays up during demo) Title: "LIVE: Attacker vs MIRAGE". Split layout matches your screen. |
| 5 | USPs + Use Cases | 3 USPs in bold. Real-world deployment: DMZ honeypot alongside production. Potential: enterprise SOC product. |

---

## 12 — USPs + JUDGE Q&A PREPARATION

### 12.1 The Three USPs — Memorize These

> **USP 1 — FIRST WEB-NATIVE HONEYPOT WITH ACTIVE REVERSE FINGERPRINTING**
> Cowrie and Honeyd work at SSH/network layer. MIRAGE works at HTTP/application layer — where modern attackers actually operate. No other student project extracts real IPs through VPNs using WebRTC while the attacker stares at a fake OTP form.

> **USP 2 — SOCIAL ENGINEERING IN REVERSE**
> Social engineering is the attacker's weapon. MIRAGE weaponizes it defensively. The OTP trap is psychologically brilliant: the attacker believes they triggered a security check. They are actually being fingerprinted. This inversion will stick with every judge.

> **USP 3 — ACTIONABLE INTELLIGENCE, NOT JUST LOGS**
> Every competing team will show a log table. MIRAGE produces a Threat Actor Dossier: real IP (bypassing VPN), device fingerprint, geographic region, tools used, MITRE ATT&CK kill chain, risk score. This is a product a real SOC analyst can act on in minutes.

### 12.2 Critical Judge Questions — Prepared Answers

| QUESTION | YOUR ANSWER |
|----------|-------------|
| How does a hacker end up on the honeypot? | Real customers know their bank's URL. A hacker scanning the network discovers port 4000 as an open HTTP service. They probe it, find `/admin`, and walk in. Any traffic to the honeypot is definitionally malicious. |
| Is this legal? | Yes. WebRTC and canvas fingerprinting are standard APIs used by Google and LinkedIn for fraud detection. MIRAGE only runs against attackers already trespassing on a system designed to catch them. No real users, no privacy violation. |
| How is this different from Cowrie? | Cowrie is SSH-only and logs passively. MIRAGE is HTTP-native, actively profiles attackers using WebRTC, and generates actionable intelligence. Cowrie tells you someone knocked. MIRAGE tells you who they are. |
| Can it be deployed in production? | Yes. Deploy MIRAGE as a DMZ decoy alongside your real infrastructure. Any traffic to it is malicious by definition. Enterprise deception technology works exactly this way. |
| Why not use ML? | Rule-based scoring is faster to build, 100% explainable, and deterministic for demo purposes. ML adds training time with zero demo benefit. Explainability is actually a feature for SOC analysts who need to justify actions. |
| What if WebRTC is blocked? | We fall back to HTTP header IP. Canvas fingerprint has no browser restrictions. Even without WebRTC, we still capture user-agent, timing, path behaviour, and all scoring signals. The demo uses Chrome, where WebRTC works perfectly. |

---

## FINAL DIRECTIVE

**Build the dual-site system.**
Make both sites visually identical to HDFC Bank.
Make the honeypot invisible as a trap.
Engage the OTP trap. Extract the fingerprint.
Generate the dossier. **Win the room.**

---

*MIRAGE PRD v3.0 • ACM Hackathon • MIT Manipal*
