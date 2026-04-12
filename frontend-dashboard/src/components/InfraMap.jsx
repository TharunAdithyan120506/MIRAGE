import { useMemo } from 'react'

// Node definitions that unlock as score threshold is reached
const ALL_NODES = [
  // Always visible
  { id: 'attacker',   label: '🕵️ Attacker',       x: 80,  y: 120, minScore: 0,   color: '#C8102E' },
  { id: 'honeypot',   label: '🍯 Honeypot :4000', x: 280, y: 120, minScore: 0,   color: '#D4A017' },
  { id: 'backend',    label: '⚙️ MIRAGE Engine',  x: 480, y: 120, minScore: 0,   color: '#003366' },
  // Unlocked at score 15+
  { id: 'admin',      label: '🔓 /admin Panel',    x: 200, y: 260, minScore: 15,  color: '#E05C00' },
  { id: 'phpmyadmin', label: '🗄️ /phpmyadmin',    x: 360, y: 260, minScore: 15,  color: '#E05C00' },
  // Unlocked at score 31+
  { id: 'users_db',   label: '👥 /api/users',      x: 120, y: 380, minScore: 31,  color: '#B00020' },
  { id: 'config_api', label: '🔑 /api/config',     x: 300, y: 380, minScore: 31,  color: '#B00020' },
  { id: 'env_file',   label: '📄 /files/.env',     x: 480, y: 380, minScore: 31,  color: '#B00020' },
  // Unlocked at score 61+
  { id: 'payment_gw', label: '💳 Payment Gateway', x: 680, y: 260, minScore: 61,  color: '#8B0000' },
  { id: 'internal',   label: '📋 Internal Docs',   x: 600, y: 380, minScore: 61,  color: '#8B0000' },
  // Unlocked at score 86+
  { id: 'otp_trap',   label: '🪤 OTP TRAP',        x: 280, y: 500, minScore: 86,  color: '#FF0000', pulse: true },
  { id: 'fingerprint',label: '🕵️ Fingerprinted!', x: 500, y: 500, minScore: 86,  color: '#FF4444', pulse: true },
]

const ALL_EDGES = [
  { from: 'attacker', to: 'honeypot',   minScore: 0 },
  { from: 'honeypot', to: 'backend',    minScore: 0 },
  { from: 'attacker', to: 'admin',      minScore: 15 },
  { from: 'attacker', to: 'phpmyadmin', minScore: 15 },
  { from: 'admin',    to: 'users_db',   minScore: 31 },
  { from: 'admin',    to: 'config_api', minScore: 31 },
  { from: 'admin',    to: 'env_file',   minScore: 31 },
  { from: 'admin',    to: 'payment_gw', minScore: 61 },
  { from: 'admin',    to: 'internal',   minScore: 61 },
  { from: 'attacker', to: 'otp_trap',   minScore: 86 },
  { from: 'otp_trap', to: 'fingerprint',minScore: 86 },
]

export default function InfraMap({ score }) {
  const visibleNodes = useMemo(
    () => ALL_NODES.filter(n => score >= n.minScore),
    [score]
  )
  const visibleEdges = useMemo(
    () => ALL_EDGES.filter(e => score >= e.minScore),
    [score]
  )

  const nodeMap = useMemo(() => {
    const m = {}
    ALL_NODES.forEach(n => { m[n.id] = n })
    return m
  }, [])

  return (
    <div style={{
      background: '#161B22', border: '1px solid #30363D', borderRadius: 12,
      overflow: 'hidden',
    }}>
      <div style={{
        padding: '14px 20px', borderBottom: '1px solid #30363D',
        background: '#0D1117', display: 'flex', alignItems: 'center', gap: 8
      }}>
        <span style={{ fontSize: 16 }}>🗺️</span>
        <span style={{ color: '#E6EDF3', fontWeight: 700, fontSize: 14 }}>Infrastructure Map</span>
        <span style={{
          marginLeft: 'auto', fontSize: 11, color: '#8B949E'
        }}>
          {visibleNodes.length} nodes unlocked
        </span>
      </div>

      <div style={{ padding: 16, overflowX: 'auto' }}>
        <svg width="780" height="560" style={{ display: 'block', maxWidth: '100%' }}>
          <defs>
            <marker id="arrowhead" markerWidth="8" markerHeight="6"
              refX="8" refY="3" orient="auto">
              <polygon points="0 0, 8 3, 0 6" fill="#C8102E" />
            </marker>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Background grid */}
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#21262D" strokeWidth="0.5" />
          </pattern>
          <rect width="780" height="560" fill="url(#grid)" />

          {/* Edges */}
          {visibleEdges.map((edge, i) => {
            const from = nodeMap[edge.from]
            const to = nodeMap[edge.to]
            if (!from || !to) return null
            return (
              <line key={i}
                x1={from.x + 60} y1={from.y + 20}
                x2={to.x + 60}   y2={to.y + 20}
                stroke="#C8102E" strokeWidth="1.5" strokeDasharray="6 3"
                strokeOpacity="0.6"
                markerEnd="url(#arrowhead)"
              >
                <animate attributeName="stroke-dashoffset"
                  from="0" to="-18" dur="1.5s" repeatCount="indefinite" />
              </line>
            )
          })}

          {/* Nodes */}
          {visibleNodes.map((node) => (
            <g key={node.id}
              style={{ animation: 'fadeIn 0.4s ease', cursor: 'default' }}>
              <rect
                x={node.x} y={node.y}
                width={120} height={40}
                rx={8} ry={8}
                fill={node.color + '22'}
                stroke={node.color}
                strokeWidth={node.pulse ? 2 : 1}
                filter={node.pulse ? 'url(#glow)' : undefined}
              >
                {node.pulse && (
                  <animate attributeName="stroke-opacity"
                    values="1;0.4;1" dur="1.5s" repeatCount="indefinite" />
                )}
              </rect>
              <text
                x={node.x + 60} y={node.y + 15}
                textAnchor="middle"
                fill={node.color}
                fontSize="11"
                fontFamily="Inter, Arial"
                fontWeight="600"
              >
                {node.label.slice(0, 18)}
              </text>
              <text
                x={node.x + 60} y={node.y + 30}
                textAnchor="middle"
                fill={node.color + 'AA'}
                fontSize="9"
                fontFamily="monospace"
              >
                {score >= node.minScore ? '● DISCOVERED' : `[Score ≥${node.minScore}]`}
              </text>
            </g>
          ))}

          {/* Hidden nodes (greyed out) */}
          {ALL_NODES.filter(n => score < n.minScore).map((node) => (
            <g key={`hidden-${node.id}`}>
              <rect
                x={node.x} y={node.y}
                width={120} height={40}
                rx={8} ry={8}
                fill="#21262D"
                stroke="#30363D"
                strokeWidth={1}
              />
              <text
                x={node.x + 60} y={node.y + 15}
                textAnchor="middle" fill="#484F58" fontSize="10"
                fontFamily="Inter, Arial"
              >
                [LOCKED]
              </text>
              <text
                x={node.x + 60} y={node.y + 28}
                textAnchor="middle" fill="#30363D" fontSize="9"
                fontFamily="monospace"
              >
                Score ≥{node.minScore}
              </text>
            </g>
          ))}

          <style>{`
            @keyframes fadeIn {
              from { opacity: 0; transform: scale(0.8); }
              to   { opacity: 1; transform: scale(1); }
            }
          `}</style>
        </svg>
      </div>
    </div>
  )
}
