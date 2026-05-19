import { useState, useRef, useEffect } from 'react'
import { Trash01, XClose, AlignLeft, Clock } from '@untitled-ui/icons-react'
import Avatar from '../ui/Avatar'
import Button from '../ui/Button'
import Input from '../ui/Input'
import { parseTimeInput, formatSeconds, formatEntryDate } from '../../lib/timeUtils'
import type { TimeEntry } from '../../lib/api'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface EditTimeEntryPayload {
  duration_seconds: number
  started_at:       string
  ended_at:         string
  description?:     string
}

interface EditTimeEntryPopupProps {
  entry:     TimeEntry
  anchorRef: React.RefObject<HTMLElement | null>
  onSave:    (entryId: string, payload: EditTimeEntryPayload) => Promise<void>
  onDelete:  (entryId: string) => void
  onClose:   () => void
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function isoToTimeValue(iso: string): string {
  const d   = new Date(iso)
  const h   = String(d.getHours()).padStart(2, '0')
  const m   = String(d.getMinutes()).padStart(2, '0')
  return `${h}:${m}`
}

function applyTimeToISO(baseISO: string, timeValue: string): string {
  const [h, m] = timeValue.split(':').map(Number)
  const d = new Date(baseISO)
  d.setHours(h, m, 0, 0)
  return d.toISOString()
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function EditTimeEntryPopup({
  entry, anchorRef, onSave, onDelete, onClose,
}: EditTimeEntryPopupProps) {
  const popupRef = useRef<HTMLDivElement>(null)

  // Form state
  const [durationText, setDurationText] = useState(() => formatSeconds(entry.duration_seconds ?? 0))
  const [startTime,    setStartTime]    = useState(() => isoToTimeValue(entry.started_at))
  const [endTime,      setEndTime]      = useState(() => entry.ended_at ? isoToTimeValue(entry.ended_at) : '')
  const [note,         setNote]         = useState(entry.description ?? '')

  // Async save state
  const [saving,   setSaving]   = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Popup position (fixed, relative to viewport)
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)

  useEffect(() => {
    if (!anchorRef.current) return
    const rect = anchorRef.current.getBoundingClientRect()
    const POPUP_W  = 300
    const POPUP_H  = 320 // approximate
    const MARGIN   = 8

    // Center over the anchor row (which spans the full panel width)
    let left = rect.left + rect.width / 2 - POPUP_W / 2
    if (left + POPUP_W > window.innerWidth - MARGIN) {
      left = window.innerWidth - POPUP_W - MARGIN
    }
    if (left < MARGIN) left = MARGIN

    // Prefer below anchor; flip above if it overflows bottom edge
    let top = rect.bottom + 4
    if (top + POPUP_H > window.innerHeight - MARGIN) {
      top = rect.top - POPUP_H - 4
    }

    setPos({ top, left })
  }, [anchorRef])

  // Close on outside click
  useEffect(() => {
    function handleDown(e: MouseEvent) {
      const t = e.target as Node
      if (
        popupRef.current   && !popupRef.current.contains(t) &&
        anchorRef.current  && !anchorRef.current.contains(t)
      ) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleDown)
    return () => document.removeEventListener('mousedown', handleDown)
  }, [anchorRef, onClose])

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  async function handleSave() {
    const parsedSeconds = parseTimeInput(durationText)
    const startISO      = applyTimeToISO(entry.started_at, startTime)
    const endISO        = endTime
      ? applyTimeToISO(entry.ended_at ?? entry.started_at, endTime)
      : (entry.ended_at ?? entry.started_at)

    const duration = parsedSeconds
      ?? Math.max(0, Math.round((new Date(endISO).getTime() - new Date(startISO).getTime()) / 1000))

    setSaving(true)
    setErrorMsg(null)
    try {
      await onSave(entry.id, {
        duration_seconds: Math.max(1, duration),
        started_at:       startISO,
        ended_at:         endISO,
        description:      note.trim() || undefined,
      })
      onClose()
    } catch {
      setErrorMsg('Failed to save. Please try again.')
      setSaving(false)
    }
  }

  const userName  = entry.user?.name ?? 'Unknown'
  const avatarUrl = entry.user?.avatar_url ?? undefined
  const dateLabel = formatEntryDate(entry.started_at)

  if (!pos) return null

  return (
    <div
      ref={popupRef}
      style={{ position: 'fixed', top: pos.top, left: pos.left, width: 300, zIndex: 9999 }}
      className="bg-white rounded-xl shadow-xl border border-[#E9EAEB]"
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-3 pt-3 pb-2 border-b border-[#F2F4F7]">
        <Avatar name={userName} src={avatarUrl} size="sm" />
        <span className="flex-1 text-[13px] font-semibold text-[#344054] truncate">{userName}</span>
        <button
          type="button"
          onClick={() => onDelete(entry.id)}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-[#98A2B3] hover:text-[#F04438] hover:bg-[#FEF3F2] transition-colors"
          aria-label="Delete entry"
        >
          <Trash01 width={14} height={14} />
        </button>
        <button
          type="button"
          onClick={onClose}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-[#98A2B3] hover:bg-[#F2F4F7] transition-colors"
          aria-label="Close"
        >
          <XClose width={14} height={14} />
        </button>
      </div>

      <div className="px-3 py-3 flex flex-col gap-3">
        {/* Duration */}
        <Input
          value={durationText}
          onChange={(e) => setDurationText(e.target.value)}
          placeholder="e.g. 2h 30m"
          className="text-[15px] font-semibold"
          rightIcon={<Clock width={14} height={14} />}
          aria-label="Duration"
        />

        {/* Time range */}
        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-medium text-[#667085]">{dateLabel}</span>
          <div className="flex items-center gap-1.5">
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="flex-1 border border-[#D5D7DA] rounded-lg px-2 py-1.5 text-[12px] text-[#344054] focus:outline-none focus:ring-2 focus:ring-[#9E77ED] focus:border-transparent"
              aria-label="Start time"
            />
            <span className="text-[11px] text-[#98A2B3] shrink-0">—</span>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="flex-1 border border-[#D5D7DA] rounded-lg px-2 py-1.5 text-[12px] text-[#344054] focus:outline-none focus:ring-2 focus:ring-[#9E77ED] focus:border-transparent"
              aria-label="End time"
            />
          </div>
        </div>

        {/* Notes */}
        <div className="relative">
          <AlignLeft
            width={14} height={14}
            className="absolute left-2.5 top-2.5 text-[#98A2B3] pointer-events-none"
          />
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Notes"
            rows={2}
            className="w-full pl-8 pr-2.5 py-2 border border-[#D5D7DA] rounded-lg text-[12px] text-[#344054] placeholder-[#A4A7AE] resize-none focus:outline-none focus:ring-2 focus:ring-[#9E77ED] focus:border-transparent"
          />
        </div>

        {/* Error */}
        {errorMsg && (
          <p className="text-[11px] text-[#F04438]">{errorMsg}</p>
        )}

        {/* Actions */}
        <div className="flex justify-end">
          <Button size="sm" onClick={handleSave} loading={saving} disabled={saving}>
            Save
          </Button>
        </div>
      </div>
    </div>
  )
}
