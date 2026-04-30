import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 15000
})

// Attach JWT on every request
api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('ttm_token')
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

// Global 401 handler → redirect to login
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('ttm_token')
      localStorage.removeItem('ttm_user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api

// ── Auth ────────────────────────────────────────────────────────
export const authApi = {
  signup: d => api.post('/auth/signup', d),
  login:  d => api.post('/auth/login', d),
  me:     ()  => api.get('/auth/me'),
  update: d => api.patch('/auth/profile', d)
}

// ── Projects ─────────────────────────────────────────────────────
export const projectsApi = {
  list:         ()        => api.get('/projects'),
  create:       d         => api.post('/projects', d),
  get:          id        => api.get(`/projects/${id}`),
  update:       (id, d)   => api.put(`/projects/${id}`, d),
  remove:       id        => api.delete(`/projects/${id}`),
  addMember:    (id, d)   => api.post(`/projects/${id}/members`, d),
  updateMember: (id,uid,d)=> api.patch(`/projects/${id}/members/${uid}`, d),
  removeMember: (id, uid) => api.delete(`/projects/${id}/members/${uid}`)
}

// ── Tasks ────────────────────────────────────────────────────────
export const tasksApi = {
  list:   (pid, params) => api.get(`/tasks/project/${pid}`, { params }),
  create: (pid, d)      => api.post(`/tasks/project/${pid}`, d),
  update: (pid, tid, d) => api.put(`/tasks/project/${pid}/${tid}`, d),
  remove: (pid, tid)    => api.delete(`/tasks/project/${pid}/${tid}`)
}

// ── Dashboard ────────────────────────────────────────────────────
export const dashboardApi = {
  get: () => api.get('/dashboard')
}

// ── Users ────────────────────────────────────────────────────────
export const usersApi = {
  search: q => api.get('/users/search', { params: { q } })
}
