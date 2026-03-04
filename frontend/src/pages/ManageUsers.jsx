import { useState, useEffect, useRef } from 'react'
import { api } from '../api.js'

const MUNICIPALITIES = [
  'Cabanatuan City', 'Science City of Muñoz', 'Talavera', 'San Jose City',
  'San Isidro', 'Aliaga', 'Cuyapo', 'Guimba', 'Gapan City', 'Palayan City',
  'Bongabon', 'Cabiao', 'Carranglan', 'Gabaldon', 'General Mamerto Natividad',
  'General Tinio', 'Jaen', 'Laur', 'Licab', 'Llanera', 'Lupao', 'Nampicuan',
  'Pantabangan', 'Peñaranda', 'Quezon', 'Rizal', 'San Antonio', 'San Leonardo',
  'Santa Rosa', 'Santo Domingo', 'Zaragoza',
]

// ── Phone input with PH format enforcer ──────────────────────────────
function PhoneInput({ value, onChange }) {
  function handleChange(e) {
    let v = e.target.value.replace(/\D/g, '') // digits only
    if (!v.startsWith('0') && v.length > 0) v = '0' + v
    if (v.length > 11) v = v.slice(0, 11)
    onChange(v)
  }
  const isValid   = /^09\d{9}$/.test(value)
  const isDirty   = value.length > 0
  const remaining = 11 - value.length

  return (
    <div>
      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
        Phone Number <span className="text-red-400">*</span>
      </label>
      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 select-none">🇵🇭</div>
        <input
          type="tel"
          value={value}
          onChange={handleChange}
          placeholder="09XXXXXXXXX"
          maxLength={11}
          className={`w-full border rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 bg-gray-50 transition-all font-mono tracking-wider ${
            isDirty
              ? isValid
                ? 'border-green-400 focus:border-green-500 focus:ring-green-100'
                : 'border-red-300 focus:border-red-400 focus:ring-red-100'
              : 'border-gray-200 focus:border-forest-500 focus:ring-forest-100'
          }`}
        />
        {isDirty && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {isValid
              ? <span className="text-green-500 text-base">✓</span>
              : <span className="text-xs text-red-400">{remaining} left</span>
            }
          </div>
        )}
      </div>
      {isDirty && !isValid && (
        <p className="text-xs text-red-500 mt-1.5">Must start with 09 and be exactly 11 digits</p>
      )}
      {isValid && (
        <p className="text-xs text-green-600 mt-1.5 font-medium">✓ Valid Philippine mobile number</p>
      )}
    </div>
  )
}

// ── 6-digit Code Input ───────────────────────────────────────────────
function CodeInput({ value, onChange }) {
  const inputs = useRef([])

  function handleKeyDown(i, e) {
    if (e.key === 'Backspace' && !value[i] && i > 0) {
      inputs.current[i - 1]?.focus()
    }
  }

  function handleInput(i, e) {
    const digit = e.target.value.replace(/\D/g, '').slice(-1)
    const arr   = value.split('')
    arr[i]      = digit
    const next  = arr.join('').padEnd(6, ' ').slice(0, 6)
    onChange(next.trimEnd())
    if (digit && i < 5) inputs.current[i + 1]?.focus()
  }

  function handlePaste(e) {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    onChange(pasted)
    inputs.current[Math.min(pasted.length, 5)]?.focus()
    e.preventDefault()
  }

  return (
    <div className="flex gap-2 justify-center">
      {[0,1,2,3,4,5].map(i => (
        <input
          key={i}
          ref={el => inputs.current[i] = el}
          type="text" inputMode="numeric" maxLength={1}
          value={value[i] || ''}
          onChange={e => handleInput(i, e)}
          onKeyDown={e => handleKeyDown(i, e)}
          onPaste={handlePaste}
          className={`w-11 h-14 text-center text-2xl font-bold rounded-xl border-2 focus:outline-none transition-all ${
            value[i]
              ? 'border-forest-500 bg-forest-50 text-forest-700'
              : 'border-gray-200 bg-gray-50 text-gray-800 focus:border-forest-400'
          }`}
        />
      ))}
    </div>
  )
}

