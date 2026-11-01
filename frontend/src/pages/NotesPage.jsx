/**
 * NotesPage — страница «Конспекты» в стиле Notion.
 * Полная поддержка светлой и тёмно-оранжевой тем.
 */
import { useState, useEffect, useCallback, useRef } from 'react'
import { notesAPI } from '../api'
import NoteEditor from '../components/NoteEditor'
import CoverHeader from '../components/CoverHeader'

/* ── Иконки ──────────────────────────────────────────────────────────────── */
const IconPlus = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
       stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
)
const IconSearch = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
       stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
)
const IconTrash = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
       stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
    <path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
  </svg>
)
const IconDoc = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
       stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
  </svg>
)

function fmtDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en', { month: 'short', day: 'numeric' })
}

function NoteItem({ note, active, onSelect, onDelete }) {
  const [hover, setHover] = useState(false)

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={() => onSelect(note)}
      className={`group flex items-center justify-between px-3 py-1.5 rounded cursor-pointer
                  transition-colors select-none text-[13px]
                  ${active
                    ? 'bg-th-hover text-th-text font-medium'
                    : 'text-th-muted hover:bg-th-hover hover:text-th-text'}`}
    >
      <span className="flex items-center gap-2 min-w-0">
        <span className={active ? 'text-th-accent' : 'opacity-70'}><IconDoc /></span>
        <span className="truncate">{note.title || 'Untitled'}</span>
      </span>
      {(hover || active) && (
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(note.id) }}
          className="shrink-0 ml-1 p-0.5 rounded hover:text-th-danger text-th-muted transition-colors"
          title="Delete"
        >
          <IconTrash />
        </button>
      )}
    </div>
  )
}

