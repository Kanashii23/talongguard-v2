import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link, Navigate } from 'react-router-dom'
import { api } from '../api.js'

export default function ResetPassword({ isLoggedIn }) {
  if (isLoggedIn) return <Navigate to="/dashboard" replace />
  const [searchParams] = useSearchParams()
  const [newPass, setNewPass] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const navigate = useNavigate()
  const token = searchParams.get('token')

  useEffect(() => {
    if (!token) setError('Invalid or missing reset link. Please request a new one.')
  }, [token])

  const strength =
    newPass.length === 0
      ? 0
      : newPass.length < 8
        ? 1
        : /[A-Z]/.test(newPass) && /[0-9]/.test(newPass) && /[^A-Za-z0-9]/.test(newPass)
          ? 3
          : 2
  const strengthLabels = ['', 'Too short', 'Good', 'Strong']
  const strengthColors = ['', 'bg-red-400', 'bg-yellow-400', 'bg-green-500']

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!token) {
      setError('Invalid reset link.')
      return
    }
    if (newPass.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (newPass !== confirm) {
      setError('Passwords do not match.')
      return
    }
    setLoading(true)
    try {
      await api.resetPassword({ token, newPassword: newPass })
      setSuccess(true)
      setTimeout(() => navigate('/login'), 2500)
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
            {success ? (
              <div className="text-center py-4 animate-fade-up">
                <div className="text-6xl mb-4">✅</div>
                <h2 className="font-display text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Password Reset!
                </h2>
                <p className="text-gray-400 text-sm mb-6">
                  Your password has been updated successfully. Redirecting to login...
                </p>
                <div className="w-8 h-8 border-2 border-forest-200 border-t-forest-600 rounded-full animate-spin mx-auto" />
              </div>
            ) : (
              <>
                <div className="text-center mb-8">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-forest-700 to-eggplant-700 flex items-center justify-center text-2xl mx-auto mb-4 shadow-md">
                    🔐
                  </div>
                  <h2 className="font-display text-2xl font-bold text-gray-900 dark:text-white">
                    Set New Password
                  </h2>
                  <p className="text-gray-400 text-sm mt-2">Enter your new password below.</p>
                </div>
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-5 flex items-center gap-2">
                    <span>⚠️</span> {error}
                    {!token && (
                      <Link
                        to="/forgot-password"
                        className="ml-auto text-red-600 underline font-medium text-xs whitespace-nowrap"
                      >
                        Request new link
                      </Link>
                    )}
                  </div>
                )}
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPass ? 'text' : 'password'}
                        value={newPass}
                        onChange={(e) => setNewPass(e.target.value)}
                        placeholder="At least 8 characters"
                        disabled={!token}
                        className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 pr-11 text-sm focus:outline-none focus:border-forest-500 focus:ring-2 focus:ring-forest-100 bg-gray-50 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500 transition-all disabled:opacity-50"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPass(!showPass)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition text-lg"
                      >
                        {showPass ? '🙈' : '👁️'}
                      </button>
                    </div>
                    {newPass && (
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${strengthColors[strength]}`}
                            style={{ width: `${(strength / 3) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-400">{strengthLabels[strength]}</span>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                      Confirm Password
                    </label>
                    <input
                      type={showPass ? 'text' : 'password'}
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      placeholder="Re-enter your password"
                      disabled={!token}
                      className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 bg-gray-50 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500 transition-all disabled:opacity-50 ${
                        confirm && confirm !== newPass
                          ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
                          : 'border-gray-200 dark:border-gray-700 focus:border-forest-500 focus:ring-forest-100'
                      }`}
                    />
                    {confirm && confirm !== newPass && (
                      <p className="text-xs text-red-500 mt-1.5">Passwords don't match</p>
                    )}
                  </div>
                  <button
                    type="submit"
                    disabled={loading || !token}
                    className="w-full py-3.5 rounded-xl bg-forest-700 hover:bg-forest-800 text-white font-semibold text-sm transition-all duration-200 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed mt-2 active:scale-[0.99]"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Saving...
                      </span>
                    ) : (
                      'Reset Password →'
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
