import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import HoneyNavBar from '../components/HoneyNavBar'
import HoneyFooter from '../components/HoneyFooter'

const API = 'http://localhost:8000'
const BANKS = ['HDFC Bank','ICICI Bank','SBI','Axis Bank','Kotak Mahindra','PNB','Bank of Baroda']

export default function HoneyTransfer({ user, sessionId, onLogout }) {
  const [form, setForm] = useState({ beneficiary:'', account:'', ifsc:'', amount:'', remarks:'', bank: 'HDFC Bank' })
  const [mode, setMode] = useState('NEFT')
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [refId] = useState(`REF${Date.now().toString().slice(-9)}`)
  const navigate = useNavigate()

  useEffect(() => {
    if (!user) { navigate('/'); return }
    axios.post(`${API}/honey/event`, { session_id: sessionId, path: '/transfer', signal: 'transfer_attempt' }).catch(()=>{})
  }, [user, sessionId, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (step === 1) { setStep(2); return }
    setLoading(true)
    await new Promise(r => setTimeout(r, 1000))
    setLoading(false)
    setDone(true)
  }

  if (!user) return null

  if (done) return (
    <div className="page">
      <HoneyNavBar user={user} onLogout={onLogout} />
      
      <div className="page-header-bar">
        <div className="page-header-inner">
          <div className="breadcrumb">
            <span className="breadcrumb-item"><Link to="/dashboard">Home</Link></span>
            <span className="breadcrumb-sep">&gt;</span>
            <span className="breadcrumb-item"><Link to="/transfer">Payments & Transfers</Link></span>
            <span className="breadcrumb-sep">&gt;</span>
            <span className="breadcrumb-item current">Status</span>
          </div>
        </div>
      </div>

      <div className="page-content container">
        <div className="card" style={{maxWidth:560, margin:'0 auto', textAlign:'center', padding: '40px 24px'}}>
          <div className="success-icon">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
          </div>
          <h2 style={{color:'var(--hdfc-navy)', fontSize: 22, fontWeight: 700, marginBottom: 8}}>
            Transfer Successful
          </h2>
          <p style={{color:'var(--text-secondary)', marginBottom: 24}}>
            Your {mode} transfer of <strong style={{color:'var(--text-primary)'}}>₹ {Number(form.amount).toLocaleString('en-IN')}</strong> to{' '}
            <strong style={{color:'var(--text-primary)'}}>{form.beneficiary}</strong> has been initiated.
          </p>

          <div style={{background:'var(--surface-light)', borderRadius: 'var(--radius-sm)', padding: 20, marginBottom: 28, textAlign:'left'}}>
            {[
              ['Reference ID', refId],
              ['Transfer Mode', mode],
              ['Amount', `₹ ${Number(form.amount).toLocaleString('en-IN')}`],
              ['Beneficiary', form.beneficiary],
              ['Account Number', form.account],
              ['Status', 'Success']
            ].map(([k,v]) => (
              <div key={k} className="data-row" style={{padding: '8px 0'}}>
                <span className="data-label">{k}</span>
                <span className="data-value">{v}</span>
              </div>
            ))}
          </div>

          <div className="flex-center flex-gap-3">
             <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>
               Return to Dashboard
             </button>
             <button className="btn btn-outline" onClick={() => {
               setStep(1); setDone(false); setForm({beneficiary:'',account:'',ifsc:'',bank:'HDFC Bank',amount:'',remarks:''});
             }}>
               Make Another Transfer
             </button>
          </div>
        </div>
      </div>
      <HoneyFooter />
    </div>
  )

  return (
    <div className="page">
      <HoneyNavBar user={user} onLogout={onLogout} />

      <div className="page-header-bar">
        <div className="page-header-inner">
          <div className="breadcrumb">
            <span className="breadcrumb-item"><Link to="/dashboard">Home</Link></span>
            <span className="breadcrumb-sep">&gt;</span>
            <span className="breadcrumb-item current">Payments & Transfers</span>
          </div>
        </div>
      </div>

      <div className="page-content container">
        <h1 className="page-title">Fund Transfer</h1>

        <div className="grid-2">
          <div>
            <div className="mode-tabs">
              {['NEFT','IMPS','RTGS'].map(m => (
                <button key={m} className={`mode-tab ${mode===m ? 'active' : ''}`}
                  onClick={() => setMode(m)} type="button">
                  {m}
                </button>
              ))}
            </div>

            <div className="card">
              <div className="card-header">
                {step === 1 ? 'Beneficiary & Transfer Details' : 'Verify Transfer Details'}
              </div>

              {step === 1 ? (
                <form onSubmit={handleSubmit}>
                  <div className="form-group">
                    <label className="form-label form-label-required">Beneficiary Name</label>
                    <input className="form-input" placeholder="Name as per bank records"
                      value={form.beneficiary} onChange={e=>setForm({...form,beneficiary:e.target.value})} required/>
                  </div>
                  
                  <div className="grid-2">
                    <div className="form-group">
                      <label className="form-label form-label-required">Account Number</label>
                      <input className="form-input" placeholder="Enter account number"
                        value={form.account} onChange={e=>setForm({...form,account:e.target.value})} required/>
                    </div>
                    <div className="form-group">
                      <label className="form-label form-label-required">IFSC Code</label>
                      <input className="form-input" placeholder="e.g. HDFC0001234"
                        value={form.ifsc} onChange={e=>setForm({...form,ifsc:e.target.value.toUpperCase()})} required/>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label form-label-required">Beneficiary Bank</label>
                    <select className="form-input" value={form.bank}
                      onChange={e=>setForm({...form,bank:e.target.value})}>
                      {BANKS.map(b=><option key={b}>{b}</option>)}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label form-label-required">Transfer Amount (₹)</label>
                    <input className="form-input" type="number" placeholder="Enter amount"
                      value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})} required min="1"/>
                    <div className="form-hint">Maximum limit based on selected mode.</div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Remarks (Optional)</label>
                    <input className="form-input" placeholder="Add a note for beneficiary"
                      value={form.remarks} onChange={e=>setForm({...form,remarks:e.target.value})} maxLength={50} />
                  </div>

                  <div className="mt-4">
                    <button className="btn btn-primary" type="submit">
                      Proceed to Verify
                    </button>
                    <button className="btn btn-ghost" type="button" style={{marginLeft: 8}} onClick={() => navigate('/dashboard')}>
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div>
                  <div className="alert alert-warning">
                    Please verify the details below. Transfers once initiated cannot be reversed.
                  </div>
                  
                  <div style={{background:'var(--surface-light)', borderRadius:'var(--radius-sm)', padding: 16, marginBottom: 24}}>
                    {[
                      ['Transfer Mode', mode],
                      ['Beneficiary Name', form.beneficiary],
                      ['Account Number', form.account],
                      ['IFSC Code', form.ifsc],
                      ['Bank Name', form.bank],
                      ['Amount', '₹ ' + Number(form.amount).toLocaleString('en-IN')],
                      ['Remarks', form.remarks || '—']
                    ].map(([k,v]) => (
                      <div key={k} className="data-row">
                        <span className="data-label">{k}</span>
                        <span className="data-value">{v}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex-gap-3">
                    <button className="btn btn-primary" disabled={loading} onClick={handleSubmit}>
                      {loading ? <><span className="spinner"/> Processing...</> : 'Confirm Transfer'}
                    </button>
                    <button className="btn btn-outline" onClick={()=>setStep(1)} disabled={loading}>
                      Back to Edit
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="card" style={{height:'fit-content'}}>
              <div className="card-header">Transfer Guidelines & Limits</div>
              <div style={{display:'flex',flexDirection:'column'}}>
                {[
                  {m:'NEFT', limit:'₹ 10 Lakhs / day', time:'Within 2 hours', charge:'₹ 2.50 + GST per txn'},
                  {m:'IMPS', limit:'₹ 5 Lakhs / txn',  time:'Instant (24×7)', charge:'₹ 5.00 + GST per txn'},
                  {m:'RTGS', limit:'Min ₹ 2 Lakhs',    time:'Instant (during bank hours)', charge:'₹ 25.00 + GST per txn'}
                ].map(r => (
                  <div key={r.m} className={`transfer-info-item ${mode===r.m ? 'active' : ''}`} onClick={() => setStep(1) || setMode(r.m)} style={{cursor: 'pointer'}}>
                    <div className="transfer-info-title">{r.m} Transfer</div>
                    <div className="transfer-info-detail">
                      <strong>Limit:</strong> {r.limit} <br/>
                      <strong>Timeline:</strong> {r.time} <br/>
                      <strong>Charges:</strong> <span style={{color:'var(--text-primary)'}}>{r.charge}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="notice-box mt-4">
              <strong>Need Help?</strong> For any issues related to failed transactions or incorrect beneficiary transfers, please contact our 24x7 helpline immediately.
            </div>
          </div>
        </div>
      </div>
      <HoneyFooter />
    </div>
  )
}
