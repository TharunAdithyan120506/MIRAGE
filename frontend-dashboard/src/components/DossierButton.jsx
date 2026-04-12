import { useState } from 'react'
import axios from 'axios'

const API = 'http://localhost:8000'

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
      // Auto-download
      const link = document.createElement('a')
      link.href = `${API}/api/dossier/${sessionId}`
      link.download = `MIRAGE_dossier_${sessionId.slice(0, 8)}.pdf`
      link.click()
    } catch (err) {
      setError('PDF generation failed. Check backend logs.')
    } finally {
      setLoading(false)
    }
  }

  const canGenerate = sessionId && hasEvents && !loading

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <button
        onClick={handleGenerate}
        disabled={!canGenerate}
        style={{
          background: canGenerate ? '#003366' : '#21262D',
          color: canGenerate ? 'white' : '#8B949E',
          border: `1px solid ${canGenerate ? '#004d99' : '#30363D'}`,
          padding: '12px 24px',
          borderRadius: 8,
          fontSize: 14,
          fontWeight: 700,
          cursor: canGenerate ? 'pointer' : 'not-allowed',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          transition: 'all 0.2s',
          width: '100%',
          justifyContent: 'center',
        }}
      >
        {loading ? (
          <>
            <span style={{
              width: 16, height: 16,
              border: '2px solid rgba(255,255,255,0.3)',
              borderTopColor: 'white',
              borderRadius: '50%',
              display: 'inline-block',
              animation: 'spin 0.7s linear infinite',
            }} />
            Generating PDF...
          </>
        ) : generated ? (
          <>✅ Dossier Generated — Click to Re-download</>
        ) : (
          <>📄 Generate Threat Dossier</>
        )}
      </button>

      {!sessionId && (
        <p style={{ fontSize: 11, color: '#484F58', textAlign: 'center' }}>
          Select a session to generate dossier
        </p>
      )}
      {sessionId && !hasEvents && (
        <p style={{ fontSize: 11, color: '#484F58', textAlign: 'center' }}>
          Waiting for events before dossier is available
        </p>
      )}
      {generated && (
        <div style={{
          background: '#1A7A4A22', border: '1px solid #1A7A4A44',
          borderRadius: 6, padding: '8px 14px', fontSize: 12,
          color: '#4ade80', textAlign: 'center'
        }}>
          ✓ Dossier generated successfully.{' '}
          <a href={`${API}/api/dossier/${sessionId}`} target="_blank" rel="noreferrer"
            style={{ color: '#58A6FF', textDecoration: 'none' }}>
            Open PDF ↗
          </a>
        </div>
      )}
      {error && (
        <div style={{
          background: '#8B000022', border: '1px solid #8B000044',
          borderRadius: 6, padding: '8px 14px', fontSize: 12, color: '#FF6B6B'
        }}>
          ⚠️ {error}
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
