import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { User, Mail, Save, Shield } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

export default function ProfilePage() {
  const { user, updateProfile } = useAuth()
  const [form, setForm] = useState({ name: user?.name || '', avatar: user?.avatar || '' })
  const [loading, setLoading] = useState(false)

  const initials = user?.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '??'

  const handleSubmit = async e => {
    e.preventDefault()
    setLoading(true)
    try {
      await updateProfile(form)
      toast.success('Profile updated!')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl space-y-6 animate-fade-in">
      <div>
        <h1 className="page-title">Profile</h1>
        <p className="text-white/40 text-sm mt-1">Manage your account settings</p>
      </div>

      {/* Avatar */}
      <div className="card p-6">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 avatar text-xl flex-shrink-0">
            {user?.avatar
              ? <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" />
              : initials}
          </div>
          <div>
            <h2 className="font-display font-bold text-lg text-white">{user?.name}</h2>
            <p className="text-white/40 text-sm">{user?.email}</p>
            <p className="text-white/25 text-xs mt-1 font-mono">
              Member since {user?.createdAt ? format(new Date(user.createdAt), 'MMMM yyyy') : '—'}
            </p>
          </div>
        </div>
      </div>

      {/* Edit form */}
      <div className="card p-6">
        <h3 className="section-title mb-5">Edit Profile</h3>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="label flex items-center gap-1"><User size={10} /> Display Name</label>
            <input className="input" placeholder="Your name"
              value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              required minLength={2} />
          </div>

          <div>
            <label className="label flex items-center gap-1"><Mail size={10} /> Email</label>
            <input className="input" value={user?.email} disabled
              style={{ opacity: 0.4, cursor: 'not-allowed' }} />
            <p className="text-xs text-white/25 mt-1">Email cannot be changed</p>
          </div>

          <div>
            <label className="label">Avatar URL (optional)</label>
            <input className="input" placeholder="https://…"
              value={form.avatar}
              onChange={e => setForm(p => ({ ...p, avatar: e.target.value }))} />
            <p className="text-xs text-white/25 mt-1">Paste a direct image URL (JPEG or PNG)</p>
          </div>

          <button type="submit" disabled={loading}
            className="btn-primary flex items-center gap-2">
            <Save size={15} />
            {loading ? 'Saving…' : 'Save Changes'}
          </button>
        </form>
      </div>

      {/* Security info */}
      <div className="card p-6">
        <h3 className="section-title mb-4 flex items-center gap-2"><Shield size={14} /> Security</h3>
        <div className="flex items-center justify-between p-3 bg-ink-700/40 rounded-xl border border-ink-600/30">
          <div>
            <p className="text-sm font-medium text-white">Password</p>
            <p className="text-xs text-white/35 mt-0.5">Last changed: Unknown</p>
          </div>
          <span className="text-xs text-white/25 font-mono">••••••••</span>
        </div>
        <p className="text-xs text-white/25 mt-3">Password change coming in a future update.</p>
      </div>
    </div>
  )
}
