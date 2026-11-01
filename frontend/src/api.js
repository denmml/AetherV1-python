/**
 * api.js — HTTP-клиент для всех запросов к backend.
 * Базовый URL берётся из Vite proxy: /api → http://localhost:8000/api
 */
import axios from 'axios'

const BASE_URL = '/api/v1'

const api = axios.create({ baseURL: BASE_URL })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('access_token')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// ── AUTH ──────────────────────────────────────────────────────────────────
export const authAPI = {
  register: (email, password, name) =>
    api.post('/auth/register', { email, password, name: name || undefined }),
  login: (email, password) => {
    const form = new URLSearchParams()
    form.append('username', email)
    form.append('password', password)
    return api.post('/auth/login', form, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
  },
  me: () => api.get('/auth/me'),
}

// ── FOLDERS / CANVASES ────────────────────────────────────────────────────
export const foldersAPI = {
  list:   ()           => api.get('/folders/'),
  create: (name)       => api.post('/folders/', { name }),
  update: (id, name)   => api.put(`/folders/${id}`, { name }),
  remove: (id)         => api.delete(`/folders/${id}`),
}

// ── GRAPH ─────────────────────────────────────────────────────────────────
export const graphAPI = {
  getGraph: (folder_id) => api.get('/graph/', { params: folder_id ? { folder_id } : {} }),
}

// ── LINKS ─────────────────────────────────────────────────────────────────
export const linksAPI = {
  createLink: (source_note_id, target_note_id) =>
    api.post('/links/', { source_note_id, target_note_id }),
  deleteLink: (link_id) => api.delete(`/links/${link_id}`),
}

// ── NOTES ─────────────────────────────────────────────────────────────────
export const notesAPI = {
  list:   (folder_id)     => api.get('/notes/', { params: folder_id ? { folder_id } : {} }),
  get:    (id)            => api.get(`/notes/${id}`),
  create: (data)          => api.post('/notes/', data),
  update: (id, data)      => api.patch(`/notes/${id}`, data),
  remove: (id)            => api.delete(`/notes/${id}`),
}

// ── AUDIO / WHISPER ───────────────────────────────────────────────────────
export const audioAPI = {
  transcribe: (file, title = '', onProgress) => {
    const form = new FormData()
    form.append('file', file)
    form.append('title', title)
    return api.post('/audio/transcribe', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: onProgress
        ? (e) => onProgress(Math.round((e.loaded * 100) / e.total))
        : undefined,
    })
  },
  listLectures:  ()   => api.get('/audio/lectures'),
  getLecture:    (id) => api.get(`/audio/lectures/${id}`),
  deleteLecture: (id) => api.delete(`/audio/lectures/${id}`),
}

export default api
