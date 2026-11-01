/**
 * NoteEditor — Notion-style rich text editor на Tiptap.
 * Адаптирован под мобильные устройства, планшеты и десктоп.
 */
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Highlight from '@tiptap/extension-highlight'
import Typography from '@tiptap/extension-typography'
import Placeholder from '@tiptap/extension-placeholder'
import { useEffect, useRef } from 'react'

function Ico({ d, size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  )
}

const TOOLBAR_GROUPS = [
  [
    {
      title: 'Heading 1',
      label: 'H1',
      text: true,
      action: (e) => e.chain().focus().toggleHeading({ level: 1 }).run(),
      active: (e) => e.isActive('heading', { level: 1 }),
    },
    {
      title: 'Heading 2',
      label: 'H2',
      text: true,
      action: (e) => e.chain().focus().toggleHeading({ level: 2 }).run(),
      active: (e) => e.isActive('heading', { level: 2 }),
    },
    {
      title: 'Heading 3',
      label: 'H3',
      text: true,
      action: (e) => e.chain().focus().toggleHeading({ level: 3 }).run(),
      active: (e) => e.isActive('heading', { level: 3 }),
    },
  ],
  [
    {
      title: 'Bold',
      icon: 'M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z',
      action: (e) => e.chain().focus().toggleBold().run(),
      active: (e) => e.isActive('bold'),
    },
    {
      title: 'Italic',
      icon: 'M19 4h-9M14 20H5M15 4L9 20',
      action: (e) => e.chain().focus().toggleItalic().run(),
      active: (e) => e.isActive('italic'),
    },
    {
      title: 'Highlight',
      icon: 'M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 1 1 3.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z',
      action: (e) => e.chain().focus().toggleHighlight().run(),
      active: (e) => e.isActive('highlight'),
    },
    {
      title: 'Inline code',
      icon: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4',
      action: (e) => e.chain().focus().toggleCode().run(),
      active: (e) => e.isActive('code'),
    },
  ],
  [
    {
      title: 'Bullet list',
      icon: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
      action: (e) => e.chain().focus().toggleBulletList().run(),
      active: (e) => e.isActive('bulletList'),
    },
    {
      title: 'Ordered list',
      icon: 'M10 6h11M10 12h11M10 18h11M4 6h1v4M4 10H3M3 18h2l-2-4h2',
      action: (e) => e.chain().focus().toggleOrderedList().run(),
      active: (e) => e.isActive('orderedList'),
    },
    {
      title: 'Blockquote',
      icon: 'M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1zm12 0c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z',
      action: (e) => e.chain().focus().toggleBlockquote().run(),
      active: (e) => e.isActive('blockquote'),
    },
  ],
]

function ToolbarBtn({ item, editor }) {
  if (!editor) return null
  const isActive = item.active?.(editor) ?? false
  return (
    <button
      type="button"
      title={item.title}
      onClick={() => item.action(editor)}
      className={`px-2 py-1.5 min-w-[28px] h-7 rounded text-[11px] font-semibold flex items-center justify-center
                  transition-colors select-none cursor-pointer
                  ${isActive
                    ? 'bg-th-accent text-white'
                    : 'text-th-muted hover:bg-th-hover hover:text-th-text'}`}
    >
      {item.text ? item.label : <Ico d={item.icon} size={13} />}
    </button>
  )
}

export default function NoteEditor({ content = '', onChange, placeholder = 'Start writing…' }) {
  const saveTimer = useRef(null)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading:      { levels: [1, 2, 3] },
        bulletList:   {},
        orderedList:  {},
        blockquote:   {},
        code:         {},
        codeBlock:    false,
      }),
      Highlight,
      Typography,
      Placeholder.configure({ placeholder }),
    ],
    content,
    editorProps: {
      attributes: { class: 'tiptap-editor text-th-text' },
    },
    onUpdate: ({ editor }) => {
      clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(() => {
        onChange?.(editor.getHTML())
      }, 600)
    },
  })

  useEffect(() => {
    if (!editor) return
    const current = editor.getHTML()
    if (current !== content) {
      editor.commands.setContent(content || '', false)
    }
  }, [content, editor])

  useEffect(() => () => clearTimeout(saveTimer.current), [])

  return (
    <div className="flex flex-col h-full bg-th-bg text-th-text">
      {/* Toolbar с горизонтальной прокруткой на мобильных */}
      <div className="flex items-center gap-0.5 flex-nowrap sm:flex-wrap px-3 sm:px-8 md:px-12 py-1.5 sm:py-2
                      border-b border-th-border bg-th-bg sticky top-0 z-10 overflow-x-auto">
        {TOOLBAR_GROUPS.map((group, gi) => (
          <span key={gi} className="flex items-center gap-0.5 shrink-0">
            {gi > 0 && (
              <span className="w-px h-4 bg-th-border mx-1" />
            )}
            {group.map((item) => (
              <ToolbarBtn key={item.title} item={item} editor={editor} />
            ))}
          </span>
        ))}
      </div>

      {/* Editor area с адаптивными отступами */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-8 md:px-12 py-5 sm:py-8 bg-th-bg">
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}
