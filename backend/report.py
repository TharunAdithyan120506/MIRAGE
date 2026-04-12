"""
MIRAGE PDF Report Generator — PRD Section 07
ReportLab 7-page Threat Actor Dossier
"""
import os
from datetime import datetime
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch, cm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, PageBreak
)
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT

# ── Brand Colors ──────────────────────────────────────────────────────────────
NAVY   = colors.HexColor("#003366")
RED    = colors.HexColor("#C8102E")
GOLD   = colors.HexColor("#D4A017")
WHITE  = colors.white
LIGHT  = colors.HexColor("#F0F4F8")
DARK   = colors.HexColor("#1A1A2E")
GREEN  = colors.HexColor("#1A7A4A")
ORANGE = colors.HexColor("#E05C00")
CRIMSON= colors.HexColor("#B00020")

TIER_COLORS = {
    "Script Kiddie":     GREEN,
    "Opportunist":       ORANGE,
    "Targeted Attacker": RED,
    "APT-Level":         CRIMSON,
}

DOSSIERS_DIR = "dossiers"
os.makedirs(DOSSIERS_DIR, exist_ok=True)


def _styles():
    s = getSampleStyleSheet()
    custom = {
        "cover_title": ParagraphStyle("cover_title", fontSize=36, textColor=WHITE,
                                       alignment=TA_CENTER, fontName="Helvetica-Bold", spaceAfter=6),
        "cover_sub":   ParagraphStyle("cover_sub",   fontSize=16, textColor=GOLD,
                                       alignment=TA_CENTER, fontName="Helvetica", spaceAfter=4),
        "cover_body":  ParagraphStyle("cover_body",  fontSize=12, textColor=WHITE,
                                       alignment=TA_CENTER, fontName="Helvetica", spaceAfter=4),
        "section_h":   ParagraphStyle("section_h",   fontSize=16, textColor=NAVY,
                                       fontName="Helvetica-Bold", spaceAfter=6, spaceBefore=12),
        "field_label": ParagraphStyle("field_label", fontSize=10, textColor=DARK,
                                       fontName="Helvetica-Bold"),
        "field_value": ParagraphStyle("field_value", fontSize=10, textColor=DARK,
                                       fontName="Helvetica"),
        "body":        ParagraphStyle("body",        fontSize=10, textColor=DARK,
                                       fontName="Helvetica", spaceAfter=4),
        "mono":        ParagraphStyle("mono",        fontSize=9,  textColor=RED,
                                       fontName="Courier", spaceAfter=2),
        "warning":     ParagraphStyle("warning",     fontSize=11, textColor=WHITE,
                                       fontName="Helvetica-Bold", alignment=TA_CENTER),
    }
    return custom


def _header_table(text: str, bg=NAVY):
    t = Table([[Paragraph(text, ParagraphStyle("h", fontSize=14, textColor=WHITE,
                fontName="Helvetica-Bold", alignment=TA_CENTER))]], colWidths=[7*inch])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (-1,-1), bg),
        ("TOPPADDING",    (0,0), (-1,-1), 8),
        ("BOTTOMPADDING", (0,0), (-1,-1), 8),
        ("LEFTPADDING",   (0,0), (-1,-1), 12),
    ]))
    return t


def _kv_table(rows: list[tuple], col_widths=None):
    if col_widths is None:
        col_widths = [2.2*inch, 4.8*inch]
    st = _styles()
    data = [[Paragraph(k, st["field_label"]), Paragraph(str(v), st["field_value"])] for k, v in rows]
    t = Table(data, colWidths=col_widths)
    t.setStyle(TableStyle([
        ("BACKGROUND",    (0, 0), (0, -1), LIGHT),
        ("GRID",          (0, 0), (-1,-1), 0.5, colors.HexColor("#CCCCCC")),
        ("TOPPADDING",    (0, 0), (-1,-1), 5),
        ("BOTTOMPADDING", (0, 0), (-1,-1), 5),
        ("LEFTPADDING",   (0, 0), (-1,-1), 8),
        ("VALIGN",        (0, 0), (-1,-1), "TOP"),
    ]))
    return t


