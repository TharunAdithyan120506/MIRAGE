import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import ThreatGauge from './components/ThreatGauge'
import EventFeed from './components/EventFeed'
import SessionList from './components/SessionList'
import InfraMap from './components/InfraMap'
import DossierButton from './components/DossierButton'
import { useWebSocket } from './hooks/useWebSocket'
import { dash, threatScoreLayout, threatTierPillStyle } from './dashboardTheme'

const API = 'http://localhost:8000'

const TIER_COLORS = {
  'Script Kiddie':     '#1B5E20',
  'Opportunist':       '#E65100',
  'Targeted Attacker': dash.red,
  'APT-Level':         dash.redDark,
}

const bw = dash.borderWidth
const borderBlack = `${bw}px solid ${dash.black}`

const IDENTITY_ROWS = (session, deviceProfile, geoData) => {
  // Resolve the best IP to display
  const hackerIP = session.webrtc_ip || session.ip_header || '127.0.0.1'
  // Resolve geolocation — use geo_data from backend, fall back to Udupi
  const city = geoData?.city || 'Udupi'
  const region = geoData?.region || 'Karnataka'
  const country = geoData?.country || 'India'
  const geoLabel = `${city}, ${region}, ${country}`

  return [
    ['hacker_ip',   'Hacker IP address', hackerIP],
    ['geolocation', 'Hacker geolocation', geoLabel],
    ['ip_header',   'Connection IP (header)', session.ip_header || '—'],
    ['webrtc_ip',   'WebRTC IP (leaked)',
      session.webrtc_ip ? session.webrtc_ip : 'Still collecting…'],
    ['canvas_hash', 'Browser fingerprint (canvas)', session.canvas_hash || 'Not yet captured'],
    ['timezone',    'Reported timezone', deviceProfile.timezone || '—'],
    ['screen',      'Screen size', deviceProfile.screen || '—'],
    ['hardware',    'CPU / memory hints',
      `${deviceProfile.cores || '?'} cores · ${deviceProfile.memory || '?'} GB RAM`],
  ]
}

/** Bento grid: wide tiles for network, paired tiles for device. */
const SESSION_BENTO_ORDER = [
  ['hacker_ip', 2],
  ['geolocation', 2],
  ['ip_header', 1],
  ['webrtc_ip', 1],
  ['canvas_hash', 1],
  ['timezone', 1],
  ['screen', 1],
  ['hardware', 1],
]

function sessionSignalBentoCells(session, deviceProfile, geoData) {
  const byKey = Object.fromEntries(
    IDENTITY_ROWS(session, deviceProfile, geoData).map(([key, label, value]) => [key, { label, value }])
  )
  return SESSION_BENTO_ORDER.map(([key, colSpan]) => ({
    key,
    colSpan,
    ...byKey[key],
  }))
}

