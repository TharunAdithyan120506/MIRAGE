import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import HoneyNavBar from '../components/HoneyNavBar'
import HoneyFooter from '../components/HoneyFooter'
import OTPTrap from '../components/OTPTrap'

const API = 'http://localhost:8000'

// Fake transactions for the honeypot
const FAKE_TRANSACTIONS = [
  { date:'15-Mar-2024', desc:'Salary Credit — SecureBank Corp', type:'CREDIT', amount:92000, balance:284730.55 },
  { date:'12-Mar-2024', desc:'Flipkart — Online Purchase', type:'DEBIT', amount:4599, balance:192730.55 },
  { date:'10-Mar-2024', desc:'Swiggy Order', type:'DEBIT', amount:425, balance:197329.55 },
  { date:'08-Mar-2024', desc:'UPI — Transfer', type:'DEBIT', amount:10000, balance:197754.55 },
  { date:'05-Mar-2024', desc:'EMI — Home Loan', type:'DEBIT', amount:25000, balance:207754.55 },
]

export default function HoneyDashboard({ user, sessionId, onLogout }) {
  const [showOTP, setShowOTP] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    if (!user) { navigate('/'); return }
    axios.post(`${API}/honey/event`, { session_id: sessionId, path: '/dashboard', signal: 'dashboard_visit' })
      .catch(() => {})
  }, [user, sessionId, navigate])

  if (!user) return null

  return (
    <div className="page">
      {showOTP && <OTPTrap sessionId={sessionId} onClose={() => setShowOTP(false)} />}
      <HoneyNavBar user={user} onLogout={onLogout} />

      <div className="page-header-bar">
        <div className="page-header-inner">
          <div className="breadcrumb">
            <span className="breadcrumb-item"><Link to="/dashboard">Home</Link></span>
            <span className="breadcrumb-sep">&gt;</span>
            <span className="breadcrumb-item current">Accounts</span>
          </div>
        </div>
      </div>

      <div className="page-content container">
        <h1 className="page-title">Accounts Summary</h1>

        {/* Account Hero */}
        <div className="account-hero">
          <div className="account-type-badge">
            <span className="account-status-dot"></span>
            Active savings
          </div>
          <div className="account-number-label">Account Number</div>
          <div className="account-number-value">XXXX XXXX 8847</div>
          <div className="account-balance-label">Available Balance</div>
          <div className="account-balance">
            <span className="account-balance-currency">₹</span>
            2,84,730.55
          </div>
          <div className="account-meta">
            <div className="account-meta-item">
              <span className="account-meta-label">IFSC Code</span>
              <span className="account-meta-value">HDFC0008847</span>
            </div>
            <div className="account-meta-item">
              <span className="account-meta-label">Last Login</span>
              <span className="account-meta-value">Today 09:42 AM</span>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="quick-links">
          <Link to="/transfer" className="quick-link-btn">
            <div className="quick-link-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
            </div>
            Fund Transfer
          </Link>
          <Link to="/statement" className="quick-link-btn">
            <div className="quick-link-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16c0 1.1.9 2 2 2h12a2 2 0 0 0 2-2V8l-6-6z"></path><path d="M14 3v5h5M16 13H8M16 17H8M10 9H8"></path></svg>
            </div>
            Statement
          </Link>
          {/* Honeypot traps */}
          <button className="quick-link-btn" onClick={() => setShowOTP(true)}>
            <div className="quick-link-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
            </div>
            Export Data
          </button>
          <Link to="/admin" className="quick-link-btn text-muted">
            <div className="quick-link-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
            </div>
            Admin Panel
          </Link>
        </div>

        <div className="grid-2">
          {/* Recent Transactions */}
          <div className="card">
            <div className="card-header">
              Recent Transactions
            </div>
            <div className="table-wrap">
              <table>
                <thead><tr>
                  <th>Date</th><th>Description</th><th className="text-right">Amount (₹)</th>
                </tr></thead>
                <tbody>
                  {FAKE_TRANSACTIONS.map((t,i) => (
                    <tr key={i}>
                      <td style={{whiteSpace:'nowrap', color: 'var(--text-secondary)'}}>{t.date}</td>
                      <td>{t.desc}</td>
                      <td className={t.type==='CREDIT'?'amount-credit text-right':'amount-debit text-right'}>
                        {t.type==='CREDIT'?'+':'-'}{t.amount.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="text-right mt-4">
              <Link to="/statement" className="btn btn-outline btn-sm">
                View Past Transactions
              </Link>
            </div>
          </div>

          {/* Account Summary */}
          <div className="grid-col-stack">
            <div className="card">
              <div className="card-header">Account Details</div>
              <div>
                {[
                  ['Available Balance', '₹ 2,84,730.55'],
                  ['Account Type', 'Savings — Premium'],
                  ['Account Status', 'Active'],
                  ['Branch', 'MG Road, Bangalore'],
                ].map(([label, value],i) => (
                  <div key={i} className="data-row">
                    <span className="data-label">{label}</span>
                    <span className="data-value">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="notice-box notice-box-warning">
              <strong>Stay Secure:</strong> HDFC Bank will never ask for your confidential information like password, OTP, CVV or PIN. Beware of fraudulent calls or links.
            </div>
          </div>
        </div>
      </div>
      <HoneyFooter />
    </div>
  )
}
