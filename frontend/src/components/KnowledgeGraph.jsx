/**
 * KnowledgeGraph — интерактивный граф знаний с поддержкой:
 * 1. Нескольких холстов (Canvases)
 * 2. 4 портов подключения со всех сторон (CustomNode)
 * 3. Кастомизации цвета нод (Orange, Blue, Green, Purple, Rose, Default)
 * 4. Соединений со стрелками или без стрелок (Straight / Smooth / Dashed)
 * 5. Стильной панели зума (ZoomBar)
 * 6. Полной поддержки темной и светлой темы
 */
import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import ReactFlow, {
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  MarkerType,
  useReactFlow,
  ReactFlowProvider,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { graphAPI, linksAPI, notesAPI, foldersAPI } from '../api'
import CustomNode from './CustomNode'
import ZoomBar from './ZoomBar'

/* ── Иконки ──────────────────────────────────────────────────────────────── */
const I = ({ d }) => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
       stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={d}/>
  </svg>
)
const IconPlus    = () => <I d="M12 5v14M5 12h14"/>
const IconSearch  = () => <I d="M21 21l-4.35-4.35M11 19A8 8 0 1 0 11 3a8 8 0 0 0 0 16z"/>
const IconRefresh = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
       stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10"/>
    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
  </svg>
)
const IconTrash   = () => <I d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m3 0l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
const IconX       = () => <I d="M18 6L6 18M6 6l12 12"/>
const IconDoc     = () => <I d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6"/>
const IconSidebar = () => <I d="M4 6h16M4 12h10M4 18h16"/>
const IconBoard   = () => <I d="M3 3h7v9H3zm11 0h7v5h-7zm0 9h7v9h-7zM3 16h7v5H3z"/>

/* ── Преобразование узлов с позиционированием ───────────────────────────── */
function layoutNodes(rawNodes) {
  const cols = Math.max(Math.ceil(Math.sqrt(rawNodes.length)), 1)
  return rawNodes.map((n, i) => ({
    id:   String(n.id),
    type: 'custom',
    data: {
      label: n.title || `Note ${n.id}`,
      content: n.content || '',
      noteId: n.id,
      folderId: n.folder_id,
      color: n.color || 'default',
    },
    position: { x: (i % cols) * 260 + 80, y: Math.floor(i / cols) * 160 + 80 },
  }))
}