def generate_dossier(session: dict, events: list[dict], mitre_techniques: list[dict]) -> str:
    """
    Generate a 7-page PDF dossier for the given session.
    Returns the file path of the generated PDF.
    """
    session_id = session.get("id", "unknown")
    filename = os.path.join(DOSSIERS_DIR, f"dossier_{session_id[:8]}.pdf")
    doc = SimpleDocTemplate(filename, pagesize=A4,
                            rightMargin=inch*0.75, leftMargin=inch*0.75,
                            topMargin=inch*0.75, bottomMargin=inch*0.75)
    st = _styles()
    story = []

    tier = session.get("tier", "Script Kiddie")
    score = session.get("threat_score", 0)
    tier_color = TIER_COLORS.get(tier, ORANGE)
    now_str = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")
    started = session.get("started_at", now_str)
    last_seen = session.get("last_seen", now_str)

    # ── PAGE 1: Cover ────────────────────────────────────────────────────────
    story.append(Spacer(1, 0.5*inch))
    cover_bg = Table([[""]], colWidths=[7*inch], rowHeights=[0.6*inch])
    cover_bg.setStyle(TableStyle([("BACKGROUND",(0,0),(-1,-1), NAVY)]))
    story.append(cover_bg)
    story.append(Spacer(1, 0.1*inch))

    story.append(Paragraph("MIRAGE", ParagraphStyle("m1", fontSize=42, textColor=NAVY,
                            fontName="Helvetica-Bold", alignment=TA_CENTER)))
    story.append(Paragraph("Multi-layer Intelligent Reactive Adaptive Grid Engine",
                 ParagraphStyle("m2", fontSize=12, textColor=DARK,
                                fontName="Helvetica", alignment=TA_CENTER)))
    story.append(Spacer(1, 0.3*inch))
    story.append(HRFlowable(width="100%", thickness=2, color=RED))
    story.append(Spacer(1, 0.2*inch))
    story.append(Paragraph("THREAT ACTOR DOSSIER",
                 ParagraphStyle("m3", fontSize=28, textColor=RED,
                                fontName="Helvetica-Bold", alignment=TA_CENTER)))
    story.append(Spacer(1, 0.2*inch))

    tier_pill = Table([[Paragraph(f"⚠️ {tier.upper()}", ParagraphStyle("tp", fontSize=16,
                        textColor=WHITE, fontName="Helvetica-Bold", alignment=TA_CENTER))]],
                      colWidths=[3*inch], rowHeights=[0.5*inch])
    tier_pill.setStyle(TableStyle([("BACKGROUND",(0,0),(-1,-1), tier_color),
                                    ("ALIGN",(0,0),(-1,-1),"CENTER"),
                                    ("VALIGN",(0,0),(-1,-1),"MIDDLE")]))
    story.append(tier_pill)
    story.append(Spacer(1, 0.3*inch))

    story.append(_kv_table([
        ("Session ID",     session_id),
        ("Generated At",   now_str),
        ("Classification", "⛔ CONFIDENTIAL — MIRAGE SOC"),
        ("Threat Score",   f"{score} / 100"),
        ("Tier",           tier),
    ]))
    story.append(PageBreak())

    # ── PAGE 2: Executive Summary ─────────────────────────────────────────────
    story.append(_header_table("EXECUTIVE SUMMARY"))
    story.append(Spacer(1, 0.15*inch))

    duration = "N/A"
    try:
        if isinstance(started, str):
            s_dt = datetime.fromisoformat(started.replace("Z",""))
        else:
            s_dt = started
        if isinstance(last_seen, str):
            e_dt = datetime.fromisoformat(last_seen.replace("Z",""))
        else:
            e_dt = last_seen
        duration = str(e_dt - s_dt).split(".")[0]
    except Exception:
        pass

    honeytokens = [e for e in events if e.get("event_type") == "HONEYTOKEN_ACCESS"]
    critical_events = [e for e in events if e.get("severity") == "CRITICAL"]

    story.append(_kv_table([
        ("Threat Score",        f"{score} / 100"),
        ("Threat Tier",         tier),
        ("Session Duration",    duration),
        ("Total Events",        str(len(events))),
        ("Critical Events",     str(len(critical_events))),
        ("Honeytokens Accessed",str(len(honeytokens))),
        ("Session Start",       str(started)),
        ("Last Activity",       str(last_seen)),
    ]))
    story.append(Spacer(1, 0.2*inch))

    # Risk narrative
    narrative = _generate_narrative(score, tier, len(events), len(honeytokens), len(critical_events))
    story.append(Paragraph("Risk Assessment", st["section_h"]))
    story.append(Paragraph(narrative, st["body"]))
    story.append(PageBreak())

    # ── PAGE 3: Attacker Identity ─────────────────────────────────────────────
    story.append(_header_table("ATTACKER IDENTITY PROFILE"))
    story.append(Spacer(1, 0.15*inch))

    device = session.get("device_profile") or {}
    geo = session.get("geo_data") or {}

    identity_rows = [
        ("Header IP",          session.get("ip_header", "Unknown")),
        ("WebRTC Real IP",     (session.get("webrtc_ip") or "Not captured") + " ← bypasses VPN"),
        ("User Agent",         session.get("user_agent", "Unknown")),
        ("Canvas Hash",        session.get("canvas_hash", "Not captured")),
        ("Browser / OS",       _parse_ua(session.get("user_agent", ""))),
    ]

    # Geolocation data
    if geo.get("city"):
        identity_rows.extend([
            ("— GEOLOCATION —",    "— Resolved from IP —"),
            ("City",               f"{geo.get('city', 'Unknown')}, {geo.get('region', '')}"),
            ("Country",            f"{geo.get('country', 'Unknown')} ({geo.get('countryCode', '??')})"),
            ("ISP",                geo.get("isp", "Unknown")),
            ("Organization",       geo.get("org", "Unknown")),
            ("AS Number",          geo.get("as", "Unknown")),
            ("Coordinates",        f"{geo.get('lat', 0)}, {geo.get('lon', 0)}"),
            ("Timezone",           geo.get("timezone", device.get("timezone", "Unknown"))),
        ])
    else:
        identity_rows.append(("Timezone", device.get("timezone", "Unknown")))

    # Device profile
    identity_rows.extend([
        ("— DEVICE PROFILE —",  "— Fingerprint Data —"),
        ("Language",           device.get("language", "Unknown")),
        ("Screen Resolution",  device.get("screen", "Unknown")),
        ("CPU Cores",          str(device.get("cores", "Unknown"))),
        ("Device Memory",      f"{device.get('memory', 'Unknown')} GB"),
        ("Touch Points",       str(device.get("touchPoints", "Unknown"))),
    ])

    story.append(_kv_table(identity_rows))
    story.append(PageBreak())

    # ── PAGE 4: Attack Timeline ───────────────────────────────────────────────
    story.append(_header_table("ATTACK TIMELINE"))
    story.append(Spacer(1, 0.15*inch))

    timeline_data = [["Timestamp", "Event Type", "Path", "Severity", "Δ Score", "Cumulative"]]
    cumulative = 0
    for e in sorted(events, key=lambda x: x.get("timestamp", "")):
        delta = e.get("score_delta", 0)
        cumulative += delta
        ts = str(e.get("timestamp", ""))[:19]
        timeline_data.append([
            ts, e.get("event_type",""), e.get("path","")[:25],
            e.get("severity",""), f"+{delta}", str(cumulative)
        ])

    t = Table(timeline_data, colWidths=[1.4*inch, 1.3*inch, 1.5*inch, 0.9*inch, 0.6*inch, 0.8*inch])
    t.setStyle(TableStyle([
        ("BACKGROUND",    (0,0), (-1,0), NAVY),
        ("TEXTCOLOR",     (0,0), (-1,0), WHITE),
        ("FONTNAME",      (0,0), (-1,0), "Helvetica-Bold"),
        ("FONTSIZE",      (0,0), (-1,-1), 8),
        ("GRID",          (0,0), (-1,-1), 0.4, colors.HexColor("#CCCCCC")),
        ("ROWBACKGROUNDS",(0,1), (-1,-1), [WHITE, LIGHT]),
        ("TOPPADDING",    (0,0), (-1,-1), 4),
        ("BOTTOMPADDING", (0,0), (-1,-1), 4),
        ("LEFTPADDING",   (0,0), (-1,-1), 4),
    ]))
    story.append(t)
    story.append(PageBreak())

    # ── PAGE 5: MITRE ATT&CK Kill Chain ──────────────────────────────────────
    story.append(_header_table("MITRE ATT&CK KILL CHAIN"))
    story.append(Spacer(1, 0.15*inch))

    mitre_data = [["Tactic", "Technique ID", "Technique Name", "Observed Evidence"]]
    for tech in mitre_techniques:
        mitre_data.append([
            tech.get("tactic",""),
            tech.get("technique_id",""),
            tech.get("technique_name",""),
            tech.get("observed_evidence","")[:60],
        ])
    if len(mitre_data) == 1:
        mitre_data.append(["Reconnaissance","T1595.003","Active Scanning","Path probing detected"])

    mt = Table(mitre_data, colWidths=[1.3*inch, 1.1*inch, 1.8*inch, 2.8*inch])
    mt.setStyle(TableStyle([
        ("BACKGROUND",    (0,0), (-1,0), RED),
        ("TEXTCOLOR",     (0,0), (-1,0), WHITE),
        ("FONTNAME",      (0,0), (-1,0), "Helvetica-Bold"),
        ("FONTSIZE",      (0,0), (-1,-1), 8),
        ("GRID",          (0,0), (-1,-1), 0.4, colors.HexColor("#CCCCCC")),
        ("ROWBACKGROUNDS",(0,1), (-1,-1), [WHITE, LIGHT]),
        ("TOPPADDING",    (0,0), (-1,-1), 5),
        ("BOTTOMPADDING", (0,0), (-1,-1), 5),
        ("LEFTPADDING",   (0,0), (-1,-1), 4),
        ("VALIGN",        (0,0), (-1,-1), "TOP"),
        ("WORDWRAP",      (0,0), (-1,-1), True),
    ]))
    story.append(mt)
    story.append(PageBreak())

    # ── PAGE 6: Indicators of Compromise ─────────────────────────────────────
    story.append(_header_table("INDICATORS OF COMPROMISE"))
    story.append(Spacer(1, 0.15*inch))

    accessed_paths = list({e.get("path","") for e in events if e.get("path")})
    credentials = [e.get("payload",{}) for e in events if e.get("event_type") == "LOGIN_ATTEMPT"]

    story.append(Paragraph("Accessed Endpoints", st["section_h"]))
    for p in accessed_paths:
        story.append(Paragraph(f"• {p}", st["mono"]))
    story.append(Spacer(1, 0.15*inch))

    story.append(Paragraph("Attempted Credentials", st["section_h"]))
    if credentials:
        for cred in credentials[:10]:
            u = cred.get("username","?") if isinstance(cred, dict) else "?"
            story.append(Paragraph(f"• username: {u}", st["mono"]))
    else:
        story.append(Paragraph("No credential attempts recorded.", st["body"]))

    story.append(Spacer(1, 0.15*inch))
    story.append(Paragraph("Honeytokens Triggered", st["section_h"]))
    honeytoken_paths = [e.get("path","") for e in events if e.get("event_type") == "HONEYTOKEN_ACCESS"]
    if honeytoken_paths:
        for p in honeytoken_paths:
            story.append(Paragraph(f"• {p}", st["mono"]))
    else:
        story.append(Paragraph("No honeytokens accessed.", st["body"]))
    story.append(PageBreak())

    # ── PAGE 7: SOC Recommendations ──────────────────────────────────────────
    story.append(_header_table("SOC RECOMMENDATIONS", bg=RED))
    story.append(Spacer(1, 0.2*inch))

    recs = _generate_recommendations(score, tier, mitre_techniques)
    for i, rec in enumerate(recs, 1):
        story.append(Paragraph(f"{i}. {rec}", st["body"]))
        story.append(Spacer(1, 0.1*inch))

    story.append(Spacer(1, 0.3*inch))
    story.append(HRFlowable(width="100%", thickness=1, color=NAVY))
    story.append(Spacer(1, 0.1*inch))
    story.append(Paragraph(
        "This report was generated automatically by MIRAGE — Adaptive Cybersecurity Honeypot System. "
        "All attacker data was collected passively while the threat actor interacted with the honeypot deception surface. "
        "MIRAGE intelligence should be reviewed by a qualified SOC analyst before operational action.",
        ParagraphStyle("footer", fontSize=8, textColor=colors.HexColor("#4A4A6A"),
                       fontName="Helvetica", alignment=TA_CENTER)
    ))

    doc.build(story)
    return filename


