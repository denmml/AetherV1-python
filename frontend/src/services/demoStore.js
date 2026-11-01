/**
 * demoStore.js — автономное локальное хранилище данных (localStorage)
 * для работы приложения в режиме оффлайн / Demo Mode.
 */

const STORAGE_KEYS = {
  MODE: 'aether_demo_mode',
  USER: 'aether_demo_user',
  FOLDERS: 'aether_demo_folders',
  NOTES: 'aether_demo_notes',
  LINKS: 'aether_demo_links',
  LECTURES: 'aether_demo_lectures',
}

const DEFAULT_USER = {
  id: 1,
  name: 'Demo Explorer',
  email: 'explorer@aether.local',
}

const DEFAULT_FOLDERS = [
  { id: 1, name: 'Main Canvas' },
  { id: 2, name: 'AI & Research' },
]

const DEFAULT_NOTES = [
  {
    id: 1,
    title: 'Welcome to Demo Mode',
    content:
      '<p><strong>Aether PKM is currently running in Demo Mode (Offline).</strong></p>' +
      '<p>All your notes, canvases, and graph nodes are automatically stored in <code>localStorage</code>.</p>' +
      '<p>When the backend is started, you can seamlessly connect to the live API.</p>',
    folder_id: 1,
    color: 'orange',
    created_at: new Date(Date.now() - 3600000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 2,
    title: 'Knowledge Graph',
    content:
      '<p>Drag nodes around, create new connections by pulling handles from any of the 4 ports.</p>' +
      '<p>Right-click on the canvas to quickly add notes or change connection styles.</p>',
    folder_id: 1,
    color: 'blue',
    created_at: new Date(Date.now() - 1800000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 3,
    title: 'Neural Synthesis',
    content:
      '<p>Deep associative memory and interconnected ideas form the foundation of personal knowledge graphs.</p>',
    folder_id: 1,
    color: 'green',
    created_at: new Date(Date.now() - 900000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 4,
    title: 'Whisper Transcription',
    content:
      '<p>Audio lectures and voice memos can be recorded in the browser and transcribed into notes.</p>',
    folder_id: 2,
    color: 'purple',
    created_at: new Date(Date.now() - 600000).toISOString(),
    updated_at: new Date().toISOString(),
  },
]

const DEFAULT_LINKS = [
  { id: 1, source_note_id: 1, target_note_id: 2 },
  { id: 2, source_note_id: 2, target_note_id: 3 },
]

const DEFAULT_LECTURES = [
  {
    lecture_id: 1,
    title: 'Introduction to PKM & Knowledge Graphs',
    transcript:
      'Welcome to Aether PKM. In this introductory lecture, we explore bidirectional links, ' +
      'visual canvas workflows, and resilient local-first data storage.',
    status: 'transcribed',
    created_at: new Date(Date.now() - 7200000).toISOString(),
  },
]

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch (e) {
    console.warn(`[demoStore] Failed reading ${key}:`, e)
    return fallback
  }
}

function writeJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (e) {
    console.error(`[demoStore] Failed writing ${key}:`, e)
  }
}

/** Инициализация начальных демо-данных в localStorage при первом запуске */
export function initDemoStore() {
  if (!localStorage.getItem(STORAGE_KEYS.FOLDERS)) {
    writeJSON(STORAGE_KEYS.FOLDERS, DEFAULT_FOLDERS)
  }
  if (!localStorage.getItem(STORAGE_KEYS.NOTES)) {
    writeJSON(STORAGE_KEYS.NOTES, DEFAULT_NOTES)
  }
  if (!localStorage.getItem(STORAGE_KEYS.LINKS)) {
    writeJSON(STORAGE_KEYS.LINKS, DEFAULT_LINKS)
  }
  if (!localStorage.getItem(STORAGE_KEYS.LECTURES)) {
    writeJSON(STORAGE_KEYS.LECTURES, DEFAULT_LECTURES)
  }
  if (!localStorage.getItem(STORAGE_KEYS.USER)) {
    writeJSON(STORAGE_KEYS.USER, DEFAULT_USER)
  }
}

export function isDemoMode() {
  return localStorage.getItem(STORAGE_KEYS.MODE) === 'true'
}

export function setDemoMode(active) {
  const current = isDemoMode()
  if (current !== active) {
    localStorage.setItem(STORAGE_KEYS.MODE, active ? 'true' : 'false')
    if (active) {
      initDemoStore()
    }
    window.dispatchEvent(new CustomEvent('aether:demo-mode', { detail: { isDemo: active } }))
  }
}

// ── USER / AUTH ─────────────────────────────────────────────────────────────
export const demoAuth = {
  me: () => {
    initDemoStore()
    return readJSON(STORAGE_KEYS.USER, DEFAULT_USER)
  },
  login: (email, password) => {
    initDemoStore()
    let user = readJSON(STORAGE_KEYS.USER, DEFAULT_USER)
    if (email && email.includes('@')) {
      user = { ...user, email, name: user.name || email.split('@')[0] }
      writeJSON(STORAGE_KEYS.USER, user)
    }
    localStorage.setItem('access_token', 'demo-access-token')
    setDemoMode(true)
    return {
      access_token: 'demo-access-token',
      token_type: 'bearer',
      user,
    }
  },
  register: (email, password, name) => {
    initDemoStore()
    const user = {
      id: Date.now(),
      email,
      name: name?.trim() || email.split('@')[0] || 'Explorer',
    }
    writeJSON(STORAGE_KEYS.USER, user)
    localStorage.setItem('access_token', 'demo-access-token')
    setDemoMode(true)
    return user
  },
}

// ── FOLDERS / CANVASES ──────────────────────────────────────────────────────
export const demoFolders = {
  list: () => {
    initDemoStore()
    return readJSON(STORAGE_KEYS.FOLDERS, DEFAULT_FOLDERS)
  },
  create: (name) => {
    initDemoStore()
    const folders = readJSON(STORAGE_KEYS.FOLDERS, DEFAULT_FOLDERS)
    const newFolder = {
      id: Date.now(),
      name: name?.trim() || 'Untitled Canvas',
    }
    const updated = [...folders, newFolder]
    writeJSON(STORAGE_KEYS.FOLDERS, updated)
    return newFolder
  },
  update: (id, name) => {
    initDemoStore()
    const folders = readJSON(STORAGE_KEYS.FOLDERS, DEFAULT_FOLDERS)
    let updatedFolder = null
    const updated = folders.map((f) => {
      if (String(f.id) === String(id)) {
        updatedFolder = { ...f, name }
        return updatedFolder
      }
      return f
    })
    writeJSON(STORAGE_KEYS.FOLDERS, updated)
    return updatedFolder || { id, name }
  },
  remove: (id) => {
    initDemoStore()
    const folders = readJSON(STORAGE_KEYS.FOLDERS, DEFAULT_FOLDERS)
    writeJSON(STORAGE_KEYS.FOLDERS, folders.filter((f) => String(f.id) !== String(id)))
    return { status: 'ok', id }
  },
}

// ── NOTES ───────────────────────────────────────────────────────────────────
export const demoNotes = {
  list: (folder_id) => {
    initDemoStore()
    const notes = readJSON(STORAGE_KEYS.NOTES, DEFAULT_NOTES)
    if (folder_id !== undefined && folder_id !== null && folder_id !== '') {
      return notes.filter((n) => String(n.folder_id) === String(folder_id))
    }
    return notes
  },
  get: (id) => {
    initDemoStore()
    const notes = readJSON(STORAGE_KEYS.NOTES, DEFAULT_NOTES)
    const found = notes.find((n) => String(n.id) === String(id))
    if (!found) {
      throw new Error('Note not found')
    }
    return found
  },
  create: (data) => {
    initDemoStore()
    const notes = readJSON(STORAGE_KEYS.NOTES, DEFAULT_NOTES)
    const now = new Date().toISOString()
    const newNote = {
      id: Date.now(),
      title: data.title ?? 'Untitled',
      content: data.content ?? '',
      folder_id: data.folder_id ?? null,
      color: data.color ?? 'default',
      created_at: now,
      updated_at: now,
    }
    writeJSON(STORAGE_KEYS.NOTES, [newNote, ...notes])
    window.dispatchEvent(new CustomEvent('aether:notes-changed'))
    return newNote
  },
  update: (id, data) => {
    initDemoStore()
    const notes = readJSON(STORAGE_KEYS.NOTES, DEFAULT_NOTES)
    let updatedNote = null
    const updated = notes.map((n) => {
      if (String(n.id) === String(id)) {
        updatedNote = {
          ...n,
          ...data,
          updated_at: new Date().toISOString(),
        }
        return updatedNote
      }
      return n
    })
    writeJSON(STORAGE_KEYS.NOTES, updated)
    window.dispatchEvent(new CustomEvent('aether:notes-changed'))
    return updatedNote || { id, ...data }
  },
  remove: (id) => {
    initDemoStore()
    const notes = readJSON(STORAGE_KEYS.NOTES, DEFAULT_NOTES)
    writeJSON(STORAGE_KEYS.NOTES, notes.filter((n) => String(n.id) !== String(id)))

    // Также удаляем связи, связанные с этой заметкой
    const links = readJSON(STORAGE_KEYS.LINKS, DEFAULT_LINKS)
    writeJSON(
      STORAGE_KEYS.LINKS,
      links.filter(
        (l) => String(l.source_note_id) !== String(id) && String(l.target_note_id) !== String(id)
      )
    )
    window.dispatchEvent(new CustomEvent('aether:notes-changed'))
    return { status: 'ok', id }
  },
}

// ── GRAPH ───────────────────────────────────────────────────────────────────
export const demoGraph = {
  getGraph: (folder_id) => {
    initDemoStore()
    const notes = demoNotes.list(folder_id)
    const noteIds = new Set(notes.map((n) => String(n.id)))

    const allLinks = readJSON(STORAGE_KEYS.LINKS, DEFAULT_LINKS)
    const links = allLinks.filter(
      (l) => noteIds.has(String(l.source_note_id)) && noteIds.has(String(l.target_note_id))
    )

    return {
      nodes: notes.map((n) => ({
        id: n.id,
        title: n.title,
        content: n.content || '',
        folder_id: n.folder_id,
        color: n.color || 'default',
      })),
      edges: links.map((l) => ({
        id: l.id,
        source: l.source_note_id,
        target: l.target_note_id,
      })),
    }
  },
}

// ── LINKS ───────────────────────────────────────────────────────────────────
export const demoLinks = {
  createLink: (source_note_id, target_note_id) => {
    initDemoStore()
    const links = readJSON(STORAGE_KEYS.LINKS, DEFAULT_LINKS)
    const existing = links.find(
      (l) =>
        String(l.source_note_id) === String(source_note_id) &&
        String(l.target_note_id) === String(target_note_id)
    )
    if (existing) {
      return {
        status: 'success',
        link_id: existing.id,
        source: existing.source_note_id,
        target: existing.target_note_id,
      }
    }
    const newLink = {
      id: Date.now(),
      source_note_id,
      target_note_id,
    }
    writeJSON(STORAGE_KEYS.LINKS, [...links, newLink])
    return {
      status: 'success',
      link_id: newLink.id,
      source: newLink.source_note_id,
      target: newLink.target_note_id,
    }
  },
  deleteLink: (link_id) => {
    initDemoStore()
    const links = readJSON(STORAGE_KEYS.LINKS, DEFAULT_LINKS)
    writeJSON(STORAGE_KEYS.LINKS, links.filter((l) => String(l.id) !== String(link_id)))
    return { status: 'deleted', link_id }
  },
}

// ── AUDIO / WHISPER ─────────────────────────────────────────────────────────
export const demoAudio = {
  transcribe: async (file, title, onProgress) => {
    initDemoStore()
    const lectures = readJSON(STORAGE_KEYS.LECTURES, DEFAULT_LECTURES)

    // Имитация прогресса загрузки и обработки
    if (onProgress) {
      onProgress(30)
      await new Promise((r) => setTimeout(r, 200))
      onProgress(70)
      await new Promise((r) => setTimeout(r, 200))
      onProgress(100)
    }

    const recTitle = title?.trim() || file?.name || 'Voice Memo (Demo)'
    const newLecture = {
      lecture_id: Date.now(),
      title: recTitle,
      transcript:
        `[Demo Mode Transcription — ${new Date().toLocaleTimeString()}]:\n` +
        `Recorded file "${recTitle}" (${Math.round((file?.size || 1024) / 1024)} KB) was transcribed locally in Demo Mode. ` +
        `When backend is connected, transcription runs directly through OpenAI Whisper API.`,
      status: 'transcribed',
      created_at: new Date().toISOString(),
    }

    writeJSON(STORAGE_KEYS.LECTURES, [newLecture, ...lectures])
    return newLecture
  },
  listLectures: () => {
    initDemoStore()
    return readJSON(STORAGE_KEYS.LECTURES, DEFAULT_LECTURES)
  },
  getLecture: (id) => {
    initDemoStore()
    const lectures = readJSON(STORAGE_KEYS.LECTURES, DEFAULT_LECTURES)
    const found = lectures.find((l) => String(l.lecture_id) === String(id))
    if (!found) throw new Error('Lecture not found')
    return found
  },
  deleteLecture: (id) => {
    initDemoStore()
    const lectures = readJSON(STORAGE_KEYS.LECTURES, DEFAULT_LECTURES)
    writeJSON(STORAGE_KEYS.LECTURES, lectures.filter((l) => String(l.lecture_id) !== String(id)))
    return { status: 'deleted', lecture_id: id }
  },
}
