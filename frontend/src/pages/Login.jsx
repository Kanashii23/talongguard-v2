import { useState } from 'react'
import { useNavigate, Link, Navigate } from 'react-router-dom'
import { api } from '../api.js'

export default function Login({ onLogin, isLoggedIn }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const navigate = useNavigate()

  if (isLoggedIn) return <Navigate to="/dashboard" replace />

  async function handleLogin(e) {
    e.preventDefault()
    if (!email || !password) {
      setError('Please enter both email and password.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const data = await api.login({ email, password })
      localStorage.setItem('tg_token', data.token)
      localStorage.setItem('tg_user', JSON.stringify(data.user))
      onLogin(data.user)
      if (data.user.mustChangePassword) navigate('/change-password')
      else navigate('/dashboard')
    } catch (err) {
      setError(err.message || 'Invalid email or password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-enter min-h-[calc(100vh-64px)] flex items-center justify-center px-4 bg-gradient-to-br from-forest-50 via-cream to-eggplant-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-forest-600 via-emerald-500 to-eggplant-600" />
          <div className="p-8 sm:p-10">
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-forest-700 to-eggplant-700 flex items-center justify-center text-3xl mx-auto mb-5 shadow-lg">
                🍆
              </div>
              <h2 className="font-display text-2xl font-bold text-gray-900 dark:text-white">
                Welcome Back
              </h2>
              <p className="text-gray-400 text-sm mt-2">Sign in to your TalongGuard account</p>
            </div>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-5 flex items-center gap-2 animate-fade-in">
                <span>⚠️</span> {error}
              </div>
            )}
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@email.com"
                  autoComplete="email"
                  className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-forest-500 focus:ring-2 focus:ring-forest-100 bg-gray-50 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    autoComplete="current-password"
                    className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 pr-11 text-sm focus:outline-none focus:border-forest-500 focus:ring-2 focus:ring-forest-100 bg-gray-50 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition text-lg"
                  >
                    {showPass ? '🙈' : '👁️'}
                  </button>
                </div>
                <div className="flex justify-end mt-1.5">
                  <Link
                    to="/forgot-password"
                    className="text-xs text-forest-600 hover:text-forest-800 font-medium transition"
                  >
                    Forgot password?
                  </Link>
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-forest-700 hover:bg-forest-800 text-white font-semibold text-sm transition-all duration-200 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed mt-2 active:scale-[0.99]"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing in...
                  </span>
                ) : (
                  'Sign In →'
                )}
              </button>
            </form>
            <p className="text-center text-xs text-gray-400 mt-6">
              🔒 Access is managed by the System Administrator
            </p>
          </div>
        </div>
        <p className="text-center text-xs text-gray-400 mt-5">
          Don't have an account? Contact your administrator.
        </p>
      </div>
    </div>
  )
}
