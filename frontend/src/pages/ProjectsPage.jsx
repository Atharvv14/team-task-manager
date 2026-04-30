import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { projectsApi } from '../api/client'
import { Plus, FolderKanban, Users, CheckSquare, ChevronRight, Trash2, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { format } from 'date-fns'

const COLORS = [
  '#6366F1','#7C6EFA','#38BDF8','#2DD4A0','#F59E0B',
  '#F87171','#A78BFA','#34D399','#FB923C','#E879F9'
]

function ProjectCard({ project, onDelete }) {
  const { user } = useAuth()
  const isOwner = project.ownerId === user?.id || project.owner?.id === user?.id
  const totalTasks = project._count?.tasks ?? 0
  const members = project._count?.members ?? 0

  return (
    <div className="card card-hover p-5 flex flex-col gap-4 relative group">
      {/* Color strip */}
      <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl" style={{ background: project.color }} />

      <div className="flex items-start justify-between mt-1">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
               style={{ background: project.color + '22', border: `1px solid ${project.color}44` }}>
            <FolderKanban size={17} style={{ color: project.color }} />
          </div>
          <div>
            <h3 className="font-display font-semibold text-white group-hover:text-accent transition-colors">
              {project.name}
            </h3>
            <p className="text-xs text-white/35 mt-0.5">
              {project.userRole === 'ADMIN' ? '⚡ Admin' : '👥 Member'}
            </p>
          </div>
        </div>
        {isOwner && (
          <button onClick={e => { e.preventDefault(); onDelete(project) }}
            className="opacity-0 group-hover:opacity-100 transition-opacity text-white/30 hover:text-rose p-1 rounded-lg hover:bg-rose/10">
            <Trash2 size={14} />
          </button>
        )}
      </div>

      {project.description && (
        <p className="text-xs text-white/40 line-clamp-2">{project.description}</p>
      )}

      <div className="flex items-center gap-4 text-xs text-white/35">
        <span className="flex items-center gap-1"><CheckSquare size={12} />{totalTasks} tasks</span>
        <span className="flex items-center gap-1"><Users size={12} />{members} members</span>
      </div>

      <Link to={`/projects/${project.id}`}
        className="mt-auto flex items-center justify-between text-xs font-mono
                   text-white/30 hover:text-accent transition-colors group/link">
        <span>View project</span>
        <ChevronRight size={13} className="group-hover/link:translate-x-0.5 transition-transform" />
      </Link>
    </div>
  )
}

function CreateProjectModal({ onClose, onCreate }) {
  const [form, setForm] = useState({ name: '', description: '', color: COLORS[0] })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async e => {
    e.preventDefault()
    setLoading(true)
    try {
      const r = await projectsApi.create(form)
      onCreate(r.data)
      toast.success('Project created!')
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create project')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display font-bold text-xl text-white">New Project</h2>
          <button onClick={onClose} className="btn-ghost"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="label">Project Name</label>
            <input className="input" placeholder="e.g. Product Redesign"
              value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              required autoFocus />
          </div>

          <div>
            <label className="label">Description</label>
            <textarea className="input min-h-[80px] resize-none" placeholder="What's this project about?"
              value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
          </div>

          <div>
            <label className="label">Color</label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map(c => (
                <button key={c} type="button" onClick={() => setForm(p => ({ ...p, color: c }))}
                  className="w-7 h-7 rounded-lg transition-all duration-150 flex items-center justify-center"
                  style={{ background: c, outline: form.color === c ? `2px solid white` : 'none', outlineOffset: 2 }}>
                  {form.color === c && <span className="text-white text-xs">✓</span>}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? 'Creating…' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function DeleteConfirmModal({ project, onClose, onConfirm }) {
  const [loading, setLoading] = useState(false)
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal max-w-sm">
        <h2 className="font-display font-bold text-xl text-white mb-2">Delete Project?</h2>
        <p className="text-white/50 text-sm mb-6">
          "<strong className="text-white">{project.name}</strong>" and all its tasks will be permanently deleted.
        </p>
        <div className="flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={async () => { setLoading(true); await onConfirm(); setLoading(false) }}
            disabled={loading} className="btn-danger flex-1">
            {loading ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading]   = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [toDelete, setToDelete]     = useState(null)

  useEffect(() => {
    projectsApi.list()
      .then(r => setProjects(r.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const handleDelete = async () => {
    try {
      await projectsApi.remove(toDelete.id)
      setProjects(ps => ps.filter(p => p.id !== toDelete.id))
      toast.success('Project deleted')
      setToDelete(null)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete')
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Projects</h1>
          <p className="text-white/40 text-sm mt-1">{projects.length} project{projects.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> New Project
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
        </div>
      ) : projects.length === 0 ? (
        <div className="card p-16 text-center">
          <FolderKanban size={40} className="text-white/20 mx-auto mb-4" />
          <h3 className="font-display font-semibold text-white mb-2">No projects yet</h3>
          <p className="text-white/40 text-sm mb-6">Create your first project to get started</p>
          <button onClick={() => setShowCreate(true)} className="btn-primary inline-flex items-center gap-2">
            <Plus size={16} /> Create Project
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map(p => (
            <ProjectCard key={p.id} project={p} onDelete={setToDelete} />
          ))}
          <button onClick={() => setShowCreate(true)}
            className="card border-dashed border-ink-600 hover:border-accent/40 hover:bg-accent/5
                       p-5 flex flex-col items-center justify-center gap-3 min-h-[180px]
                       text-white/30 hover:text-accent transition-all duration-200 cursor-pointer">
            <Plus size={24} />
            <span className="font-display text-sm font-medium">New Project</span>
          </button>
        </div>
      )}

      {showCreate && (
        <CreateProjectModal
          onClose={() => setShowCreate(false)}
          onCreate={p => setProjects(ps => [p, ...ps])} />
      )}
      {toDelete && (
        <DeleteConfirmModal
          project={toDelete}
          onClose={() => setToDelete(null)}
          onConfirm={handleDelete} />
      )}
    </div>
  )
}
