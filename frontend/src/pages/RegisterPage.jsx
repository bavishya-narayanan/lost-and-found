import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import Logo from '../components/ui/Logo'
import useAuth from '../hooks/useAuth'
import { registerUser } from '../services/authService'

const DEPARTMENTS = [
  'Computer Science','Engineering','Business Administration','Arts & Humanities',
  'Medicine','Law','Architecture','Natural Sciences','Social Sciences','Education',
]
const YEARS = ['Year 1','Year 2','Year 3','Year 4','Year 5','Postgraduate','PhD']

const selectStyle = {
  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 24 24' fill='none' stroke='%2352525b' stroke-width='2' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M6 9l6 6 6-6' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', backgroundSize: '16px', paddingRight: '40px',
}

export default function RegisterPage() {
  const { saveAuth, isAuthenticated, loading: authLoading } = useAuth()
  const navigate = useNavigate()

  // ALL hooks must be declared before any conditional returns
  const [form, setForm] = useState({ name:'', email:'', department:'', year:'', password:'', confirmPassword:'' })
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
    if (!form.name.trim()) errs.name = 'Full name is required'
    if (!form.email) errs.email = 'Email is required'
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) errs.email = 'Enter a valid email'
    if (!form.department) errs.department = 'Department is required'
    if (!form.year) errs.year = 'Year is required'
    if (!form.password) errs.password = 'Password is required'
    else if (form.password.length < 8) errs.password = 'Minimum 8 characters'
    if (!form.confirmPassword) errs.confirmPassword = 'Please confirm your password'
    else if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match'
    return errs
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    setIsSubmitting(true)
    try {
      const data = await registerUser(form)
      saveAuth(data.token, data.user)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setApiError(err.response?.data?.message || 'Registration failed. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Conditional rendering AFTER all hooks
  if (authLoading) return <div className="min-h-screen bg-[#080808]" />
  if (isAuthenticated) return <Navigate to="/dashboard" replace />

  const selectBase = "w-full rounded-lg bg-[#191919] border border-white/8 text-zinc-300 text-sm px-4 py-3 focus:outline-none focus:border-white/25 focus:bg-[#1e1e1e] transition-all duration-200 appearance-none cursor-pointer"

  return (
    <div className="min-h-screen bg-[#080808] flex">
      {/* Left panel */}
      <motion.div
        initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="hidden lg:flex flex-col justify-between w-[40%] xl:w-[42%] flex-shrink-0 bg-[#0d0d0d] border-r border-white/8 p-12 relative overflow-hidden"
      >
        <div aria-hidden className="pointer-events-none absolute top-0 right-0 w-[350px] h-[350px] rounded-full bg-white/[0.018] blur-[90px]" />
        <div aria-hidden className="pointer-events-none absolute inset-0" style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.012) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.012) 1px, transparent 1px)`,
          backgroundSize: '48px 48px',
        }} />

        <div className="relative z-10"><Logo size="md" /></div>

        <div className="relative z-10 space-y-10">
          <div>
            <p className="text-xs font-semibold text-zinc-600 uppercase tracking-widest mb-6">Join your campus</p>
            <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight tracking-tight mb-5">
              Start recovering<br /><span className="text-zinc-500">your items today.</span>
            </h1>
            <p className="text-sm text-zinc-600 leading-relaxed max-w-xs">
              Create your campus account and let AI handle the heavy lifting of matching lost and found items.
            </p>
          </div>
          <div className="space-y-4">
            {['AI-powered item matching','Real-time push notifications','Verified campus community','Secure handover workflow'].map(item => (
              <div key={item} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-white/8 border border-white/12 flex items-center justify-center flex-shrink-0">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-2.5 h-2.5 text-zinc-300">
                    <path d="M5 12l5 5L20 7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <span className="text-sm text-zinc-400">{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 grid grid-cols-2 gap-4">
          {[['2,400+','Items recovered'],['12+','Campus buildings']].map(([v,l]) => (
            <div key={l} className="p-4 rounded-xl bg-white/4 border border-white/8 text-center">
              <p className="text-xl font-bold text-white">{v}</p>
              <p className="text-xs text-zinc-600 mt-1">{l}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Right panel */}
      <div className="flex-1 flex items-start justify-center px-6 py-12 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut', delay: 0.1 }}
          className="w-full max-w-[440px]"
        >
          <div className="lg:hidden mb-10"><Logo size="md" /></div>

          <div className="mb-10">
            <h2 className="text-2xl font-bold text-white tracking-tight mb-2">Create your account</h2>
            <p className="text-sm text-zinc-500">Fill in your details to join the Findit campus network.</p>
          </div>

          {apiError && (
            <div className="mb-6 px-4 py-3 rounded-lg bg-red-950/50 border border-red-500/30 text-sm text-red-400">
              {apiError}
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit} noValidate>
            <Input label="Full Name" id="reg-name" name="name" type="text"
              placeholder="Jane Smith" autoComplete="name"
              value={form.name} onChange={handleChange} error={errors.name}
            />
            <Input label="University Email" id="reg-email" name="email" type="email"
              placeholder="you@university.edu" autoComplete="email"
              value={form.email} onChange={handleChange} error={errors.email}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="reg-dept" className="text-sm font-medium text-zinc-300">Department</label>
                <select id="reg-dept" name="department" value={form.department} onChange={handleChange}
                  className={`${selectBase} ${errors.department ? 'border-red-500/50' : ''}`} style={selectStyle}
                >
                  <option value="" disabled className="text-zinc-600 bg-[#191919]">Select</option>
                  {DEPARTMENTS.map(d => <option key={d} value={d} className="bg-[#191919] text-zinc-200">{d}</option>)}
                </select>
                {errors.department && <p className="text-xs text-red-400">{errors.department}</p>}
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="reg-year" className="text-sm font-medium text-zinc-300">Year</label>
                <select id="reg-year" name="year" value={form.year} onChange={handleChange}
                  className={`${selectBase} ${errors.year ? 'border-red-500/50' : ''}`} style={selectStyle}
                >
                  <option value="" disabled className="text-zinc-600 bg-[#191919]">Select</option>
                  {YEARS.map(y => <option key={y} value={y} className="bg-[#191919] text-zinc-200">{y}</option>)}
                </select>
                {errors.year && <p className="text-xs text-red-400">{errors.year}</p>}
              </div>
            </div>

            <Input label="Password" id="reg-password" name="password" type="password"
              placeholder="Min. 8 characters" autoComplete="new-password"
              value={form.password} onChange={handleChange} error={errors.password}
            />
            <Input label="Confirm Password" id="reg-confirm" name="confirmPassword" type="password"
              placeholder="Repeat your password" autoComplete="new-password"
              value={form.confirmPassword} onChange={handleChange} error={errors.confirmPassword}
            />

            <p className="text-xs text-zinc-600 leading-relaxed">
              By creating an account you agree to the{' '}
              <span className="text-zinc-400 cursor-pointer hover:text-white transition-colors">Terms of Service</span>{' '}
              and{' '}
              <span className="text-zinc-400 cursor-pointer hover:text-white transition-colors">Privacy Policy</span>.
            </p>

            <div className="pt-1">
              <Button variant="primary" size="lg" fullWidth type="submit" loading={isSubmitting}>
                {isSubmitting ? 'Creating Account…' : 'Create Account'}
              </Button>
            </div>
          </form>

          <div className="flex items-center gap-4 my-8">
            <div className="flex-1 h-px bg-white/8" />
            <span className="text-xs text-zinc-700">or</span>
            <div className="flex-1 h-px bg-white/8" />
          </div>
          <p className="text-center text-sm text-zinc-600">
            Already have an account?{' '}
            <Link to="/login" className="text-zinc-300 hover:text-white font-medium transition-colors">Sign in</Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}
