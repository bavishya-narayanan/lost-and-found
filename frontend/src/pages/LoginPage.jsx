import { useState } from 'react'
import { Link, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import Logo from '../components/ui/Logo'
import useAuth from '../hooks/useAuth'
import { loginUser } from '../services/authService'

export default function LoginPage() {
  const { saveAuth, isAuthenticated, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || '/dashboard'

  // ALL hooks must be declared before any conditional returns
  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [apiError, setApiError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }))
    setApiError('')
  }

  const validate = () => {
    const errs = {}
    if (!form.email) errs.email = 'Email is required'
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) errs.email = 'Please enter a valid email'
    if (!form.password) errs.password = 'Password is required'
    return errs
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    setIsSubmitting(true)
    try {
      const data = await loginUser({ email: form.email, password: form.password })
      saveAuth(data.token, data.user)
      navigate(from, { replace: true })
    } catch (err) {
      setApiError(err.response?.data?.message || 'Login failed. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Conditional rendering AFTER all hooks
  if (authLoading) return <div className="min-h-screen bg-[#080808]" />
  if (isAuthenticated) return <Navigate to={from} replace />

  return (
    <div className="min-h-screen bg-[#080808] flex">
      {/* Left panel */}
      <motion.div
        initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="hidden lg:flex flex-col justify-between w-[42%] xl:w-[45%] flex-shrink-0 bg-[#0d0d0d] border-r border-white/8 p-12 relative overflow-hidden"
      >
        <div aria-hidden className="pointer-events-none absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-white/[0.015] blur-[100px]" />
        <div aria-hidden className="pointer-events-none absolute inset-0" style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.012) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.012) 1px, transparent 1px)`,
          backgroundSize: '48px 48px',
        }} />

        <div className="relative z-10"><Logo size="md" /></div>

        <div className="relative z-10">
          <p className="text-xs font-semibold text-zinc-600 uppercase tracking-widest mb-6">Campus Lost & Found</p>
          <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight tracking-tight mb-6">
            Find your<br />belongings,<br /><span className="text-zinc-500">faster than ever.</span>
          </h1>
          <p className="text-sm text-zinc-600 leading-relaxed max-w-xs">
            An intelligent platform helping students across campus recover lost items through AI-powered matching.
          </p>
        </div>

        <div className="relative z-10 p-5 rounded-xl bg-white/4 border border-white/8">
          <p className="text-sm text-zinc-400 leading-relaxed mb-4">
            "Got my laptop back within 2 hours of filing a report. The matching was spot on."
          </p>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center text-xs font-bold text-zinc-300">AS</div>
            <div>
              <p className="text-xs font-medium text-zinc-300">Aisha S.</p>
              <p className="text-xs text-zinc-600">Computer Science, Year 2</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 lg:py-0">
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut', delay: 0.1 }}
          className="w-full max-w-[420px]"
        >
          <div className="lg:hidden mb-10"><Logo size="md" /></div>

          <div className="mb-10">
            <h2 className="text-2xl font-bold text-white tracking-tight mb-2">Welcome back</h2>
            <p className="text-sm text-zinc-500">Sign in to your Findit account to continue.</p>
          </div>

          {/* API error */}
          {apiError && (
            <div className="mb-6 px-4 py-3 rounded-lg bg-red-950/50 border border-red-500/30 text-sm text-red-400">
              {apiError}
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit} noValidate>
            <Input
              label="Email address" id="login-email" name="email" type="email"
              placeholder="you@university.edu" autoComplete="email"
              value={form.email} onChange={handleChange} error={errors.email}
            />
            <div className="space-y-1.5">
              <Input
                label="Password" id="login-password" name="password" type="password"
                placeholder="••••••••••" autoComplete="current-password"
                value={form.password} onChange={handleChange} error={errors.password}
              />
              <div className="flex justify-end">
                <button type="button" className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer">
                  Forgot password?
                </button>
              </div>
            </div>
            <div className="pt-2">
              <Button variant="primary" size="lg" fullWidth type="submit" loading={isSubmitting}>
                {isSubmitting ? 'Signing in…' : 'Sign In'}
              </Button>
            </div>
          </form>

          <div className="flex items-center gap-4 my-8">
            <div className="flex-1 h-px bg-white/8" />
            <span className="text-xs text-zinc-700">or</span>
            <div className="flex-1 h-px bg-white/8" />
          </div>

          <p className="text-center text-sm text-zinc-600">
            Don't have an account?{' '}
            <Link to="/register" className="text-zinc-300 hover:text-white font-medium transition-colors">Create account</Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}
