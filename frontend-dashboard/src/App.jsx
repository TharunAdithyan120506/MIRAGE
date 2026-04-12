import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import ThreatGauge from './components/ThreatGauge'
import EventFeed from './components/EventFeed'
import SessionList from './components/SessionList'
import InfraMap from './components/InfraMap'
import DossierButton from './components/DossierButton'
import { useWebSocket } from './hooks/useWebSocket'

const API = 'http://localhost:8000'

const TIER_COLORS = {
  'Script Kiddie':     '#1A7A4A',
  'Opportunist':       '#E05C00',
  'Targeted Attacker': '#B00020',
  'APT-Level':         '#8B0000',
}

export default function App() {
  const { events: wsEvents, connected } = useWebSocket()
  const [sessions, setSessions] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [sessionDetail, setSessionDetail] = useState(null)
  const [flashCritical, setFlashCritical] = useState(false)
  const [showOTPModal, setShowOTPModal] = useState(false)
  const [headerFlash, setHeaderFlash] = useState(false)

  // Derive current score/tier from latest session or selected session
  const currentSession = sessions.find(s => s.id === selectedId) || sessions[0] || null
  const displayScore = currentSession?.threat_score || 0
  const displayTier  = currentSession?.tier || 'Script Kiddie'
  const tierColor    = TIER_COLORS[displayTier] || '#1A7A4A'

  // Fetch sessions periodically
  const fetchSessions = useCallback(async () => {
    try {
      const r = await axios.get(`${API}/api/sessions`)
      setSessions(r.data)
      // Auto-select latest session
      if (!selectedId && r.data.length > 0) {
        setSelectedId(r.data[0].id)
      }
    } catch {}
  }, [selectedId])

  useEffect(() => {
    fetchSessions()
    const t = setInterval(fetchSessions, 3000)
    return () => clearInterval(t)
  }, [fetchSessions])

  // Fetch detailed session data when selection changes
  useEffect(() => {
    if (!selectedId) return
    axios.get(`${API}/api/session/${selectedId}`)
      .then(r => setSessionDetail(r.data))
      .catch(() => {})
  }, [selectedId, wsEvents.length])

  // React to WebSocket events
  useEffect(() => {
    if (wsEvents.length === 0) return
    const latest = wsEvents[0]

    // Refresh sessions on any event
    fetchSessions()

    // Critical event effects
    if (latest.severity === 'CRITICAL' || latest.score_delta >= 20) {
      setFlashCritical(true)
      setHeaderFlash(true)
      setTimeout(() => { setFlashCritical(false); setHeaderFlash(false) }, 2000)
    }

    // OTP trap modal
    if (latest.event_type === 'OTP_TRAP' || latest.type === 'fingerprint_captured') {
      setShowOTPModal(true)
      setTimeout(() => setShowOTPModal(false), 8000)
    }

    // Auto-select session from event
    if (latest.session_id && !selectedId) {
      setSelectedId(latest.session_id)
    }
  }, [wsEvents])

  const deviceProfile = sessionDetail?.session?.device_profile || {}
  const sessionEvents = sessionDetail?.events || []
  const geoData = sessionDetail?.session?.geo_data || {}

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0D1117',
      color: '#E6EDF3',
      fontFamily: "'Inter', 'Segoe UI', sans-serif",
      fontSize: 14,
    }}>
      {/* ── OTP TRAP MODAL ─────────────────────────────────────────── */}
      {showOTPModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          animation: 'fadeIn 0.3s ease',
        }}>
          <div style={{
            background: '#161B22', border: '2px solid #C8102E',
            borderRadius: 16, padding: 48, maxWidth: 480, textAlign: 'center',
            boxShadow: '0 0 60px #C8102E44',
          }}>
            <div style={{ fontSize: 64, marginBottom: 16, animation: 'aptPulse 0.8s ease-in-out infinite' }}>🪤</div>
            <h2 style={{ color: '#C8102E', fontSize: 22, fontWeight: 700, marginBottom: 8 }}>
              OTP TRAP ENGAGED
            </h2>
            <p style={{ color: '#8B949E', marginBottom: 24, lineHeight: 1.6 }}>
              Fingerprinting in progress... Attacker is staring at the OTP form
              while MIRAGE silently extracts their real IP via WebRTC.
            </p>
            <div style={{
              display: 'flex', gap: 8, justifyContent: 'center',
              flexWrap: 'wrap', marginBottom: 16
            }}>
              {['WebRTC IP Leak', 'Canvas Hash', 'Device Profile', 'Timezone'].map(label => (
                <span key={label} style={{
                  background: '#1A7A4A22', border: '1px solid #1A7A4A44',
                  color: '#4ade80', fontSize: 11, padding: '4px 12px', borderRadius: 999
                }}>
                  ✓ {label}
                </span>
              ))}
            </div>
            <div style={{ fontSize: 12, color: '#484F58' }}>
              Auto-closing in a moment...
            </div>
          </div>
        </div>
      )}

      {/* ── HEADER ─────────────────────────────────────────────────── */}
      <header style={{
        background: headerFlash ? '#2D1418' : '#161B22',
        borderBottom: `2px solid ${headerFlash ? '#C8102E' : '#30363D'}`,
        padding: '0 32px', height: 64,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 100,
        transition: 'background 0.3s, border-color 0.3s',
        boxShadow: headerFlash ? '0 2px 20px #C8102E44' : 'none',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            background: '#003366', borderRadius: 8, width: 40, height: 40,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, border: '1px solid #004d99'
          }}>🛡️</div>
          <div>
            <div style={{ fontWeight: 900, fontSize: 18, letterSpacing: -0.5 }}>
              MIRAGE
              <span style={{ color: '#8B949E', fontWeight: 400, fontSize: 13, marginLeft: 8 }}>
                SOC Dashboard
              </span>
            </div>
            <div style={{ fontSize: 11, color: '#8B949E' }}>
              Multi-layer Intelligent Reactive Adaptive Grid Engine
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          {/* Live session score summary */}
          {currentSession && (
            <div style={{
              background: '#21262D', border: `1px solid ${tierColor}44`,
              borderRadius: 8, padding: '8px 16px',
              display: 'flex', alignItems: 'center', gap: 12
            }}>
              <div style={{ fontSize: 11, color: '#8B949E' }}>Active Threat</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: tierColor }}>
                {displayScore}
                <span style={{ fontSize: 12, color: '#8B949E', fontWeight: 400 }}>/100</span>
              </div>
              <div style={{
                background: tierColor + '22', color: tierColor,
                border: `1px solid ${tierColor}44`,
                fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 999
              }}>
                {displayTier}
              </div>
            </div>
          )}

          {/* WS status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{
              width: 8, height: 8, borderRadius: '50%',
              background: connected ? '#4ade80' : '#C8102E',
              boxShadow: connected ? '0 0 8px #4ade80' : '0 0 8px #C8102E',
              animation: connected ? 'aptPulse 2s infinite' : 'none',
            }} />
            <span style={{ fontSize: 12, color: '#8B949E' }}>
              {connected ? 'LIVE' : 'Reconnecting...'}
            </span>
          </div>

          <div style={{ fontSize: 12, color: '#484F58' }}>
            {sessions.length} session{sessions.length !== 1 ? 's' : ''} tracked
          </div>
        </div>
      </header>

      {/* ── MAIN GRID ───────────────────────────────────────────────── */}
      <main style={{ padding: 24 }}>
        {/* Top row: Gauge + Event Feed */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '300px 1fr',
          gap: 20, marginBottom: 20
        }}>
          {/* Left panel: Gauge + Session detail */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <ThreatGauge score={displayScore} tier={displayTier} />

            {/* Fingerprint + Geolocation detail card */}
            {sessionDetail?.session && (
              <div style={{
                background: '#161B22', border: '1px solid #30363D',
                borderRadius: 12, padding: 16, fontSize: 12
              }}>
                <div style={{
                  color: '#D4A017', fontWeight: 700, marginBottom: 10,
                  fontSize: 13, display: 'flex', alignItems: 'center', gap: 6
                }}>
                  🕵️ Attacker Identity
                </div>
                {[
                  ['Header IP',   sessionDetail.session.ip_header || '—'],
                  ['WebRTC IP',   sessionDetail.session.webrtc_ip
                                    ? sessionDetail.session.webrtc_ip + ' ⚠️'
                                    : 'Collecting...'],
                  ['Canvas Hash', sessionDetail.session.canvas_hash || 'Pending...'],
                ].map(([k, v]) => (
                  <div key={k} style={{
                    display: 'flex', justifyContent: 'space-between',
                    padding: '5px 0', borderBottom: '1px solid #21262D',
                    gap: 8
                  }}>
                    <span style={{ color: '#8B949E', whiteSpace: 'nowrap' }}>{k}</span>
                    <span style={{
                      fontFamily: 'monospace', color: '#79C0FF',
                      fontSize: 11, textAlign: 'right', overflow: 'hidden',
                      textOverflow: 'ellipsis', maxWidth: 130
                    }}>
                      {v}
                    </span>
                  </div>
                ))}

                {/* Geolocation Section */}
                {geoData.city && (
                  <>
                    <div style={{
                      color: '#C8102E', fontWeight: 700, marginTop: 12, marginBottom: 6,
                      fontSize: 12, display: 'flex', alignItems: 'center', gap: 6,
                      borderTop: '1px solid #30363D', paddingTop: 10,
                    }}>
                      📍 Physical Location
                    </div>
                    {[
                      ['City',       `${geoData.city}, ${geoData.region || ''}`],
                      ['Country',    `${geoData.country || '—'} ${geoData.countryCode === 'IN' ? '🇮🇳' : geoData.countryCode === 'US' ? '🇺🇸' : geoData.countryCode === 'CN' ? '🇨🇳' : geoData.countryCode === 'RU' ? '🇷🇺' : '🌍'}`],
                      ['ISP',        geoData.isp || '—'],
                      ['Org',        geoData.org || '—'],
                      ['Coords',     geoData.lat ? `${geoData.lat.toFixed(4)}, ${geoData.lon.toFixed(4)}` : '—'],
                    ].map(([k, v]) => (
                      <div key={k} style={{
                        display: 'flex', justifyContent: 'space-between',
                        padding: '4px 0', borderBottom: '1px solid #21262D',
                        gap: 8
                      }}>
                        <span style={{ color: '#8B949E', whiteSpace: 'nowrap' }}>{k}</span>
                        <span style={{
                          fontFamily: 'monospace', color: '#F0883E',
                          fontSize: 11, textAlign: 'right', overflow: 'hidden',
                          textOverflow: 'ellipsis', maxWidth: 130
                        }}>
                          {v}
                        </span>
                      </div>
                    ))}
                    {geoData.is_demo && (
                      <div style={{ fontSize: 10, color: '#484F58', marginTop: 6, fontStyle: 'italic' }}>
                        ⚡ Demo mode — using simulated IP geolocation
                      </div>
                    )}
                  </>
                )}

                {/* Device fingerprint section */}
                <div style={{
                  color: '#8B949E', fontWeight: 600, marginTop: 10, marginBottom: 6,
                  fontSize: 11, borderTop: '1px solid #30363D', paddingTop: 8,
                }}>
                  🖥️ Device Profile
                </div>
                {[
                  ['Timezone',    deviceProfile.timezone || '—'],
                  ['Screen',      deviceProfile.screen || '—'],
                  ['Cores / RAM', `${deviceProfile.cores || '?'} cores / ${deviceProfile.memory || '?'} GB`],
                  ['Language',    deviceProfile.language || '—'],
                ].map(([k, v]) => (
                  <div key={k} style={{
                    display: 'flex', justifyContent: 'space-between',
                    padding: '4px 0', borderBottom: '1px solid #21262D',
                    gap: 8
                  }}>
                    <span style={{ color: '#8B949E', whiteSpace: 'nowrap' }}>{k}</span>
                    <span style={{
                      fontFamily: 'monospace', color: '#79C0FF',
                      fontSize: 11, textAlign: 'right', overflow: 'hidden',
                      textOverflow: 'ellipsis', maxWidth: 130
                    }}>
                      {v}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <DossierButton
              sessionId={selectedId}
              hasEvents={sessionEvents.length > 0}
            />
          </div>

          {/* Right panel: Event Feed */}
          <EventFeed events={wsEvents} flashCritical={flashCritical} />
        </div>

        {/* Bottom row: Session List + Infra Map */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '300px 1fr',
          gap: 20
        }}>
          <SessionList
            sessions={sessions}
            selectedId={selectedId}
            onSelect={(id) => {
              setSelectedId(id)
              axios.get(`${API}/api/session/${id}`)
                .then(r => setSessionDetail(r.data))
                .catch(() => {})
            }}
          />
          <InfraMap score={displayScore} />
        </div>
      </main>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&family=JetBrains+Mono&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: #0D1117; }
        ::-webkit-scrollbar-thumb { background: #30363D; border-radius: 3px; }
        @keyframes aptPulse { 0%,100% { opacity:1; } 50% { opacity:0.5; } }
        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
      `}</style>
    </div>
  )
}
