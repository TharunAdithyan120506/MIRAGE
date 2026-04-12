"""
MIRAGE MITRE ATT&CK Mapper — PRD Section 7.2
Maps honeypot events → ATT&CK Tactic / Technique ID / Technique Name / Evidence
"""

MITRE_TABLE = [
    {
        "technique_id": "T1595.003",
        "tactic": "Reconnaissance",
        "technique_name": "Active Scanning: Wordlist Scanning",
        "signals": ["admin_access", "rapid_path_scan", "phpmyadmin_visit", "admin_portal_access", "nmap_scan_detected"],
        "description": "Attacker probed common admin paths (/admin, /phpmyadmin) indicating automated or manual wordlist scanning.",
    },
    {
        "technique_id": "T1078",
        "tactic": "Initial Access",
        "technique_name": "Valid Accounts",
        "signals": ["login_attempt", "multi_cred_attempt", "dashboard_visit", "extended_session", "otp_verify_attempt"],
        "description": "Attacker authenticated using arbitrary credentials on honeypot — honeypot accepts any login.",
    },
    {
        "technique_id": "T1190",
        "tactic": "Initial Access",
        "technique_name": "Exploit Public-Facing Application",
        "signals": ["sqli_pattern", "db_query_access"],
        "description": "Attacker attempted SQL injection or probed database query interface.",
    },
    {
        "technique_id": "T1530",
        "tactic": "Collection",
        "technique_name": "Data from Cloud Storage Object",
        "signals": ["honeytoken_config", "payment_gateway_access"],
        "description": "Attacker accessed fake AWS credentials, JWT secrets, and payment gateway keys.",
    },
    {
        "technique_id": "T1213",
        "tactic": "Collection",
        "technique_name": "Data from Information Repositories",
        "signals": ["bulk_user_harvest", "statement_access", "internal_docs_access", "transfer_attempt"],
        "description": "Attacker harvested bulk user records and financial transaction data.",
    },
    {
        "technique_id": "T1048",
        "tactic": "Exfiltration",
        "technique_name": "Exfiltration Over Alternative Protocol",
        "signals": ["env_file_download"],
        "description": "Attacker downloaded .env file containing fake credentials — exfiltration via HTTP.",
    },
    {
        "technique_id": "T1041",
        "tactic": "Exfiltration",
        "technique_name": "Exfiltration Over C2 Channel",
        "signals": ["otp_trap_triggered", "admin_export_attempt"],
        "description": "Attacker attempted to export user data, triggering the OTP trap and fingerprinting sequence.",
    },
    {
        "technique_id": "T1036",
        "tactic": "Defense Evasion",
        "technique_name": "Masquerading",
        "signals": ["attack_tool_ua"],
        "description": "Attack tool user-agent string detected (sqlmap, nmap, Nikto, or Burp Suite).",
    },
    {
        "technique_id": "T1090",
        "tactic": "Defense Evasion",
        "technique_name": "Proxy",
        "signals": ["tor_vpn_detected"],
        "description": "Traffic originated from a Tor exit node or known VPN IP range.",
    },
    {
        "technique_id": "T1082",
        "tactic": "Discovery",
        "technique_name": "System Information Discovery",
        "signals": ["telemetry_captured"],
        "description": "Device fingerprint captured: WebRTC IP, canvas hash, hardware profile, timezone, and geolocation.",
    },
]


def map_techniques(triggered_signals: list[str]) -> list[dict]:
    """
    Given a list of triggered signal keys, return all matching MITRE techniques
    with evidence notes.
    """
    results = []
    seen = set()
    for entry in MITRE_TABLE:
        matched = [s for s in entry["signals"] if s in triggered_signals]
        if matched and entry["technique_id"] not in seen:
            results.append({
                "technique_id": entry["technique_id"],
                "tactic": entry["tactic"],
                "technique_name": entry["technique_name"],
                "observed_evidence": entry["description"],
                "matched_signals": matched,
            })
            seen.add(entry["technique_id"])
    return results


def get_all_techniques() -> list[dict]:
    return MITRE_TABLE
