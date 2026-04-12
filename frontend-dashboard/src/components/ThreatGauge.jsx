import { useState, useEffect, useRef } from 'react'
import { dash } from '../dashboardTheme'

/**
 * Threat score panel — controlled by parent props only.
 *
 * React equivalent of `updateScore(score, tier)`:
 * update parent state when the session changes, e.g.
 *   <ThreatGauge score={session.threat_score} tier={session.tier} />
 */

const PANEL = '#8B1E1E'
const CREAM = '#F5F0E8'
const INNER_BORDER = '#A04040'
const TIER_DOT = '#FF8A5C'
/** Connecting line between CALM and URGENT (spec: ~20% opacity) */
const SEPARATOR_LINE = 'rgba(245, 240, 232, 0.2)'
const PANEL_W = 420
/** Target height; content may extend slightly so tall typography + 120px gauge are not clipped. */
const PANEL_MIN_H = 160
const PAD = 20
const RADIUS = 16

const GAUGE = 120
const CX = 60
const CY = 60
const R = 52
const STROKE = 8
const CIRC = 2 * Math.PI * R

const DURATION_MS = 1500

function easeStandard(t) {
  if (t <= 0) return 0
  if (t >= 1) return 1
  let lo = 0
  let hi = 1
  for (let i = 0; i < 16; i++) {
    const mid = (lo + hi) / 2
    const bx = sampleX(mid)
    if (bx < t) lo = mid
    else hi = mid
  }
  const u = (lo + hi) / 2
  return sampleY(u)
}

function sampleX(u) {
  const o = 1 - u
  return 3 * o * o * u * 0.4 + 3 * o * u * u * 0.2 + u * u * u
}

function sampleY(u) {
  const o = 1 - u
  return 3 * o * u * u + u * u * u
}

function clampScore(n) {
  const x = Number(n)
  if (Number.isNaN(x)) return 0
  return Math.min(100, Math.max(0, x))
}

/** Display fallback if tier string is empty (score bands). */
function tierFromScoreBands(s) {
  const x = Math.round(clampScore(s))
  if (x <= 30) return 'LOW'
  if (x <= 60) return 'MEDIUM'
  if (x <= 85) return 'HIGH'
  return 'CRITICAL'
}

function formatTierLabel(tier, scoreForFallback) {
  if (tier != null && String(tier).trim() !== '') {
    return String(tier).toUpperCase()
  }
  return tierFromScoreBands(scoreForFallback)
}

/** Tier row opacity from numeric score (prop), not animated value. */
function tierTextOpacityFromScore(s) {
  const x = Math.round(clampScore(s))
  if (x <= 60) return 0.7
  if (x <= 85) return 0.85
  return 1
}

export default function ThreatGauge({ score = 0, tier = 'LOW' }) {
  const target = clampScore(score)
  const tierLabel = formatTierLabel(tier, target)
  const tierOpacity = tierTextOpacityFromScore(target)
  const showCriticalDot = target >= 86

  const animatedRef = useRef(0)
  const [animated, setAnimated] = useState(0)

  useEffect(() => {
    const from = animatedRef.current
    const to = target
    const start = performance.now()
    let raf = 0
    let cancelled = false

    const tick = (now) => {
      if (cancelled) return
      const elapsed = now - start
      const t = Math.min(1, elapsed / DURATION_MS)
      const e = easeStandard(t)
      const v = from + (to - from) * e
      animatedRef.current = v
      setAnimated(v)
      if (t < 1) raf = requestAnimationFrame(tick)
      else animatedRef.current = to
    }

    raf = requestAnimationFrame(tick)
    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
    }
  }, [target])

  const display = Math.round(animated)
  const offset = CIRC * (1 - animated / 100)
  const svgAria = `Threat score is ${display} out of 100, tier ${tierLabel}`

  return (
    <div
      style={{
        width: PANEL_W,
        maxWidth: '100%',
        minHeight: PANEL_MIN_H,
        height: 'auto',
        boxSizing: 'border-box',
        background: PANEL,
        borderRadius: RADIUS,
        border: `1px solid ${INNER_BORDER}`,
        padding: PAD,
        display: 'flex',
        flexDirection: 'column',
        boxShadow: 'none',
      }}
    >
      <div style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        flex: 1,
        minHeight: 0,
        gap: 16,
      }}
      >
        <div style={{
          width: GAUGE,
          height: GAUGE,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        >
          <svg
            role="img"
            aria-label={svgAria}
            width={GAUGE}
            height={GAUGE}
            viewBox={`0 0 ${GAUGE} ${GAUGE}`}
          >
            <g transform={`rotate(-90 ${CX} ${CY})`}>
              <circle
                r={R}
                cx={CX}
                cy={CY}
                fill="none"
                stroke={CREAM}
                strokeWidth={STROKE}
                strokeLinecap="round"
                strokeDasharray={CIRC}
                strokeDashoffset={offset}
              />
            </g>
          </svg>
        </div>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          textAlign: 'right',
          justifyContent: 'center',
          minWidth: 0,
          flex: 1,
        }}
        >
          <span style={{
            fontSize: 10,
            fontWeight: 700,
            color: CREAM,
            opacity: 0.6,
            letterSpacing: '2px',
            textTransform: 'uppercase',
            fontFamily: dash.fontSans,
          }}>
            THREAT SCORE
          </span>
          <span style={{
            fontSize: 64,
            fontWeight: 700,
            color: CREAM,
            opacity: 1,
            lineHeight: 1,
            fontFamily: dash.fontSans,
            letterSpacing: '-0.03em',
          }}>
            {display}
          </span>
          <div style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 6,
            marginTop: 4,
          }}
          >
            {showCriticalDot && (
              <span
                aria-hidden
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: TIER_DOT,
                  flexShrink: 0,
                }}
              />
            )}
            <span style={{
              fontSize: 11,
              fontWeight: 600,
              color: CREAM,
              opacity: tierOpacity,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              fontFamily: dash.fontSans,
            }}>
              {tierLabel}
            </span>
          </div>
        </div>
      </div>

      <div style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 12,
        flexShrink: 0,
      }}
      >
        <span style={{
          fontSize: 9,
          fontWeight: 700,
          color: CREAM,
          opacity: 0.5,
          letterSpacing: '1px',
          textTransform: 'uppercase',
          fontFamily: dash.fontSans,
        }}>
          CALM 0
        </span>
        <div
          style={{
            flex: 1,
            height: 1,
            background: SEPARATOR_LINE,
            margin: '0 12px',
            boxShadow: 'none',
          }}
          aria-hidden
        />
        <span style={{
          fontSize: 9,
          fontWeight: 700,
          color: CREAM,
          opacity: 0.5,
          letterSpacing: '1px',
          textTransform: 'uppercase',
          fontFamily: dash.fontSans,
        }}>
          100 URGENT
        </span>
      </div>
    </div>
  )
}
