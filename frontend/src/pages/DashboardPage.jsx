import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { dashboardApi } from '../api/client'
import { useAuth } from '../context/AuthContext'
import {
  LayoutDashboard, FolderKanban, CheckSquare, AlertTriangle,
  Clock, TrendingUp, ChevronRight, Calendar, User
} from 'lucide-react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis } from 'recharts'
import { format, formatDistanceToNow } from 'date-fns'

const STATUS_COLORS = {
  TODO: '#4A4A68', IN_PROGRESS: '#38BDF8', REVIEW: '#F59E0B', DONE: '#2DD4A0'
}
const STATUS_LABELS = {
  TODO: 'To Do', IN_PROGRESS: 'In Progress', REVIEW: 'Review', DONE: 'Done'
}
const PRIORITY_COLORS = {
  LOW: '#2DD4A0', MEDIUM: '#38BDF8', HIGH: '#F59E0B', URGENT: '#F87171'
}

function StatCard({ icon: Icon, label, value, sub, color = 'accent', href }) {
  const colorMap = {
    accent: 'text-accent bg-accent/10',
    jade:   'text-jade bg-jade/10',
    amber:  'text-amber bg-amber/10',
    rose:   'text-rose bg-rose/10',
    sky:    'text-sky bg-sky/10'
  }
  const card = (
    <div className="stat-card group">
      <div className="flex items-start justify-between">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${colorMap[color]}`}>
          <Icon size={18} />
        </div>
        {href && <ChevronRight size={14} className="text-white/20 group-hover:text-white/50 transition-colors" />}
      </div>
      <div>
        <p className="text-3xl font-display font-bold text-white">{value}</p>
        <p className="text-xs font-display text-white/40 uppercase tracking-wider mt-0.5">{label}</p>
        {sub && <p className="text-xs text-white/25 mt-1">{sub}</p>}
      </div>
    </div>
  )
  return href ? <Link to={href}>{card}</Link> : card
}

function PriorityBadge({ priority }) {
  const cls = { LOW: 'priority-low', MEDIUM: 'priority-medium', HIGH: 'priority-high', URGENT: 'priority-urgent' }
  return <span className={cls[priority] || 'badge bg-ink-600 text-white/50'}>{priority}</span>
}

function StatusBadge({ status }) {
  const cls = { TODO: 'status-todo', IN_PROGRESS: 'status-in-progress', REVIEW: 'status-review', DONE: 'status-done' }
  return <span className={cls[status] || 'badge bg-ink-600 text-white/50'}>{STATUS_LABELS[status] || status}</span>
}

function TaskRow({ task }) {
  return (
    <Link to={`/projects/${task.project?.id}`}
      className="flex items-center gap-3 p-3 rounded-xl hover:bg-ink-700/50 transition-colors group">
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium truncate ${task.isOverdue ? 'text-rose' : 'text-white/90'}`}>
          {task.isOverdue && <AlertTriangle size={12} className="inline mr-1" />}
          {task.title}
        </p>
        <p className="text-xs text-white/30 truncate mt-0.5">{task.project?.name}</p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <PriorityBadge priority={task.priority} />
        <StatusBadge status={task.status} />
      </div>
    </Link>
  )
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    dashboardApi.get()
      .then(r => setData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
    </div>
  )

  const { stats, statusBreakdown, priorityBreakdown, overdueTasks, dueSoon, myTasks, recentActivity } = data || {}

  const statusData = statusBreakdown ? Object.entries(statusBreakdown).map(([k, v]) => ({
    name: STATUS_LABELS[k], value: v, color: STATUS_COLORS[k]
  })).filter(d => d.value > 0) : []

  const priorityData = priorityBreakdown ? Object.entries(priorityBreakdown).map(([k, v]) => ({
    name: k, value: v, fill: PRIORITY_COLORS[k]
  })).filter(d => d.value > 0) : []

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <p className="text-sm text-accent font-mono mb-1">{greeting} 👋</p>
        <h1 className="page-title text-3xl">{user?.name?.split(' ')[0]}'s Dashboard</h1>
        <p className="text-white/40 text-sm mt-1">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard icon={FolderKanban} label="Projects"    value={stats?.totalProjects} color="accent" href="/projects" />
        <StatCard icon={CheckSquare}  label="Total Tasks" value={stats?.totalTasks}    color="sky" />
        <StatCard icon={User}         label="My Tasks"    value={stats?.myTasks}       color="jade" />
        <StatCard icon={AlertTriangle}label="Overdue"     value={stats?.overdueTasks}  color="rose" />
        <StatCard icon={Clock}        label="Due Soon"    value={stats?.dueSoon}       color="amber" />
        <StatCard icon={TrendingUp}   label="Done Rate"   value={`${stats?.completionRate}%`} color="jade" />
      </div>

      {/* Charts row */}
      {(statusData.length > 0 || priorityData.length > 0) && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Status donut */}
          <div className="card p-6">
            <h3 className="section-title mb-6">Task Status</h3>
            {statusData.length > 0 ? (
              <div className="flex items-center gap-6">
                <ResponsiveContainer width={140} height={140}>
                  <PieChart>
                    <Pie data={statusData} cx="50%" cy="50%" innerRadius={42} outerRadius={65}
                      dataKey="value" stroke="none">
                      {statusData.map((d, i) => <Cell key={i} fill={d.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#1A1A26', border: '1px solid #333348', borderRadius: 10, color: '#fff', fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2">
                  {statusData.map(d => (
                    <div key={d.name} className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: d.color }} />
                      <span className="text-xs text-white/60">{d.name}</span>
                      <span className="text-xs font-mono text-white ml-auto pl-4">{d.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-white/30 text-sm text-center py-8">No tasks yet</p>
            )}
          </div>

          {/* Priority bar */}
          <div className="card p-6">
            <h3 className="section-title mb-6">By Priority</h3>
            {priorityData.length > 0 ? (
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={priorityData} barSize={28}>
                  <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip contentStyle={{ background: '#1A1A26', border: '1px solid #333348', borderRadius: 10, color: '#fff', fontSize: 12 }} />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {priorityData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-white/30 text-sm text-center py-8">No tasks yet</p>
            )}
          </div>
        </div>
      )}

      {/* Bottom grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* My Tasks */}
        <div className="lg:col-span-2 card p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="section-title">My Tasks</h3>
            <Link to="/projects" className="text-xs text-accent hover:text-accent-hover transition-colors font-mono">
              View all →
            </Link>
          </div>
          {myTasks?.length > 0 ? (
            <div className="space-y-1">
              {myTasks.slice(0, 8).map(t => <TaskRow key={t.id} task={t} />)}
            </div>
          ) : (
            <div className="text-center py-10">
              <CheckSquare size={32} className="text-white/20 mx-auto mb-3" />
              <p className="text-white/40 text-sm">No tasks assigned to you yet</p>
            </div>
          )}
        </div>

        {/* Overdue + Due Soon */}
        <div className="space-y-5">
          {/* Overdue */}
          <div className="card p-5">
            <h3 className="section-title text-rose mb-4 flex items-center gap-2">
              <AlertTriangle size={14} /> Overdue
            </h3>
            {overdueTasks?.length > 0 ? (
              <div className="space-y-2">
                {overdueTasks.slice(0, 4).map(t => (
                  <Link key={t.id} to={`/projects/${t.project?.id}`}
                    className="block p-2.5 bg-rose/5 border border-rose/15 rounded-lg hover:border-rose/30 transition-colors">
                    <p className="text-xs font-medium text-rose/90 truncate">{t.title}</p>
                    <p className="text-xs text-white/30 mt-0.5">{t.project?.name}</p>
                    {t.dueDate && (
                      <p className="text-xs text-rose/60 mt-1 flex items-center gap-1">
                        <Calendar size={10} />
                        {formatDistanceToNow(new Date(t.dueDate), { addSuffix: true })}
                      </p>
                    )}
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-white/25 text-xs text-center py-4">🎉 No overdue tasks</p>
            )}
          </div>

          {/* Due Soon */}
          <div className="card p-5">
            <h3 className="section-title text-amber mb-4 flex items-center gap-2">
              <Clock size={14} /> Due Soon
            </h3>
            {dueSoon?.length > 0 ? (
              <div className="space-y-2">
                {dueSoon.slice(0, 4).map(t => (
                  <Link key={t.id} to={`/projects/${t.project?.id}`}
                    className="block p-2.5 bg-amber/5 border border-amber/15 rounded-lg hover:border-amber/30 transition-colors">
                    <p className="text-xs font-medium text-amber/90 truncate">{t.title}</p>
                    <p className="text-xs text-white/30 mt-0.5">{t.project?.name}</p>
                    {t.dueDate && (
                      <p className="text-xs text-amber/60 mt-1 flex items-center gap-1">
                        <Calendar size={10} />
                        {format(new Date(t.dueDate), 'MMM d')}
                      </p>
                    )}
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-white/25 text-xs text-center py-4">Nothing due soon</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
