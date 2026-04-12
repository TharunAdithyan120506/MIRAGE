import { useRef, useEffect } from 'react'

const SEVERITY_COLORS = {
  CRITICAL: { bg: '#8B0000', text: '#FF6B6B', border: '#FF000044' },
  HIGH:     { bg: '#B00020', text: '#FF8C94', border: '#C8102E44' },
  MEDIUM:   { bg: '#7C4A00', text: '#FFB347', border: '#E05C0044' },
  LOW:      { bg: '#0D3D25', text: '#4ade80', border: '#1A7A4A44' },
}

const EVENT_ICONS = {
  PATH_PROBE:        '🔍',
  LOGIN_ATTEMPT:     '🔑',
  HONEYTOKEN_ACCESS: '🍯',
  OTP_TRAP:          '🪤',
  TELEMETRY:         '📡',
  fingerprint_captured: '🕵️',
}

function timeAgo(ts) {
  if (!ts) return ''
  const diff = Math.floor((Date.now() - new Date(ts).getTime()) / 1000)
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff/60)}m ago`
  return `${Math.floor(diff/3600)}h ago`
}

export default function EventFeed({ events, flashCritical }) {
  const feedRef = useRef(null)

  // Auto-scroll to top on new event
  useEffect(() => {
    if (feedRef.current) feedRef.current.scrollTop = 0
  }, [events.length])

  if (!events.length) return (
    <div style={{
      background: '#161B22', border: '1px solid #30363D', borderRadius: 12,
      padding: 24, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', minHeight: 200,
      color: '#8B949E', fontSize: 14
    }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>📡</div>
      <div>Waiting for attacker events...</div>
      <div style={{ fontSize: 12, marginTop: 4, color: '#484F58' }}>
        Events will appear here in real-time
      </div>
    </div>
  )

  return (
    <div style={{
      background: '#161B22', border: '1px solid #30363D', borderRadius: 12,
      overflow: 'hidden', display: 'flex', flexDirection: 'column',
      animation: flashCritical ? 'criticalFlash 0.5s ease-in-out 4' : 'none',
    }}>
      <div style={{
        padding: '14px 20px', borderBottom: '1px solid #30363D',
        display: 'flex', alignItems: 'center', gap: 10,
        background: '#0D1117',
      }}>
        <span style={{ fontSize: 16 }}>📡</span>
        <span style={{ color: '#E6EDF3', fontWeight: 700, fontSize: 14 }}>Live Event Feed</span>
        <span style={{
          marginLeft: 'auto', background: '#1A7A4A22', border: '1px solid #1A7A4A44',
          color: '#4ade80', fontSize: 11, padding: '2px 10px', borderRadius: 999
        }}>
          LIVE • {events.length} events
        </span>
      </div>

      <div ref={feedRef} style={{ maxHeight: 380, overflowY: 'auto', padding: '8px 0' }}>
        {events.map((ev, i) => {
          const sev = SEVERITY_COLORS[ev.severity] || SEVERITY_COLORS.LOW
          const isCritical = ev.severity === 'CRITICAL'
          const icon = EVENT_ICONS[ev.type || ev.event_type] || '⚡'

          return (
            <div key={i} style={{
              padding: '10px 20px', borderBottom: '1px solid #21262D',
              display: 'flex', alignItems: 'flex-start', gap: 12,
              background: isCritical ? `${sev.bg}22` : 'transparent',
              borderLeft: isCritical ? `3px solid ${sev.bg}` : '3px solid transparent',
              animation: i === 0 ? 'slideIn 0.3s ease' : 'none',
              transition: 'background 0.2s',
            }}>
              <span style={{ fontSize: 18, marginTop: 1 }}>{icon}</span>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                  <span style={{
                    background: sev.bg, color: sev.text,
                    border: `1px solid ${sev.border}`,
                    fontSize: 10, fontWeight: 700,
                    padding: '1px 8px', borderRadius: 999,
                    textTransform: 'uppercase', letterSpacing: 0.5,
                  }}>
                    {ev.severity}
                  </span>
                  <span style={{ color: '#8B949E', fontSize: 11 }}>
                    {ev.event_type || ev.type}
                  </span>
                  {ev.score_delta > 0 && (
                    <span style={{ color: sev.text, fontWeight: 700, fontSize: 12, marginLeft: 'auto' }}>
                      +{ev.score_delta} pts
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  {ev.path && (
                    <code style={{
                      color: '#C8102E', background: '#1A0A0A',
                      padding: '1px 6px', borderRadius: 3, fontSize: 11
                    }}>
                      {ev.path}
                    </code>
                  )}
                  {ev.webrtc_ip && (
                    <span style={{ fontSize: 11, color: '#58A6FF' }}>
                      WebRTC: {ev.webrtc_ip}
                    </span>
                  )}
                </div>

                {ev.mitre_technique && (
                  <span style={{
                    fontSize: 10, color: '#D4A017', fontFamily: 'monospace',
                    marginTop: 3, display: 'block'
                  }}>
                    ATT&CK: {ev.mitre_technique}
                  </span>
                )}
              </div>

              <div style={{ color: '#484F58', fontSize: 10, whiteSpace: 'nowrap', marginTop: 2 }}>
                {timeAgo(ev.timestamp)}
              </div>
            </div>
          )
        })}
      </div>

      <style>{`
        @keyframes slideIn {
          from { transform: translateY(-10px); opacity: 0; }
          to   { transform: translateY(0);     opacity: 1; }
        }
        @keyframes criticalFlash {
          0%, 100% { border-color: #30363D; }
          50%       { border-color: #C8102E; box-shadow: 0 0 20px #C8102E44; }
        }
      `}</style>
    </div>
  )
}
