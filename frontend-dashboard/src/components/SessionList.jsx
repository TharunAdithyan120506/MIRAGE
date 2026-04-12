import { dash } from '../dashboardTheme'

const TIER_COLORS = {
  'Script Kiddie':     '#1B5E20',
  'Opportunist':       '#E65100',
  'Targeted Attacker': dash.red,
  'APT-Level':         dash.redDark,
}

const bw = dash.borderWidth
const borderBlack = `${bw}px solid ${dash.black}`

function formatTime(ts) {
  if (!ts) return '—'
  const d = new Date(ts)
  // Show as HH:MM:SS in local time
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  const ss = String(d.getSeconds()).padStart(2, '0')
  // If it was today, just show time; otherwise show date + time
  const now = new Date()
  const isToday = d.toDateString() === now.toDateString()
  if (isToday) {
    return `${hh}:${mm}:${ss}`
  }
  const dd = String(d.getDate()).padStart(2, '0')
  const mon = String(d.getMonth() + 1).padStart(2, '0')
  return `${dd}/${mon} ${hh}:${mm}:${ss}`
}

export default function SessionList({ sessions, selectedId, onSelect, fillHeight }) {
  const fill = fillHeight
    ? { flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }
    : {}

  if (!sessions.length) return (
    <div style={{
      background: dash.card,
      border: borderBlack,
      borderRadius: dash.radius,
      padding: 22,
      color: dash.textBody,
      fontSize: 16,
      textAlign: 'center',
      boxShadow: dash.shadowHard,
      width: '100%',
      justifyContent: fillHeight ? 'center' : undefined,
      ...fill,
    }}>
      <div style={{ fontSize: 40, marginBottom: dash.space.md }} aria-hidden>👤</div>
      <div style={{
        fontWeight: 800,
        color: dash.text,
        marginBottom: dash.space.sm,
        textTransform: 'uppercase',
      }}>No sessions yet</div>
      <div style={{
        fontSize: 15,
        lineHeight: dash.lineBody,
        maxWidth: 300,
        margin: '0 auto',
      }}>
        Decoy hits show up here — click to inspect.
      </div>
    </div>
  )

  return (
    <div style={{
      background: dash.card,
      border: borderBlack,
      borderRadius: dash.radius,
      overflow: 'hidden',
      boxShadow: dash.shadowHard,
      width: '100%',
      ...fill,
    }}>
      <div style={{
        padding: `${dash.space.md}px ${dash.space.lg}px`,
        borderBottom: borderBlack,
        background: dash.bgElevated,
        display: 'flex',
        alignItems: 'center',
        gap: dash.space.sm,
        flexShrink: 0,
      }}>
        <span style={{ fontSize: 20 }} aria-hidden>👥</span>
        <div style={{ minWidth: 0 }}>
          <div style={{
            color: dash.text,
            fontWeight: 800,
            fontSize: 18,
            letterSpacing: '-0.02em',
            textTransform: 'uppercase',
          }}>
            Sessions
          </div>
          <div style={{
            fontSize: 13,
            color: dash.textBody,
            marginTop: dash.space.xs,
            fontFamily: dash.fontMono,
            fontWeight: 600,
            lineHeight: dash.lineBody,
          }}>
            Select session · {sessions.length} total
          </div>
        </div>
      </div>

      <ul style={{
        listStyle: 'none',
        margin: 0,
        padding: 0,
        flex: fillHeight ? 1 : undefined,
        minHeight: fillHeight ? 0 : undefined,
        overflowY: fillHeight ? 'auto' : undefined,
      }}
      >
        {sessions.map((sess) => {
          const tierColor = TIER_COLORS[sess.tier] || '#1B5E20'
          const isSelected = sess.id === selectedId

          return (
            <li key={sess.id}>
              <div
                role="button"
                tabIndex={0}
                aria-selected={isSelected}
                aria-label={`Session ${sess.id?.slice(0, 8)}, threat ${sess.threat_score}, ${sess.tier}`}
                onClick={() => onSelect(sess.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    onSelect(sess.id)
                  }
                }}
                className="session-row-brut"
                style={{
                  padding: `${dash.space.md}px ${dash.space.lg}px`,
                  borderBottom: `${dash.borderWidthSm}px dashed ${dash.black}`,
                  cursor: 'pointer',
                  background: isSelected ? dash.red : 'transparent',
                  color: isSelected ? dash.card : dash.textBody,
                  borderLeft: isSelected ? `${bw}px solid ${dash.black}` : `${bw}px solid transparent`,
                  outline: 'none',
                  boxShadow: isSelected ? 'none' : undefined,
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: dash.space.sm,
                  marginBottom: dash.space.sm,
                  flexWrap: 'wrap',
                }}>
                  <span style={{
                    fontSize: 10,
                    fontWeight: 800,
                    color: isSelected ? dash.card : dash.text,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    fontFamily: dash.fontMono,
                  }}>
                    Session
                  </span>
                  <code style={{
                    color: isSelected ? dash.black : dash.redDark,
                    fontSize: 11,
                    background: isSelected ? dash.card : dash.bgElevated,
                    padding: '4px 8px',
                    borderRadius: dash.radius,
                    fontFamily: dash.fontMono,
                    border: `${dash.borderWidthSm}px solid ${dash.black}`,
                    fontWeight: 700,
                  }}>
                    {sess.id?.slice(0, 8)}…
                  </code>
                  <span style={{
                    marginLeft: 'auto',
                    background: isSelected ? dash.card : dash.bgElevated,
                    color: isSelected ? tierColor : tierColor,
                    border: `${dash.borderWidthSm}px solid ${dash.black}`,
                    fontSize: 10,
                    fontWeight: 800,
                    padding: '5px 10px',
                    textTransform: 'uppercase',
                    fontFamily: dash.fontMono,
                  }}>
                    {sess.tier}
                  </span>
                </div>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  gap: dash.space.md,
                  fontSize: 14,
                  marginTop: dash.space.xs,
                }}>
                  <div>
                    <div style={{
                      fontSize: 10,
                      fontWeight: 800,
                      color: isSelected ? dash.card : dash.textSubtle,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      marginBottom: 2,
                      fontFamily: dash.fontMono,
                    }}>
                      IP
                    </div>
                    <span style={{
                      fontFamily: dash.fontMono,
                      color: isSelected ? dash.card : dash.text,
                      fontWeight: 700,
                    }}>
                      {sess.webrtc_ip || sess.ip_header || 'Unknown'}
                    </span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{
                      fontSize: 10,
                      fontWeight: 800,
                      color: isSelected ? dash.card : dash.textSubtle,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      marginBottom: 2,
                      fontFamily: dash.fontMono,
                    }}>
                      Score
                    </div>
                    <span style={{
                      color: isSelected ? dash.card : tierColor,
                      fontWeight: 800,
                      fontSize: 18,
                      letterSpacing: '-0.02em',
                      fontFamily: dash.fontSans,
                    }}>
                      {sess.threat_score}
                      <span style={{
                        color: isSelected ? dash.card : dash.textBody,
                        fontWeight: 700,
                        fontSize: 13,
                      }}> /100</span>
                    </span>
                  </div>
                </div>

                <div style={{
                  fontSize: 12,
                  color: isSelected ? dash.card : dash.textSubtle,
                  marginTop: dash.space.md,
                  lineHeight: dash.lineBody,
                  fontFamily: dash.fontMono,
                  fontWeight: 600,
                }}>
                  Started {formatTime(sess.started_at)} · Last {formatTime(sess.last_seen)}
                </div>
              </div>
            </li>
          )
        })}
      </ul>

      <style>{`
        .session-row-brut:focus-visible {
          outline: ${bw}px solid ${dash.black};
          outline-offset: 2px;
        }
        .session-row-brut:not([aria-selected="true"]):hover {
          background: ${dash.bgElevated};
          box-shadow: inset 4px 0 0 ${dash.red};
        }
      `}</style>
    </div>
  )
}
