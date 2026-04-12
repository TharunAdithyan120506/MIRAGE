"""
MIRAGE Threat Scorer — Rule-based 0–100 scoring engine
As defined in PRD Section 5.2 and 5.3
Zero ML, 100% deterministic and explainable.
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
    "admin_access":          {"points": 15, "severity": "HIGH",     "mitre": "T1595.003", "desc": "Accessed /admin or /phpmyadmin"},
    "multi_cred_attempt":    {"points": 10, "severity": "MEDIUM",   "mitre": "T1078",     "desc": "Tried 3+ different credential pairs"},
    "honeytoken_config":     {"points": 20, "severity": "CRITICAL", "mitre": "T1530",     "desc": "Accessed /api/config or /files/.env"},
    "bulk_user_harvest":     {"points": 15, "severity": "HIGH",     "mitre": "T1213",     "desc": "Accessed /api/users bulk endpoint"},
    "sqli_pattern":          {"points": 25, "severity": "CRITICAL", "mitre": "T1190",     "desc": "SQL injection pattern detected"},
    "attack_tool_ua":        {"points": 20, "severity": "HIGH",     "mitre": "T1036",     "desc": "Attack tool user-agent detected"},
    "rapid_path_scan":       {"points": 15, "severity": "HIGH",     "mitre": "T1595.003", "desc": "Scanned 10+ paths in under 60s"},
    "otp_trap_triggered":    {"points": 20, "severity": "CRITICAL", "mitre": "T1041",     "desc": "OTP trap triggered"},
    "extended_session":      {"points": 10, "severity": "LOW",      "mitre": "T1078",     "desc": "Time on target > 5 minutes"},
    "tor_vpn_detected":      {"points": 10, "severity": "HIGH",     "mitre": "T1090",     "desc": "Tor exit node or VPN IP detected"},
    "payment_gateway_access":{"points": 20, "severity": "CRITICAL", "mitre": "T1530",     "desc": "Accessed /api/payment-gateway"},
    "env_file_download":     {"points": 15, "severity": "CRITICAL", "mitre": "T1048",     "desc": "Downloaded .env file"},
    "dashboard_visit":       {"points": 5,  "severity": "LOW",      "mitre": "T1078",     "desc": "Visited honeypot dashboard"},
    "transfer_attempt":      {"points": 10, "severity": "MEDIUM",   "mitre": "T1213",     "desc": "Attempted fund transfer"},
    "statement_access":      {"points": 15, "severity": "HIGH",     "mitre": "T1213",     "desc": "Accessed account statement"},
    "internal_docs_access":  {"points": 10, "severity": "MEDIUM",   "mitre": "T1213",     "desc": "Accessed /api/internal-docs"},
    "db_query_access":       {"points": 10, "severity": "MEDIUM",   "mitre": "T1190",     "desc": "Accessed /db/query interface"},
    "phpmyadmin_visit":      {"points": 15, "severity": "HIGH",     "mitre": "T1595.003", "desc": "Visited /phpmyadmin"},
    "login_attempt":         {"points": 10, "severity": "MEDIUM",   "mitre": "T1078",     "desc": "Login attempt on honeypot"},
}

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


def compute_score_delta(current_score: int, signal_key: str) -> tuple[int, str, str, Optional[str]]:
    """
    Returns (delta, new_tier, severity, mitre_technique)
    Caps total at 100.
    """
    rule = RULES.get(signal_key, {"points": 0, "severity": "LOW", "mitre": None})
    delta = min(rule["points"], 100 - current_score)
    new_score = current_score + delta
    return delta, get_tier(new_score), rule["severity"], rule.get("mitre")


def is_endpoint_unlocked(signal_key: str, current_score: int) -> bool:
    """Score-gated endpoint unlocking per PRD Section 5.3"""
    gates = {
        "db_query_access": 31,
        "internal_docs_access": 31,
        "payment_gateway_access": 61,
    }
    required = gates.get(signal_key, 0)
    return current_score >= required
