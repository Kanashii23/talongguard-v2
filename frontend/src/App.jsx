import { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar.jsx'
import Toast from './components/Toast.jsx'
import Home from './pages/Home.jsx'
import Dashboard from './pages/Dashboard.jsx'
import DiseaseGuide from './pages/DiseaseGuide.jsx'
import About from './pages/About.jsx'
import Login from './pages/Login.jsx'
import ChangePassword from './pages/ChangePassword.jsx'
import ForgotPassword from './pages/ForgotPassword.jsx'
import ResetPassword from './pages/ResetPassword.jsx'
import ManageUsers from './pages/ManageUsers.jsx'
import { api } from './api.js'

// Load persisted user from localStorage
function loadUser() {
  try { return JSON.parse(localStorage.getItem('tg_user')) } catch { return null }
}

export default function App() {
  const [currentUser, setCurrentUser] = useState(loadUser)
  const [records, setRecords]         = useState([])
  const [scansLoaded, setScansLoaded] = useState(false)
  const [toast, setToast]             = useState(null)

  const isLoggedIn = !!currentUser
  const isAdmin    = currentUser?.role === 'admin'

  // Fetch real scan records from backend when logged in
  useEffect(() => {
    if (!currentUser || scansLoaded) return
    api.getScans()
      .then(data => {
        if (data && data.length > 0) {
          setRecords(data)
          setScansLoaded(true)
        }
      })
      .catch(() => {
        // Not logged in or no records yet — keep sample data
      })
  }, [currentUser]) // eslint-disable-line

  function showToast(msg, type = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  function handleLogin(user) {
    setCurrentUser(user)
  }

  function handleLogout() {
    localStorage.removeItem('tg_token')
    localStorage.removeItem('tg_user')
    setCurrentUser(null)
    showToast('👋 Logged out successfully')
  }

  function handlePasswordChanged() {
    // Update local user to clear mustChangePassword
    const updated = { ...currentUser, mustChangePassword: false }
    setCurrentUser(updated)
    localStorage.setItem('tg_user', JSON.stringify(updated))
  }

  return (
    <div className="min-h-screen bg-cream font-body">
      <Navbar
        isLoggedIn={isLoggedIn}
        isAdmin={isAdmin}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      <div className="pt-16">
        <Routes>
          <Route path="/"               element={<Home records={records} />} />
          <Route path="/dashboard"      element={
            <Dashboard
              records={records}
              setRecords={setRecords}
              isLoggedIn={isLoggedIn}
              showToast={showToast}
            />
          } />
          <Route path="/diseases"       element={<DiseaseGuide />} />
          <Route path="/about"          element={<About />} />
          <Route path="/login"          element={<Login onLogin={handleLogin} isLoggedIn={isLoggedIn} />} />
          <Route path="/forgot-password"element={<ForgotPassword isLoggedIn={isLoggedIn} />} />
          <Route path="/reset-password"  element={<ResetPassword isLoggedIn={isLoggedIn} />} />
          <Route path="/change-password"element={
            isLoggedIn
              ? <ChangePassword currentUser={currentUser} onPasswordChanged={handlePasswordChanged} />
              : <Navigate to="/login" />
          } />
          <Route path="/manage-users"   element={
            isAdmin
              ? <ManageUsers showToast={showToast} />
              : <Navigate to="/dashboard" />
          } />
          <Route path="*"               element={<Navigate to="/" />} />
        </Routes>
      </div>

      {toast && <Toast msg={toast.msg} type={toast.type} />}
    </div>
  )
}