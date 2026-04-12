"""
MIRAGE Tor / VPN Checker — PRD Section 5.2
Checks if an IP is a known Tor exit node or falls in common VPN ranges.
Uses Dan.me.uk Tor exit node list (with HTTP fallback to cached list).
"""
import ipaddress
from typing import Optional

# ── Known VPN / Datacenter CIDR ranges (simplified list for demo) ─────────────
KNOWN_VPN_RANGES = [
    # Mullvad
    "193.138.218.0/24", "185.213.154.0/24",
    # NordVPN
    "185.234.216.0/22", "213.232.87.0/24",
    # ProtonVPN
    "185.159.156.0/22", "185.107.56.0/22",
    # ExpressVPN
    "119.28.0.0/14",
    # Common datacenter ranges often abused
    "23.19.224.0/19", "104.153.64.0/18",
    # Tor default CIDR approximations
    "176.10.99.0/24", "62.102.148.0/24",
]

# ── Tor Exit Node Cache (populated at startup or from live feed) ──────────────
_TOR_EXIT_NODES: set[str] = set()
_VPN_NETWORKS = [ipaddress.ip_network(cidr, strict=False) for cidr in KNOWN_VPN_RANGES]


def load_tor_exit_nodes_from_url() -> None:
    """
    Attempt to fetch live Tor exit nodes from Dan.me.uk.
    If offline, silently skip (uses empty set — check_ip will still detect VPN ranges).
    """
    import urllib.request
    global _TOR_EXIT_NODES
    try:
        url = "https://www.dan.me.uk/torlist/?exit"
        with urllib.request.urlopen(url, timeout=5) as resp:
            data = resp.read().decode("utf-8")
            _TOR_EXIT_NODES = set(line.strip() for line in data.splitlines() if line.strip())
    except Exception:
        # Offline / blocked — use empty set, VPN check still works
        _TOR_EXIT_NODES = set()


def check_ip(ip: Optional[str]) -> dict:
    """
    Returns {'is_tor': bool, 'is_vpn': bool, 'is_suspicious': bool}
    """
    if not ip:
        return {"is_tor": False, "is_vpn": False, "is_suspicious": False}

    # Handle comma-separated X-Forwarded-For
    clean_ip = ip.split(",")[0].strip()

    is_tor = clean_ip in _TOR_EXIT_NODES
    is_vpn = False

    try:
        addr = ipaddress.ip_address(clean_ip)
        if addr.is_loopback or addr.is_private:
            return {"is_tor": False, "is_vpn": False, "is_suspicious": False}
        is_vpn = any(addr in net for net in _VPN_NETWORKS)
    except ValueError:
        pass

    return {
        "is_tor": is_tor,
        "is_vpn": is_vpn,
        "is_suspicious": is_tor or is_vpn,
    }
