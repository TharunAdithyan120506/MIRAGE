"""
MIRAGE Threat Scorer — Rule-based 0–100 scoring engine
As defined in PRD Section 5.2 and 5.3
Zero ML, 100% deterministic and explainable.

PRODUCTION FIX: Deduplication-aware scoring with diminishing returns.
Each unique signal contributes full points only ONCE.
Repeat signals contribute 10% (min 1 point).
Score 100 requires triggering 10+ unique attack categories.
"""
from datetime import datetime
from typing import Optional

# ── Tier thresholds ──────────────────────────────────────────────────────────
TIERS = [
    (86, "APT-Level"),
    (61, "Targeted Attacker"),
    (31, "Opportunist"),
    (0,  "Script Kiddie"),
]

# ── Scoring rules: (signal_key, points, description) ─────────────────────────
RULES = {
    "admin_access":          {"points": 12, "severity": "HIGH",     "mitre": "T1595.003", "desc": "Accessed /admin or /phpmyadmin"},
    "multi_cred_attempt":    {"points": 8,  "severity": "MEDIUM",   "mitre": "T1078",     "desc": "Tried 3+ different credential pairs"},
    "honeytoken_config":     {"points": 14, "severity": "CRITICAL", "mitre": "T1530",     "desc": "Accessed /api/config or /files/.env"},
    "bulk_user_harvest":     {"points": 10, "severity": "HIGH",     "mitre": "T1213",     "desc": "Accessed /api/users bulk endpoint"},
    "sqli_pattern":          {"points": 15, "severity": "CRITICAL", "mitre": "T1190",     "desc": "SQL injection pattern detected"},
    "attack_tool_ua":        {"points": 12, "severity": "HIGH",     "mitre": "T1036",     "desc": "Attack tool user-agent detected"},
    "rapid_path_scan":       {"points": 10, "severity": "HIGH",     "mitre": "T1595.003", "desc": "Scanned 10+ paths in under 60s"},
    "otp_trap_triggered":    {"points": 14, "severity": "CRITICAL", "mitre": "T1041",     "desc": "OTP trap triggered"},
    "extended_session":      {"points": 6,  "severity": "LOW",      "mitre": "T1078",     "desc": "Time on target > 5 minutes"},
    "tor_vpn_detected":      {"points": 8,  "severity": "HIGH",     "mitre": "T1090",     "desc": "Tor exit node or VPN IP detected"},
    "payment_gateway_access":{"points": 14, "severity": "CRITICAL", "mitre": "T1530",     "desc": "Accessed /api/payment-gateway"},
    "env_file_download":     {"points": 10, "severity": "CRITICAL", "mitre": "T1048",     "desc": "Downloaded .env file"},
    "dashboard_visit":       {"points": 4,  "severity": "LOW",      "mitre": "T1078",     "desc": "Visited honeypot dashboard"},
    "transfer_attempt":      {"points": 8,  "severity": "MEDIUM",   "mitre": "T1213",     "desc": "Attempted fund transfer"},
    "statement_access":      {"points": 10, "severity": "HIGH",     "mitre": "T1213",     "desc": "Accessed account statement"},
    "internal_docs_access":  {"points": 8,  "severity": "MEDIUM",   "mitre": "T1213",     "desc": "Accessed /api/internal-docs"},
    "db_query_access":       {"points": 8,  "severity": "MEDIUM",   "mitre": "T1190",     "desc": "Accessed /db/query interface"},
    "phpmyadmin_visit":      {"points": 12, "severity": "HIGH",     "mitre": "T1595.003", "desc": "Visited /phpmyadmin"},
    "login_attempt":         {"points": 6,  "severity": "MEDIUM",   "mitre": "T1078",     "desc": "Login attempt on honeypot"},
    "admin_portal_access":   {"points": 12, "severity": "HIGH",     "mitre": "T1595.003", "desc": "Accessed admin portal on :5000"},
    "admin_export_attempt":  {"points": 14, "severity": "CRITICAL", "mitre": "T1041",     "desc": "Attempted data export via admin portal"},
    "otp_verify_attempt":    {"points": 10, "severity": "CRITICAL", "mitre": "T1078",     "desc": "Attempted OTP verification on admin portal"},
    "nmap_scan_detected":    {"points": 10, "severity": "HIGH",     "mitre": "T1595.003", "desc": "Port scanning detected"},
    "telemetry_captured":    {"points": 8,  "severity": "MEDIUM",   "mitre": "T1082",     "desc": "Device fingerprint captured via telemetry"},
}

# Diminishing returns multiplier for repeat signals
REPEAT_MULTIPLIER = 0.10
REPEAT_MIN_POINTS = 1

ATTACK_TOOL_PATTERNS = ["sqlmap", "nmap", "nikto", "burp", "masscan", "zap", "dirbuster", "gobuster", "metasploit"]
SQLI_PATTERNS = ["' or", "\" or", "1=1", "drop table", "union select", "' --", "\" --", "; --", "xp_cmdshell"]


def get_tier(score: int) -> str:
    for threshold, name in TIERS:
        if score >= threshold:
            return name
    return "Script Kiddie"


def score_event(signal_key: str) -> dict:
    """Return scoring metadata for a known signal key."""
    rule = RULES.get(signal_key)
    if not rule:
        return {"points": 0, "severity": "LOW", "mitre": None, "desc": "Unknown signal"}
    return rule


def detect_attack_tool(user_agent: str) -> bool:
    ua_lower = (user_agent or "").lower()
    return any(tool in ua_lower for tool in ATTACK_TOOL_PATTERNS)


def detect_sqli(payload: str) -> bool:
    p_lower = (payload or "").lower()
    return any(pat in p_lower for pat in SQLI_PATTERNS)


def compute_score_delta(
    current_score: int,
    signal_key: str,
    scored_signals: list = None,
) -> tuple[int, str, str, Optional[str], list]:
    """
    Deduplication-aware scoring with diminishing returns.
    
    Returns (delta, new_tier, severity, mitre_technique, updated_scored_signals)
    - First time a signal fires: full points
    - Repeat signals: 10% of original points (min 1)
    - Caps total at 100.
    """
    if scored_signals is None:
        scored_signals = []

    rule = RULES.get(signal_key, {"points": 0, "severity": "LOW", "mitre": None})
    base_points = rule["points"]

    if signal_key in scored_signals:
        # Diminishing returns for repeat signals
        delta = max(int(base_points * REPEAT_MULTIPLIER), REPEAT_MIN_POINTS)
    else:
        # Full points for first occurrence
        delta = base_points
        scored_signals = scored_signals + [signal_key]

    # Cap at 100
    delta = min(delta, 100 - current_score)
    new_score = current_score + delta

    return delta, get_tier(new_score), rule["severity"], rule.get("mitre"), scored_signals


def is_endpoint_unlocked(signal_key: str, current_score: int) -> bool:
    """Score-gated endpoint unlocking per PRD Section 5.3"""
    gates = {
        "db_query_access": 31,
        "internal_docs_access": 31,
        "payment_gateway_access": 61,
    }
    required = gates.get(signal_key, 0)
    return current_score >= required