export default function NotesPage() {
  const [notes,       setNotes]       = useState([])
  const [activeNote,  setActiveNote]  = useState(null)
  const [query,       setQuery]       = useState('')
  const [loading,     setLoading]     = useState(true)
  const [saveLabel,   setSaveLabel]   = useState('')

  const titleRef    = useRef(null)
  const savingTimer = useRef(null)

  const fetchNotes = useCallback(async () => {
    setLoading(true)
    try {
      const res = await notesAPI.list()
      const sorted = [...res.data].sort(
        (a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at)
      )
      setNotes(sorted)
      setActiveNote((prev) =>
        prev ? sorted.find((n) => n.id === prev.id) || sorted[0] || null : sorted[0] || null
      )
    } catch { /* silent */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchNotes() }, [fetchNotes])

  const handleCreate = async () => {
    try {
      const res = await notesAPI.create({ title: 'Untitled', content: '' })
      const note = res.data
      setNotes((prev) => [note, ...prev])
      setActiveNote(note)
      setTimeout(() => titleRef.current?.focus(), 80)
    } catch { /* silent */ }
  }

  const handleDelete = async (id) => {
    try {
      await notesAPI.remove(id)
      setNotes((prev) => {
        const next = prev.filter((n) => n.id !== id)
        if (activeNote?.id === id) setActiveNote(next[0] || null)
        return next
      })
    } catch { /* silent */ }
  }

  const handleTitleBlur = async () => {
    if (!activeNote) return
    const newTitle = titleRef.current?.value?.trim() || 'Untitled'
    if (newTitle === activeNote.title) return
    const updated = { ...activeNote, title: newTitle }
    setActiveNote(updated)
    setNotes((prev) => prev.map((n) => (n.id === updated.id ? updated : n)))
    await notesAPI.update(activeNote.id, { title: newTitle })
  }

  const handleTitleKeyDown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); titleRef.current?.blur() }
  }

  const handleContentChange = useCallback(async (html) => {
    if (!activeNote) return
    clearTimeout(savingTimer.current)
    setSaveLabel('Saving…')
    try {
      const res = await notesAPI.update(activeNote.id, { content: html })
      const updated = res.data
      setActiveNote((prev) => (prev?.id === updated.id ? { ...prev, ...updated } : prev))
      setNotes((prev) => prev.map((n) => (n.id === updated.id ? { ...n, ...updated } : n)))
      setSaveLabel('Saved')
      savingTimer.current = setTimeout(() => setSaveLabel(''), 2000)
    } catch {
      setSaveLabel('Error saving')
      savingTimer.current = setTimeout(() => setSaveLabel(''), 3000)
    }
  }, [activeNote])

  const filtered = query.trim()
    ? notes.filter((n) =>
        n.title?.toLowerCase().includes(query.toLowerCase()) ||
        n.content?.toLowerCase().includes(query.toLowerCase())
      )
    : notes

  return (
    <div className="flex h-full bg-th-bg text-th-text overflow-hidden">
      {/* ── Left sidebar ─────────────────────────────────────────────── */}
      <aside className="w-56 shrink-0 flex flex-col bg-th-sidebar border-r border-th-border">
        {/* Header */}
        <div className="px-3 py-3 border-b border-th-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[12px] font-semibold text-th-muted uppercase tracking-wide">
              Notes
            </span>
            <button
              onClick={handleCreate}
              title="New note"
              className="p-1 rounded hover:bg-th-hover text-th-muted hover:text-th-accent transition-colors"
            >
              <IconPlus />
            </button>
          </div>
          {/* Search */}
          <div className="flex items-center gap-2 px-2.5 py-1.5 bg-th-input border border-th-border rounded-lg text-th-muted">
            <IconSearch />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter notes…"
              className="flex-1 text-[12px] outline-none bg-transparent text-th-text placeholder:text-th-muted/60"
            />
          </div>
        </div>

        {/* Note list */}
        <div className="flex-1 overflow-y-auto py-2 px-1.5">
          {loading && (
            <p className="text-center text-[12px] text-th-muted py-4">Loading…</p>
          )}
          {!loading && filtered.length === 0 && (
            <div className="text-center py-8">
              <p className="text-[12px] text-th-muted">No notes yet</p>
              <button
                onClick={handleCreate}
                className="mt-2 text-[12px] text-th-accent hover:underline font-medium"
              >
                Create one
              </button>
            </div>
          )}
          {filtered.map((note) => (
            <NoteItem
              key={note.id}
              note={note}
              active={activeNote?.id === note.id}
              onSelect={setActiveNote}
              onDelete={handleDelete}
            />
          ))}
        </div>

        {/* Footer */}
        <div className="px-3 py-2.5 border-t border-th-border">
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 text-[12px] text-th-muted hover:text-th-text transition-colors w-full py-1 font-medium"
          >
            <IconPlus />
            New page
          </button>
        </div>
      </aside>

      {/* ── Editor area ──────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden bg-th-bg text-th-text">
        {activeNote ? (
          <>
            <CoverHeader seed={activeNote.id} />

            {/* Save status */}
            <div className="flex justify-end px-12 pt-2">
              <span className={`text-[11px] transition-opacity
                ${saveLabel ? 'opacity-100' : 'opacity-0'}
                ${saveLabel === 'Error saving' ? 'text-th-danger' : 'text-th-muted'}`}>
                {saveLabel || '.'}
              </span>
            </div>

            {/* Editable title */}
            <div className="px-12 pb-1">
              <input
                ref={titleRef}
                type="text"
                defaultValue={activeNote.title}
                key={activeNote.id}
                onBlur={handleTitleBlur}
                onKeyDown={handleTitleKeyDown}
                placeholder="Untitled"
                className="w-full text-[2rem] font-bold text-th-text
                           outline-none bg-transparent placeholder:text-th-muted/40
                           border-none tracking-tight leading-tight"
              />
              <p className="text-[11px] text-th-muted mt-0.5">
                {fmtDate(activeNote.updated_at || activeNote.created_at)}
              </p>
            </div>

            {/* Rich-text editor */}
            <div className="flex-1 overflow-hidden">
              <NoteEditor
                key={activeNote.id}
                content={activeNote.content || ''}
                onChange={handleContentChange}
                placeholder="Start writing your note…"
              />
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-th-muted">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" strokeWidth="1.2" className="mb-4 opacity-40">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
            <p className="text-sm">Select or create a note</p>
            <button
              onClick={handleCreate}
              className="mt-3 px-4 py-1.5 text-sm font-medium bg-th-accent text-white
                         rounded-lg hover:bg-th-accentH transition-colors shadow-sm"
            >
              New page
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