def _parse_ua(ua: str) -> str:
    """Simplified browser/OS extraction from user agent string."""
    if not ua:
        return "Unknown"
    browser = "Unknown Browser"
    os_info = "Unknown OS"
    if "Chrome" in ua and "Edg" not in ua:
        browser = "Chrome"
    elif "Firefox" in ua:
        browser = "Firefox"
    elif "Safari" in ua:
        browser = "Safari"
    elif "Edg" in ua:
        browser = "Edge"
    if "Windows NT 10" in ua:
        os_info = "Windows 11/10"
    elif "Windows" in ua:
        os_info = "Windows"
    elif "Mac OS X" in ua:
        os_info = "macOS"
    elif "Linux" in ua:
        os_info = "Linux"
    elif "Android" in ua:
        os_info = "Android"
    return f"{browser} on {os_info}"


def _generate_narrative(score, tier, total_events, honeytokens, critical) -> str:
    if score >= 86:
        return (
            f"This session exhibits characteristics consistent with an APT-level threat actor. "
            f"With a threat score of {score}/100, the attacker demonstrated sophisticated, "
            f"multi-stage attack behavior including reconnaissance, credential harvesting, "
            f"honeytoken access, and data exfiltration attempts. "
            f"{critical} critical events were recorded across {total_events} total interactions. "
            f"Immediate escalation to SOC Tier 3 is recommended."
        )
    elif score >= 61:
        return (
            f"This session shows signs of a targeted, skilled attacker with score {score}/100. "
            f"The threat actor systematically probed internal APIs and attempted data harvest. "
            f"{honeytokens} honeytokens were accessed. Recommend blocking the identified IP ranges "
            f"and reviewing all accessed endpoint logs."
        )
    elif score >= 31:
        return (
            f"This session indicates an opportunistic attacker (score: {score}/100) "
            f"who discovered the honeypot and attempted to harvest credentials and configuration data. "
            f"Standard SOC response procedure recommended. Monitor for follow-up probing."
        )
    else:
        return (
            f"This session shows low-sophistication probing behavior (score: {score}/100). "
            f"The threat actor may be a script kiddie or automated scanner. "
            f"Log for pattern analysis. No immediate escalation required."
        )


