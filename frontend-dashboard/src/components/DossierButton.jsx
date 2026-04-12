import { useState } from 'react'
import axios from 'axios'
import { dash } from '../dashboardTheme'

const API = 'http://localhost:8000'

const bw = dash.borderWidth
const borderBlack = `${bw}px solid ${dash.black}`

export default function DossierButton({ sessionId, hasEvents }) {
  const [loading, setLoading] = useState(false)
  const [generated, setGenerated] = useState(false)
  const [error, setError] = useState(null)

  const handleGenerate = async () => {
    if (!sessionId) return
    setLoading(true)
    setError(null)
    try {
      await axios.post(`${API}/api/generate-dossier/${sessionId}`)
      setGenerated(true)
      const link = document.createElement('a')
      link.href = `${API}/api/dossier/${sessionId}`
      link.download = `MIRAGE_dossier_${sessionId.slice(0, 8)}.pdf`
      link.click()
    } catch {
      setError('PDF generation failed. Check backend logs.')
    } finally {
      setLoading(false)
    }
  }

  const canGenerate = sessionId && hasEvents && !loading
  const primaryStyle = loading || (sessionId && hasEvents)

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: dash.space.md,
      padding: dash.space.lg,
      background: dash.card,
      border: borderBlack,
      borderRadius: dash.radius,
      boxShadow: dash.shadowHard,
    }}>
      <div>
        <div style={{
          fontWeight: 800,
          fontSize: 16,
          color: dash.text,
          letterSpacing: '-0.02em',
          textTransform: 'uppercase',
          borderBottom: `3px solid ${dash.red}`,
          paddingBottom: dash.space.sm,
          display: 'inline-block',
        }}>
          PDF report
        </div>
        <p style={{
          margin: `${dash.space.md}px 0 0`,
          fontSize: 15,
          color: dash.textBody,
          lineHeight: dash.lineBody,
        }}>
          Export for the <strong style={{ color: dash.text }}>selected session</strong> from captured events.
        </p>
      </div>

      <button
        type="button"
        onClick={handleGenerate}
        disabled={!canGenerate}
        style={{
          background: primaryStyle ? dash.red : dash.bgElevated,
          color: primaryStyle ? dash.card : dash.textSubtle,
          border: borderBlack,
          padding: `${dash.space.md}px ${dash.space.lg + 2}px`,
          borderRadius: dash.radius,
          fontSize: 14,
          fontWeight: 800,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          cursor: canGenerate ? 'pointer' : 'not-allowed',
          display: 'flex',
          alignItems: 'center',
          gap: dash.space.md,
          width: '100%',
          justifyContent: 'center',
          fontFamily: dash.fontMono,
          boxShadow: canGenerate ? dash.shadowHard : 'none',
        }}
        className="dossier-btn-brut"
      >
        {loading ? (
          <>
            <span
              aria-hidden
              style={{
                width: 14,
                height: 14,
                border: `3px solid ${dash.card}`,
                borderTopColor: 'transparent',
                display: 'inline-block',
                animation: 'spin 0.65s linear infinite',
              }}
            />
            Building…
          </>
        ) : generated ? (
          <>Re-download PDF</>
        ) : (
          <>Download PDF</>
        )}
      </button>

      {!sessionId && (
        <p style={{ fontSize: 13, color: dash.textBody, textAlign: 'center', margin: 0, fontWeight: 600 }}>
          Pick a session first.
        </p>
      )}
      {sessionId && !hasEvents && (
        <p style={{ fontSize: 13, color: dash.textBody, textAlign: 'center', margin: 0, fontWeight: 600 }}>
          Need at least one activity line.
        </p>
      )}
      {generated && (
        <div style={{
          background: dash.bgElevated,
          border: borderBlack,
          borderRadius: dash.radius,
          padding: '12px 14px',
          fontSize: 14,
          color: dash.text,
          textAlign: 'center',
          lineHeight: 1.45,
          fontWeight: 600,
          boxShadow: dash.shadowHard,
        }}>
          <strong>Ready.</strong>{' '}
          <a href={`${API}/api/dossier/${sessionId}`} target="_blank" rel="noreferrer"
            style={{ color: dash.redDark, fontWeight: 800, textDecoration: 'underline' }}>
            Open PDF ↗
          </a>
        </div>
      )}
      {error && (
        <div style={{
          background: dash.red,
          color: dash.card,
          border: borderBlack,
          borderRadius: dash.radius,
          padding: '12px 14px',
          fontSize: 14,
          lineHeight: 1.45,
          fontWeight: 700,
        }}>
          {error}
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .dossier-btn-brut:focus-visible {
          outline: ${bw}px solid ${dash.black};
          outline-offset: 3px;
        }
        .dossier-btn-brut:not(:disabled):hover {
          box-shadow: -6px 6px 0 #111;
          transform: translate(2px, -2px);
        }
        .dossier-btn-brut:not(:disabled):active {
          box-shadow: 3px 3px 0 #111;
          transform: translate(0, 0);
        }
      `}</style>
    </div>
  )
}