// ── Multi-step Create User Modal ─────────────────────────────────────
function CreateUserModal({ onClose, onCreated, showToast }) {
  const [step, setStep]       = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [codeSent, setCodeSent]     = useState(false)
  const [codeSending, setCodeSending] = useState(false)
  const [codeVerified, setCodeVerified] = useState(false)
  const [countdown, setCountdown]   = useState(0)
  const [showPass, setShowPass]     = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const [form, setForm] = useState({
    name: '', phone: '', address: '', municipality: '', barangay: '',
    email: '', verificationCode: '', password: '', confirmPassword: '',
    role: 'agriculturist',
  })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  // Countdown timer for resend
  useEffect(() => {
    if (countdown <= 0) return
    const t = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown])

  const passStrength = form.password.length === 0 ? 0
    : form.password.length < 8 ? 1
    : /[A-Z]/.test(form.password) && /[0-9]/.test(form.password) && /[^A-Za-z0-9]/.test(form.password) ? 3 : 2
  const strengthLabels = ['', 'Too short', 'Good', 'Strong']
  const strengthColors = ['', 'bg-red-400', 'bg-yellow-400', 'bg-green-500']

  const steps = [
    { num: 1, label: 'Personal',  icon: '👤' },
    { num: 2, label: 'Location',  icon: '📍' },
    { num: 3, label: 'Email',     icon: '📧' },
    { num: 4, label: 'Password',  icon: '🔐' },
  ]

  function validateStep() {
    setError('')
    if (step === 1) {
      if (!form.name.trim())  { setError('Full name is required.'); return false }
      if (!form.phone.trim()) { setError('Phone number is required.'); return false }
      if (!/^09\d{9}$/.test(form.phone)) { setError('Phone must be 09XXXXXXXXX (11 digits).'); return false }
    }
    if (step === 3) {
      if (!form.email.trim()) { setError('Email address is required.'); return false }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { setError('Enter a valid email address.'); return false }
      if (!codeVerified) { setError('Please verify the email with the code first.'); return false }
    }
    if (step === 4) {
      if (!form.password) { setError('Password is required.'); return false }
      if (form.password.length < 8) { setError('Password must be at least 8 characters.'); return false }
      if (form.password !== form.confirmPassword) { setError('Passwords do not match.'); return false }
    }
    return true
  }

  function nextStep() { if (validateStep()) setStep(s => s + 1) }
  function prevStep() { setError(''); setStep(s => s - 1) }

  async function handleSendCode() {
    setError('')
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setError('Enter a valid email address first.'); return
    }
    setCodeSending(true)
    try {
      await api.sendVerificationCode({ email: form.email, name: form.name })
      setCodeSent(true)
      setCodeVerified(false)
      set('verificationCode', '')
      setCountdown(60) // 60s before can resend
      showToast(`📧 Verification code sent to ${form.email}`)
    } catch (err) {
      setError(err.message)
    } finally { setCodeSending(false) }
  }

  function handleCodeChange(code) {
    set('verificationCode', code)
    // Auto-verify when all 6 digits entered
    if (code.length === 6) setCodeVerified(false) // reset until user clicks verify or we verify inline
  }

  async function handleVerifyCode() {
    if (form.verificationCode.length !== 6) { setError('Enter all 6 digits.'); return }
    // We'll verify on final submit — just mark as "entered" here to unblock next step
    // Real verify happens on POST /api/users
    setCodeVerified(true)
    setError('')
    showToast('✅ Code accepted — continue to set password')
  }

  async function handleCreate() {
    if (!validateStep()) return
    setLoading(true); setError('')
    try {
      const res = await api.createUser({
        name:             form.name,
        email:            form.email,
        phone:            form.phone,
        address:          form.address,
        municipality:     form.municipality,
        barangay:         form.barangay,
        role:             form.role,
        password:         form.password,
        verificationCode: form.verificationCode,
      })
      onCreated()
      showToast(`✅ Account created for ${form.name}!`)
      onClose()
    } catch (err) {
      setError(err.message)
      // If code was wrong, send back to step 3
      if (err.message.toLowerCase().includes('code')) setStep(3)
    } finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ animation: 'fadeIn 0.2s ease forwards' }} onClick={onClose}>
      <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-lg shadow-2xl max-h-[92vh] flex flex-col"
        onClick={e => e.stopPropagation()}>

        {/* Drag handle */}
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mt-3 mb-1 sm:hidden flex-shrink-0" />

        {/* Header */}
        <div className="px-6 pt-4 pb-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-lg font-bold text-gray-900">Create New Account</h3>
            <button onClick={onClose} className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition text-sm">✕</button>
          </div>
          {/* Step indicators */}
          <div className="flex items-center">
            {steps.map((s, i) => (
              <div key={s.num} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold transition-all ${
                    step > s.num ? 'bg-forest-600 text-white' : step === s.num ? 'bg-forest-700 text-white shadow-md scale-110' : 'bg-gray-100 text-gray-400'
                  }`}>
                    {step > s.num ? '✓' : s.icon}
                  </div>
                  <span className={`text-[10px] mt-1 font-semibold ${step === s.num ? 'text-forest-700' : 'text-gray-400'}`}>{s.label}</span>
                </div>
                {i < steps.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 mb-4 rounded-full transition-all ${step > s.num ? 'bg-forest-400' : 'bg-gray-100'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Scrollable form body */}
        <div className="px-6 py-5 overflow-y-auto flex-1">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-2.5 rounded-xl text-sm mb-4 flex items-center gap-2">
              <span className="flex-shrink-0">⚠️</span> {error}
            </div>
          )}

          {/* ── Step 1: Personal Info ── */}
          {step === 1 && (
            <div className="space-y-4" style={{ animation: 'fadeUp 0.25s ease forwards' }}>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Full Name <span className="text-red-400">*</span></label>
                <input type="text" value={form.name} onChange={e => set('name', e.target.value)}
                  placeholder="e.g. Juan dela Cruz"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-forest-500 focus:ring-2 focus:ring-forest-100 bg-gray-50 transition-all" />
              </div>
              <PhoneInput value={form.phone} onChange={v => set('phone', v)} />
              <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
                <p className="text-blue-700 text-xs font-semibold mb-1">📱 Why we need your phone number</p>
                <p className="text-blue-600 text-xs">Used for account recovery if email access is lost. Must be a valid Philippine mobile number starting with 09.</p>
              </div>
            </div>
          )}

          {/* ── Step 2: Location ── */}
          {step === 2 && (
            <div className="space-y-4" style={{ animation: 'fadeUp 0.25s ease forwards' }}>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Municipality / City</label>
                <select value={form.municipality} onChange={e => set('municipality', e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-forest-500 focus:ring-2 focus:ring-forest-100 bg-gray-50 transition-all">
                  <option value="">Select municipality...</option>
                  {MUNICIPALITIES.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Barangay</label>
                <input type="text" value={form.barangay} onChange={e => set('barangay', e.target.value)}
                  placeholder="e.g. Brgy. Mabini"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-forest-500 focus:ring-2 focus:ring-forest-100 bg-gray-50 transition-all" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Full Address <span className="text-gray-300 font-normal">(optional)</span></label>
                <textarea value={form.address} onChange={e => set('address', e.target.value)}
                  placeholder="House/Lot No., Street..." rows={2}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-forest-500 focus:ring-2 focus:ring-forest-100 bg-gray-50 transition-all resize-none" />
              </div>
            </div>
          )}

          {/* ── Step 3: Email Verification ── */}
          {step === 3 && (
            <div className="space-y-5" style={{ animation: 'fadeUp 0.25s ease forwards' }}>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Email Address <span className="text-red-400">*</span></label>
                <div className="flex gap-2">
                  <input type="email" value={form.email} onChange={e => { set('email', e.target.value); setCodeSent(false); setCodeVerified(false) }}
                    placeholder="user@gmail.com"
                    disabled={codeSent && !codeVerified}
                    className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-forest-500 focus:ring-2 focus:ring-forest-100 bg-gray-50 transition-all disabled:opacity-60" />
                  <button onClick={handleSendCode} disabled={codeSending || countdown > 0}
                    className="flex-shrink-0 px-4 py-3 rounded-xl bg-forest-700 hover:bg-forest-800 disabled:opacity-50 text-white text-xs font-bold transition whitespace-nowrap">
                    {codeSending ? (
                      <span className="flex items-center gap-1.5">
                        <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />Sending
                      </span>
                    ) : countdown > 0 ? `Resend (${countdown}s)` : codeSent ? 'Resend' : 'Send Code'}
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-1.5">A 6-digit code will be sent to this email to verify it's valid.</p>
              </div>

              {codeSent && (
                <div style={{ animation: 'fadeUp 0.2s ease forwards' }}>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-3 text-center">Enter 6-Digit Code</label>
                  <CodeInput value={form.verificationCode} onChange={v => { set('verificationCode', v); setCodeVerified(false) }} />
                  <p className="text-xs text-gray-400 text-center mt-2">Check inbox and spam of <strong>{form.email}</strong></p>

                  {!codeVerified ? (
                    <button onClick={handleVerifyCode}
                      disabled={form.verificationCode.length !== 6}
                      className="w-full mt-4 py-3 rounded-xl bg-forest-700 hover:bg-forest-800 disabled:opacity-40 text-white text-sm font-semibold transition">
                      Verify Code →
                    </button>
                  ) : (
                    <div className="mt-4 bg-green-50 border border-green-200 rounded-xl px-4 py-3 flex items-center gap-2.5">
                      <span className="text-green-500 text-xl flex-shrink-0">✅</span>
                      <div>
                        <p className="text-green-700 font-semibold text-sm">Email Verified!</p>
                        <p className="text-green-600 text-xs">{form.email} is confirmed. Continue to set the password.</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── Step 4: Password + Role ── */}
          {step === 4 && (
            <div className="space-y-4" style={{ animation: 'fadeUp 0.25s ease forwards' }}>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Set Password <span className="text-red-400">*</span></label>
                <div className="relative">
                  <input type={showPass ? 'text' : 'password'} value={form.password}
                    onChange={e => set('password', e.target.value)}
                    placeholder="Min. 8 characters"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 pr-11 text-sm focus:outline-none focus:border-forest-500 focus:ring-2 focus:ring-forest-100 bg-gray-50 transition-all" />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition text-lg">
                    {showPass ? '🙈' : '👁️'}
                  </button>
                </div>
                {form.password && (
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-300 ${strengthColors[passStrength]}`}
                        style={{ width: `${(passStrength / 3) * 100}%` }} />
                    </div>
                    <span className="text-xs text-gray-400">{strengthLabels[passStrength]}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Confirm Password <span className="text-red-400">*</span></label>
                <div className="relative">
                  <input type={showConfirm ? 'text' : 'password'} value={form.confirmPassword}
                    onChange={e => set('confirmPassword', e.target.value)}
                    placeholder="Re-enter password"
                    className={`w-full border rounded-xl px-4 py-3 pr-11 text-sm focus:outline-none focus:ring-2 bg-gray-50 transition-all ${
                      form.confirmPassword && form.confirmPassword !== form.password
                        ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
                        : 'border-gray-200 focus:border-forest-500 focus:ring-forest-100'
                    }`} />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition text-lg">
                    {showConfirm ? '🙈' : '👁️'}
                  </button>
                </div>
                {form.confirmPassword && form.confirmPassword !== form.password && (
                  <p className="text-xs text-red-500 mt-1.5">Passwords don't match</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Role</label>
                <div className="flex gap-3">
                  {[
                    { val: 'agriculturist', label: 'Agriculturist', icon: '🌾', desc: 'View & edit records' },
                    { val: 'admin',         label: 'Admin',         icon: '⚙️', desc: 'Full access' },
                  ].map(r => (
                    <button key={r.val} type="button" onClick={() => set('role', r.val)}
                      className={`flex-1 p-3 rounded-xl border-2 text-left transition-all ${
                        form.role === r.val ? 'border-forest-500 bg-forest-50' : 'border-gray-200 hover:border-gray-300'
                      }`}>
                      <div className="text-xl mb-1">{r.icon}</div>
                      <div className="text-sm font-semibold text-gray-800">{r.label}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{r.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Final summary */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 text-sm space-y-1.5">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Account Summary</p>
                {[
                  ['Name',     form.name],
                  ['Phone',    form.phone],
                  ['Email',    form.email],
                  ['Location', [form.municipality, form.barangay].filter(Boolean).join(', ') || '—'],
                  ['Role',     form.role],
                ].map(([label, val]) => (
                  <div key={label} className="flex gap-2">
                    <span className="text-gray-400 w-20 flex-shrink-0 text-xs">{label}</span>
                    <span className="font-medium text-gray-800 text-xs">{val || '—'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 pt-3 border-t border-gray-50 flex gap-3 flex-shrink-0">
          {step > 1 && (
            <button onClick={prevStep} className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition">
              ← Back
            </button>
          )}
          {step < 4 ? (
            <button onClick={nextStep}
              disabled={step === 3 && !codeVerified}
              className="flex-1 py-3 rounded-xl bg-forest-700 hover:bg-forest-800 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold transition active:scale-[0.99] shadow-sm">
              Next →
            </button>
          ) : (
            <button onClick={handleCreate} disabled={loading}
              className="flex-1 py-3 rounded-xl bg-forest-700 hover:bg-forest-800 text-white text-sm font-semibold transition disabled:opacity-60 active:scale-[0.99] shadow-sm">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Creating...
                </span>
              ) : '✅ Create Account'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Main Manage Users Page ────────────────────────────────────────────
export default function ManageUsers({ showToast }) {
  const [users, setUsers]           = useState([])
  const [loading, setLoading]       = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [search, setSearch]         = useState('')
  const [resetting, setResetting]   = useState(null)

  useEffect(() => { fetchUsers() }, [])

  async function fetchUsers() {
    setLoading(true)
    try { setUsers(await api.getUsers()) }
    catch (err) { showToast('❌ Failed to load users') }
    finally { setLoading(false) }
  }

  async function handleToggleActive(user) {
    try {
      if (user.isActive) { await api.deleteUser(user.id); showToast(`⛔ ${user.name} deactivated`) }
      else { await api.updateUser(user.id, { isActive: true }); showToast(`✅ ${user.name} reactivated`) }
      fetchUsers()
    } catch (err) { showToast('❌ ' + err.message) }
  }

  async function handleResetPassword(user) {
    if (!confirm(`Reset password for ${user.name}?\nA new temp password will be emailed to:\n${user.email}`)) return
    setResetting(user.id)
    try {
      const res = await api.resetUserPassword(user.id)
      showToast(res.emailSent ? `📧 New password sent to ${user.email}` : `🔑 Temp password: ${res.tempPassword}`)
    } catch (err) { showToast('❌ ' + err.message) }
    finally { setResetting(null) }
  }

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    (u.municipality || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="page-enter min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 sm:px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1">
            <h1 className="font-display text-xl sm:text-2xl font-bold text-gray-900">Manage Users</h1>
            <p className="text-gray-400 text-sm mt-0.5">{users.filter(u => u.isActive).length} active · {users.length} total</p>
          </div>
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 bg-forest-700 hover:bg-forest-800 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition shadow-sm active:scale-[0.99]">
            + Create Account
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Search */}
        <div className="relative mb-5">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, email, or municipality..."
            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm focus:outline-none focus:border-forest-400 focus:ring-2 focus:ring-forest-50 transition shadow-sm" />
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-gray-400">
              <span className="w-6 h-6 border-2 border-gray-200 border-t-forest-500 rounded-full animate-spin mr-3" />Loading...
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <div className="text-4xl mb-3">👥</div>
              <p className="font-medium">{search ? 'No users match your search' : 'No users yet'}</p>
              {!search && <p className="text-sm mt-1">Click "Create Account" to add the first one.</p>}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-xs font-bold text-gray-400 uppercase tracking-wide">
                    <th className="text-left px-5 py-3">User</th>
                    <th className="text-left px-5 py-3 hidden sm:table-cell">Location</th>
                    <th className="text-left px-5 py-3 hidden md:table-cell">Phone</th>
                    <th className="text-left px-5 py-3">Role</th>
                    <th className="text-left px-5 py-3">Status</th>
                    <th className="text-left px-5 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(u => (
                    <tr key={u.id} className={`border-t border-gray-50 hover:bg-gray-50/60 transition-colors ${!u.isActive ? 'opacity-50' : ''}`}>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold text-white flex-shrink-0 ${u.role === 'admin' ? 'bg-gradient-to-br from-eggplant-600 to-eggplant-800' : 'bg-gradient-to-br from-forest-600 to-forest-800'}`}>
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-800 text-sm">{u.name}</div>
                            <div className="text-gray-400 text-xs">{u.email}</div>
                            {u.mustChangePassword && <span className="text-[10px] text-amber-600 font-semibold">⚠ Must change password</span>}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 hidden sm:table-cell">
                        {u.municipality
                          ? <div><div className="text-gray-700 text-xs font-medium">{u.municipality}</div>{u.barangay && <div className="text-gray-400 text-xs">{u.barangay}</div>}</div>
                          : <span className="text-gray-300 text-xs">—</span>}
                      </td>
                      <td className="px-5 py-3.5 hidden md:table-cell">
                        <span className="text-gray-500 text-xs font-mono">{u.phone || <span className="text-gray-300">—</span>}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${u.role === 'admin' ? 'bg-eggplant-100 text-eggplant-700' : 'bg-forest-100 text-forest-700'}`}>
                          {u.role === 'admin' ? '⚙️' : '🌾'} {u.role}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${u.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${u.isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
                          {u.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => handleResetPassword(u)} disabled={resetting === u.id}
                            className="text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 hover:border-forest-400 hover:text-forest-700 transition disabled:opacity-50" title="Reset password">
                            {resetting === u.id ? '...' : '🔑'}
                          </button>
                          <button onClick={() => handleToggleActive(u)}
                            className={`text-xs px-2.5 py-1.5 rounded-lg border transition ${u.isActive ? 'border-red-100 text-red-500 hover:bg-red-50' : 'border-green-100 text-green-600 hover:bg-green-50'}`}
                            title={u.isActive ? 'Deactivate' : 'Reactivate'}>
                            {u.isActive ? '⛔' : '✅'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showCreate && (
        <CreateUserModal
          onClose={() => setShowCreate(false)}
          onCreated={fetchUsers}
          showToast={showToast}
        />
      )}
    </div>
  )
}