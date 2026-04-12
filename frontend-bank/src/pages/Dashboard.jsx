import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import NavBar from '../components/NavBar'
import Footer from '../components/Footer'
import axios from 'axios'

const API = 'http://localhost:8000'

const TRANSACTIONS = [
  { date:'15-Mar-2024', desc:'Salary Credit — ABC Corp',    type:'CREDIT', amount:85000,   balance:142500.75 },
  { date:'12-Mar-2024', desc:'Amazon.in — Online Purchase',  type:'DEBIT',  amount:2499,    balance:57500.75 },
  { date:'10-Mar-2024', desc:'Netflix Subscription',         type:'DEBIT',  amount:649,     balance:59999.75 },
  { date:'08-Mar-2024', desc:'UPI — Transfer to Priya M',    type:'DEBIT',  amount:5000,    balance:60648.75 },
  { date:'05-Mar-2024', desc:'BSNL Electricity Bill',        type:'DEBIT',  amount:1250,    balance:65648.75 },
]

export default function Dashboard({ user, onLogout }) {
  const navigate = useNavigate()
  const [showTimeout, setShowTimeout] = useState(false)

  useEffect(() => {
    if (!user) { navigate('/'); return }
    // 14-min inactivity warning
    const warn = setTimeout(() => setShowTimeout(true), 14 * 60 * 1000)
    const auto = setTimeout(() => { onLogout(); navigate('/') }, 15 * 60 * 1000)
    return () => { clearTimeout(warn); clearTimeout(auto) }
  }, [user, navigate, onLogout])

  if (!user) return null

  return (
    <div className="page">
      <NavBar user={user} onLogout={onLogout} />

      {showTimeout && (
        <div className="session-banner">
          <div className="session-banner-inner">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
            You will be automatically logged out in 1 minute due to inactivity.
            <button className="btn btn-outline btn-sm" style={{marginLeft:'auto', borderColor: '#d97706', color: '#92400e'}}
              onClick={() => setShowTimeout(false)}>Stay Logged In</button>
          </div>
        </div>
      )}

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
          <div className="account-number-value">{user.account}</div>
          <div className="account-balance-label">Available Balance</div>
          <div className="account-balance">
            <span className="account-balance-currency">₹</span>
            {user.balance?.toLocaleString('en-IN', {minimumFractionDigits:2})}
          </div>
          <div className="account-meta">
            <div className="account-meta-item">
              <span className="account-meta-label">IFSC Code</span>
              <span className="account-meta-value">{user.ifsc}</span>
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
          <Link to="/profile" className="quick-link-btn">
            <div className="quick-link-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
            </div>
            My Profile
          </Link>
          <a href="#" className="quick-link-btn" onClick={(e) => e.preventDefault()}>
            <div className="quick-link-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>
            </div>
            Credit Cards
          </a>
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
                  {TRANSACTIONS.map((t,i) => (
                    <tr key={i}>
                      <td style={{whiteSpace:'nowrap', color: 'var(--text-secondary)'}}>{t.date}</td>
                      <td>{t.desc}</td>
                      <td className={t.type==='CREDIT'?'amount-credit text-right':'amount-debit text-right'}>
                        {t.type==='CREDIT'?'+':'-'}{t.amount.toLocaleString('en-IN', {minimumFractionDigits:2})}
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
                  ['Available Balance', '₹ '+user.balance?.toLocaleString('en-IN', {minimumFractionDigits:2})],
                  ['Account Type', 'Savings — Premium'],
                  ['Account Status', 'Active'],
                  ['Branch', 'Koramangala, Bangalore'],
                  ['Nomination', 'Registered'],
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
      <Footer />
    </div>
  )
}
