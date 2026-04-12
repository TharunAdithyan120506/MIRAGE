import { useState, useEffect } from 'react'
import { RadialBarChart, RadialBar, ResponsiveContainer, PolarAngleAxis } from 'recharts'

const TIER_COLORS = {
  'Script Kiddie':     '#1A7A4A',
  'Opportunist':       '#E05C00',
  'Targeted Attacker': '#B00020',
  'APT-Level':         '#8B0000',
}

function getGaugeColor(score) {
  if (score >= 86) return '#8B0000'
  if (score >= 61) return '#B00020'
  if (score >= 31) return '#E05C00'
  return '#1A7A4A'
}

export default function ThreatGauge({ score, tier }) {
  const [displayScore, setDisplayScore] = useState(0)
  const color = getGaugeColor(score)
  const isAPT = score >= 86

  // Smooth animation
  useEffect(() => {
    const diff = score - displayScore
    if (diff === 0) return
    const step = diff > 0 ? 1 : -1
    const t = setInterval(() => {
      setDisplayScore(prev => {
        const next = prev + step
        if ((step > 0 && next >= score) || (step < 0 && next <= score)) {
          clearInterval(t)
          return score
        }
        return next
      })
    }, 15)
    return () => clearInterval(t)
  }, [score])

  const data = [{ value: displayScore, fill: color }]

  return (
    <div style={{
      background: '#161B22',
      border: `1px solid ${color}44`,
      borderRadius: 12,
      padding: 24,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {isAPT && (
        <div style={{
          position: 'absolute',
          inset: 0,
          animation: 'aptPulse 2s ease-in-out infinite',
          background: `radial-gradient(ellipse at center, ${color}10 0%, transparent 70%)`,
          pointerEvents: 'none',
        }} />
      )}

      <div style={{ fontSize: 13, fontWeight: 600, color: '#8B949E', marginBottom: 12, letterSpacing: 1, textTransform: 'uppercase' }}>
        🎯 Threat Score
      </div>

      <div style={{ position: 'relative', width: 200, height: 200 }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            cx="50%" cy="50%"
            innerRadius="65%" outerRadius="90%"
            data={data}
            startAngle={225} endAngle={-45}
          >
            <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
            <RadialBar
              background={{ fill: '#21262D' }}
              dataKey="value"
              angleAxisId={0}
              cornerRadius={8}
              data={data}
            />
          </RadialBarChart>
        </ResponsiveContainer>

        {/* Center score */}
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div style={{
            fontSize: 52,
            fontWeight: 700,
            color,
            fontFamily: 'Inter, monospace',
            lineHeight: 1,
            transition: 'color 0.5s',
            textShadow: `0 0 20px ${color}66`,
          }}>
            {displayScore}
          </div>
          <div style={{ fontSize: 12, color: '#8B949E', marginTop: 4 }}>/100</div>
        </div>
      </div>

      <div style={{
        marginTop: 12,
        padding: '6px 20px',
        borderRadius: 999,
        background: color + '22',
        border: `1px solid ${color}66`,
        color,
        fontWeight: 700,
        fontSize: 14,
        textAlign: 'center',
        animation: isAPT ? 'aptPulse 1.5s ease-in-out infinite' : 'none',
      }}>
        {tier || 'Script Kiddie'}
      </div>

      <style>{`
        @keyframes aptPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
      `}</style>
    </div>
  )
}