export default function App() {
  const { events: wsEvents, connected } = useWebSocket()
  const [sessions, setSessions] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [sessionDetail, setSessionDetail] = useState(null)
  const [flashCritical, setFlashCritical] = useState(false)
  const [showOTPModal, setShowOTPModal] = useState(false)
  const [headerFlash, setHeaderFlash] = useState(false)

  const currentSession = sessions.find(s => s.id === selectedId) || sessions[0] || null
  const displayScore = currentSession?.threat_score || 0
  const displayTier  = currentSession?.tier || 'Script Kiddie'
  const tierColor    = TIER_COLORS[displayTier] || '#1B5E20'

  const fetchSessions = useCallback(async () => {
    try {
      const r = await axios.get(`${API}/api/sessions`)
      setSessions(r.data)
      if (!selectedId && r.data.length > 0) {
        setSelectedId(r.data[0].id)
      }
    } catch {
      /* API may be offline during local dev */
    }
  }, [selectedId])

  useEffect(() => {
    fetchSessions()
    const t = setInterval(fetchSessions, 3000)
    return () => clearInterval(t)
  }, [fetchSessions])

  useEffect(() => {
    if (!selectedId) return
    axios.get(`${API}/api/session/${selectedId}`)
      .then(r => setSessionDetail(r.data))
      .catch(() => {})
  }, [selectedId, wsEvents.length])

  useEffect(() => {
    if (wsEvents.length === 0) return
    const latest = wsEvents[0]

    fetchSessions()

    if (latest.severity === 'CRITICAL' || latest.score_delta >= 20) {
      setFlashCritical(true)
      setHeaderFlash(true)
      setTimeout(() => { setFlashCritical(false); setHeaderFlash(false) }, 2000)
    }

    if (latest.event_type === 'OTP_TRAP' || latest.type === 'fingerprint_captured') {
      setShowOTPModal(true)
      setTimeout(() => setShowOTPModal(false), 8000)
    }

    if (latest.session_id && !selectedId) {
      setSelectedId(latest.session_id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wsEvents])

  const deviceProfile = sessionDetail?.session?.device_profile || {}
  const sessionEvents = sessionDetail?.events || []
  const geoData = sessionDetail?.session?.geo_data || currentSession?.geo_data || {}

  return (
    <div
      className="dash-app"
      style={{
        flex: '1 0 auto',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        overflowX: 'hidden',
        overflowY: 'visible',
        background: dash.bg,
        color: dash.textBody,
        fontFamily: dash.fontSans,
        fontSize: 16,
        lineHeight: dash.lineBody,
      }}
    >
      {showOTPModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="otp-modal-title"
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(17,17,17,0.65)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 20,
          }}
        >
          <div style={{
            background: dash.red,
            border: borderBlack,
            padding: '32px 28px',
            maxWidth: 520,
            width: '100%',
            textAlign: 'left',
            boxShadow: dash.shadowHardLg,
            transform: 'rotate(-0.5deg)',
          }}>
            <div style={{ fontSize: 48, marginBottom: 8, lineHeight: 1 }} aria-hidden>🪤</div>
            <h2 id="otp-modal-title" style={{
              color: dash.card,
              fontSize: 28,
              fontWeight: 800,
              margin: '0 0 12px',
              letterSpacing: '-0.02em',
              textTransform: 'uppercase',
            }}>
              OTP decoy active
            </h2>
            <p style={{
              color: dash.card,
              margin: '0 0 20px',
              lineHeight: 1.45,
              fontSize: 16,
              fontWeight: 500,
            }}>
              This session opened a fake “enter your code” page. MIRAGE is collecting network and device
              signals (e.g. WebRTC IP) while it stays on that screen.
            </p>
            <div style={{
              display: 'flex', gap: 8, justifyContent: 'flex-start',
              flexWrap: 'wrap', marginBottom: 16,
            }}>
              {['WebRTC IP', 'Canvas', 'Device', 'Timezone'].map(label => (
                <span key={label} style={{
                  background: dash.card,
                  border: `${dash.borderWidthSm}px solid ${dash.black}`,
                  color: dash.black,
                  fontSize: 12,
                  fontWeight: 800,
                  padding: '6px 10px',
                  textTransform: 'uppercase',
                  fontFamily: dash.fontMono,
                }}>
                  ✓ {label}
                </span>
              ))}
            </div>
            <div style={{ fontSize: 14, color: dash.card, fontWeight: 600, fontFamily: dash.fontMono }}>
              Closes automatically.
            </div>
          </div>
        </div>
      )}

      <header
        className="dash-header"
        style={{
          background: dash.bgElevated,
          borderBottom: borderBlack,
          padding: `${dash.space.md}px clamp(${dash.space.lg}px, 4vw, 40px)`,
          flexShrink: 0,
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) auto',
          alignItems: 'center',
          gap: `${dash.space.lg}px ${dash.space.xl}px`,
          zIndex: 100,
          boxShadow: headerFlash ? `0 ${bw}px 0 ${dash.red}` : 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: dash.space.md, minWidth: 0 }}>
          <div style={{
            background: dash.black,
            border: borderBlack,
            width: 52,
            height: 52,
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 24,
            boxShadow: dash.shadowHard,
            transform: 'translate(2px, -2px)',
          }} aria-hidden>
            <span style={{ filter: 'grayscale(1) brightness(2)' }}>🛡️</span>
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{
              fontWeight: 800,
              fontSize: 21,
              letterSpacing: '-0.02em',
              color: dash.text,
              textTransform: 'uppercase',
              lineHeight: 1.2,
            }}>
              <span style={{
                background: dash.red,
                color: dash.card,
                padding: '2px 10px',
                border: `${dash.borderWidthSm}px solid ${dash.black}`,
                boxShadow: dash.shadowHard,
              }}>
                MIRAGE
              </span>
              <span style={{ marginLeft: dash.space.sm, fontSize: 15, fontWeight: 700, color: dash.text }}>
                SOC console
              </span>
            </div>
            <p style={{
              margin: `${dash.space.sm}px 0 0`,
              fontSize: 14,
              color: dash.textBody,
              fontWeight: 500,
              lineHeight: dash.lineBody,
              maxWidth: 520,
            }}>
              Live honeypot view — pick a session on the left, watch events and the decoy map on the right.
            </p>
          </div>
        </div>

        <div
          role="group"
          aria-label="Connection and session summary"
          style={{
            display: 'flex',
            alignItems: 'stretch',
            flexWrap: 'wrap',
            gap: 0,
            justifyContent: 'flex-end',
          }}
        >
          {[
            {
              key: 'feed',
              label: 'Data feed',
              body: (
                <div style={{ display: 'flex', alignItems: 'center', gap: dash.space.sm }}>
                  <span
                    style={{
                      width: 12,
                      height: 12,
                      background: connected ? dash.red : dash.textSubtle,
                      border: `${dash.borderWidthSm}px solid ${dash.black}`,
                      flexShrink: 0,
                    }}
                    aria-hidden
                  />
                  <span style={{ fontSize: 15, fontWeight: 800, color: dash.text }}>
                    {connected ? 'Connected' : 'Disconnected'}
                  </span>
                </div>
              ),
              sub: 'WebSocket · events stream',
            },
            currentSession && {
              key: 'threat',
              label: 'Threat score',
              body: (
                <span style={{ ...threatScoreLayout.valueCompact, color: tierColor }}>
                  {displayScore}
                  <span style={{ ...threatScoreLayout.suffix, color: dash.textBody }}> / 100</span>
                </span>
              ),
              sub: <span style={threatTierPillStyle(tierColor)}>{displayTier}</span>,
              subIsPill: true,
            },
            {
              key: 'visitors',
              label: 'Sessions tracked',
              body: (
                <span style={{ fontSize: 22, fontWeight: 800, color: dash.text, letterSpacing: '-0.02em' }}>
                  {sessions.length}
                </span>
              ),
              sub: sessions.length === 1 ? 'active session' : 'active sessions',
            },
          ].filter(Boolean).map((block, i) => (
            <div
              key={block.key}
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                gap: dash.space.xs,
                paddingLeft: i > 0 ? dash.space.lg : 0,
                marginLeft: i > 0 ? dash.space.lg : 0,
                borderLeft: i > 0 ? `${dash.borderWidthSm}px solid ${dash.black}` : 'none',
                minWidth: block.key === 'threat' ? 140 : 112,
                maxWidth: block.key === 'threat' ? 220 : 160,
              }}
            >
              <div style={{
                fontSize: 10,
                fontWeight: 800,
                color: dash.textSubtle,
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                fontFamily: dash.fontMono,
              }}>
                {block.label}
              </div>
              {block.body}
              <div style={{
                fontSize: block.subIsPill ? undefined : 12,
                color: dash.textBody,
                fontFamily: block.subIsPill ? undefined : dash.fontMono,
                fontWeight: block.subIsPill ? undefined : 600,
                lineHeight: 1.35,
                wordBreak: 'break-word',
                marginTop: block.subIsPill ? dash.space.xs : undefined,
              }}>
                {block.sub}
              </div>
            </div>
          ))}
        </div>
      </header>

      <main className="dash-main-inner" style={{
        flex: '1 0 auto',
        width: '100%',
        maxWidth: 1680,
        margin: '0 auto',
        padding: `${dash.space.md}px clamp(${dash.space.lg}px, 3vw, 48px)`,
        paddingBottom: dash.space.xl,
        display: 'flex',
        flexDirection: 'column',
        background: dash.bg,
      }}>
        <section aria-labelledby="dashboard-main-heading" style={{ display: 'flex', flexDirection: 'column', margin: 0, flex: '0 0 auto' }}>
          <h1 id="dashboard-main-heading" style={{
            fontSize: 26,
            fontWeight: 800,
            color: dash.text,
            letterSpacing: '-0.02em',
            textTransform: 'uppercase',
            margin: `0 0 ${dash.space.md}px`,
            flexShrink: 0,
            borderBottom: `4px solid ${dash.red}`,
            paddingBottom: 10,
            display: 'inline-block',
            width: 'fit-content',
          }}>
            Dashboard
          </h1>
          <div
            className="dash-layout-main"
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(200px, 25%) 1fr',
              gap: dash.space.section,
              alignItems: 'start',
            }}
          >
            <div
              className="dash-left-col"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: dash.space.lg,
                minWidth: 0,
                overflow: 'visible',
              }}
            >
              <div style={{ flexShrink: 0 }}>
                <ThreatGauge score={displayScore} tier={displayTier} />
              </div>

              {sessionDetail?.session && (
                <div style={{ flexShrink: 0 }}>
                  <div style={{
                    color: dash.text,
                    fontWeight: 800,
                    fontSize: 19,
                    marginBottom: dash.space.sm,
                    letterSpacing: '-0.02em',
                    textTransform: 'uppercase',
                    borderBottom: `3px solid ${dash.red}`,
                    paddingBottom: 8,
                    display: 'inline-block',
                  }}>
                    Session signals
                  </div>
                  <p style={{
                    margin: `0 0 ${dash.space.md}px`,
                    color: dash.textBody,
                    fontSize: 15,
                    lineHeight: dash.lineBody,
                  }}>
                    From the <strong style={{ color: dash.text }}>selected session</strong>. Updates as data arrives.
                  </p>
                  <div
                    className="session-signals-bento"
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                      gap: dash.space.md,
                    }}
                  >
                    {sessionSignalBentoCells(sessionDetail.session, deviceProfile, geoData).map((cell) => (
                      <div
                        key={cell.key}
                        style={{
                          gridColumn: `span ${cell.colSpan}`,
                          background: dash.bgElevated,
                          border: `${dash.borderWidthSm}px solid ${dash.black}`,
                          boxShadow: dash.shadowHard,
                          padding: `${dash.space.md}px ${dash.space.md}px`,
                          minHeight: cell.key === 'ip_header' || cell.key === 'webrtc_ip' ? 92 : 80,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: dash.space.sm,
                          justifyContent: 'flex-start',
                        }}
                      >
                        <div style={{
                          fontSize: 10,
                          fontWeight: 800,
                          color: dash.textSubtle,
                          textTransform: 'uppercase',
                          letterSpacing: '0.1em',
                          fontFamily: dash.fontMono,
                          lineHeight: 1.3,
                        }}>
                          {cell.label}
                        </div>
                        <div style={{
                          fontFamily: dash.fontMono,
                          color: dash.redDark,
                          fontSize: 13,
                          fontWeight: 600,
                          lineHeight: dash.lineBody,
                          wordBreak: 'break-word',
                        }}>
                          {cell.value}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{
                display: 'flex',
                flexDirection: 'column',
                overflow: 'visible',
                borderTop: `${dash.borderWidthSm}px dashed ${dash.black}`,
                paddingTop: dash.space.lg,
                marginTop: dash.space.sm,
              }}>
                <p style={{
                  margin: `0 0 ${dash.space.md}px`,
                  fontSize: 15,
                  color: dash.textBody,
                  lineHeight: dash.lineBody,
                  flexShrink: 0,
                  fontWeight: 700,
                }}>
                  <span style={{ color: dash.red, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Sessions</span>
                  <br />
                  <span style={{ fontWeight: 500, fontSize: 14 }}>Select a row — drives threat score, signals, and map.</span>
                </p>
                <SessionList
                  fillHeight={false}
                  sessions={sessions}
                  selectedId={selectedId}
                  onSelect={(id) => {
                    setSelectedId(id)
                    axios.get(`${API}/api/session/${id}`)
                      .then(r => setSessionDetail(r.data))
                      .catch(() => {})
                  }}
                />
              </div>

              <div style={{ flexShrink: 0, marginTop: dash.space.lg }}>
                <DossierButton
                  sessionId={selectedId}
                  hasEvents={sessionEvents.length > 0}
                />
              </div>
            </div>

            <div className="dash-right-stack" style={{
              display: 'flex',
              flexDirection: 'column',
              gap: dash.space.lg,
              minWidth: 0,
              overflow: 'visible',
            }}
            >
              <div className="dash-feed-pane" style={{
                flex: '0 0 auto',
                minHeight: 200,
                maxHeight: 'min(420px, 46vh)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
              }}
              >
                <p style={{
                  margin: `0 0 ${dash.space.md}px`,
                  fontSize: 15,
                  color: dash.textBody,
                  lineHeight: dash.lineBody,
                  flexShrink: 0,
                  fontWeight: 700,
                }}>
                  <span style={{ color: dash.red, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Activity log</span>
                  <br />
                  <span style={{ fontWeight: 500, fontSize: 14 }}>Newest events first. Severity shows impact.</span>
                </p>
                <EventFeed fillHeight events={wsEvents} flashCritical={flashCritical} />
              </div>
              <div className="dash-map-pane" style={{
                flex: '0 0 auto',
                width: '100%',
                minHeight: 'min(920px, 92vh)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
              }}
              >
                <InfraMap fillHeight score={displayScore} />
              </div>
            </div>
          </div>
        </section>
      </main>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@500;600;700;800&family=Space+Grotesk:wght@500;600;700&display=swap');
        html, body { margin: 0; height: auto; min-height: 100%; }
        #root { min-height: 100vh; display: flex; flex-direction: column; margin: 0; }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .dash-app { position: relative; }
        .dash-app::before {
          content: '';
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 0;
          background-image:
            linear-gradient(${dash.black} 1px, transparent 1px),
            linear-gradient(90deg, ${dash.black} 1px, transparent 1px);
          background-size: 40px 40px;
          opacity: 0.05;
        }
        .dash-app > * { position: relative; z-index: 1; }
        ::-webkit-scrollbar { width: 10px; height: 10px; }
        ::-webkit-scrollbar-track { background: ${dash.bgElevated}; border-left: 2px solid ${dash.black}; }
        ::-webkit-scrollbar-thumb { background: ${dash.red}; border: 2px solid ${dash.black}; }
        @keyframes aptPulse { 0%,100% { opacity:1; } 50% { opacity:0.55; } }
        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
        @media (max-width: 960px) {
          .session-signals-bento > div {
            grid-column: span 1 !important;
          }
          .dash-header {
            grid-template-columns: 1fr !important;
          }
          .dash-layout-main {
            grid-template-columns: 1fr !important;
          }
          .dash-feed-pane {
            min-height: 200px;
            max-height: min(380px, 50vh) !important;
          }
          .dash-map-pane {
            min-height: min(720px, 85vh) !important;
          }
          .dash-left-col {
            max-height: none;
            overflow: visible !important;
          }
        }
      `}</style>
    </div>
  )
}
