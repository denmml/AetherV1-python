/**
 * api.js — HTTP-клиент с автоматическим переключением в Demo Mode (fallback).
 * Если бэкенд недоступен или возвращает ошибку подключения, запросы прозрачно
 * перенаправляются в локальное хранилище localStorage (demoStore).
 */
import axios from 'axios'
import {
  isDemoMode,
  setDemoMode,
  demoAuth,
  demoFolders,
  demoGraph,
  demoLinks,
  demoNotes,
  demoAudio,
} from './services/demoStore'

const BASE_URL = '/api/v1'

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 8000,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    // Редирект на /login только если бэкенд живой (вернул 401) и мы не в Demo Mode
    if (err.response?.status === 401 && !isDemoMode()) {
      localStorage.removeItem('access_token')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

/**
 * Проверка, является ли ошибка ошибкой сети / недоступности бэкенда.
 */
export function isNetworkError(err) {
  if (!err) return false
  // Нет ответа от сервера (сервер выключен, DNS, CORS, таймаут соединения)
  if (!err.response) return true
  // Коды шлюзов и прокси Vite при невозможности подключиться к upstream
  const status = err.response.status
  if (status === 502 || status === 503 || status === 504) return true
  // Vite dev server proxy connection error
  if (
    status === 500 &&
    typeof err.response.data === 'string' &&
    (err.response.data.includes('ECONNREFUSED') ||
      err.response.data.includes('proxy error') ||
      err.response.data.includes('FetchError'))
  ) {
    return true
  }
  return false
}

/**
 * Обертка для запросов: пробует реальный API, при сбое сети переключает
 * систему в Demo Mode и выполняет fallback в localStorage.
 */
async function withFallback(apiCall, fallbackFn) {
  if (isDemoMode()) {
    try {
      const data = await Promise.resolve(fallbackFn())
      return { data }
    } catch (err) {
      return Promise.reject(err)
    }
  }

  try {
    return await apiCall()
  } catch (err) {
    if (isNetworkError(err)) {
      console.warn('[API] Backend unavailable. Switching to Demo Mode (localStorage fallback).', err.message)
      setDemoMode(true)
      const data = await Promise.resolve(fallbackFn())
      return { data }
    }
    throw err
  }
}

/**
 * Проверка доступности реального бэкенда
 */
export async function checkBackendHealth() {
  try {
    const res = await axios.get('/api/v1/openapi.json', { timeout: 2500 })
    return res.status === 200
  } catch (err) {
    // Если вернул 401 или 404, сам сервер активен
    if (err.response && err.response.status < 500) return true
    return false
  }
}

// ── AUTH ──────────────────────────────────────────────────────────────────
export const authAPI = {
  register: (email, password, name) =>
    withFallback(
      () => api.post('/auth/register', { email, password, name: name || undefined }),
      () => demoAuth.register(email, password, name)
    ),

  login: (email, password) => {
    const form = new URLSearchParams()
    form.append('username', email)
    form.append('password', password)

    return withFallback(
      () =>
        api.post('/auth/login', form, {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        }),
      () => demoAuth.login(email, password)
    )
  },

  me: () =>
    withFallback(
      () => api.get('/auth/me'),
      () => demoAuth.me()
    ),
}

// ── FOLDERS / CANVASES ────────────────────────────────────────────────────
export const foldersAPI = {
  list: () =>
    withFallback(
      () => api.get('/folders/'),
      () => demoFolders.list()
    ),

  create: (name) =>
    withFallback(
      () => api.post('/folders/', { name }),
      () => demoFolders.create(name)
    ),

  update: (id, name) =>
    withFallback(
      () => api.put(`/folders/${id}`, { name }),
      () => demoFolders.update(id, name)
    ),

  remove: (id) =>
    withFallback(
      () => api.delete(`/folders/${id}`),
      () => demoFolders.remove(id)
    ),
}

// ── GRAPH ─────────────────────────────────────────────────────────────────
export const graphAPI = {
  getGraph: (folder_id) =>
    withFallback(
      () => api.get('/graph/', { params: folder_id ? { folder_id } : {} }),
      () => demoGraph.getGraph(folder_id)
    ),
}

// ── LINKS ─────────────────────────────────────────────────────────────────
export const linksAPI = {
  createLink: (source_note_id, target_note_id) =>
    withFallback(
      () => api.post('/links/', { source_note_id, target_note_id }),
      () => demoLinks.createLink(source_note_id, target_note_id)
    ),

  deleteLink: (link_id) =>
    withFallback(
      () => api.delete(`/links/${link_id}`),
      () => demoLinks.deleteLink(link_id)
    ),
}

// ── NOTES ─────────────────────────────────────────────────────────────────
export const notesAPI = {
  list: (folder_id) =>
    withFallback(
      () => api.get('/notes/', { params: folder_id ? { folder_id } : {} }),
      () => demoNotes.list(folder_id)
    ),

  get: (id) =>
    withFallback(
      () => api.get(`/notes/${id}`),
      () => demoNotes.get(id)
    ),

  create: (data) =>
    withFallback(
      () => api.post('/notes/', data),
      () => demoNotes.create(data)
    ),

  update: (id, data) =>
    withFallback(
      () => api.patch(`/notes/${id}`, data),
      () => demoNotes.update(id, data)
    ),

  remove: (id) =>
    withFallback(
      () => api.delete(`/notes/${id}`),
      () => demoNotes.remove(id)
    ),
}

// ── AUDIO / WHISPER ───────────────────────────────────────────────────────
export const audioAPI = {
  transcribe: (file, title = '', onProgress) => {
    const form = new FormData()
    form.append('file', file)
    form.append('title', title)

    return withFallback(
      () =>
        api.post('/audio/transcribe', form, {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: onProgress
            ? (e) => onProgress(Math.round((e.loaded * 100) / e.total))
            : undefined,
        }),
      () => demoAudio.transcribe(file, title, onProgress)
    )
  },

  listLectures: () =>
    withFallback(
      () => api.get('/audio/lectures'),
      () => demoAudio.listLectures()
    ),

  getLecture: (id) =>
    withFallback(
      () => api.get(`/audio/lectures/${id}`),
      () => demoAudio.getLecture(id)
    ),

  deleteLecture: (id) =>
    withFallback(
      () => api.delete(`/audio/lectures/${id}`),
      () => demoAudio.deleteLecture(id)
    ),
}

export default api