def _generate_recommendations(score, tier, mitre_techniques) -> list:
    technique_ids = {t.get("technique_id") for t in mitre_techniques}
    recs = []
    if "T1595.003" in technique_ids:
        recs.append("Deploy rate limiting and path-based WAF rules to detect and block wordlist scanning patterns on all public-facing applications.")
    if "T1078" in technique_ids:
        recs.append("Enforce multi-factor authentication on all administrative interfaces. Review and rotate all credentials that may have been observed by this session.")
    if "T1530" in technique_ids or "T1048" in technique_ids:
        recs.append("Rotate all credentials and secrets that were exposed as honeytokens. Implement secrets management (HashiCorp Vault or AWS Secrets Manager) to prevent plaintext credential exposure.")
    if "T1090" in technique_ids:
        recs.append("Block known Tor exit nodes and VPN datacenter IP ranges at the perimeter firewall. Implement geo-fencing for administrative interfaces.")
    if "T1190" in technique_ids:
        recs.append("Conduct an emergency review of all SQL injection vectors in production APIs. Enforce parameterized queries and input validation across all database interfaces.")
    if score >= 61:
        recs.append("Escalate this incident to Tier 3 SOC analysts. Preserve all honeypot logs as evidence. Consider sharing IOCs with threat intelligence platforms (MISP, OpenCTI).")
    if not recs:
        recs.append("Continue monitoring. No immediate high-priority actions required. Review this session for inclusion in threat intelligence baseline.")
        recs.append("Ensure all honeypot logs are archived for pattern analysis and future threat modeling.")
        recs.append("Verify honeypot isolation — confirm no real customer data is accessible from the honeypot network segment.")
    return recs[:5]
