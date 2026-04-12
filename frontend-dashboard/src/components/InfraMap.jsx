import { useMemo } from 'react'
import { dash } from '../dashboardTheme'

const NH = 58
const GAP = 28

const NODES = [
  {
    id: 'attacker', title: 'Session', detail: 'Who hit the honeypot',
    x: 100, y: 44, w: 168, h: NH, minScore: 0, accent: dash.redDark,
  },
  {
    id: 'honeypot', title: 'Decoy front door', detail: 'Fake app · :4000',
    x: 296, y: 44, w: 168, h: NH, minScore: 0, accent: dash.red,
  },
  {
    id: 'backend', title: 'MIRAGE engine', detail: 'Collects signals',
    x: 492, y: 44, w: 168, h: NH, minScore: 0, accent: dash.black,
  },
  {
    id: 'admin', title: 'Admin panel', detail: 'URL /admin',
    x: 164, y: 44 + NH + GAP, w: 200, h: NH, minScore: 15, accent: '#E65100',
  },
  {
    id: 'phpmyadmin', title: 'phpMyAdmin bait', detail: 'URL /phpmyadmin',
    x: 396, y: 44 + NH + GAP, w: 200, h: NH, minScore: 15, accent: '#E65100',
  },
  {
    id: 'users_db', title: 'User API', detail: 'GET /api/users',
    x: 100, y: 44 + 2 * (NH + GAP), w: 168, h: NH, minScore: 31, accent: dash.red,
  },
  {
    id: 'config_api', title: 'Secrets API', detail: 'GET /api/config',
    x: 296, y: 44 + 2 * (NH + GAP), w: 168, h: NH, minScore: 31, accent: dash.red,
  },
  {
    id: 'env_file', title: 'Env file', detail: '/files/.env',
    x: 492, y: 44 + 2 * (NH + GAP), w: 168, h: NH, minScore: 31, accent: dash.redDark,
  },
  {
    id: 'payment_gw', title: 'Payment gateway', detail: 'High-value decoy',
    x: 164, y: 44 + 3 * (NH + GAP), w: 220, h: NH, minScore: 61, accent: dash.redDark,
  },
  {
    id: 'internal', title: 'Internal docs', detail: 'Sensitive decoy',
    x: 412, y: 44 + 3 * (NH + GAP), w: 220, h: NH, minScore: 61, accent: dash.redDark,
  },
  {
    id: 'otp_trap', title: 'OTP trap page', detail: 'Fake 2FA form',
    x: 164, y: 44 + 4 * (NH + GAP), w: 220, h: NH, minScore: 86, accent: dash.red, pulse: true,
  },
  {
    id: 'fingerprint', title: 'Fingerprinting', detail: 'Strong ID signals',
    x: 412, y: 44 + 4 * (NH + GAP), w: 220, h: NH, minScore: 86, accent: dash.redDark, pulse: true,
  },
]

const EDGES = [
  { from: 'attacker', to: 'honeypot', minScore: 0 },
  { from: 'honeypot', to: 'backend', minScore: 0 },
  { from: 'attacker', to: 'admin', minScore: 15 },
  { from: 'attacker', to: 'phpmyadmin', minScore: 15 },
  { from: 'admin', to: 'users_db', minScore: 31 },
  { from: 'admin', to: 'config_api', minScore: 31 },
  { from: 'admin', to: 'env_file', minScore: 31 },
  { from: 'admin', to: 'payment_gw', minScore: 61 },
  { from: 'admin', to: 'internal', minScore: 61 },
  { from: 'attacker', to: 'otp_trap', minScore: 86 },
  { from: 'otp_trap', to: 'fingerprint', minScore: 86 },
]

const THRESHOLDS = [0, 15, 31, 61, 86]
const VB_W = 780
const VB_H = 44 + 5 * NH + 4 * GAP + 32

const bw = dash.borderWidth
const borderBlack = `${bw}px solid ${dash.black}`

