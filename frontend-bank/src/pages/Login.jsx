import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

const API = 'http://localhost:8000'

export default function Login({ onLogin }) {
  const [step, setStep] = useState(1) // 1=creds, 2=otp
  const [form, setForm] = useState({ account: '', ipin: '', otp: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [failCount, setFailCount] = useState(0)
  const [locked, setLocked] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (step === 1) {
      setStep(2)
      return
    }
    setLoading(true)
    try {
      const res = await axios.post(`${API}/real/auth`, {
        account_number: form.account,
        ipin: form.ipin,
      })
      onLogin(res.data.user, res.data.token)
      navigate('/dashboard')
    } catch (err) {
      const status = err?.response?.status
      const data = err?.response?.data || {}
      const headers = err?.response?.headers || {}
      const newFailCount = failCount + 1
      setFailCount(newFailCount)

      // ── CONSOLE DEBUG CLUES (visible in Chrome DevTools) ─────────────
      // These simulate leaked debug info that a hacker would find in the console
      console.error(
        `%c[SEC] AUTH_FAILURE #${newFailCount}: credential validation failed for account ${form.account}`,
        'color: #C8102E; font-weight: bold; font-size: 12px;'
      )
      console.warn(
        `%c[SEC] Trace ID: ${data._internal_trace_id || 'N/A'}`,
        'color: #E05C00; font-size: 11px;'
      )

      if (newFailCount >= 2) {
        console.warn(
          '%c[SEC] Internal service map detected in response headers:',
          'color: #D4A017; font-weight: bold;'
        )
        console.table({
          'Banking Portal': { port: 3000, status: 'LOCKED' },
          'Debug Portal': { port: 4000, status: 'EXPOSED' },
          'Admin Export': { port: 5000, status: 'OPEN' },
          'API Gateway': { port: 8000, status: 'INTERNAL' },
        })

        if (headers['x-debug-service']) {
          console.info(
            `%c[SEC] X-Debug-Service header: ${headers['x-debug-service']}`,
            'color: #1A7A4A; font-size: 12px;'
          )
        }
      }

      if (newFailCount >= 3) {
        console.error(
          '%c[SEC] ⚠️ SECURITY NOTICE: Multiple auth failures detected. Debug portal available at http://localhost:4000 — Admin export at http://localhost:5000',
          'background: #2D1418; color: #F85149; font-size: 13px; padding: 8px 12px; border-radius: 4px; font-weight: bold;'
        )
        console.warn(
          '%c[SEC] Internal network topology leaked:',
          'color: #D4A017; font-weight: bold;'
        )
        console.log(
          '%c' + JSON.stringify({
            "3000": "production-banking-frontend",
            "4000": "debug-banking-portal (VULNERABLE)",
            "5000": "admin-data-export-service (NO AUTH)",
            "8000": "internal-api-gateway",
          }, null, 2),
          'color: #79C0FF; font-family: monospace; font-size: 11px;'
        )

        if (data._debug_failover_notice) {
          console.error(
            `%c[SEC] FAILOVER: ${data._debug_failover_notice}`,
            'color: #F85149; font-size: 12px; font-weight: bold;'
          )
        }
      }

      // ── UI ERROR MESSAGES ────────────────────────────────────────────
      if (status === 429) {
        setLocked(true)
        setError('Account temporarily locked due to multiple failed attempts. Please try again later.')
      } else if (newFailCount >= 3) {
        setError(`Login failed (${newFailCount} attempts). Account security review initiated.`)
      } else {
        setError(`Invalid Customer ID or IPIN. Please try again. (Attempt ${newFailCount}/5)`)
      }
      setStep(1)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-header">
        <div className="logo-mark">
          <svg viewBox="0 0 34 34" fill="none" xmlns="http://www.w3.org/2000/svg" width="28" height="28">
            <rect x="1" y="1" width="14" height="14" rx="1" fill="#003580"/>
            <rect x="19" y="1" width="14" height="14" rx="1" fill="#ed1c24"/>
            <rect x="1" y="19" width="14" height="14" rx="1" fill="#ed1c24"/>
            <rect x="19" y="19" width="14" height="14" rx="1" fill="#003580"/>
          </svg>
        </div>
        <div className="logo-wordmark" style={{ color: 'white' }}>
          <span className="logo-bank-name">HDFC Bank</span>
        </div>
        <span style={{ color: 'rgba(255,255,255,0.6)', marginLeft: 8, fontSize: 13, borderLeft: '1px solid rgba(255,255,255,0.3)', paddingLeft: 12 }}>
          NetBanking
        </span>
        <div className="login-header-right">
          <a href="#" className="login-header-link" onClick={(e) => e.preventDefault()}>Continue to new login Page</a>
        </div>
      </div>

      <div className="login-body">
        <div className="login-info-panel">
          <h1 className="login-info-title">Welcome to HDFC Bank NetBanking</h1>
          <p className="login-info-subtitle">Experience a safer, faster and more intuitive digital banking journey.</p>
          
          <ul className="login-feature-list">
            <li className="login-feature-item">
              <div className="login-feature-item-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
              </div>
              <div className="login-feature-item-text">
                <strong>Bank Securely</strong>
                Enhanced security features for peace of mind.
              </div>
            </li>
            <li className="login-feature-item">
              <div className="login-feature-item-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
              </div>
              <div className="login-feature-item-text">
                <strong>Save Time</strong>
                Quick transfers, bill payments, and more.
              </div>
            </li>
          </ul>
        </div>

        <div className="login-card-wrap">
          <div className="login-card">
            <div className="login-card-header">
              <div className="login-card-header-title">Login to NetBanking</div>
            </div>
            
            <div className="login-step-indicator">
              <div className={`step-pill ${step >= 1 ? 'active' : ''} ${step > 1 ? 'done' : ''}`}>
                <div className="step-num">{step > 1 ? '✓' : '1'}</div>
                Credentials
              </div>
              <div className="step-connector" />
              <div className={`step-pill ${step >= 2 ? 'active' : ''}`}>
                <div className="step-num">2</div>
                Verification
              </div>
            </div>

            <div className="login-card-body">
              {error && <div className="alert alert-error">{error}</div>}

              {locked ? (
                <div style={{textAlign:'center',padding:'20px 0'}}>
                  <div style={{fontSize:48,marginBottom:16}}>🔒</div>
                  <h3 style={{color:'var(--hdfc-red)',marginBottom:8}}>Account Temporarily Locked</h3>
                  <p style={{fontSize:13,color:'var(--text-secondary)',lineHeight:1.6}}>
                    Multiple failed login attempts detected. Your account has been temporarily locked
                    for security purposes. Please try again after 60 seconds or contact support.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  {step === 1 ? (
                    <>
                      <div className="form-group">
                        <label className="form-label form-label-required">Customer ID / User ID</label>
                        <input
                          className="form-input"
                          type="text"
                          placeholder="Enter your Customer ID"
                          value={form.account}
                          onChange={e => setForm({...form, account: e.target.value})}
                          required
                          autoFocus
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label form-label-required">IPIN (Password)</label>
                        <input
                          className="form-input"
                          type="password"
                          placeholder="Enter your IPIN"
                          value={form.ipin}
                          onChange={e => setForm({...form, ipin: e.target.value})}
                          required
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="otp-info-box">
                        OTP has been sent to your registered mobile number ending in <strong>XXXX</strong>.<br/>
                        Valid for 10 minutes.
                      </div>
                      <div className="form-group">
                        <label className="form-label form-label-required">Enter OTP</label>
                        <input
                          className="form-input"
                          type="text"
                          placeholder="Enter 6-digit OTP"
                          inputMode="numeric"
                          maxLength={6}
                          style={{fontFamily:'Roboto Mono, monospace',fontSize:20,letterSpacing:8,textAlign:'center'}}
                          value={form.otp}
                          onChange={e => setForm({...form, otp: e.target.value})}
                          autoFocus
                          required
                        />
                      </div>
                      <p style={{fontSize:12,color:'var(--text-secondary)',marginBottom:16}}>
                        Didn't receive OTP? <a href="#" style={{color:'var(--hdfc-navy)', fontWeight: 600}} onClick={(e) => e.preventDefault()}>Resend OTP</a>
                      </p>
                    </>
                  )}

                  <button type="submit" className="btn btn-primary" style={{width:'100%', marginTop: 8}} disabled={loading || locked}>
                    {loading ? <span className="spinner"/> : null}
                    {loading ? 'Verifying...' : step === 1 ? 'Continue' : 'Login Securely'}
                  </button>

                  {step === 2 && (
                    <button type="button" className="btn btn-outline" style={{width:'100%',marginTop:12}}
                      onClick={() => setStep(1)}>
                      Back
                    </button>
                  )}
                </form>
              )}
              
              <div className="demo-box" style={{marginTop: 24}}>
                <div className="demo-box-title">Demo Accounts (Account / IPIN)</div>
                <div className="demo-credential">40021234567 / 123456</div>
                <div className="demo-credential">40029876543 / 654321</div>
                <div style={{fontSize:11,color:'var(--text-muted)',marginTop:8}}>
                  Any OTP value is accepted.
                </div>
              </div>
            </div>
            
            <div className="login-security-footer">
              <div className="security-badge">
                <svg className="security-badge-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.25C17.25 22.15 21 17.25 21 12V7L12 2z"></path></svg>
                Site is protected
              </div>
              <div className="security-badge">
                <svg className="security-badge-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                Your data is secure
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <footer style={{ background: 'var(--hdfc-dark-navy)', color: 'rgba(255,255,255,0.65)', borderTop: 'none', padding: '24px 0', marginTop: 'auto' }}>
        <div style={{ maxWidth: 1240, margin: '0 auto', padding: '0 24px', textAlign: 'center', fontSize: 12 }}>
          &copy; 2024 HDFC Bank Ltd. All Rights Reserved. Not a real bank site. Used for demonstration only.
        </div>
      </footer>
    </div>
  )
}
