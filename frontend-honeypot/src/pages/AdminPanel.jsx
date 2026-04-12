import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import OTPTrap from '../components/OTPTrap'
import Footer from '../components/HoneyFooter'

const API = 'http://localhost:8000'

// Fake admin dashboard data
const FAKE_STATS = {
  users: '12,847',
  volume: '₹4.2 Cr',
  activeSessions: 394,
  serverHealth: 98.7,
}

export default function AdminPanel({ sessionId, onNavigate }) {
  const [authed, setAuthed] = useState(false)
  const [form, setForm] = useState({ username: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [adminUser, setAdminUser] = useState('')
  const [showOTP, setShowOTP] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [pulse, setPulse] = useState(0)
  const navigate = useNavigate()

  // Animate stats
  useEffect(() => {
    const t = setInterval(() => setPulse(p => p + 1), 3000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    // Log admin visit
    axios.post(`${API}/honey/event`, { session_id: sessionId, path: '/admin', signal: 'admin_access' })
      .catch(() => {})
  }, [])

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    await new Promise(r => setTimeout(r, 800))
    // Log admin login attempt
    await axios.post(`${API}/honey/auth`, {
      username: form.username, password: form.password, session_id: sessionId
    }).catch(() => {})
    setAdminUser(form.username)
    setAuthed(true)
    setLoading(false)
  }

  const handleExport = async () => {
    // Trigger OTP trap
    await axios.get(`${API}/api/export-users?session_id=${sessionId}`).catch(() => {})
    setShowOTP(true)
  }

  if (!authed) return (
    <div style={{minHeight:'100vh',background:'var(--surface-light)',display:'flex',flexDirection:'column'}}>
      {/* Admin Navbar */}
      <nav style={{background:'#1a1a2e',borderBottom:'3px solid #C8102E',padding:'0 32px',
        height:64,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <span style={{background:'#C8102E',borderRadius:6,width:36,height:36,
            display:'flex',alignItems:'center',justifyContent:'center',fontSize:18}}>⚙️</span>
          <div>
            <div style={{color:'white',fontWeight:700,fontSize:15}}>SecureBank Admin Console</div>
            <div style={{color:'rgba(255,255,255,0.5)',fontSize:11}}>v2.3 — Restricted Access</div>
          </div>
        </div>
        <span style={{color:'rgba(255,255,255,0.4)',fontSize:12}}>🔒 Internal Use Only</span>
      </nav>

      <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',padding:40}}>
        <div style={{background:'white',borderRadius:12,width:'100%',maxWidth:420,
          boxShadow:'0 8px 40px rgba(0,0,0,0.12)',overflow:'hidden'}}>
          <div style={{background:'#1a1a2e',padding:'24px 32px'}}>
            <div style={{color:'#D4A017',fontWeight:700,fontSize:18}}>⚙️ Admin Login</div>
            <div style={{color:'rgba(255,255,255,0.7)',fontSize:13,marginTop:4}}>
              SecureBank Administrative Portal — Authorized Personnel Only
            </div>
          </div>
          <div style={{padding:32}}>
            <div style={{background:'#FFF3CD',borderRadius:6,padding:'10px 14px',
              fontSize:12,color:'#92400E',marginBottom:20,border:'1px solid #FBBF24'}}>
              ⚠️ This portal is for internal use only. Unauthorized access will be prosecuted.
            </div>
            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label className="form-label">Admin Username</label>
                <input className="form-input" placeholder="Enter admin username"
                  value={form.username} onChange={e=>setForm({...form,username:e.target.value})}
                  autoFocus required/>
              </div>
              <div className="form-group">
                <label className="form-label">Admin Password</label>
                <input className="form-input" type="password" placeholder="Enter admin password"
                  value={form.password} onChange={e=>setForm({...form,password:e.target.value})} required/>
              </div>
              <button className="btn btn-primary" type="submit" style={{width:'100%',background:'#1a1a2e'}}
                disabled={loading}>
                {loading ? <><span className="spinner"/> Authenticating...</> : 'Login to Admin Panel →'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div style={{minHeight:'100vh',background:'#0D1117',color:'white',fontFamily:'Inter,sans-serif'}}>
      {showOTP && <OTPTrap sessionId={sessionId} onClose={() => setShowOTP(false)} />}

      {/* Admin Navbar */}
      <nav style={{background:'#161B22',borderBottom:'2px solid #C8102E',padding:'0 32px',
        height:64,display:'flex',alignItems:'center',justifyContent:'space-between',
        position:'sticky',top:0,zIndex:100}}>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <span style={{fontSize:20}}>⚙️</span>
          <div>
            <div style={{fontWeight:700,fontSize:15}}>SecureBank Admin Console</div>
            <div style={{color:'rgba(255,255,255,0.5)',fontSize:11}}>v2.3</div>
          </div>
        </div>
        <div style={{display:'flex',gap:8}}>
          {['overview','users','transactions','config','api'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              background:activeTab===tab?'#003366':'transparent',
              border:activeTab===tab?'1px solid #004d99':'1px solid rgba(255,255,255,0.1)',
              color:'white',padding:'6px 16px',borderRadius:6,cursor:'pointer',fontSize:13,
              textTransform:'capitalize'
            }}>{tab}</button>
          ))}
        </div>
        <div style={{color:'rgba(255,255,255,0.7)',fontSize:13}}>
          👤 Welcome back, <strong style={{color:'#D4A017'}}>{adminUser}</strong>.
          You have <strong style={{color:'#C8102E'}}>3 pending alerts.</strong>
        </div>
      </nav>

      <div style={{padding:32}}>
        {activeTab === 'overview' && (
          <>
            <h2 style={{marginBottom:24,color:'#D4A017'}}>📊 Dashboard Overview</h2>
            {/* Stat cards */}
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16,marginBottom:32}}>
              {[
                {label:'Total Users',value:FAKE_STATS.users,icon:'👥',color:'#003366'},
                {label:'Today\'s Volume',value:FAKE_STATS.volume,icon:'💰',color:'#1A7A4A'},
                {label:'Active Sessions',value:FAKE_STATS.activeSessions+(pulse%2),icon:'🟢',color:'#C8102E'},
                {label:'Server Health',value:FAKE_STATS.serverHealth+'%',icon:'🖥️',color:'#D4A017'},
              ].map(s => (
                <div key={s.label} style={{background:'#161B22',border:'1px solid #30363D',
                  borderRadius:8,padding:20,borderTop:`3px solid ${s.color}`}}>
                  <div style={{fontSize:28,marginBottom:8}}>{s.icon}</div>
                  <div style={{fontSize:26,fontWeight:700,color:s.color}}>{s.value}</div>
                  <div style={{fontSize:12,color:'rgba(255,255,255,0.5)',marginTop:4}}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Action buttons */}
            <div style={{background:'#161B22',border:'1px solid #30363D',borderRadius:8,padding:24}}>
              <h3 style={{marginBottom:16,color:'rgba(255,255,255,0.8)'}}>⚡ Quick Actions</h3>
              <div style={{display:'flex',gap:12,flexWrap:'wrap'}}>
                <button onClick={() => setActiveTab('users')} style={adminBtn('#003366')}>
                  👥 Manage Users
                </button>
                <button onClick={() => setActiveTab('config')} style={adminBtn('#1A7A4A')}>
                  🔑 View Config
                </button>
                <button onClick={handleExport} style={adminBtn('#C8102E')}>
                  📤 Export User Data
                </button>
                <button onClick={() => setActiveTab('api')} style={adminBtn('#D4A017','#1A1A2E')}>
                  📋 API Explorer
                </button>
              </div>
            </div>
          </>
        )}

        {activeTab === 'users' && <UsersTab sessionId={sessionId} />}
        {activeTab === 'transactions' && <TransactionsTab sessionId={sessionId} />}
        {activeTab === 'config' && <ConfigTab sessionId={sessionId} onOTP={() => setShowOTP(true)} />}
        {activeTab === 'api' && <APITab sessionId={sessionId} onOTP={() => setShowOTP(true)} />}
      </div>
    </div>
  )
}

function adminBtn(bg, color='white') {
  return {
    background:bg,color,border:'none',padding:'10px 20px',borderRadius:6,
    fontSize:13,fontWeight:600,cursor:'pointer'
  }
}

function UsersTab({ sessionId }) {
  const [data, setData] = useState([])
  useEffect(() => {
    axios.get(`${API}/api/users?session_id=${sessionId}`).then(r => setData(r.data.slice(0,20))).catch(()=>{})
  }, [])
  return (
    <div>
      <h2 style={{marginBottom:16,color:'#D4A017'}}>👥 User Management ({data.length} shown of 12,847)</h2>
      <div style={{background:'#161B22',border:'1px solid #30363D',borderRadius:8,overflow:'auto'}}>
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
          <thead>
            <tr style={{background:'#003366'}}>
              {['ID','Name','Email','Phone','Account','Balance','KYC'].map(h => (
                <th key={h} style={{padding:'12px 16px',textAlign:'left',color:'white',fontWeight:600}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((u,i) => (
              <tr key={i} style={{borderBottom:'1px solid #30363D',background:i%2?'#0D1117':'#161B22'}}>
                <td style={{padding:'10px 16px',color:'rgba(255,255,255,0.5)'}}>{u.id}</td>
                <td style={{padding:'10px 16px'}}>{u.name}</td>
                <td style={{padding:'10px 16px',color:'#58A6FF',fontFamily:'monospace',fontSize:11}}>{u.email}</td>
                <td style={{padding:'10px 16px'}}>{u.phone}</td>
                <td style={{padding:'10px 16px',fontFamily:'monospace',color:'#79C0FF',fontSize:11}}>{u.account_number}</td>
                <td style={{padding:'10px 16px',color:'#3FB950',fontWeight:600}}>₹{Number(u.balance).toLocaleString('en-IN')}</td>
                <td style={{padding:'10px 16px'}}>
                  <span style={{background:u.kyc_status==='VERIFIED'?'#1A7A4A':'#E05C00',
                    color:'white',padding:'2px 8px',borderRadius:4,fontSize:11}}>{u.kyc_status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function TransactionsTab({ sessionId }) {
  const [data, setData] = useState([])
  useEffect(() => {
    axios.get(`${API}/api/transactions?session_id=${sessionId}`).then(r => setData(r.data.slice(0,20))).catch(()=>{})
  }, [])
  return (
    <div>
      <h2 style={{marginBottom:16,color:'#D4A017'}}>💳 Transaction Ledger (showing 20 of 2,000)</h2>
      <div style={{background:'#161B22',border:'1px solid #30363D',borderRadius:8,overflow:'auto'}}>
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
          <thead>
            <tr style={{background:'#003366'}}>
              {['ID','Account','Type','Mode','Amount','Description','Status'].map(h => (
                <th key={h} style={{padding:'12px 16px',textAlign:'left',color:'white'}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((t,i) => (
              <tr key={i} style={{borderBottom:'1px solid #30363D',background:i%2?'#0D1117':'#161B22'}}>
                <td style={{padding:'10px 16px',color:'rgba(255,255,255,0.5)'}}>{t.id}</td>
                <td style={{padding:'10px 16px',fontFamily:'monospace',fontSize:11}}>{t.account_number}</td>
                <td style={{padding:'10px 16px'}}>
                  <span style={{background:t.txn_type==='CREDIT'?'#1A7A4A':'#C8102E',
                    color:'white',padding:'2px 8px',borderRadius:4,fontSize:11}}>{t.txn_type}</span>
                </td>
                <td style={{padding:'10px 16px'}}>{t.txn_mode}</td>
                <td style={{padding:'10px 16px',color:t.txn_type==='CREDIT'?'#3FB950':'#F85149',fontWeight:600}}>
                  ₹{Number(t.amount).toLocaleString('en-IN')}
                </td>
                <td style={{padding:'10px 16px'}}>{t.description}</td>
                <td style={{padding:'10px 16px'}}>
                  <span style={{background:'#1A7A4A',color:'white',padding:'2px 8px',borderRadius:4,fontSize:11}}>SUCCESS</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function ConfigTab({ sessionId, onOTP }) {
  const [config, setConfig] = useState(null)
  const [envFile, setEnvFile] = useState(false)

  const loadConfig = async () => {
    const r = await axios.get(`${API}/api/config?session_id=${sessionId}`)
    setConfig(r.data)
  }

  const downloadEnv = async () => {
    const r = await axios.get(`${API}/files/.env?session_id=${sessionId}`, {responseType:'blob'})
    const url = URL.createObjectURL(r.data)
    const a = document.createElement('a')
    a.href = url; a.download = '.env'; a.click()
    setEnvFile(true)
  }

  return (
    <div>
      <h2 style={{marginBottom:16,color:'#D4A017'}}>🔑 System Configuration</h2>
      <div style={{display:'flex',gap:12,marginBottom:20}}>
        <button onClick={loadConfig} style={adminBtn('#003366')}>Load Live Config</button>
        <button onClick={downloadEnv} style={adminBtn('#1A7A4A')}>
          ⬇️ Download .env {envFile && '✓'}
        </button>
        <button onClick={onOTP} style={adminBtn('#C8102E')}>Export All Credentials</button>
      </div>
      {config && (
        <div style={{background:'#0D1117',border:'1px solid #30363D',borderRadius:8,padding:24,fontFamily:'monospace',fontSize:12}}>
          {Object.entries(config).map(([k,v]) => (
            <div key={k} style={{padding:'6px 0',borderBottom:'1px solid #21262D',display:'flex',gap:16}}>
              <span style={{color:'#79C0FF',minWidth:220}}>{k}</span>
              <span style={{color:'#3FB950'}}>{v}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function APITab({ sessionId, onOTP }) {
  const ENDPOINTS = [
    {method:'GET',path:'/api/config',desc:'Get live system credentials',action:async()=>{
      const r = await axios.get(`${API}/api/config?session_id=${sessionId}`)
      return JSON.stringify(r.data,null,2)
    }},
    {method:'GET',path:'/api/users',desc:'List all user accounts',action:async()=>{
      const r = await axios.get(`${API}/api/users?session_id=${sessionId}`)
      return `// ${r.data.length} users returned\n` + JSON.stringify(r.data.slice(0,3),null,2) + '\n...'
    }},
    {method:'GET',path:'/api/internal-docs',desc:'Internal API documentation',action:async()=>{
      const r = await axios.get(`${API}/api/internal-docs?session_id=${sessionId}`)
      return JSON.stringify(r.data,null,2)
    }},
    {method:'GET',path:'/api/export-users',desc:'Export all user data [REQUIRES OTP]',action:async()=>{
      onOTP()
      return '// OTP verification required...'
    }},
  ]
  const [output, setOutput] = useState('')
  const [active, setActive] = useState(null)

  const callEndpoint = async (ep, i) => {
    setActive(i)
    setOutput('// Loading...')
    try {
      const res = await ep.action()
      setOutput(res)
    } catch(err) {
      setOutput(`// Error: ${err.message}`)
    }
  }

  return (
    <div>
      <h2 style={{marginBottom:16,color:'#D4A017'}}>📋 API Explorer</h2>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
        <div style={{background:'#161B22',border:'1px solid #30363D',borderRadius:8,overflow:'hidden'}}>
          {ENDPOINTS.map((ep,i) => (
            <div key={i} onClick={() => callEndpoint(ep,i)} style={{
              padding:'14px 20px',borderBottom:'1px solid #30363D',cursor:'pointer',
              background:active===i?'#003366':'transparent',
              transition:'background 0.15s'
            }}>
              <div style={{display:'flex',alignItems:'center',gap:10}}>
                <span style={{background:ep.method==='GET'?'#1A7A4A':'#C8102E',
                  color:'white',padding:'2px 8px',borderRadius:4,fontSize:11,fontFamily:'monospace'}}>
                  {ep.method}
                </span>
                <span style={{fontFamily:'monospace',fontSize:12,color:'#79C0FF'}}>{ep.path}</span>
              </div>
              <div style={{fontSize:11,color:'rgba(255,255,255,0.5)',marginTop:4,marginLeft:54}}>{ep.desc}</div>
            </div>
          ))}
        </div>
        <div style={{background:'#0D1117',border:'1px solid #30363D',borderRadius:8,padding:20}}>
          <div style={{fontSize:11,color:'rgba(255,255,255,0.5)',marginBottom:8}}>// Response Output</div>
          <pre style={{fontFamily:'monospace',fontSize:11,color:'#3FB950',whiteSpace:'pre-wrap',
            lineHeight:1.6,maxHeight:400,overflow:'auto'}}>
            {output || '// Click an endpoint to execute'}
          </pre>
        </div>
      </div>
    </div>
  )
}
