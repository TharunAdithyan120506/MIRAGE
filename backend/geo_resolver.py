"""
MIRAGE Geolocation Resolver — Resolve IP to real physical location
Uses ip-api.com (free, no API key, 45 req/min) for production.
For localhost/private IPs, returns realistic demo data (Bangalore, India).
"""
import json
import urllib.request
from typing import Optional

# ── In-memory cache to avoid rate limits ─────────────────────────────────────
_GEO_CACHE: dict[str, dict] = {}

# ── Demo fallback data for localhost/private IPs ────────────────────────────
DEMO_GEO = {
    "city": "Local Network",
    "region": "Private",
    "country": "Unknown",
    "countryCode": "XX",
    "isp": "Localhost",
    "org": "Internal Network",
    "as": "AS0000 Local",
    "lat": 0.0,
    "lon": 0.0,
    "timezone": "UTC",
    "query": "127.0.0.1",
    "status": "fail",
    "is_demo": True,
}


def _is_private_ip(ip: str) -> bool:
    """Check if IP is loopback or private range."""
    if not ip:
        return True
    ip = ip.strip()
    return (
        ip.startswith("127.") or
        ip.startswith("10.") or
        ip.startswith("192.168.") or
        ip.startswith("172.") or
        ip == "::1" or
        ip == "0.0.0.0" or
        ip == "localhost"
    )


def resolve_ip(ip: Optional[str]) -> dict:
    """
    Resolve an IP address to geographic location.
    Returns dict with: city, region, country, countryCode, isp, org, as, lat, lon, timezone
    """
    # If the IP is private or localhost, we fetch the real public IP of the workstation
    url_target = ip
    if not ip or _is_private_ip(ip):
        url_target = "" # Querying without IP resolves the requestor's public IP
        
    cache_key = url_target or "self_public_ip"
    
    # Check cache
    if cache_key in _GEO_CACHE:
        return _GEO_CACHE[cache_key]

    try:
        url = f"http://ip-api.com/json/{url_target}?fields=status,message,country,countryCode,region,regionName,city,lat,lon,timezone,isp,org,as,query"
        req = urllib.request.Request(url, headers={"User-Agent": "MIRAGE/1.0"})
        with urllib.request.urlopen(req, timeout=5) as resp:
            data = json.loads(resp.read().decode("utf-8"))

        if data.get("status") == "success":
            result = {
                "city": data.get("city", "Unknown"),
                "region": data.get("regionName", "Unknown"),
                "country": data.get("country", "Unknown"),
                "countryCode": data.get("countryCode", "??"),
                "isp": data.get("isp", "Unknown"),
                "org": data.get("org", "Unknown"),
                "as": data.get("as", "Unknown"),
                "lat": data.get("lat", 0),
                "lon": data.get("lon", 0),
                "timezone": data.get("timezone", "Unknown"),
                "query": data.get("query", ip), # Get the real public IP resolved
                "status": "success",
                "is_demo": False,
            }
            _GEO_CACHE[cache_key] = result
            return result
        else:
            return DEMO_GEO.copy()

    except Exception:
        # API unreachable — return demo data
        return DEMO_GEO.copy()


# Country code → flag emoji mapping
def country_flag(country_code: str) -> str:
    """Convert ISO country code to flag emoji."""
    if not country_code or len(country_code) != 2:
        return "🌍"
    return chr(0x1F1E6 + ord(country_code[0]) - ord('A')) + chr(0x1F1E6 + ord(country_code[1]) - ord('A'))
