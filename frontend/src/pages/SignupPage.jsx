import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Eye, EyeOff, Zap, ArrowRight } from 'lucide-react'
import toast from 'react-hot-toast'

export default function SignupPage() {
  const { signup } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }))

  const handleSubmit = async e => {
    e.preventDefault()
    if (form.password.length < 6) { toast.error('Password must be at least 6 characters'); return }
    setLoading(true)
    try {
      await signup(form)
      toast.success('Account created! 🎉')
      navigate('/dashboard')
    } catch (err) {
      const msg = err.response?.data?.error ||
        err.response?.data?.errors?.[0]?.msg || 'Signup failed'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-ink-950 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px]
                      bg-accent/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px]
                      bg-jade/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md animate-fade-up">
        <div className="flex items-center justify-center gap-3 mb-10">
          <div className="w-10 h-10 bg-accent rounded-2xl flex items-center justify-center shadow-glow-accent">
            <Zap size={20} className="text-white" fill="white" />
          </div>
          <span className="font-display font-bold text-2xl text-white">TaskFlow</span>
        </div>

        <div className="card p-8">
          <h1 className="font-display font-bold text-2xl text-white mb-1">Create account</h1>
          <p className="text-white/40 text-sm mb-8">Start managing your team's work in minutes.</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">Full name</label>
              <input type="text" className="input" placeholder="Alex Johnson"
                value={form.name} onChange={set('name')} required autoFocus minLength={2} />
            </div>

            <div>
              <label className="label">Email</label>
              <input type="email" className="input" placeholder="you@company.com"
                value={form.email} onChange={set('email')} required />
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} className="input pr-10"
                  placeholder="min. 6 characters"
                  value={form.password} onChange={set('password')} required minLength={6} />
                <button type="button" onClick={() => setShowPw(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <p className="mt-1 text-xs text-white/25">At least 6 characters</p>
            </div>

            <button type="submit" disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 mt-2">
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>Create account <ArrowRight size={16} /></>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-white/40">
            Already have an account?{' '}
            <Link to="/login" className="text-accent hover:text-accent-hover transition-colors font-semibold">
              Sign in →
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
