import { useState, useEffect } from 'react'
import { collectFingerprint } from '../traps/fingerprint'

const API = 'http://localhost:8000'

export default function OTPTrap({ sessionId, onClose }) {
  const [otp, setOtp] = useState('')
  const [attempts, setAttempts] = useState(0)
  const [countdown, setCountdown] = useState(0)
  const [locked, setLocked] = useState(false)
  const [fingerprint, setFingerprint] = useState(null)

  // Silently collect fingerprint on mount
  useEffect(() => {
    collectFingerprint(sessionId).then(fp => setFingerprint(fp))
  }, [sessionId])

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) return
    const t = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (attempts >= 2) {
      setLocked(true)
      return
    }
    setAttempts(a => a + 1)
    setCountdown(30)
    setOtp('')
  }

  return (
    <div style={{
      position:'fixed',inset:0,zIndex:9999,
      background:'rgba(0,0,0,0.7)',backdropFilter:'blur(4px)',
      display:'flex',alignItems:'center',justifyContent:'center',
      padding:16
    }}>
      <div style={{
        background:'white',borderRadius:8,width:'100%',maxWidth:460,
        boxShadow:'0 10px 40px rgba(0,0,0,0.3)',
        overflow:'hidden',animation:'slideIn 0.3s ease',
        border: '1px solid var(--border-color)'
      }}>
        {/* Header */}
        <div style={{background:'var(--hdfc-navy)',padding:'20px 28px',color:'white',borderBottom:'3px solid var(--hdfc-red)'}}>
          <div style={{display:'flex',alignItems:'center',gap:12}}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
            <div>
              <div style={{fontSize:16,fontWeight:700}}>Security Verification Required</div>
              <div style={{fontSize:12,opacity:0.8}}>HDFC Bank — Session Security</div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div style={{padding:'28px 32px'}}>
          {locked ? (
            <div style={{textAlign:'center',padding:'16px 0'}}>
              <svg style={{margin:'0 auto 16px', color:'var(--hdfc-red)'}} width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
              <h3 style={{color:'var(--hdfc-red)',fontSize:18,fontWeight:700,marginBottom:8}}>
                Account Temporarily Locked
              </h3>
              <p style={{color:'var(--text-secondary)',fontSize:13,lineHeight:1.6}}>
                Multiple failed OTP attempts detected. Your session has been temporarily locked
                for security purposes. Please contact HDFC Bank support at 1800-202-6161.
              </p>
              <p className="mono" style={{color:'var(--text-muted)',fontSize:11,marginTop:16}}>
                Reference ID: {sessionId?.slice(0,8).toUpperCase()}
              </p>
            </div>
          ) : (
            <>
              <div className="notice-box notice-box-warning" style={{marginBottom: 24}}>
                <strong>Unusual activity detected on your session.</strong> For your security,
                please enter the OTP sent to your registered mobile number ending in <strong>XXXX</strong>.
              </div>

              <form onSubmit={handleSubmit}>
                <div style={{marginBottom:20}}>
                  <label className="form-label form-label-required" style={{marginBottom:10}}>
                    Enter 6-Digit OTP
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="• • • • • •"
                    value={otp}
                    onChange={e => setOtp(e.target.value.replace(/\D/g,''))}
                    autoFocus
                    disabled={countdown > 0}
                    style={{
                      width:'100%',padding:'14px 16px',border:'1.5px solid var(--border-color)',
                      borderRadius:'var(--radius-sm)',fontSize:24,fontFamily:'Roboto Mono, monospace',
                      textAlign:'center',letterSpacing:12,outline:'none',
                      borderColor:countdown>0?'var(--border-color)':'var(--hdfc-navy)',
                      background:countdown>0?'var(--surface-light)':'white'
                    }}
                  />
                </div>

                {countdown > 0 && (
                  <div className="alert alert-error" style={{padding: '10px 14px', marginBottom: 16}}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink: 0}}><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
                    Incorrect OTP. Please retry in {countdown}s
                  </div>
                )}

                {attempts > 0 && countdown === 0 && (
                  <div style={{fontSize:12,color:'var(--hdfc-red)',marginBottom:12, fontWeight: 500}}>
                    Attempt {attempts}/3 — {3-attempts} attempt(s) remaining
                  </div>
                )}

                <button
                  type="submit"
                  disabled={otp.length < 6 || countdown > 0}
                  style={{
                    width:'100%',background:'var(--hdfc-navy)',color:'white',border:'none',
                    padding:'12px 20px',borderRadius:'var(--radius-sm)',fontSize:14,fontWeight:600,
                    cursor:otp.length<6||countdown>0?'not-allowed':'pointer',
                    opacity:otp.length<6||countdown>0?0.5:1,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                  }}
                >
                  Verify & Continue <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                </button>
                <div style={{marginTop: 8}}>
                   <button type="button" className="btn btn-ghost" style={{width:'100%'}} onClick={onClose}>Cancel</button>
                </div>
              </form>

              <div style={{textAlign:'center',marginTop:20,fontSize:12,color:'var(--text-secondary)'}}>
                OTP valid for <strong>10 minutes</strong> •
                <a href="#" style={{color:'var(--hdfc-navy)',fontWeight:600,marginLeft:4}} onClick={e => e.preventDefault()}>Resend OTP</a>
              </div>
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes slideIn {
          from { transform: translateY(-30px); opacity: 0; }
          to   { transform: translateY(0);     opacity: 1; }
        }
      `}</style>
    </div>
  )
}
