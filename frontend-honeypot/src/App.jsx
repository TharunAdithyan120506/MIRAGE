import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import HoneyLogin from './pages/HoneyLogin'
import HoneyDashboard from './pages/HoneyDashboard'
import AdminPanel from './pages/AdminPanel'
import HoneyTransfer from './pages/HoneyTransfer'
import HoneyStatement from './pages/HoneyStatement'
import PhpMyAdmin from './pages/PhpMyAdmin'
import './styles/theme.css'

export default function App() {
  const [user, setUser] = useState(() => sessionStorage.getItem('honey_user'))
  const [sessionId, setSessionId] = useState(() => sessionStorage.getItem('honey_session'))

  const handleLogin = (username, sid) => {
    sessionStorage.setItem('honey_user', username)
    if (sid) sessionStorage.setItem('honey_session', sid)
    setUser(username)
    setSessionId(sid)
  }

  const handleLogout = () => {
    sessionStorage.clear()
    setUser(null)
    setSessionId(null)
  }

  const props = { user, sessionId, onLogout: handleLogout }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={user ? <Navigate to="/dashboard"/> : <HoneyLogin onLogin={handleLogin}/>} />
        <Route path="/dashboard" element={user ? <HoneyDashboard {...props}/> : <Navigate to="/"/>} />
        <Route path="/transfer"  element={user ? <HoneyTransfer  {...props}/> : <Navigate to="/"/>} />
        <Route path="/statement" element={user ? <HoneyStatement {...props}/> : <Navigate to="/"/>} />
        {/* Trap routes — accessible without "auth" to simulate exposed admin */}
        <Route path="/admin"      element={<AdminPanel sessionId={sessionId} />} />
        <Route path="/phpmyadmin" element={<PhpMyAdmin sessionId={sessionId} />} />
        <Route path="*" element={<Navigate to="/"/>} />
      </Routes>
    </BrowserRouter>
  )
}
