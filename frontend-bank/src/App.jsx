import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Transfer from './pages/Transfer'
import Statement from './pages/Statement'
import Profile from './pages/Profile'
import './styles/theme.css'

export default function App() {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('mirage_bank_user')) } catch { return null }
  })

  const handleLogin = (userData, token) => {
    sessionStorage.setItem('mirage_bank_user', JSON.stringify(userData))
    sessionStorage.setItem('mirage_bank_token', token)
    setUser(userData)
  }

  const handleLogout = () => {
    sessionStorage.removeItem('mirage_bank_user')
    sessionStorage.removeItem('mirage_bank_token')
    setUser(null)
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={
          user ? <Navigate to="/dashboard" replace /> : <Login onLogin={handleLogin} />
        } />
        <Route path="/dashboard" element={
          user ? <Dashboard user={user} onLogout={handleLogout} /> : <Navigate to="/" replace />
        } />
        <Route path="/transfer" element={
          user ? <Transfer user={user} onLogout={handleLogout} /> : <Navigate to="/" replace />
        } />
        <Route path="/statement" element={
          user ? <Statement user={user} onLogout={handleLogout} /> : <Navigate to="/" replace />
        } />
        <Route path="/profile" element={
          user ? <Profile user={user} onLogout={handleLogout} /> : <Navigate to="/" replace />
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
