import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Eye, EyeOff, Zap, ArrowRight } from 'lucide-react'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async e => {
    e.preventDefault()
    setLoading(true)
    try {
      await login(form)
      toast.success('Welcome back!')
      navigate('/dashboard')
    } catch (err) {
      const msg = err.response?.data?.error || 'Login failed'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-ink-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* BG glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px]
                      bg-accent/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px]
                      bg-jade/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md animate-fade-up">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-10">
          <div className="w-10 h-10 bg-accent rounded-2xl flex items-center justify-center shadow-glow-accent">
            <Zap size={20} className="text-white" fill="white" />
          </div>
          <span className="font-display font-bold text-2xl text-white">TaskFlow</span>
        </div>

        <div className="card p-8">
          <h1 className="font-display font-bold text-2xl text-white mb-1">Sign in</h1>
          <p className="text-white/40 text-sm mb-8">Welcome back. Let's get things done.</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">Email</label>
              <input type="email" className="input" placeholder="you@company.com"
                value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                required autoFocus />
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} className="input pr-10"
                  placeholder="••••••••"
                  value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  required />
                <button type="button" onClick={() => setShowPw(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 mt-2">
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>Sign in <ArrowRight size={16} /></>
              )}
            </button>
          </form>

          {/* Demo credentials hint */}
          <div className="mt-6 p-3 bg-accent/5 border border-accent/15 rounded-xl">
            <p className="text-xs text-white/40 font-mono text-center">
              No account? <Link to="/signup" className="text-accent hover:text-accent-hover transition-colors font-semibold">Create one free →</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
