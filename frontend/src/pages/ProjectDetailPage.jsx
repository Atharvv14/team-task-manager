import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { projectsApi, tasksApi } from '../api/client'
import { useAuth } from '../context/AuthContext'
import TaskModal from '../components/TaskModal'
import {
  Plus, Users, Settings, ArrowLeft, AlertTriangle, Calendar,
  LayoutGrid, List, X, Mail, Shield, UserMinus, UserCheck
} from 'lucide-react'
import toast from 'react-hot-toast'
import { format, formatDistanceToNow } from 'date-fns'

const COLUMNS = [
  { key: 'TODO',        label: 'To Do',      color: '#4A4A68' },
  { key: 'IN_PROGRESS', label: 'In Progress', color: '#38BDF8' },
  { key: 'REVIEW',      label: 'Review',      color: '#F59E0B' },
  { key: 'DONE',        label: 'Done',        color: '#2DD4A0' }
]

const PRIORITY_COLORS = { LOW:'#2DD4A0', MEDIUM:'#38BDF8', HIGH:'#F59E0B', URGENT:'#F87171' }

function Avatar({ user, size = 7 }) {
  const initials = user?.name?.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase() || '?'
  if (user?.avatar) return <img src={user.avatar} alt={user.name} className={`w-${size} h-${size} rounded-full object-cover`} />
  return (
    <div className={`w-${size} h-${size} avatar text-[10px]`}>{initials}</div>
  )
}

function TaskCard({ task, onClick }) {
  const priorityColor = PRIORITY_COLORS[task.priority] || '#4A4A68'
  const isOverdue = task.isOverdue
  return (
    <div onClick={onClick} className="task-card select-none">
      {/* Priority stripe */}
      <div className="w-full h-0.5 rounded-full mb-3" style={{ background: priorityColor + '60' }} />

      <p className={`text-sm font-medium leading-snug mb-2 ${isOverdue ? 'text-rose' : 'text-white/90'}`}>
        {isOverdue && <AlertTriangle size={11} className="inline mr-1" />}
        {task.title}
      </p>

      {task.description && (
        <p className="text-xs text-white/35 line-clamp-2 mb-3">{task.description}</p>
      )}

      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-2">
          <span className="badge text-[10px] px-2 py-0.5" style={{ background: priorityColor + '20', color: priorityColor }}>
            {task.priority}
          </span>
          {task.dueDate && (
            <span className={`text-[10px] flex items-center gap-1 ${isOverdue ? 'text-rose' : 'text-white/30'}`}>
              <Calendar size={9} />
              {format(new Date(task.dueDate), 'MMM d')}
            </span>
          )}
        </div>
        {task.assignee && <Avatar user={task.assignee} size={6} />}
      </div>
    </div>
  )
}

