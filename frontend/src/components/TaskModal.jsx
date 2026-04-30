import { useState, useEffect } from 'react'
import { X, Calendar, User, Flag, Tag } from 'lucide-react'
import { format } from 'date-fns'

const STATUSES   = ['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE']
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT']
const STATUS_LABELS = { TODO: 'To Do', IN_PROGRESS: 'In Progress', REVIEW: 'Review', DONE: 'Done' }

export default function TaskModal({ task, members, projectId, onClose, onSave, onDelete, userRole }) {
  const isNew = !task?.id
  const [form, setForm] = useState({
    title:       task?.title       || '',
    description: task?.description || '',
    status:      task?.status      || 'TODO',
    priority:    task?.priority    || 'MEDIUM',
    dueDate:     task?.dueDate ? format(new Date(task.dueDate), 'yyyy-MM-dd') : '',
    assigneeId:  task?.assigneeId  || task?.assignee?.id || ''
  })
  const [loading, setLoading] = useState(false)

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }))

  const handleSubmit = async e => {
    e.preventDefault()
    setLoading(true)
    const payload = {
      ...form,
      dueDate:    form.dueDate    || null,
      assigneeId: form.assigneeId || null
    }
    await onSave(payload)
    setLoading(false)
  }

  const isAdmin = userRole === 'ADMIN'

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display font-bold text-xl text-white">
            {isNew ? 'Create Task' : 'Edit Task'}
          </h2>
          <button onClick={onClose} className="btn-ghost"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Title */}
          <div>
            <label className="label">Title *</label>
            <input className="input" placeholder="What needs to be done?"
              value={form.title} onChange={set('title')} required autoFocus />
          </div>

          {/* Description */}
          <div>
            <label className="label">Description</label>
            <textarea className="input min-h-[90px] resize-none"
              placeholder="Add more context, acceptance criteria, links…"
              value={form.description} onChange={set('description')} />
          </div>

          {/* Status + Priority row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label flex items-center gap-1"><Tag size={10} /> Status</label>
              <select className="input" value={form.status} onChange={set('status')}>
                {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
              </select>
            </div>
            <div>
              <label className="label flex items-center gap-1"><Flag size={10} /> Priority</label>
              <select className="input" value={form.priority} onChange={set('priority')}>
                {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>

          {/* Assignee + Due Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label flex items-center gap-1"><User size={10} /> Assignee</label>
              <select className="input" value={form.assigneeId} onChange={set('assigneeId')}>
                <option value="">Unassigned</option>
                {members.map(m => (
                  <option key={m.user?.id || m.id} value={m.user?.id || m.id}>
                    {m.user?.name || m.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label flex items-center gap-1"><Calendar size={10} /> Due Date</label>
              <input type="date" className="input" value={form.dueDate} onChange={set('dueDate')}
                min={format(new Date(), 'yyyy-MM-dd')} />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            {!isNew && isAdmin && (
              <button type="button" onClick={onDelete} className="btn-danger px-4">
                Delete
              </button>
            )}
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? 'Saving…' : isNew ? 'Create Task' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
