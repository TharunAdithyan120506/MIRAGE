import { Link, useNavigate } from 'react-router-dom'
import NavBar from '../components/NavBar'
import Footer from '../components/Footer'

export default function Profile({ user, onLogout }) {
  const navigate = useNavigate()
  if (!user) { navigate('/'); return null }

  return (
    <div className="page">
      <NavBar user={user} onLogout={onLogout} />

      <div className="page-header-bar">
        <div className="page-header-inner">
          <div className="breadcrumb">
            <span className="breadcrumb-item"><Link to="/dashboard">Home</Link></span>
            <span className="breadcrumb-sep">&gt;</span>
            <span className="breadcrumb-item current">My Profile</span>
          </div>
        </div>
      </div>

      <div className="page-content container">
        <h1 className="page-title">Personal Profile</h1>

        <div className="grid-2">
          <div className="grid-col-stack">
            <div className="card">
              <div className="card-header">Personal Information</div>
              <div style={{display:'flex',flexDirection:'column'}}>
                {[
                  ['Full Name', user.name],
                  ['Customer ID', '7823' + user.account?.slice(-4)],
                  ['Account Number', user.account],
                  ['Account Type', 'Savings Account — Premium'],
                  ['IFSC Code', user.ifsc],
                  ['Date of Birth', '12/08/1988'],
                  ['PAN Number', 'ABCPS****E'],
                  ['Aadhaar Number', '********' + Math.floor(1000+Math.random()*9000)],
                ].map(([label, value]) => (
                  <div key={label} className="data-row">
                    <span className="data-label">{label}</span>
                    <span className="data-value">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <div className="card-header">Contact & Address</div>
              <div style={{display:'flex',flexDirection:'column'}}>
                {[
                  ['Registered Mobile', '+91 98****1234'],
                  ['Email Address', user.name?.toLowerCase().replace(' ','.')+'@gmail.com'],
                  ['Communication Address', '42, MG Road, Koramangala, Bangalore, Karnataka — 560034, India'],
                ].map(([label, value]) => (
                  <div key={label} className="data-row">
                    <span className="data-label">{label}</span>
                    <span className="data-value" style={{maxWidth: 240}}>{value}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <button className="btn btn-outline btn-sm">Update Contact Details</button>
              </div>
            </div>
          </div>

          <div className="grid-col-stack">
            <div className="card">
              <div className="card-header">KYC & Verification</div>
              <div className="flex-gap-3" style={{padding: '12px 0'}}>
                <div style={{color: 'var(--green)'}}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                </div>
                <div>
                  <div className="font-bold text-green" style={{fontSize: 18, marginBottom: 2}}>KYC Verified</div>
                  <div className="text-muted" style={{fontSize: 13}}>
                    Status Active. Valid till: 15-Jan-2027
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-4" style={{borderTop: '1px solid var(--surface-light)'}}>
                <a href="#" className="btn-ghost" style={{fontSize: 13, fontWeight: 600}}>Re-KYC Document Upload →</a>
              </div>
            </div>

            <div className="card">
              <div className="card-header">Nominee Information</div>
              <div style={{display:'flex',flexDirection:'column'}}>
                {[
                  ['Nominee Name', 'Sunita ' + user.name?.split(' ')[1]],
                  ['Relationship', 'Spouse'],
                  ['Allocation %', '100%'],
                  ['Registration Date', '24-May-2022'],
                ].map(([label, value]) => (
                  <div key={label} className="data-row">
                    <span className="data-label">{label}</span>
                    <span className="data-value">{value}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <button className="btn btn-outline btn-sm">Manage Nominee</button>
              </div>
            </div>
            
            <div className="card" style={{background: 'var(--surface-light)'}}>
              <div className="card-header">Security Settings</div>
              <ul style={{paddingLeft: 20, color: 'var(--hdfc-navy)', fontSize: 13, lineHeight: 2}}>
                <li><a href="#">Change IPIN (Password)</a></li>
                <li><a href="#">Manage Login Devices</a></li>
                <li><a href="#">Set Transaction Limits</a></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
