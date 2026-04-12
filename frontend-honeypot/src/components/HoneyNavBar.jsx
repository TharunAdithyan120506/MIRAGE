import { Link, useNavigate, useLocation } from 'react-router-dom'

const NAV_LINKS = [
  { path: '/dashboard', label: 'Accounts & Deposits' },
  { path: '/transfer',  label: 'Payments & Transfers' },
  { path: '/statement', label: 'Statements' },
  { path: null,         label: 'Cards' },
  { path: null,         label: 'Investments' },
]

export default function HoneyNavBar({ user, onLogout }) {
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    if (onLogout) onLogout()
    navigate('/')
  }

  const now = new Date()
  const hour = now.getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <>
      {/* Top Info Bar */}
      <div className="topbar">
        <div className="topbar-inner">
          <div className="topbar-left">
            <span className="topbar-link active">NetBanking</span>
            <span className="topbar-divider">|</span>
            <span className="topbar-link">MobileBanking</span>
            <span className="topbar-divider">|</span>
            <span className="topbar-link">SmartHub</span>
          </div>
          <div className="topbar-right">
            <div className="topbar-secure">
              <svg width="11" height="13" viewBox="0 0 11 13" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="1" y="5" width="9" height="7" rx="1" stroke="#4ade80" strokeWidth="1.5"/>
                <path d="M3.5 5V3.5a2 2 0 014 0V5" stroke="#4ade80" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              256-bit SSL Secured
            </div>
            <span className="topbar-divider">|</span>
            <span className="topbar-link">Customer Care: 1800-202-6161</span>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <nav className="navbar">
        <div className="navbar-inner">
          <Link to="/dashboard" className="navbar-logo">
            <div className="logo-mark">
              <svg viewBox="0 0 34 34" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="1" y="1" width="14" height="14" rx="1" fill="#003580"/>
                <rect x="19" y="1" width="14" height="14" rx="1" fill="#ed1c24"/>
                <rect x="1" y="19" width="14" height="14" rx="1" fill="#ed1c24"/>
                <rect x="19" y="19" width="14" height="14" rx="1" fill="#003580"/>
              </svg>
            </div>
            <div className="logo-wordmark">
              <span className="logo-bank-name">HDFC Bank</span>
              <span className="logo-tagline">NetBanking</span>
            </div>
          </Link>

          <div className="navbar-nav">
            {NAV_LINKS.map((link) => (
              link.path ? (
                <Link
                  key={link.label}
                  to={link.path}
                  className={`nav-link ${location.pathname === link.path ? 'active' : ''}`}
                >
                  {link.label}
                </Link>
              ) : (
                <span key={link.label} className="nav-link" style={{ cursor: 'default', opacity: 0.6 }}>
                  {link.label}
                </span>
              )
            ))}
            {/* The attacker trap links */}
            <span className="nav-link" style={{cursor:'pointer', color: 'rgba(255,255,255,0.4)'}} onClick={()=>navigate('/admin')}>admin_panel</span>
          </div>

          <div className="navbar-actions">
            <div className="navbar-greeting">
              <div className="navbar-user-icon">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="8" r="4" fill="rgba(255,255,255,0.8)"/>
                  <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" fill="rgba(255,255,255,0.8)"/>
                </svg>
              </div>
              <span>{greeting}, {user?.split(' ')[0] || 'User'}</span>
            </div>
            <button className="btn-logout" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
      </nav>
    </>
  )
}
