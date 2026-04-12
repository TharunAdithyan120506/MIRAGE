/**
 * MIRAGE Fingerprinting Module
 * Runs silently on OTP trap page load.
 * PRD Section 4.3 — WebRTC IP Leak + Canvas Hash + Device Profile
 */

const API = 'http://localhost:8000'

export async function collectFingerprint(sessionId) {
  const profile = {
    session_id: sessionId,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: navigator.language,
    screen: `${screen.width}x${screen.height}`,
    cores: navigator.hardwareConcurrency,
    memory: navigator.deviceMemory || null,
    userAgent: navigator.userAgent,
    touchPoints: navigator.maxTouchPoints,
    webrtcIP: null,
    canvasHash: null,
  }

  // ── Canvas Fingerprint ────────────────────────────────────────────────────
  try {
    const canvas = document.createElement('canvas')
    canvas.width = 300
    canvas.height = 100
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#003366'
    ctx.fillRect(0, 0, 300, 100)
    ctx.fillStyle = '#C8102E'
    ctx.font = 'bold 18px Arial'
    ctx.fillText('MIRAGE_FP_⚠️_SecureBank', 10, 50)
    ctx.fillStyle = '#D4A017'
    ctx.font = '12px monospace'
    ctx.fillText(navigator.userAgent.slice(0, 40), 10, 75)
    const dataURL = canvas.toDataURL()
    profile.canvasHash = btoa(dataURL).slice(20, 52)
  } catch { /* Canvas blocked — skip */ }

  // ── WebRTC IP Leak (bypasses VPN) ────────────────────────────────────────
  await new Promise((resolve) => {
    try {
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ],
      })
      pc.createDataChannel('')
      pc.createOffer()
        .then(o => pc.setLocalDescription(o))
        .catch(() => resolve())

      const timeout = setTimeout(() => { pc.close(); resolve() }, 4000)

      pc.onicecandidate = (e) => {
        if (!e.candidate) return
        const candidate = e.candidate.candidate
        // Extract IP from SDP candidate string
        const ipMatch = candidate.match(
          /(\d{1,3}(?:\.\d{1,3}){3}|[a-f0-9:]{3,39})/i
        )
        if (ipMatch) {
          const ip = ipMatch[1]
          // Skip private/loopback ranges
          if (!ip.startsWith('192.168') && !ip.startsWith('10.') &&
              !ip.startsWith('172.') && ip !== '127.0.0.1') {
            profile.webrtcIP = ip
            clearTimeout(timeout)
            pc.close()
            resolve()
          } else if (!profile.webrtcIP) {
            profile.webrtcIP = ip // Keep even if private
          }
        }
      }
    } catch { resolve() }
  })

  // ── POST to backend silently ──────────────────────────────────────────────
  try {
    await fetch(`${API}/api/telemetry`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile),
      keepalive: true,
    })
  } catch { /* Backend unreachable — fingerprint still captured client-side */ }

  return profile
}