/* ── Context menu ────────────────────────────────────────────────────────── */
function ContextMenu({ x, y, items, onClose }) {
  const ref = useRef(null)
  useEffect(() => {
    const hd = (e) => { if (!ref.current?.contains(e.target)) onClose() }
    const esc = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('mousedown', hd)
    document.addEventListener('keydown', esc)
    return () => { document.removeEventListener('mousedown', hd); document.removeEventListener('keydown', esc) }
  }, [onClose])

  return (
    <div
      ref={ref}
      className="fixed z-50 py-1.5 min-w-[200px] rounded-xl text-[13px] backdrop-blur-md"
      style={{
        left: x, top: y,
        background:  'var(--th-card)',
        border:      '1px solid var(--th-border)',
        boxShadow:   '0 8px 32px rgba(0,0,0,.22)',
        color:       'var(--th-text)',
      }}
    >
      {items.map((item, i) =>
        item === 'divider' ? (
          <div key={i} className="my-1 border-t" style={{ borderColor: 'var(--th-border)' }} />
        ) : (
          <button
            key={i}
            onClick={() => { item.action?.(); onClose() }}
            className="flex items-center gap-2.5 w-full px-3.5 py-1.5 text-left transition-colors"
            style={{ color: item.danger ? 'var(--th-danger)' : 'var(--th-text)' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--th-hover)' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
          >
            {item.icon && <span style={{ opacity: .7 }}>{item.icon}</span>}
            <span>{item.label}</span>
            {item.colorCircle && (
              <span className="w-2.5 h-2.5 rounded-full ml-auto" style={{ background: item.colorCircle }} />
            )}
          </button>
        )
      )}
    </div>
  )
}

/* ── Модальное окно создания холста ─────────────────────────────────────── */
function CreateCanvasModal({ onClose, onCreated }) {
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const ref = useRef(null)

  useEffect(() => { ref.current?.focus() }, [])

  const submit = async (e) => {
    e.preventDefault()
    if (!name.trim()) return
    setBusy(true)
    try {
      const res = await foldersAPI.create(name.trim())
      const data = res.data
      onCreated({
        id: data.id,
        name: data.name || data.title || name.trim(),
        title: data.title || data.name || name.trim(),
      })
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create canvas.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,.5)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full max-w-sm p-5 rounded-xl border border-th-border bg-th-card shadow-xl"
        style={{ color: 'var(--th-text)' }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-[14px]">Create New Canvas</h3>
          <button onClick={onClose} className="text-th-muted hover:text-th-text"><IconX /></button>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <input
            ref={ref}
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Canvas name, e.g. 'Project Roadmap'"
            className="w-full px-3 py-2 text-sm bg-th-input border border-th-border rounded-lg outline-none
                       focus:ring-2 focus:ring-th-accent/20 focus:border-th-accent transition text-th-text"
          />
          {error && <p className="text-th-danger text-xs">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs text-th-muted border border-th-border rounded-lg hover:bg-th-hover"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="px-4 py-1.5 text-xs font-semibold bg-th-accent text-white rounded-lg hover:bg-th-accentH"
            >
              {busy ? 'Creating…' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ── Модальное окно создания заметки ─────────────────────────────────────── */
function CreateNoteModal({ onClose, onCreated, canvases, activeCanvasId }) {
  const [title, setTitle]       = useState('')
  const [content, setContent]   = useState('')
  const [folderId, setFolderId] = useState(activeCanvasId || '')
  const [color, setColor]       = useState('default')
  const [busy, setBusy]         = useState(false)
  const [error, setError]       = useState('')
  const ref = useRef(null)

  useEffect(() => { ref.current?.focus() }, [])

  const submit = async (e) => {
    e.preventDefault()
    if (!title.trim()) { setError('Title is required.'); return }
    setBusy(true)
    try {
      const res = await notesAPI.create({
        title: title.trim(),
        content,
        folder_id: folderId ? (isNaN(Number(folderId)) ? folderId : Number(folderId)) : undefined,
      })
      onCreated({ ...res.data, color })
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed.')
    } finally { setBusy(false) }
  }

  const colors = [
    { id: 'default', label: 'Neutral', bg: 'var(--th-card)' },
    { id: 'orange',  label: 'Orange',  bg: '#f97316' },
    { id: 'blue',    label: 'Blue',    bg: '#3b82f6' },
    { id: 'green',   label: 'Green',   bg: '#10b981' },
    { id: 'purple',  label: 'Purple',  bg: '#a855f7' },
    { id: 'rose',    label: 'Rose',    bg: '#f43f5e' },
  ]

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,.5)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full max-w-md p-6 rounded-xl border border-th-border bg-th-card shadow-2xl"
        style={{ color: 'var(--th-text)' }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[15px] font-semibold">New Note Node</h2>
          <button onClick={onClose} className="text-th-muted hover:text-th-text"><IconX /></button>
        </div>

        <form onSubmit={submit} className="space-y-3.5">
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-widest mb-1 text-th-muted">
              Title
            </label>
            <input
              ref={ref}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Node title…"
              className="w-full px-3.5 py-2 text-sm bg-th-input border border-th-border rounded-lg outline-none
                         focus:ring-2 focus:ring-th-accent/20 focus:border-th-accent transition text-th-text"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-widest mb-1 text-th-muted">
              Content (Optional)
            </label>
            <textarea
              rows={3}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Short note summary or description…"
              className="w-full px-3.5 py-2 text-sm bg-th-input border border-th-border rounded-lg outline-none
                         focus:ring-2 focus:ring-th-accent/20 focus:border-th-accent transition text-th-text resize-none"
            />
          </div>

          {/* Canvas select */}
          {canvases.length > 0 && (
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-widest mb-1 text-th-muted">
                Canvas
              </label>
              <select
                value={folderId}
                onChange={(e) => setFolderId(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-th-input border border-th-border rounded-lg outline-none
                           focus:border-th-accent text-th-text"
              >
                <option value="">Default (All nodes)</option>
                {canvases.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Node color accent */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-widest mb-1.5 text-th-muted">
              Color Accent
            </label>
            <div className="flex items-center gap-2">
              {colors.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setColor(c.id)}
                  title={c.label}
                  className="w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 flex items-center justify-center"
                  style={{
                    background: c.bg,
                    borderColor: color === c.id ? 'var(--th-text)' : 'var(--th-border)',
                    boxShadow: color === c.id ? '0 0 0 2px var(--th-accent)' : 'none',
                  }}
                />
              ))}
            </div>
          </div>

          {error && <p className="text-xs text-th-danger">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 text-xs text-th-muted border border-th-border rounded-lg hover:bg-th-hover"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="px-4 py-1.5 text-xs font-semibold bg-th-accent text-white rounded-lg hover:bg-th-accentH shadow-sm"
            >
              {busy ? 'Saving…' : 'Create Node'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ── Боковая панель нод и холстов ─────────────────────────────────────────── */
function NodeSidebar({
  nodes,
  canvases,
  activeCanvasId,
  onSelectCanvas,
  onCreateCanvas,
  onDeleteCanvas,
  onFocus,
  onCreateNode,
}) {
  const [query, setQuery] = useState('')
  const [focused, setFocused] = useState(null)

  const filtered = query.trim()
    ? nodes.filter((n) => n.data.label.toLowerCase().includes(query.toLowerCase()))
    : nodes

  return (
    <div
      className="flex flex-col h-full border-r bg-th-sidebar border-th-border"
      style={{ width: 220, minWidth: 220 }}
    >
      {/* ── Canvases header ─────────────────────────────────────────── */}
      <div className="p-3 border-b border-th-border">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-th-muted">
            Canvases
          </span>
          <button
            onClick={onCreateCanvas}
            title="Create new canvas"
            className="p-1 rounded text-th-muted hover:text-th-accent hover:bg-th-hover transition-colors"
          >
            <IconPlus />
          </button>
        </div>

        {/* Canvas List */}
        <div className="space-y-0.5">
          <button
            onClick={() => onSelectCanvas(null)}
            className={`flex items-center gap-2 w-full px-2.5 py-1.5 rounded-lg text-left text-[12px] transition-colors
              ${activeCanvasId === null
                ? 'bg-th-hover text-th-accent font-semibold'
                : 'text-th-muted hover:bg-th-hover hover:text-th-text'}`}
          >
            <IconBoard />
            <span className="truncate">All Nodes</span>
          </button>

          {canvases.map((c) => (
            <div
              key={c.id}
              className={`group flex items-center justify-between w-full px-2.5 py-1.5 rounded-lg text-left text-[12px] transition-colors cursor-pointer
                ${activeCanvasId === c.id
                  ? 'bg-th-hover text-th-accent font-semibold'
                  : 'text-th-muted hover:bg-th-hover hover:text-th-text'}`}
              onClick={() => onSelectCanvas(c.id)}
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <IconBoard />
                <span className="truncate">{c.name || c.title || 'Canvas'}</span>
              </div>
              {onDeleteCanvas && (
                <button
                  type="button"
                  onClick={async (e) => {
                    e.stopPropagation()
                    await onDeleteCanvas(c.id)
                  }}
                  className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-th-danger transition-opacity"
                  title="Delete canvas"
                >
                  <IconTrash />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Nodes search & list ──────────────────────────────────────── */}
      <div className="p-3 pb-2 border-b border-th-border">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-th-muted">
            Nodes ({nodes.length})
          </span>
          <button
            onClick={onCreateNode}
            title="Add node"
            className="p-1 rounded text-th-muted hover:text-th-accent hover:bg-th-hover transition-colors"
          >
            <IconPlus />
          </button>
        </div>

        <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-th-input border border-th-border">
          <span className="text-th-muted/70"><IconSearch /></span>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter nodes…"
            className="flex-1 text-[12px] outline-none bg-transparent text-th-text placeholder:text-th-muted/50"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-1.5 space-y-0.5">
        {filtered.length === 0 && (
          <p className="text-center text-[12px] text-th-muted py-6">
            {nodes.length === 0 ? 'No nodes in this canvas' : 'No matches'}
          </p>
        )}
        {filtered.map((node) => (
          <button
            key={node.id}
            onClick={() => { onFocus(node); setFocused(node.id) }}
            className={`flex items-center gap-2 w-full px-2.5 py-1.5 rounded-lg text-left text-[12px] transition-colors
              ${focused === node.id
                ? 'bg-th-hover text-th-accent font-medium'
                : 'text-th-text hover:bg-th-hover'}`}
          >
            <span className="text-th-muted shrink-0"><IconDoc /></span>
            <span className="truncate">{node.data.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

/* ── Главный граф ────────────────────────────────────────────────────────── */
function GraphCanvas() {
  const { screenToFlowPosition, fitView, setCenter, getNode } = useReactFlow()

  const isDark = () => document.documentElement.classList.contains('dark')

  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [dark, setDark]                 = useState(isDark)
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState('')

  // Canvases
  const [canvases, setCanvases]         = useState([])
  const [activeCanvasId, setActiveCanvasId] = useState(null)
  const [showCanvasModal, setShowCanvasModal] = useState(false)

  // Arrow & link style: 'arrow' | 'line' | 'dashed'
  const [linkStyle, setLinkStyle]       = useState('arrow')

  // Modals & menus
  const [showModal, setShowModal]       = useState(false)
  const [pendingPos, setPendingPos]     = useState(null)
  const [ctxMenu, setCtxMenu]           = useState(null)
  const [sideOpen, setSideOpen]         = useState(true)
  const [toast, setToast]               = useState('')

  const nodeTypes = useMemo(() => ({ custom: CustomNode }), [])

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  // Загрузка холстов (папок)
  const fetchCanvases = useCallback(async () => {
    try {
      const res = await foldersAPI.list()
      setCanvases(res.data)
    } catch { /* silent */ }
  }, [])

  // Построение ребер в зависимости от текущего режима стрелок
  const buildEdgesWithStyle = useCallback((rawEdges, d, currentLinkStyle) => {
    const isArrow = currentLinkStyle === 'arrow'
    const isDashed = currentLinkStyle === 'dashed'

    return rawEdges.map((e) => ({
      id: String(e.id),
      source: String(e.source),
      target: String(e.target),
      sourceHandle: e.sourceHandle,
      targetHandle: e.targetHandle,
      markerEnd: isArrow ? { type: MarkerType.ArrowClosed, color: d ? '#f97316' : '#94a3b8' } : undefined,
      style: {
        stroke: d ? '#666666' : '#cbd5e1',
        strokeWidth: 1.75,
        strokeDasharray: isDashed ? '5 5' : undefined,
      },
    }))
  }, [])

  // Загрузка графа (с учетом холста)
  const fetchGraph = useCallback(async () => {
    setLoading(true); setError('')
    const d = isDark()
    try {
      const res = await graphAPI.getGraph(activeCanvasId)
      setNodes(layoutNodes(res.data.nodes))
      setEdges(buildEdgesWithStyle(res.data.edges, d, linkStyle))
    } catch {
      setError('Failed to load graph.')
    } finally {
      setLoading(false)
    }
  }, [activeCanvasId, linkStyle, buildEdgesWithStyle, setNodes, setEdges])

  useEffect(() => {
    fetchCanvases()
  }, [fetchCanvases])

  useEffect(() => {
    fetchGraph()
  }, [fetchGraph])

  // Следим за сменой темы
  useEffect(() => {
    const obs = new MutationObserver(() => {
      const nowDark = isDark()
      setDark(nowDark)
      setEdges((eds) => eds.map((e) => ({
        ...e,
        markerEnd: linkStyle === 'arrow'
          ? { type: MarkerType.ArrowClosed, color: nowDark ? '#f97316' : '#94a3b8' }
          : undefined,
        style: {
          ...e.style,
          stroke: nowDark ? '#666666' : '#cbd5e1',
        },
      })))
    })
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => obs.disconnect()
  }, [linkStyle, setEdges])

  const closeCtx = useCallback(() => setCtxMenu(null), [])

  // Фокус на ноде
  const handleFocusNode = useCallback((node) => {
    const n = getNode(node.id)
    if (!n) return
    setCenter(n.position.x + 90, n.position.y + 40, { zoom: 1.4, duration: 500 })
  }, [getNode, setCenter])

  // ПКМ по холсту
  const onPaneContextMenu = useCallback((e) => {
    e.preventDefault()
    const pos = screenToFlowPosition({ x: e.clientX, y: e.clientY })
    setCtxMenu({
      x: e.clientX, y: e.clientY,
      items: [
        { label: 'Add note node here', icon: <IconPlus />, action: () => { setPendingPos(pos); setShowModal(true) } },
        'divider',
        { label: 'Refresh graph', icon: <IconRefresh />, action: fetchGraph },
      ],
    })
  }, [screenToFlowPosition, fetchGraph])

  // Кастомизация цвета конкретной ноды
  const setNodeColor = useCallback((nodeId, color) => {
    setNodes((nds) => nds.map((n) => (n.id === nodeId ? { ...n, data: { ...n.data, color } } : n)))
  }, [setNodes])

  // ПКМ по ноде
  const onNodeContextMenu = useCallback((e, node) => {
    e.preventDefault(); e.stopPropagation()
    setCtxMenu({
      x: e.clientX, y: e.clientY,
      items: [
        { label: `"${node.data.label}"`, action: () => {}, hint: 'Node' },
        'divider',
        { label: 'Color: Orange',  colorCircle: '#f97316', action: () => setNodeColor(node.id, 'orange') },
        { label: 'Color: Blue',    colorCircle: '#3b82f6', action: () => setNodeColor(node.id, 'blue') },
        { label: 'Color: Green',   colorCircle: '#10b981', action: () => setNodeColor(node.id, 'green') },
        { label: 'Color: Purple',  colorCircle: '#a855f7', action: () => setNodeColor(node.id, 'purple') },
        { label: 'Color: Neutral', colorCircle: '#94a3b8', action: () => setNodeColor(node.id, 'default') },
        'divider',
        {
          label: 'Delete node', icon: <IconTrash />, danger: true,
          action: async () => {
            try {
              await notesAPI.remove(node.data.noteId)
              setNodes((ns) => ns.filter((n) => n.id !== node.id))
              setEdges((es) => es.filter((edge) => edge.source !== node.id && edge.target !== node.id))
            } catch { showToast('Could not delete note.') }
          },
        },
      ],
    })
  }, [setNodeColor, setNodes, setEdges])

  // Создание ноды
  const handleNoteCreated = useCallback((note) => {
    setShowModal(false)
    const pos = pendingPos || { x: Math.random() * 400 + 100, y: Math.random() * 300 + 100 }
    setPendingPos(null)
    setNodes((nds) => [
      ...nds,
      {
        id: String(note.id),
        type: 'custom',
        data: {
          label: note.title,
          content: note.content || '',
          noteId: note.id,
          folderId: note.folder_id,
          color: note.color || 'default',
        },
        position: pos,
      },
    ])
  }, [pendingPos, setNodes])

  // Соединение нод с поддержкой 4 сторон (sourceHandle/targetHandle) и выбранного стиля стрелок
  const onConnect = useCallback(async (params) => {
    try {
      await linksAPI.createLink(Number(params.source), Number(params.target))
      const d = isDark()
      const isArrow = linkStyle === 'arrow'
      const isDashed = linkStyle === 'dashed'

      setEdges((eds) => addEdge({
        ...params,
        markerEnd: isArrow ? { type: MarkerType.ArrowClosed, color: d ? '#f97316' : '#94a3b8' } : undefined,
        style: {
          stroke: d ? '#666666' : '#cbd5e1',
          strokeWidth: 1.75,
          strokeDasharray: isDashed ? '5 5' : undefined,
        },
      }, eds))
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to connect.')
    }
  }, [linkStyle, setEdges])

  // Переключение стиля связей
  const handleSwitchLinkStyle = (newStyle) => {
    setLinkStyle(newStyle)
    const d = isDark()
    setEdges((eds) => buildEdgesWithStyle(eds, d, newStyle))
  }

  if (loading) return (
    <div className="flex-1 flex items-center justify-center text-[13px] text-th-muted bg-th-bg">
      Loading knowledge graph…
    </div>
  )
  if (error) return (
    <div className="flex-1 flex flex-col items-center justify-center gap-3 bg-th-bg">
      <p className="text-[13px] text-th-danger">{error}</p>
      <button onClick={fetchGraph} className="px-4 py-1.5 text-[13px] rounded-lg border border-th-border text-th-text">
        Retry
      </button>
    </div>
  )

  const handleDeleteCanvas = async (folderId) => {
    try {
      await foldersAPI.remove(folderId)
      setCanvases((prev) => prev.filter((c) => c.id !== folderId))
      if (activeCanvasId === folderId) {
        setActiveCanvasId(null)
      }
    } catch {
      showToast('Could not delete canvas.')
    }
  }

  const activeCanvasName = activeCanvasId
    ? canvases.find((c) => c.id === activeCanvasId)?.name || canvases.find((c) => c.id === activeCanvasId)?.title || 'Canvas'
    : 'All Nodes'

  return (
    <div className="flex flex-col h-full bg-th-bg text-th-text">
      {/* ── Верхний тулбар ─────────────────────────────────────────── */}
      <div className="flex items-center gap-2 px-4 py-2 border-b shrink-0 bg-th-sidebar border-th-border">
        {/* Sidebar toggle */}
        <button
          onClick={() => setSideOpen((v) => !v)}
          className="p-1.5 rounded-lg text-th-muted hover:text-th-text hover:bg-th-hover transition-colors"
          title="Toggle Canvas and Node panel"
        >
          <IconSidebar />
        </button>

        {/* Current Canvas Badge */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-th-card border border-th-border">
          <IconBoard />
          <span className="text-[12px] font-semibold text-th-text">{activeCanvasName}</span>
        </div>

        <div className="w-px h-4 bg-th-border" />

        {/* New note button */}
        <button
          onClick={() => { setPendingPos(null); setShowModal(true) }}
          className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium rounded-lg bg-th-accent text-white hover:bg-th-accentH transition-colors shadow-sm"
        >
          <IconPlus /> New Node
        </button>

        {/* Connection style switch: Arrow / Line / Dashed */}
        <div className="flex items-center rounded-lg border border-th-border p-0.5 bg-th-card">
          <button
            onClick={() => handleSwitchLinkStyle('arrow')}
            className={`px-2 py-1 text-[11px] font-medium rounded transition-colors
              ${linkStyle === 'arrow' ? 'bg-th-accent text-white' : 'text-th-muted hover:text-th-text'}`}
            title="Arrow connections"
          >
            → Arrows
          </button>
          <button
            onClick={() => handleSwitchLinkStyle('line')}
            className={`px-2 py-1 text-[11px] font-medium rounded transition-colors
              ${linkStyle === 'line' ? 'bg-th-accent text-white' : 'text-th-muted hover:text-th-text'}`}
            title="Simple lines without arrowheads"
          >
            — Lines
          </button>
          <button
            onClick={() => handleSwitchLinkStyle('dashed')}
            className={`px-2 py-1 text-[11px] font-medium rounded transition-colors
              ${linkStyle === 'dashed' ? 'bg-th-accent text-white' : 'text-th-muted hover:text-th-text'}`}
            title="Dashed connections"
          >
            ┄ Dashed
          </button>
        </div>

        {/* Refresh */}
        <button
          onClick={fetchGraph}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-[12px] rounded-lg border border-th-border text-th-muted hover:text-th-text hover:bg-th-hover transition-colors"
          title="Refresh nodes and edges"
        >
          <IconRefresh />
        </button>

        <span className="ml-auto text-[11px] text-th-muted hidden md:inline">
          {nodes.length} nodes · {edges.length} edges &nbsp;·&nbsp;
          <span className="opacity-70">Connect handles from any side</span>
        </span>
      </div>

      {/* ── Рабочая область: Боковой список + Холст ─────────────────── */}
      <div className="flex flex-1 overflow-hidden relative">
        {sideOpen && (
          <NodeSidebar
            nodes={nodes}
            canvases={canvases}
            activeCanvasId={activeCanvasId}
            onSelectCanvas={setActiveCanvasId}
            onCreateCanvas={() => setShowCanvasModal(true)}
            onDeleteCanvas={handleDeleteCanvas}
            onFocus={handleFocusNode}
            onCreateNode={() => { setPendingPos(null); setShowModal(true) }}
          />
        )}

        {/* Холст графа */}
        <div className="relative flex-1">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onPaneContextMenu={onPaneContextMenu}
            onNodeContextMenu={onNodeContextMenu}
            onPaneClick={closeCtx}
            fitView
            fitViewOptions={{ padding: 0.25 }}
            minZoom={0.15}
            maxZoom={3}
          >
            <Background
              color={dark ? '#262626' : '#e9e9e7'}
              gap={26}
              size={1}
            />

            {/* Современная кастомная панель масштабирования */}
            <ZoomBar />

            {/* Стильная мини-карта */}
            <MiniMap
              nodeColor={dark ? '#f97316' : '#94a3b8'}
              nodeStrokeColor={dark ? '#ea580c' : '#64748b'}
              nodeBorderRadius={4}
              maskColor={dark ? 'rgba(0, 0, 0, 0.75)' : 'rgba(240, 240, 240, 0.65)'}
              style={{
                background: dark ? '#181818' : '#ffffff',
                border: `1px solid ${dark ? '#2e2e2e' : '#e9e9e7'}`,
                borderRadius: '8px',
              }}
            />
          </ReactFlow>

          {nodes.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-th-muted">
              <p className="text-[14px] font-medium">This canvas has no nodes yet</p>
              <p className="text-[12px] mt-1 opacity-70">Click "New Node" or right-click the canvas to add one</p>
            </div>
          )}

          {/* Toast */}
          {toast && (
            <div
              className="absolute top-3 left-1/2 -translate-x-1/2 z-30 px-4 py-2 rounded-lg text-[12px] shadow-lg"
              style={{ background: 'var(--th-accent)', color: '#fff' }}
            >
              {toast}
            </div>
          )}
        </div>
      </div>

      {/* Меню ПКМ */}
      {ctxMenu && (
        <ContextMenu x={ctxMenu.x} y={ctxMenu.y} items={ctxMenu.items} onClose={closeCtx} />
      )}

      {/* Модалка создания холста */}
      {showCanvasModal && (
        <CreateCanvasModal
          onClose={() => setShowCanvasModal(false)}
          onCreated={(newFolder) => {
            setShowCanvasModal(false)
            setCanvases((prev) => [...prev, newFolder])
            setActiveCanvasId(newFolder.id)
          }}
        />
      )}

      {/* Модалка создания заметки */}
      {showModal && (
        <CreateNoteModal
          canvases={canvases}
          activeCanvasId={activeCanvasId}
          onClose={() => { setShowModal(false); setPendingPos(null) }}
          onCreated={handleNoteCreated}
        />
      )}
    </div>
  )
}

export default function KnowledgeGraph() {
  return (
    <ReactFlowProvider>
      <GraphCanvas />
    </ReactFlowProvider>
  )
}
