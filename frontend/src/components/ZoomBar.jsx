/**
 * ZoomBar — современная кастомная плавающая панель зума для React Flow
 * взамен стандартного грубого серого блока Controls.
 */
import { useReactFlow, useViewport } from 'reactflow'

export default function ZoomBar() {
  const { zoomIn, zoomOut, fitView, setViewport } = useReactFlow()
  const { zoom } = useViewport()

  const zoomPercent = Math.round(zoom * 100)

  const resetZoom = () => {
    fitView({ duration: 300, padding: 0.25 })
  }

  const btnCls = `flex items-center justify-center w-7 h-7 rounded-lg text-th-muted
                  hover:text-th-text hover:bg-th-hover transition-colors text-[13px] font-medium`

  return (
    <div
      className="absolute bottom-5 left-5 z-20 flex items-center gap-1 p-1 rounded-xl
                 border border-th-border bg-th-card/90 backdrop-blur-md shadow-lg
                 select-none transition-all"
    >
      {/* Zoom In */}
      <button
        onClick={() => zoomIn({ duration: 200 })}
        className={btnCls}
        title="Zoom In"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>

      {/* Current zoom percentage — click to reset */}
      <button
        onClick={resetZoom}
        className="px-2 h-7 rounded-lg text-[11px] font-semibold text-th-muted hover:text-th-accent hover:bg-th-hover transition-colors"
        title="Reset zoom to fit"
      >
        {zoomPercent}%
      </button>

      {/* Zoom Out */}
      <button
        onClick={() => zoomOut({ duration: 200 })}
        className={btnCls}
        title="Zoom Out"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>

      <div className="w-px h-4 bg-th-border mx-0.5" />

      {/* Fit View */}
      <button
        onClick={() => fitView({ duration: 350, padding: 0.2 })}
        className={btnCls}
        title="Fit all nodes in view"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
        </svg>
      </button>
    </div>
  )
}
