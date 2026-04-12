const TIER_COLORS = {
  'Script Kiddie':     '#1A7A4A',
  'Opportunist':       '#E05C00',
  'Targeted Attacker': '#B00020',
  'APT-Level':         '#8B0000',
}

function timeAgo(ts) {
  if (!ts) return '—'
  const diff = Math.floor((Date.now() - new Date(ts).getTime()) / 1000)
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  return `${Math.floor(diff / 3600)}h ago`
}

export default function SessionList({ sessions, selectedId, onSelect }) {
  if (!sessions.length) return (
    <div style={{
      background: '#161B22', border: '1px solid #30363D', borderRadius: 12,
      padding: 24, color: '#8B949E', fontSize: 13, textAlign: 'center'
    }}>
      <div style={{ fontSize: 36, marginBottom: 8 }}>👤</div>
      No active honeypot sessions yet.
    </div>
  )

  return (
    <div style={{
      background: '#161B22', border: '1px solid #30363D', borderRadius: 12,
      overflow: 'hidden',
    }}>
      <div style={{
        padding: '14px 20px', borderBottom: '1px solid #30363D',
        background: '#0D1117', display: 'flex', alignItems: 'center', gap: 8
      }}>
        <span style={{ fontSize: 16 }}>👥</span>
        <span style={{ color: '#E6EDF3', fontWeight: 700, fontSize: 14 }}>Active Sessions</span>
        <span style={{
          marginLeft: 'auto', background: '#21262D', color: '#8B949E',
          fontSize: 11, padding: '2px 10px', borderRadius: 999
        }}>
          {sessions.length} session{sessions.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div style={{ maxHeight: 340, overflowY: 'auto' }}>
        {sessions.map((sess) => {
          const tierColor = TIER_COLORS[sess.tier] || '#1A7A4A'
          const isSelected = sess.id === selectedId

          return (
            <div key={sess.id} onClick={() => onSelect(sess.id)} style={{
              padding: '12px 20px', borderBottom: '1px solid #21262D',
              cursor: 'pointer', transition: 'background 0.15s',
              background: isSelected ? '#003366' + '33' : 'transparent',
              borderLeft: isSelected ? '3px solid #003366' : '3px solid transparent',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                <code style={{
                  color: '#58A6FF', fontSize: 11, background: '#0D1117',
                  padding: '1px 6px', borderRadius: 3
                }}>
                  {sess.id?.slice(0, 8)}…
                </code>
                <span style={{
                  marginLeft: 'auto',
                  background: tierColor + '22', color: tierColor,
                  border: `1px solid ${tierColor}44`,
                  fontSize: 10, fontWeight: 700, padding: '1px 8px', borderRadius: 999
                }}>
                  {sess.tier}
                </span>
              </div>

              <div style={{
                display: 'flex', justifyContent: 'space-between',
                fontSize: 11, color: '#8B949E'
              }}>
                <span style={{ fontFamily: 'monospace' }}>
                  {sess.webrtc_ip || sess.ip_header || 'Unknown IP'}
                </span>
                <span style={{ color: tierColor, fontWeight: 700, fontSize: 13 }}>
                  {sess.threat_score}
                  <span style={{ color: '#8B949E', fontWeight: 400 }}>/100</span>
                </span>
              </div>

              <div style={{ fontSize: 10, color: '#484F58', marginTop: 3 }}>
                Started {timeAgo(sess.started_at)} • Last seen {timeAgo(sess.last_seen)}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
