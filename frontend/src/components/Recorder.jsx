/**
 * Recorder — диктофон в браузере.
 * Полная поддержка светлой и тёмной темы.
 */
import { useState, useRef, useEffect, useCallback } from 'react'
import { audioAPI } from '../api'
import CoverHeader from './CoverHeader'

/* ── SVG иконки ──────────────────────────────────────────────────────────── */
const IconMic = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
       stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
    <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
    <line x1="12" y1="19" x2="12" y2="23"/>
    <line x1="8" y1="23" x2="16" y2="23"/>
  </svg>
)
const IconStop = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
       stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <rect x="6" y="6" width="12" height="12" rx="2"/>
  </svg>
)
const IconUpload = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
       stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="17 8 12 3 7 8"/>
    <line x1="12" y1="3" x2="12" y2="15"/>
  </svg>
)
const IconRefresh = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
       stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10"/>
    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
  </svg>
)
const IconTrash = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
       stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
    <path d="M10 11v6M14 11v6"/>
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
  </svg>
)
const IconChevron = ({ open }) => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
       stroke="currentColor" strokeWidth="2" strokeLinecap="round"
       style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}>
    <polyline points="6 9 12 15 18 9"/>
  </svg>
)

function fmtTime(s) {
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}

const STATUS_COLOR = {
  transcribed: 'text-green-500',
  processing:  'text-th-accent',
  failed:      'text-th-danger',
  pending:     'text-th-muted',
}

function LectureCard({ lecture, onDelete }) {
  const [open, setOpen] = useState(false)
  const color = STATUS_COLOR[lecture.status] || 'text-th-muted'

  return (
    <div className="border border-th-border rounded-xl overflow-hidden bg-th-card shadow-sm transition-all">
      <div
        className="flex items-center justify-between px-4 py-3 cursor-pointer
                   hover:bg-th-hover transition-colors select-none"
        onClick={() => setOpen((v) => !v)}
      >
        <div className="min-w-0">
          <p className="text-[13px] font-medium text-th-text truncate">
            {lecture.title || 'Untitled recording'}
          </p>
          <p className={`text-[11px] mt-0.5 font-medium ${color}`}>{lecture.status}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-3">
          {lecture.transcript && <IconChevron open={open} />}
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(lecture.lecture_id) }}
            className="p-1.5 text-th-muted hover:text-th-danger transition-colors rounded-lg hover:bg-th-hover"
            title="Delete"
          >
            <IconTrash />
          </button>
        </div>
      </div>
      {open && lecture.transcript && (
        <div className="px-4 pb-4 pt-0 border-t border-th-border bg-th-bg/40">
          <p className="text-[13px] text-th-muted leading-relaxed whitespace-pre-wrap
                        max-h-48 overflow-y-auto mt-3">
            {lecture.transcript}
          </p>
        </div>
      )}
    </div>
  )
}

