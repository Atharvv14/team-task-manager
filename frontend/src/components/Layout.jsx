import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  LayoutDashboard, FolderKanban, User, LogOut,
  Menu, X, Zap, ChevronRight
} from 'lucide-react'
import toast from 'react-hot-toast'

function Avatar({ user, size = 8 }) {
  const initials = user?.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '??'
  if (user?.avatar) {
    return <img src={user.avatar} alt={user.name} className={`w-${size} h-${size} rounded-full object-cover`} />
  }
  return (
    <div className={`w-${size} h-${size} avatar text-xs`}
         style={{ fontSize: size <= 6 ? 10 : 13 }}>
      {initials}
    </div>
  )
}

const NAV = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/projects',  icon: FolderKanban,    label: 'Projects' },
  { to: '/profile',   icon: User,            label: 'Profile' }
]

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = () => {
    logout()
    toast.success('Logged out')
    navigate('/login')
  }

  const SidebarContent = () => (
    <aside className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-6">
        <div className="w-8 h-8 bg-accent rounded-xl flex items-center justify-center shadow-glow-accent">
          <Zap size={16} className="text-white" fill="white" />
        </div>
        <span className="font-display font-bold text-lg text-white tracking-tight">TaskFlow</span>
      </div>

      <div className="glow-line mx-4 mb-4" />

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-1">
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} onClick={() => setMobileOpen(false)}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <Icon size={17} />
            <span>{label}</span>
            {/* active indicator */}
          </NavLink>
        ))}
      </nav>

      {/* User footer */}
      <div className="p-4 border-t border-ink-700">
        <NavLink to="/profile"
          className="flex items-center gap-3 p-2 rounded-xl hover:bg-ink-700 transition-colors cursor-pointer"
          onClick={() => setMobileOpen(false)}>
          <Avatar user={user} size={8} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-display font-semibold text-white truncate">{user?.name}</p>
            <p className="text-xs text-white/40 truncate">{user?.email}</p>
          </div>
          <ChevronRight size={14} className="text-white/30" />
        </NavLink>
        <button onClick={handleLogout}
          className="mt-2 w-full flex items-center gap-2 px-3 py-2 rounded-xl
                     text-white/40 hover:text-rose hover:bg-rose/10 text-sm
                     transition-all duration-150 font-body">
          <LogOut size={15} />
          Sign out
        </button>
      </div>
    </aside>
  )

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex flex-col w-60 bg-ink-900 border-r border-ink-700/50 fixed inset-y-0 left-0 z-30">
        <SidebarContent />
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div className="fixed inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <div className="relative w-64 bg-ink-900 border-r border-ink-700/50 flex flex-col animate-slide-in">
            <button onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 text-white/50 hover:text-white">
              <X size={20} />
            </button>
            <SidebarContent />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 lg:ml-60 flex flex-col min-h-screen">
        {/* Mobile top bar */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 bg-ink-900/80 backdrop-blur-md border-b border-ink-700/50 sticky top-0 z-20">
          <button onClick={() => setMobileOpen(true)} className="text-white/60 hover:text-white">
            <Menu size={22} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-accent rounded-lg flex items-center justify-center">
              <Zap size={12} className="text-white" fill="white" />
            </div>
            <span className="font-display font-bold text-base text-white">TaskFlow</span>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export { Avatar }
