/**
 * CustomNode — кастомный узел графа знаний с 4 точками соединения (Handles)
 * со всех сторон (Top, Right, Bottom, Left) и поддержкой цветовой кастомизации.
 */
import { memo } from 'react'
import { Handle, Position } from 'reactflow'

const COLOR_MAP = {
  default: {
    border: 'var(--th-border)',
    accent: 'var(--th-accent)',
    bg: 'var(--th-card)',
  },
  orange: {
    border: '#f97316',
    accent: '#f97316',
    bg: 'var(--th-card)',
    glow: 'rgba(249, 115, 22, 0.15)',
  },
  blue: {
    border: '#3b82f6',
    accent: '#3b82f6',
    bg: 'var(--th-card)',
    glow: 'rgba(59, 130, 246, 0.15)',
  },
  green: {
    border: '#10b981',
    accent: '#10b981',
    bg: 'var(--th-card)',
    glow: 'rgba(16, 185, 129, 0.15)',
  },
  purple: {
    border: '#a855f7',
    accent: '#a855f7',
    bg: 'var(--th-card)',
    glow: 'rgba(168, 85, 247, 0.15)',
  },
  rose: {
    border: '#f43f5e',
    accent: '#f43f5e',
    bg: 'var(--th-card)',
    glow: 'rgba(244, 63, 94, 0.15)',
  },
}

function CustomNode({ data, selected }) {
  const colorKey = data.color || 'default'
  const themeColor = COLOR_MAP[colorKey] || COLOR_MAP.default

  const handleStyle = {
    width: 8,
    height: 8,
    background: 'var(--th-card)',
    border: `2px solid ${themeColor.accent}`,
    transition: 'transform 0.15s ease, background 0.15s ease',
  }

  return (
    <div
      className="group relative rounded-xl px-4 py-3 min-w-[150px] max-w-[220px] transition-all"
      style={{
        background: themeColor.bg,
        border: `1.5px solid ${selected ? 'var(--th-accent)' : themeColor.border}`,
        boxShadow: selected
          ? `0 0 0 3px rgba(249, 115, 22, 0.25), 0 4px 14px rgba(0,0,0,0.12)`
          : themeColor.glow
          ? `0 0 0 2px ${themeColor.glow}, 0 2px 8px rgba(0,0,0,0.08)`
          : `0 1px 4px rgba(0,0,0,0.08)`,
        color: 'var(--th-text)',
      }}
    >
      {/* 4 Handles: Top, Right, Bottom, Left */}
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        style={{ ...handleStyle, top: -5 }}
        className="opacity-0 group-hover:opacity-100 hover:scale-125 !cursor-crosshair"
      />
      <Handle
        type="source"
        position={Position.Top}
        id="top-src"
        style={{ ...handleStyle, top: -5, opacity: 0 }}
      />

      <Handle
        type="source"
        position={Position.Right}
        id="right"
        style={{ ...handleStyle, right: -5 }}
        className="opacity-0 group-hover:opacity-100 hover:scale-125 !cursor-crosshair"
      />
      <Handle
        type="target"
        position={Position.Right}
        id="right-tgt"
        style={{ ...handleStyle, right: -5, opacity: 0 }}
      />

      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        style={{ ...handleStyle, bottom: -5 }}
        className="opacity-0 group-hover:opacity-100 hover:scale-125 !cursor-crosshair"
      />
      <Handle
        type="target"
        position={Position.Bottom}
        id="bottom-tgt"
        style={{ ...handleStyle, bottom: -5, opacity: 0 }}
      />

      <Handle
        type="target"
        position={Position.Left}
        id="left"
        style={{ ...handleStyle, left: -5 }}
        className="opacity-0 group-hover:opacity-100 hover:scale-125 !cursor-crosshair"
      />
      <Handle
        type="source"
        position={Position.Left}
        id="left-src"
        style={{ ...handleStyle, left: -5, opacity: 0 }}
      />

      {/* Node content */}
      <div className="flex items-center gap-1.5 mb-0.5">
        {data.color && data.color !== 'default' && (
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ background: themeColor.accent }}
          />
        )}
        <p className="font-semibold text-[13px] leading-snug truncate" title={data.label}>
          {data.label}
        </p>
      </div>

      {data.content && (
        <p className="text-[11px] text-th-muted line-clamp-2 leading-tight mt-1 opacity-80">
          {data.content.replace(/<[^>]*>/g, '')}
        </p>
      )}
    </div>
  )
}

export default memo(CustomNode)
