import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { usePage } from '../context/RouterContext.jsx'

const RESEND_COOLDOWN_SECONDS = 30

const ALLOWED_EMAILS = [
  { email: 'pranavkk3199@gmail.com', label: 'Pranav' },
  { email: 'saleshead@primalnutrition.in', label: 'Sales Head' },
]

export default function Login() {
  const { requestOtp, loginWithOtp, user } = useAuth()
  const { navigate } = usePage()

  const [step, setStep] = useState('email') // 'email' | 'code'
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [cooldown, setCooldown] = useState(0)
  const codeInputRef = useRef(null)

  useEffect(() => {
    if (user) navigate('dashboard')
  }, [user, navigate])

  // Resend cooldown ticker
  useEffect(() => {
    if (cooldown <= 0) return
    const t = setInterval(() => setCooldown((c) => (c > 0 ? c - 1 : 0)), 1000)
    return () => clearInterval(t)
  }, [cooldown])

  // Focus the code input when entering step 2
  useEffect(() => {
    if (step === 'code') {
      setTimeout(() => codeInputRef.current?.focus(), 50)
    }
  }, [step])

  const handleSendCode = async (e) => {
    e?.preventDefault?.()
    setError('')
    setInfo('')
    setLoading(true)
    try {
      await requestOtp(email.trim())
      setStep('code')
      setCooldown(RESEND_COOLDOWN_SECONDS)
      setInfo(`We sent a 6-digit code to ${email.trim()}.`)
    } catch (err) {
      if (err.status === 403) {
        setError('This email is not authorized to access the admin dashboard.')
      } else {
        setError(err.message || 'Could not send code. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async (e) => {
    e.preventDefault()
    setError('')
    setInfo('')
    setLoading(true)
    try {
      await loginWithOtp(email.trim(), code.trim())
      navigate('dashboard')
    } catch (err) {
      setError(err.message || 'Verification failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (cooldown > 0) return
    setError('')
    setInfo('')
    setLoading(true)
    try {
      await requestOtp(email.trim())
      setCooldown(RESEND_COOLDOWN_SECONDS)
      setInfo('New code sent.')
    } catch (err) {
      setError(err.message || 'Could not resend code.')
    } finally {
      setLoading(false)
    }
  }

  const handleChangeEmail = () => {
    setStep('email')
    setCode('')
    setError('')
    setInfo('')
    setCooldown(0)
  }

  return (
    <div className="min-h-screen bg-ink flex items-center justify-center px-4">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber/5 rounded-full blur-[100px]" />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-primal mb-4 shadow-lg shadow-amber/30">
            <span className="font-display text-bone text-3xl leading-none">P</span>
          </div>
          <h1 className="font-display text-4xl text-bone tracking-wider mb-1">PRIMAL</h1>
          <p className="text-bone/40 text-sm">Admin Analytics Dashboard</p>
        </div>

        {/* Card */}
        <div className="card p-6">
          {step === 'email' && (
            <form onSubmit={handleSendCode} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-bone/50 mb-2">Choose your account</label>
                <div className="space-y-2">
                  {ALLOWED_EMAILS.map(({ email: e, label }) => {
                    const selected = email === e
                    return (
                      <button
                        type="button"
                        key={e}
                        onClick={() => setEmail(e)}
                        className={`w-full text-left rounded-lg px-3 py-2.5 border transition ${
                          selected
                            ? 'bg-amber/10 border-amber/40 ring-1 ring-amber/30'
                            : 'bg-ink-700 border-bone/10 hover:border-bone/25'
                        }`}
                      >
                        <div className={`text-xs font-medium ${selected ? 'text-amber' : 'text-bone/40'}`}>{label}</div>
                        <div className={`text-sm font-mono ${selected ? 'text-bone' : 'text-bone/70'}`}>{e}</div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2.5">
                  <p className="text-red-400 text-xs">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !email}
                className="w-full btn-primary justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Sending code…
                  </span>
                ) : 'Send code'}
              </button>
            </form>
          )}

          {step === 'code' && (
            <form onSubmit={handleVerify} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-medium text-bone/50">6-digit code</label>
                  <button
                    type="button"
                    onClick={handleChangeEmail}
                    className="text-xs text-bone/50 hover:text-bone/80 transition"
                  >
                    Change email
                  </button>
                </div>
                <input
                  ref={codeInputRef}
                  type="text"
                  inputMode="numeric"
                  pattern="\d{6}"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  required
                  autoComplete="one-time-code"
                  placeholder="000000"
                  className="w-full bg-ink-700 border border-bone/10 rounded-lg px-3 py-2.5 text-center tracking-[0.4em] text-lg text-bone placeholder-bone/25 focus:outline-none focus:border-amber/40 transition"
                />
              </div>

              {info && !error && (
                <div className="bg-amber/8 border border-amber/20 rounded-lg px-3 py-2.5">
                  <p className="text-amber text-xs">{info}</p>
                </div>
              )}

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2.5">
                  <p className="text-red-400 text-xs">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || code.length !== 6}
                className="w-full btn-primary justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Verifying…
                  </span>
                ) : 'Verify & sign in'}
              </button>

              <div className="text-center">
                {cooldown > 0 ? (
                  <p className="text-bone/30 text-xs">Resend code in {cooldown}s</p>
                ) : (
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={loading}
                    className="text-xs text-amber/80 hover:text-amber transition disabled:opacity-50"
                  >
                    Resend code
                  </button>
                )}
              </div>
            </form>
          )}
        </div>

        <p className="text-center text-bone/25 text-xs mt-5">
          Primal Nutrition · Admin Portal · Internal Use Only
        </p>
      </div>
    </div>
  )
}