function anchor(n, side) {
  const cx = n.x + n.w / 2
  if (side === 'bottom') return { x: cx, y: n.y + n.h }
  if (side === 'top') return { x: cx, y: n.y }
  return { x: cx, y: n.y + n.h / 2 }
}

function edgePath(from, to) {
  const a = anchor(from, 'bottom')
  const b = anchor(to, 'top')
  const mid = (a.y + b.y) / 2
  return `M ${a.x} ${a.y} C ${a.x} ${mid}, ${b.x} ${mid}, ${b.x} ${b.y}`
}

export default function InfraMap({ score, fillHeight }) {
  const nodeMap = useMemo(() => {
    const m = {}
    NODES.forEach(n => { m[n.id] = n })
    return m
  }, [])

  const visibleEdges = useMemo(
    () => EDGES.filter(e => score >= e.minScore),
    [score]
  )

  const unlocked = (n) => score >= n.minScore

  const outerFlex = fillHeight
    ? { flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', width: '100%' }
    : {}

  return (
    <div style={{
      background: dash.card,
      border: borderBlack,
      borderRadius: dash.radius,
      overflow: 'hidden',
      boxShadow: dash.shadowHard,
      ...outerFlex,
    }}>
      <div style={{
        padding: `${dash.space.md}px ${dash.space.lg}px`,
        borderBottom: borderBlack,
        background: dash.bgElevated,
        flexShrink: 0,
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: dash.space.md,
          flexWrap: 'wrap',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: dash.space.sm, minWidth: 0 }}>
            <span style={{ fontSize: 18 }} aria-hidden>🗺️</span>
            <div>
              <div style={{
                color: dash.text,
                fontWeight: 800,
                fontSize: 18,
                letterSpacing: '-0.02em',
                textTransform: 'uppercase',
                borderBottom: `3px solid ${dash.red}`,
                paddingBottom: dash.space.xs,
                display: 'inline-block',
              }}>
                Session map
              </div>
              <div style={{
                fontSize: 14,
                color: dash.textBody,
                marginTop: dash.space.sm,
                lineHeight: dash.lineBody,
                fontWeight: 500,
              }}>
                Decoys unlock with threat score. Dashed = locked. Arrows = inferred path.
              </div>
            </div>
          </div>
          <div style={{
            fontSize: 12,
            fontWeight: 800,
            color: dash.text,
            background: dash.card,
            border: `${dash.borderWidthSm}px solid ${dash.black}`,
            padding: `${dash.space.sm}px ${dash.space.md}px`,
            whiteSpace: 'nowrap',
            fontFamily: dash.fontMono,
            textTransform: 'uppercase',
            boxShadow: dash.shadowHard,
          }}>
            <span>
              {`${NODES.filter(n => unlocked(n)).length}/${NODES.length} on · `}
              <strong style={{ color: dash.red }}>{score}</strong>
            </span>
          </div>
        </div>

        <div style={{ marginTop: dash.space.md }} aria-hidden>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 11,
            fontWeight: 800,
            color: dash.text,
            marginBottom: dash.space.sm,
            fontFamily: dash.fontMono,
          }}>
            <span>0</span>
            <span>15</span>
            <span>31</span>
            <span>61</span>
            <span>86</span>
            <span>100</span>
          </div>
          <div style={{
            height: 16,
            borderRadius: dash.radius,
            background: dash.card,
            border: `${dash.borderWidthSm}px solid ${dash.black}`,
            position: 'relative',
            overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: `${Math.min(100, Math.max(0, score))}%`,
              background: dash.red,
              borderRight: `${dash.borderWidthSm}px solid ${dash.black}`,
            }} />
            {THRESHOLDS.filter(t => t > 0).map(t => (
              <div
                key={t}
                title={`${t}+`}
                style={{
                  position: 'absolute',
                  left: `${t}%`,
                  top: 0,
                  width: 3,
                  height: '100%',
                  background: dash.black,
                  transform: 'translateX(-1px)',
                }}
              />
            ))}
          </div>
        </div>
      </div>

      <div style={{
        padding: dash.space.md,
        overflow: 'auto',
        WebkitOverflowScrolling: 'touch',
        background: dash.bg,
        flex: fillHeight ? 1 : undefined,
        minHeight: fillHeight ? 480 : 380,
        minWidth: 0,
      }}
      >
        <svg
          viewBox={`0 0 ${VB_W} ${VB_H}`}
          preserveAspectRatio="xMidYMid meet"
          width="100%"
          height="auto"
          style={{
            display: 'block',
            width: '100%',
            height: 'auto',
            maxWidth: '100%',
          }}
          role="img"
          aria-label={`Session map. Score ${score}. ${NODES.filter(n => unlocked(n)).length} decoys visible.`}
        >
          <defs>
            <marker id="infra-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
              <polygon points="0 0, 8 4, 0 8" fill={dash.black} />
            </marker>
            {NODES.map((n) => (
              <clipPath key={n.id} id={`clip-${n.id}`}>
                <rect x={n.x} y={n.y} width={n.w} height={n.h} />
              </clipPath>
            ))}
          </defs>

          <rect x={0} y={0} width={VB_W} height={VB_H} fill={dash.bg} stroke={dash.black} strokeWidth={1} strokeDasharray="6 6" opacity={0.35} />

          <g>
            {visibleEdges.map((edge, i) => {
              const from = nodeMap[edge.from]
              const to = nodeMap[edge.to]
              if (!from || !to) return null
              const d = edgePath(from, to)
              return (
                <path
                  key={`${edge.from}-${edge.to}-${i}`}
                  d={d}
                  fill="none"
                  stroke={dash.black}
                  strokeWidth={2}
                  strokeDasharray="8 5"
                  markerEnd="url(#infra-arrow)"
                >
                  <animate attributeName="stroke-dashoffset" from="0" to="-26" dur="1.4s" repeatCount="indefinite" />
                </path>
              )
            })}
          </g>

          {NODES.map((n) => {
            const on = unlocked(n)
            const pad = 8
            return (
              <g key={n.id}>
                <g clipPath={`url(#clip-${n.id})`}>
                  <rect
                    x={n.x}
                    y={n.y}
                    width={n.w}
                    height={n.h}
                    fill={on ? dash.card : dash.bgElevated}
                    stroke={dash.black}
                    strokeWidth={on ? 2.5 : 2}
                    strokeDasharray={on ? '0' : '6 4'}
                  />
                  <rect
                    x={n.x}
                    y={n.y}
                    width={pad}
                    height={n.h}
                    fill={on ? n.accent : dash.textSubtle}
                  />
                </g>
                {on && n.pulse && (
                  <rect
                    x={n.x}
                    y={n.y}
                    width={n.w}
                    height={n.h}
                    fill="none"
                    stroke={dash.black}
                    strokeWidth={3}
                  >
                    <animate attributeName="stroke-opacity" values="1;0.4;1" dur="1s" repeatCount="indefinite" />
                  </rect>
                )}
                <text
                  x={n.x + pad + 10}
                  y={n.y + 22}
                  fill={on ? dash.text : dash.textSubtle}
                  fontSize="12"
                  fontWeight="800"
                  fontFamily="Space Grotesk, system-ui, sans-serif"
                >
                  {n.title.length > 24 ? `${n.title.slice(0, 22)}…` : n.title}
                </text>
                <text
                  x={n.x + pad + 10}
                  y={n.y + 40}
                  fill={on ? dash.textBody : dash.textSubtle}
                  fontSize="10"
                  fontFamily="JetBrains Mono, monospace"
                  fontWeight="600"
                >
                  {on ? n.detail : `Score ≥ ${n.minScore}`}
                </text>
                {on && (
                  <text
                    x={n.x + n.w - 8}
                    y={n.y + 22}
                    textAnchor="end"
                    fill={dash.redDark}
                    fontSize="10"
                    fontWeight="800"
                    fontFamily="JetBrains Mono, monospace"
                  >
                    ON
                  </text>
                )}
              </g>
            )
          })}
        </svg>
      </div>
    </div>
  )
}
