import { useRef, useEffect } from 'react'
import { dash, EVENT_TYPE_LABELS } from '../dashboardTheme'

const SEVERITY_COLORS = {
  CRITICAL: { bg: dash.card, text: dash.redDark, border: dash.black },
  HIGH:     { bg: dash.bgElevated, text: dash.red, border: dash.black },
  MEDIUM:   { bg: dash.card, text: '#E65100', border: dash.black },
  LOW:      { bg: dash.bgElevated, text: '#1B5E20', border: dash.black },
}

const EVENT_ICONS = {
  PATH_PROBE:        '🔍',
  LOGIN_ATTEMPT:     '🔑',
  HONEYTOKEN_ACCESS: '🍯',
  OTP_TRAP:          '🪤',
  TELEMETRY:         '📡',
  fingerprint_captured: '🕵️',
}

const bw = dash.borderWidth
const borderBlack = `${bw}px solid ${dash.black}`

function timeAgo(ts) {
  if (!ts) return ''
  const diff = Math.floor((Date.now() - new Date(ts).getTime()) / 1000)
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff/60)}m ago`
  return `${Math.floor(diff/3600)}h ago`
}

function humanEventType(type) {
  const raw = type || ''
  return EVENT_TYPE_LABELS[raw] || raw.replace(/_/g, ' ').toLowerCase() || 'Event'
}

export default function EventFeed({ events, flashCritical, fillHeight }) {
  const feedRef = useRef(null)

  useEffect(() => {
    if (feedRef.current) feedRef.current.scrollTop = 0
  }, [events.length])

  const fill = fillHeight
    ? { flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }
    : {}

  if (!events.length) return (
    <div style={{
      background: dash.card,
      border: borderBlack,
      borderRadius: dash.radius,
      padding: dash.space.xl,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: fillHeight ? 0 : 180,
      flex: fillHeight ? 1 : undefined,
      width: '100%',
      color: dash.textBody,
      fontSize: 16,
      boxShadow: dash.shadowHard,
      ...fill,
    }}>
      <div style={{ fontSize: 44, marginBottom: dash.space.md }} aria-hidden>📡</div>
      <div style={{
        fontWeight: 800,
        color: dash.text,
        marginBottom: dash.space.sm,
        textTransform: 'uppercase',
      }}>No activity</div>
      <div style={{
        fontSize: 15,
        textAlign: 'center',
        maxWidth: 320,
        lineHeight: dash.lineBody,
      }}>
        Honeypot events stream here live — no refresh.
      </div>
    </div>
  )

  return (
    <div
      role="feed"
      aria-label="Live security events, newest first"
      style={{
        background: dash.card,
        border: borderBlack,
        borderRadius: dash.radius,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: dash.shadowHard,
        animation: flashCritical ? 'criticalFlash 0.45s steps(2, end) 4' : 'none',
        width: '100%',
        ...fill,
      }}
    >
      <div style={{
        padding: `${dash.space.md}px ${dash.space.lg}px`,
        borderBottom: borderBlack,
        display: 'flex',
        alignItems: 'center',
        gap: dash.space.md,
        background: dash.bgElevated,
        flexShrink: 0,
      }}>
        <span style={{ fontSize: 20 }} aria-hidden>📡</span>
        <div style={{ minWidth: 0 }}>
          <div style={{
            color: dash.text,
            fontWeight: 800,
            fontSize: 18,
            letterSpacing: '-0.02em',
            textTransform: 'uppercase',
          }}>
            Live activity
          </div>
          <div style={{
            fontSize: 13,
            color: dash.textBody,
            marginTop: dash.space.xs,
            fontFamily: dash.fontMono,
            fontWeight: 600,
            lineHeight: dash.lineBody,
          }}>
            {events.length} event{events.length !== 1 ? 's' : ''} · newest top
          </div>
        </div>
        <span style={{
          marginLeft: 'auto',
          flexShrink: 0,
          background: dash.red,
          color: dash.card,
          border: `${dash.borderWidthSm}px solid ${dash.black}`,
          fontSize: 11,
          fontWeight: 800,
          padding: `${dash.space.sm}px ${dash.space.md}px`,
          textTransform: 'uppercase',
          fontFamily: dash.fontMono,
          boxShadow: dash.shadowHard,
        }}>
          Stream
        </span>
      </div>

      <div ref={feedRef} style={{
        flex: fillHeight ? 1 : undefined,
        minHeight: fillHeight ? 0 : undefined,
        maxHeight: fillHeight ? undefined : 340,
        overflowY: 'auto',
        padding: 0,
      }}
      >
        {events.map((ev, i) => {
          const sev = SEVERITY_COLORS[ev.severity] || SEVERITY_COLORS.LOW
          const isCritical = ev.severity === 'CRITICAL'
          const icon = EVENT_ICONS[ev.type || ev.event_type] || '⚡'
          const rawType = ev.event_type || ev.type || ''
          const friendlyType = humanEventType(rawType)

          return (
            <div key={i} style={{
              padding: `${dash.space.md}px ${dash.space.lg}px`,
              borderBottom: `${dash.borderWidthSm}px dashed ${dash.black}`,
              display: 'flex',
              alignItems: 'flex-start',
              gap: dash.space.md,
              background: isCritical ? dash.red : 'transparent',
              color: isCritical ? dash.card : undefined,
              borderLeft: isCritical ? `${bw}px solid ${dash.black}` : `${bw}px solid transparent`,
            }}>
              <span style={{ fontSize: 20, marginTop: 2 }} aria-hidden>{icon}</span>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: dash.space.sm,
                  marginBottom: dash.space.sm,
                  flexWrap: 'wrap',
                }}>
                  <span style={{
                    background: isCritical ? dash.card : sev.bg,
                    color: isCritical ? dash.redDark : sev.text,
                    border: `${dash.borderWidthSm}px solid ${dash.black}`,
                    fontSize: 10,
                    fontWeight: 800,
                    padding: '4px 8px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    fontFamily: dash.fontMono,
                  }}>
                    {ev.severity}
                  </span>
                  <span style={{
                    color: isCritical ? dash.card : dash.text,
                    fontSize: 15,
                    fontWeight: 700,
                  }}>
                    {friendlyType}
                  </span>
                  {rawType && rawType !== friendlyType && (
                    <span style={{
                      color: isCritical ? dash.card : dash.textSubtle,
                      fontSize: 11,
                      fontFamily: dash.fontMono,
                    }}>
                      ({rawType})
                    </span>
                  )}
                  {ev.score_delta > 0 && (
                    <span style={{
                      color: isCritical ? dash.card : sev.text,
                      fontWeight: 800,
                      fontSize: 13,
                      marginLeft: 'auto',
                      fontFamily: dash.fontMono,
                    }}>
                      +{ev.score_delta}
                    </span>
                  )}
                </div>

                <div style={{
                  display: 'flex',
                  gap: dash.space.sm,
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  marginTop: dash.space.xs,
                }}>
                  {ev.path && (
                    <code style={{
                      color: isCritical ? dash.black : dash.redDark,
                      background: isCritical ? dash.card : dash.bgElevated,
                      padding: '4px 8px',
                      borderRadius: dash.radius,
                      fontSize: 12,
                      fontFamily: dash.fontMono,
                      border: `${dash.borderWidthSm}px solid ${dash.black}`,
                      fontWeight: 600,
                    }}>
                      {ev.path}
                    </code>
                  )}
                  {ev.webrtc_ip && (
                    <span style={{
                      fontSize: 13,
                      color: isCritical ? dash.card : dash.red,
                      fontWeight: 700,
                      fontFamily: dash.fontMono,
                    }}>
                      WebRTC {ev.webrtc_ip}
                    </span>
                  )}
                </div>

                {ev.mitre_technique && (
                  <span style={{
                    fontSize: 12,
                    color: isCritical ? dash.card : dash.textBody,
                    fontFamily: dash.fontMono,
                    marginTop: dash.space.sm,
                    display: 'block',
                    fontWeight: 600,
                  }}>
                    {`MITRE ATT&CK: ${ev.mitre_technique}`}
                  </span>
                )}
              </div>

              <time style={{
                color: isCritical ? dash.card : dash.textSubtle,
                fontSize: 11,
                whiteSpace: 'nowrap',
                marginTop: 4,
                fontWeight: 700,
                fontFamily: dash.fontMono,
              }}>
                {timeAgo(ev.timestamp)}
              </time>
            </div>
          )
        })}
      </div>

      <style>{`
        @keyframes criticalFlash {
          0%, 100% { box-shadow: 6px 6px 0 #111; border-color: #111; }
          50%      { box-shadow: -6px 6px 0 #111; border-color: ${dash.red}; }
        }
      `}</style>
    </div>
  )
}