function KanbanBoard({ tasks, userRole, onTaskClick, onAddTask }) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
      {COLUMNS.map(col => {
        const colTasks = tasks.filter(t => t.status === col.key)
        return (
          <div key={col.key} className="kanban-col">
            {/* Column header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ background: col.color }} />
                <span className="text-xs font-display font-semibold text-white/60 uppercase tracking-wider">
                  {col.label}
                </span>
                <span className="text-xs font-mono text-white/30 bg-ink-700 px-1.5 py-0.5 rounded-full">
                  {colTasks.length}
                </span>
              </div>
              <button onClick={() => onAddTask(col.key)}
                className="text-white/30 hover:text-accent transition-colors hover:bg-accent/10 rounded-lg p-1">
                <Plus size={14} />
              </button>
            </div>

            {/* Cards */}
            <div className="space-y-3">
              {colTasks.map(t => (
                <TaskCard key={t.id} task={t} onClick={() => onTaskClick(t)} />
              ))}
              {colTasks.length === 0 && (
                <div className="text-center py-8 border border-dashed border-ink-600/30 rounded-xl">
                  <p className="text-xs text-white/20">No tasks</p>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function ListView({ tasks, onTaskClick }) {
  const STATUS_LABELS = { TODO: 'To Do', IN_PROGRESS: 'In Progress', REVIEW: 'Review', DONE: 'Done' }
  return (
    <div className="card overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-ink-700">
            <th className="text-left text-xs font-display font-semibold text-white/40 uppercase tracking-wider px-5 py-3">Task</th>
            <th className="text-left text-xs font-display font-semibold text-white/40 uppercase tracking-wider px-4 py-3 hidden md:table-cell">Status</th>
            <th className="text-left text-xs font-display font-semibold text-white/40 uppercase tracking-wider px-4 py-3 hidden lg:table-cell">Priority</th>
            <th className="text-left text-xs font-display font-semibold text-white/40 uppercase tracking-wider px-4 py-3 hidden lg:table-cell">Assignee</th>
            <th className="text-left text-xs font-display font-semibold text-white/40 uppercase tracking-wider px-4 py-3 hidden xl:table-cell">Due</th>
          </tr>
        </thead>
        <tbody>
          {tasks.length === 0 && (
            <tr><td colSpan={5} className="text-center text-white/30 text-sm py-12">No tasks yet</td></tr>
          )}
          {tasks.map(task => (
            <tr key={task.id} onClick={() => onTaskClick(task)}
              className="border-b border-ink-700/50 hover:bg-ink-700/30 cursor-pointer transition-colors group">
              <td className="px-5 py-3">
                <p className={`text-sm font-medium ${task.isOverdue ? 'text-rose' : 'text-white/90'} group-hover:text-white transition-colors`}>
                  {task.isOverdue && <AlertTriangle size={11} className="inline mr-1" />}
                  {task.title}
                </p>
                {task.description && <p className="text-xs text-white/30 mt-0.5 truncate max-w-xs">{task.description}</p>}
              </td>
              <td className="px-4 py-3 hidden md:table-cell">
                <span className="text-xs font-mono px-2 py-1 rounded-lg"
                  style={{ background: COLUMNS.find(c=>c.key===task.status)?.color + '20',
                           color: COLUMNS.find(c=>c.key===task.status)?.color }}>
                  {STATUS_LABELS[task.status]}
                </span>
              </td>
              <td className="px-4 py-3 hidden lg:table-cell">
                <span className="text-xs font-mono px-2 py-1 rounded-lg"
                  style={{ background: PRIORITY_COLORS[task.priority] + '20',
                           color: PRIORITY_COLORS[task.priority] }}>
                  {task.priority}
                </span>
              </td>
              <td className="px-4 py-3 hidden lg:table-cell">
                {task.assignee ? (
                  <div className="flex items-center gap-2">
                    <Avatar user={task.assignee} size={6} />
                    <span className="text-xs text-white/50">{task.assignee.name}</span>
                  </div>
                ) : <span className="text-xs text-white/25">—</span>}
              </td>
              <td className="px-4 py-3 hidden xl:table-cell">
                {task.dueDate
                  ? <span className={`text-xs ${task.isOverdue ? 'text-rose' : 'text-white/40'}`}>
                      {format(new Date(task.dueDate), 'MMM d, yyyy')}
                    </span>
                  : <span className="text-xs text-white/25">—</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function MembersPanel({ project, members, onClose, userRole, onMemberAdded, onMemberRemoved, onRoleChange }) {
  const [email, setEmail] = useState('')
  const [role, setRole]   = useState('MEMBER')
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()

  const handleAdd = async e => {
    e.preventDefault()
    setLoading(true)
    try {
      const r = await projectsApi.addMember(project.id, { email, role })
      onMemberAdded(r.data)
      setEmail('')
      toast.success('Member added!')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add member')
    } finally {
      setLoading(false)
    }
  }

  const handleRemove = async (memberId) => {
    try {
      await projectsApi.removeMember(project.id, memberId)
      onMemberRemoved(memberId)
      toast.success('Member removed')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to remove')
    }
  }

  const handleRoleChange = async (memberId, newRole) => {
    try {
      await projectsApi.updateMember(project.id, memberId, { role: newRole })
      onRoleChange(memberId, newRole)
      toast.success('Role updated')
    } catch (err) {
      toast.error('Failed to update role')
    }
  }

  const isAdmin = userRole === 'ADMIN'

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display font-bold text-xl text-white flex items-center gap-2">
            <Users size={18} className="text-accent" /> Team Members
          </h2>
          <button onClick={onClose} className="btn-ghost"><X size={18} /></button>
        </div>

        {/* Add member form (admin only) */}
        {isAdmin && (
          <form onSubmit={handleAdd} className="flex gap-2 mb-6">
            <input className="input flex-1 text-sm" placeholder="Email address"
              type="email" value={email} onChange={e => setEmail(e.target.value)} required />
            <select className="input w-28 text-sm" value={role} onChange={e => setRole(e.target.value)}>
              <option value="MEMBER">Member</option>
              <option value="ADMIN">Admin</option>
            </select>
            <button type="submit" disabled={loading} className="btn-primary px-4 whitespace-nowrap">
              {loading ? '…' : 'Add'}
            </button>
          </form>
        )}

        {/* Members list */}
        <div className="space-y-2">
          {members.map(m => {
            const memberUser = m.user || m
            const isOwner = project.ownerId === memberUser.id
            const isSelf  = user?.id === memberUser.id
            return (
              <div key={memberUser.id}
                className="flex items-center gap-3 p-3 bg-ink-700/40 rounded-xl border border-ink-600/30">
                <div className="w-8 h-8 avatar text-xs flex-shrink-0">
                  {memberUser.name?.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {memberUser.name}
                    {isOwner && <span className="ml-2 text-[10px] text-amber font-mono">OWNER</span>}
                    {isSelf  && <span className="ml-2 text-[10px] text-white/30 font-mono">you</span>}
                  </p>
                  <p className="text-xs text-white/35 truncate flex items-center gap-1">
                    <Mail size={10} />{memberUser.email}
                  </p>
                </div>
                {isAdmin && !isOwner && !isSelf && (
                  <div className="flex items-center gap-2">
                    <select value={m.role || 'MEMBER'} onChange={e => handleRoleChange(memberUser.id, e.target.value)}
                      className="input text-xs py-1 px-2 w-24">
                      <option value="MEMBER">Member</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                    <button onClick={() => handleRemove(memberUser.id)}
                      className="text-white/30 hover:text-rose transition-colors p-1">
                      <UserMinus size={14} />
                    </button>
                  </div>
                )}
                {(!isAdmin || isOwner || isSelf) && (
                  <span className="text-xs font-mono text-white/30 px-2 py-1 bg-ink-600 rounded-lg">
                    {m.role || 'ADMIN'}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default function ProjectDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [project, setProject] = useState(null)
  const [tasks,   setTasks]   = useState([])
  const [loading, setLoading] = useState(true)
  const [view,    setView]    = useState('kanban')
  const [taskModal,    setTaskModal]    = useState(null) // null | { task?, defaultStatus? }
  const [membersModal, setMembersModal] = useState(false)
  const [filterStatus,   setFilterStatus]   = useState('ALL')
  const [filterPriority, setFilterPriority] = useState('')

  const userRole = project?.userRole || 'MEMBER'

  const load = useCallback(async () => {
    try {
      const [pRes, tRes] = await Promise.all([
        projectsApi.get(id),
        tasksApi.list(id)
      ])
      setProject(pRes.data)
      setTasks(tRes.data)
    } catch (err) {
      toast.error('Failed to load project')
      navigate('/projects')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { load() }, [load])

  const filteredTasks = tasks.filter(t => {
    if (filterStatus   && filterStatus !== 'ALL' && t.status   !== filterStatus)   return false
    if (filterPriority && t.priority !== filterPriority) return false
    return true
  })

  const handleSaveTask = async (data) => {
    try {
      if (taskModal?.task?.id) {
        const r = await tasksApi.update(id, taskModal.task.id, data)
        setTasks(ts => ts.map(t => t.id === r.data.id ? r.data : t))
        toast.success('Task updated')
      } else {
        const payload = { ...data, status: taskModal?.defaultStatus || data.status || 'TODO' }
        const r = await tasksApi.create(id, payload)
        setTasks(ts => [r.data, ...ts])
        toast.success('Task created!')
      }
      setTaskModal(null)
    } catch (err) {
      toast.error(err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || 'Failed to save task')
      throw err
    }
  }

  const handleDeleteTask = async () => {
    if (!taskModal?.task?.id) return
    try {
      await tasksApi.remove(id, taskModal.task.id)
      setTasks(ts => ts.filter(t => t.id !== taskModal.task.id))
      toast.success('Task deleted')
      setTaskModal(null)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete')
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
    </div>
  )

  const members = project?.members || []
  const donePct = tasks.length > 0 ? Math.round(tasks.filter(t=>t.status==='DONE').length / tasks.length * 100) : 0

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start gap-4">
        <button onClick={() => navigate('/projects')} className="btn-ghost mt-1 flex-shrink-0">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: project?.color }} />
            <h1 className="page-title truncate">{project?.name}</h1>
            <span className="badge bg-accent/10 text-accent text-xs">
              {userRole === 'ADMIN' ? '⚡ Admin' : '👥 Member'}
            </span>
          </div>
          {project?.description && (
            <p className="text-white/40 text-sm mt-1 ml-6">{project.description}</p>
          )}
          {/* Progress bar */}
          <div className="ml-6 mt-3 flex items-center gap-3">
            <div className="flex-1 max-w-xs h-1.5 bg-ink-600 rounded-full overflow-hidden">
              <div className="h-full bg-jade rounded-full transition-all duration-500"
                   style={{ width: `${donePct}%` }} />
            </div>
            <span className="text-xs font-mono text-white/30">{donePct}% done</span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Member avatars */}
          <button onClick={() => setMembersModal(true)}
            className="flex items-center btn-ghost gap-2">
            <div className="flex -space-x-1.5">
              {members.slice(0, 4).map((m, i) => {
                const u = m.user || m
                const initials = u?.name?.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()
                return (
                  <div key={u?.id || i} className="w-7 h-7 avatar text-[9px] border-2 border-ink-900 z-10"
                       style={{ zIndex: 10 - i }}>
                    {initials}
                  </div>
                )
              })}
            </div>
            <span className="text-xs text-white/40">{members.length}</span>
          </button>
          <button onClick={() => setTaskModal({})} className="btn-primary flex items-center gap-1.5">
            <Plus size={15} /> Add Task
          </button>
        </div>
      </div>

      {/* Filters + View toggle */}
      <div className="flex items-center gap-3 flex-wrap">
        <select className="input text-xs py-1.5 px-3 w-auto"
          value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="ALL">All statuses</option>
          <option value="TODO">To Do</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="REVIEW">Review</option>
          <option value="DONE">Done</option>
        </select>
        <select className="input text-xs py-1.5 px-3 w-auto"
          value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
          <option value="">All priorities</option>
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
          <option value="URGENT">Urgent</option>
        </select>

        <span className="text-xs text-white/30 ml-auto">{filteredTasks.length} tasks</span>

        <div className="flex bg-ink-800 border border-ink-600 rounded-xl p-1 gap-1">
          <button onClick={() => setView('kanban')}
            className={`p-1.5 rounded-lg transition-colors ${view==='kanban' ? 'bg-accent text-white' : 'text-white/40 hover:text-white'}`}>
            <LayoutGrid size={15} />
          </button>
          <button onClick={() => setView('list')}
            className={`p-1.5 rounded-lg transition-colors ${view==='list' ? 'bg-accent text-white' : 'text-white/40 hover:text-white'}`}>
            <List size={15} />
          </button>
        </div>
      </div>

      {/* Board / List */}
      {view === 'kanban' ? (
        <KanbanBoard
          tasks={filteredTasks}
          userRole={userRole}
          onTaskClick={task => setTaskModal({ task })}
          onAddTask={status => setTaskModal({ defaultStatus: status })}
        />
      ) : (
        <ListView
          tasks={filteredTasks}
          onTaskClick={task => setTaskModal({ task })}
        />
      )}

      {/* Modals */}
      {taskModal !== null && (
        <TaskModal
          task={taskModal.task}
          members={members}
          projectId={id}
          userRole={userRole}
          onClose={() => setTaskModal(null)}
          onSave={handleSaveTask}
          onDelete={handleDeleteTask}
        />
      )}
      {membersModal && (
        <MembersPanel
          project={project}
          members={members}
          userRole={userRole}
          onClose={() => setMembersModal(false)}
          onMemberAdded={m => {
            setProject(p => ({ ...p, members: [...(p.members||[]), m] }))
          }}
          onMemberRemoved={uid => {
            setProject(p => ({ ...p, members: (p.members||[]).filter(m => (m.user?.id||m.id) !== uid) }))
          }}
          onRoleChange={(uid, role) => {
            setProject(p => ({
              ...p,
              members: (p.members||[]).map(m =>
                (m.user?.id||m.id) === uid ? { ...m, role } : m
              )
            }))
          }}
        />
      )}
    </div>
  )
}
