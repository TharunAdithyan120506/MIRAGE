import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import HoneyNavBar from '../components/HoneyNavBar'
import HoneyFooter from '../components/HoneyFooter'

const API = 'http://localhost:8000'

function makeRows() {
  const descs = ['Salary Credit','Amazon','Netflix','Swiggy','Petrol','EMI','SIP','Bill','UPI',
    'OYO','IndiGo','Zepto','Gym','LIC','ATM']
  const rows = []
  let bal = 284730
  for (let i=0; i<60; i++) {
    const type = i===0?'CREDIT':i%4===0?'CREDIT':'DEBIT'
    const amt  = type==='CREDIT'?Math.floor(Math.random()*60000+5000):Math.floor(Math.random()*8000+100)
    bal = type==='CREDIT'?bal+amt:bal-amt
    const d = new Date(2023,3+Math.floor(i/5),1+i%28)
    const day = d.getDate().toString().padStart(2, '0');
    const month = d.toLocaleString('en-IN', { month: 'short' });
    const year = d.getFullYear();
    rows.push({
      date: `${day}-${month}-${year}`, 
      desc: descs[i%descs.length],
      type, mode:['NEFT','IMPS','UPI','ATM'][i%4], amount:amt, balance:Math.max(bal,1000)
    })
  }
  return rows.reverse()
}
const ROWS = makeRows()

export default function HoneyStatement({ user, sessionId, onLogout }) {
  const navigate = useNavigate()

  useEffect(() => {
    if (!user) { navigate('/'); return }
    axios.post(`${API}/honey/event`, { session_id: sessionId, path: '/statement', signal: 'statement_access' }).catch(()=>{})
  }, [user, sessionId, navigate])

  if (!user) return null

  return (
    <div className="page">
      <HoneyNavBar user={user} onLogout={onLogout} />
      
      <div className="page-header-bar">
        <div className="page-header-inner">
          <div className="breadcrumb">
            <span className="breadcrumb-item"><Link to="/dashboard">Home</Link></span>
            <span className="breadcrumb-sep">&gt;</span>
            <span className="breadcrumb-item"><Link to="/dashboard">Accounts</Link></span>
            <span className="breadcrumb-sep">&gt;</span>
            <span className="breadcrumb-item current">Statement</span>
          </div>
        </div>
      </div>

      <div className="page-content container">
        <div className="flex-between mb-5">
          <h1 className="page-title" style={{marginBottom: 0}}>Account Statement</h1>
          <button className="btn btn-outline" onClick={() => window.print()}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            Download PDF
          </button>
        </div>

        <div className="card mb-5" style={{background: 'var(--surface-light)'}}>
          <div className="grid-4" style={{display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24}}>
            <div>
              <div className="text-muted" style={{fontSize: 12, marginBottom: 4}}>Account Holder</div>
              <div className="font-bold text-navy" style={{fontSize: 15}}>{user || 'Customer'}</div>
            </div>
            <div>
              <div className="text-muted" style={{fontSize: 12, marginBottom: 4}}>Account Number</div>
              <div className="font-bold mono" style={{fontSize: 15}}>XXXX XXXX 8847</div>
            </div>
            <div>
              <div className="text-muted" style={{fontSize: 12, marginBottom: 4}}>Statement Period</div>
              <div className="font-bold" style={{fontSize: 15}}>01-Apr-2023 to 31-Mar-2024</div>
            </div>
            <div>
              <div className="text-muted" style={{fontSize: 12, marginBottom: 4}}>Closing Balance</div>
              <div className="font-bold text-green mono" style={{fontSize: 16}}>
                ₹ 2,84,730.55
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            Transaction History (Last 12 Months — 500 records)
          </div>
          <div className="table-wrap">
            <table>
              <thead><tr>
                <th>Date</th>
                <th>Narration</th>
                <th>Txn Mode</th>
                <th className="text-right">Withdrawal (Dr)</th>
                <th className="text-right">Deposit (Cr)</th>
                <th className="text-right">Balance (₹)</th>
              </tr></thead>
              <tbody>
                {ROWS.map((t,i) => (
                  <tr key={i}>
                    <td style={{whiteSpace:'nowrap', color: 'var(--text-secondary)'}}>{t.date}</td>
                    <td style={{maxWidth: 300}}>{t.desc}</td>
                    <td>
                      <span className="badge badge-neutral">{t.mode}</span>
                    </td>
                    <td className="text-right" style={{color: t.type==='DEBIT'?'var(--hdfc-red)':'transparent'}}>
                      {t.type==='DEBIT' ? t.amount.toLocaleString('en-IN', {minimumFractionDigits:2}) : ''}
                    </td>
                    <td className="text-right" style={{color: t.type==='CREDIT'?'var(--green)':'transparent'}}>
                      {t.type==='CREDIT' ? t.amount.toLocaleString('en-IN', {minimumFractionDigits:2}) : ''}
                    </td>
                    <td className="text-right font-medium mono">
                      {t.balance.toLocaleString('en-IN',{minimumFractionDigits:2})}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <HoneyFooter />
    </div>
  )
}
