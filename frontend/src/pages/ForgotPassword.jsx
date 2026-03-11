import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { api } from '../api.js'

export default function ForgotPassword({ isLoggedIn }) {
  if (isLoggedIn) return <Navigate to="/dashboard" replace />
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email) {
      setError('Please enter your email.')
      return
    }
    setLoading(true)
    setError('')
    try {
      await api.forgotPassword({ email })
      setSent(true)
    } catch (err) {
      setError(err.message)
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
            {sent ? (
              <div className="text-center py-4 animate-fade-up">
                <div className="text-6xl mb-4">📬</div>
                <h2 className="font-display text-2xl font-bold text-gray-900 dark:text-white mb-3">
                  Check Your Email
                </h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed mb-6">
                  If an account exists for{' '}
                  <strong className="text-gray-800 dark:text-gray-200">{email}</strong>, we've sent
                  a password reset link. Check your inbox and spam folder.
                </p>
                <Link
                  to="/login"
                  className="text-forest-600 hover:text-forest-800 text-sm font-medium transition"
                >
                  ← Back to Login
                </Link>
              </div>
            ) : (
              <>
                <div className="text-center mb-8">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-forest-700 to-eggplant-700 flex items-center justify-center text-2xl mx-auto mb-4 shadow-md">
                    🔑
                  </div>
                  <h2 className="font-display text-2xl font-bold text-gray-900 dark:text-white">
                    Forgot Password?
                  </h2>
                  <p className="text-gray-400 text-sm mt-2">
                    Enter your email and we'll send a reset link.
                  </p>
                </div>
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-5 flex items-center gap-2">
                    <span>⚠️</span> {error}
                  </div>
                )}
                <form onSubmit={handleSubmit} className="space-y-4">
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
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 rounded-xl bg-forest-700 hover:bg-forest-800 text-white font-semibold text-sm transition-all duration-200 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.99]"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Sending...
                      </span>
                    ) : (
                      'Send Reset Link →'
                    )}
                  </button>
                </form>
                <div className="text-center mt-6">
                  <Link
                    to="/login"
                    className="text-sm text-gray-400 hover:text-forest-600 transition"
                  >
                    ← Back to Login
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