export default function Recorder() {
  const [recording,   setRecording]   = useState(false)
  const [seconds,     setSeconds]     = useState(0)
  const [uploadPct,   setUploadPct]   = useState(null)
  const [transcript,  setTranscript]  = useState('')
  const [title,       setTitle]       = useState('')
  const [error,       setError]       = useState('')
  const [lectures,    setLectures]    = useState([])
  const [loadingList, setLoadingList] = useState(false)

  const mediaRecRef = useRef(null)
  const chunksRef   = useRef([])
  const timerRef    = useRef(null)

  const fetchLectures = useCallback(async () => {
    setLoadingList(true)
    try {
      const res = await audioAPI.listLectures()
      setLectures(res.data)
    } catch { /* silent */ }
    finally { setLoadingList(false) }
  }, [])

  useEffect(() => { fetchLectures() }, [fetchLectures])

  const startRecording = async () => {
    setError('')
    setTranscript('')
    chunksRef.current = []
    let stream
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch {
      setError('Microphone access denied.')
      return
    }
    const mime = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
      ? 'audio/webm;codecs=opus' : 'audio/webm'
    const rec = new MediaRecorder(stream, { mimeType: mime })
    mediaRecRef.current = rec
    rec.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data) }
    rec.onstop = () => stream.getTracks().forEach((t) => t.stop())
    rec.start(200)
    setRecording(true)
    setSeconds(0)
    timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000)
  }

  const stopAndUpload = () => {
    if (!mediaRecRef.current) return
    clearInterval(timerRef.current)
    setRecording(false)
    mediaRecRef.current.onstop = async () => {
      mediaRecRef.current.stream?.getTracks().forEach((t) => t.stop())
      const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
      if (!blob.size) { setError('Recording is empty.'); return }
      const file = new File([blob], `recording-${Date.now()}.webm`, { type: 'audio/webm' })
      setUploadPct(0)
      setError('')
      try {
        const res = await audioAPI.transcribe(file, title, setUploadPct)
        setTranscript(res.data.transcript)
        await fetchLectures()
      } catch (err) {
        setError(err.response?.data?.detail || 'Transcription failed.')
      } finally { setUploadPct(null) }
    }
    mediaRecRef.current.stop()
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError(''); setTranscript(''); setUploadPct(0)
    try {
      const res = await audioAPI.transcribe(file, title || file.name, setUploadPct)
      setTranscript(res.data.transcript)
      await fetchLectures()
    } catch (err) {
      setError(err.response?.data?.detail || 'Transcription failed.')
    } finally { setUploadPct(null); e.target.value = '' }
  }

  const handleDelete = async (id) => {
    try {
      await audioAPI.deleteLecture(id)
      setLectures((prev) => prev.filter((l) => l.lecture_id !== id))
    } catch { setError('Could not delete recording.') }
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-th-bg text-th-text">
      <CoverHeader seed={3} title="Transcription" subtitle="Record audio or upload a file to transcribe via Whisper" />

      <div className="px-12 py-6 max-w-3xl w-full mx-auto space-y-6">

        {/* ── Record panel ─────────────────────────────────────────── */}
        <div className="border border-th-border rounded-xl p-6 bg-th-card shadow-sm">
          <h2 className="text-[13px] font-semibold text-th-muted uppercase tracking-wide mb-4">
            New recording
          </h2>

          <input
            type="text"
            placeholder="Recording title (optional)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={recording || uploadPct !== null}
            className="w-full mb-4 px-3.5 py-2.5 text-sm bg-th-input border border-th-border rounded-lg
                       outline-none focus:ring-2 focus:ring-th-accent/20 focus:border-th-accent
                       transition text-th-text placeholder:text-th-muted/50 disabled:opacity-50"
          />

          <div className="flex items-center gap-3 flex-wrap">
            {!recording ? (
              <button
                onClick={startRecording}
                disabled={uploadPct !== null}
                className="flex items-center gap-2 px-4 py-2 text-[13px] font-medium
                           bg-th-accent text-white rounded-lg hover:bg-th-accentH
                           disabled:opacity-50 transition-colors shadow-sm"
              >
                <IconMic /> Start recording
              </button>
            ) : (
              <button
                onClick={stopAndUpload}
                className="flex items-center gap-2 px-4 py-2 text-[13px] font-medium
                           bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-sm"
                style={{ animation: 'pulse 2s cubic-bezier(.4,0,.6,1) infinite' }}
              >
                <IconStop /> Stop · {fmtTime(seconds)}
              </button>
            )}

            <label className="flex items-center gap-2 px-4 py-2 text-[13px]
                              border border-th-border rounded-lg text-th-muted
                              hover:bg-th-hover hover:text-th-text cursor-pointer
                              transition-colors">
              <IconUpload /> Upload file
              <input type="file" accept="audio/*,video/webm" className="hidden"
                     onChange={handleFileUpload} disabled={recording || uploadPct !== null} />
            </label>
          </div>

          {uploadPct !== null && (
            <div className="mt-4">
              <div className="flex justify-between text-[11px] text-th-muted mb-1">
                <span>Transcribing…</span><span>{uploadPct}%</span>
              </div>
              <div className="w-full bg-th-border rounded-full h-1.5 overflow-hidden">
                <div className="bg-th-accent h-1.5 rounded-full transition-all"
                     style={{ width: `${uploadPct}%` }} />
              </div>
            </div>
          )}

          {error && <p className="mt-3 text-th-danger text-[13px]">{error}</p>}

          {transcript && (
            <div className="mt-4 p-4 border border-th-border rounded-xl bg-th-bg">
              <p className="text-[11px] text-th-muted uppercase tracking-wide mb-2 font-medium">
                Transcript
              </p>
              <p className="text-[13px] text-th-text whitespace-pre-wrap leading-relaxed">
                {transcript}
              </p>
            </div>
          )}
        </div>

        {/* ── History ──────────────────────────────────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[13px] font-semibold text-th-muted uppercase tracking-wide">
              History
            </h2>
            <button
              onClick={fetchLectures}
              disabled={loadingList}
              className="flex items-center gap-1.5 text-[12px] text-th-muted
                         hover:text-th-text disabled:opacity-50 transition-colors"
            >
              <IconRefresh /> Refresh
            </button>
          </div>

          {!loadingList && lectures.length === 0 && (
            <p className="text-[13px] text-th-muted text-center py-10">
              No recordings yet
            </p>
          )}

          <div className="space-y-2">
            {lectures.map((lec) => (
              <LectureCard key={lec.lecture_id} lecture={lec} onDelete={handleDelete} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
