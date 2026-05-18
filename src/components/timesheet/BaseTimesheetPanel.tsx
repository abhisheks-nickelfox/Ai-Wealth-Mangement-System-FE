import { useState, useRef } from 'react'
import { useClickOutside } from '../../hooks/useClickOutside'
import { AlignLeft } from '@untitled-ui/icons-react'
import TimeInputField from './TimeInputField'
import DateTimeRangeRow from './DateTimeRangeRow'
import { parseTimeInput, todayDatetimeLocal, formatSeconds } from '../../lib/timeUtils'

// ── Shared summary shape (subset used by the form / header) ───────────────────

export interface TimeEntrySummaryLike {
  total_seconds:     number
  own_total_seconds: number
  subtask_summary?:  Array<{
    task_id:       string
    title:         string
    total_seconds: number
    entries:       unknown[]
  }>
}

// ── Props ──────────────────────────────────────────────────────────────────────

export interface BaseTimesheetPanelProps {
  open:       boolean
  onClose:    () => void
  anchorRef?: React.RefObject<HTMLElement | null>

  /** Text shown on the left of the totals header row (e.g. "Time on all tasks") */
  totalLabel:        string
  /** Text shown on the left of the secondary totals row; omit to hide the row */
  ownTotalLabel?:    string
  /** Pre-computed totals — drives the header display */
  totalSeconds:      number
  /** Own-entry seconds (shown in secondary row when ownTotalLabel is provided) */
  ownTotalSeconds:   number
  /** Whether the secondary row should render at all */
  showSecondaryRow:  boolean

  /** The timer/entry id used by TimeInputField to detect running state */
  taskId?:    string
  projectId?: string

  /** Pending states used to disable the start/stop button in TimeInputField */
  startPending: boolean
  stopPending:  boolean
  /** Pending state for the Save button */
  savePending:  boolean

  /** Whether the timer for this entity is currently running */
  isRunning: boolean

  /** Called when the user clicks Start in TimeInputField */
  onStartTimer: () => void
  /**
   * Called when the user clicks Stop in TimeInputField.
   * Receives the current notes value so the wrapper can pass it to the API.
   */
  onStopTimer: (notes: string) => void

  /**
   * Called when the user clicks Save.
   * Wrapper is responsible for the API call + side-effects; BaseTimesheetPanel
   * will reset its local form state after the promise resolves.
   */
  onSave: (payload: {
    started_at:       string
    ended_at:         string
    duration_seconds?: number
    description?:     string
  }) => Promise<void>

  /** Rendered below the entry form — the entries list section differs per panel */
  entriesSlot: React.ReactNode
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function BaseTimesheetPanel({
  open,
  onClose,
  anchorRef,
  totalLabel,
  ownTotalLabel,
  totalSeconds,
  ownTotalSeconds,
  showSecondaryRow,
  taskId,
  projectId,
  startPending,
  stopPending,
  savePending,
  isRunning,
  onStartTimer,
  onStopTimer,
  onSave,
  entriesSlot,
}: BaseTimesheetPanelProps) {
  const [timeInput, setTimeInput] = useState('')
  const [startedAt, setStartedAt] = useState(todayDatetimeLocal)
  const [endedAt,   setEndedAt]   = useState(todayDatetimeLocal)
  const [notes,     setNotes]     = useState('')
  const [showNotes, setShowNotes] = useState(false)

  const panelRef = useRef<HTMLDivElement>(null)

  useClickOutside(open ? panelRef : { current: null }, () => {
    if (anchorRef?.current?.contains(document.activeElement)) return
    onClose()
  })

  async function handleSave() {
    const seconds = parseTimeInput(timeInput)
    const computedDuration = seconds ?? Math.max(
      0,
      Math.floor((new Date(endedAt).getTime() - new Date(startedAt).getTime()) / 1000),
    )
    if (computedDuration <= 0 && !timeInput) return

    await onSave({
      started_at:       new Date(startedAt).toISOString(),
      ended_at:         new Date(endedAt).toISOString(),
      duration_seconds: computedDuration > 0 ? computedDuration : undefined,
      description:      notes || undefined,
    })

    // Reset form after successful save
    setTimeInput('')
    setNotes('')
    setShowNotes(false)
    setStartedAt(todayDatetimeLocal())
    setEndedAt(todayDatetimeLocal())
  }

  if (!open) return null

  return (
    <div
      ref={panelRef}
      className="absolute z-50 bg-white rounded-xl border border-[#E9EAEB] shadow-2xl w-[420px] flex flex-col overflow-hidden"
      style={{ top: '100%', right: 0, marginTop: 8, maxHeight: 'calc(100vh - 200px)' }}
    >
      {/* ── Header: totals ──────────────────────────────────────────────── */}
      <div className="px-4 pt-4 pb-3 border-b border-[#F2F4F7]">
        <div className="flex items-center justify-between">
          <span className="text-[13px] text-[#535862]">{totalLabel}</span>
          <span className="text-[13px] font-bold text-[#344054]">
            {totalSeconds > 0 ? formatSeconds(totalSeconds) : '—'}
          </span>
        </div>
        {showSecondaryRow && ownTotalLabel && (
          <div className="flex items-center justify-between mt-1">
            <span className="text-[12px] text-[#A4A7AE]">{ownTotalLabel}</span>
            <span className="text-[12px] text-[#717680]">
              {ownTotalSeconds > 0 ? formatSeconds(ownTotalSeconds) : '—'}
            </span>
          </div>
        )}
      </div>

      {/* ── Entry form ──────────────────────────────────────────────────── */}
      <div className="px-4 py-3 flex flex-col gap-2.5 border-b border-[#F2F4F7]">

        {/* Time input with start/stop button */}
        <TimeInputField
          value={timeInput}
          onChange={setTimeInput}
          taskId={taskId}
          projectId={projectId}
          onStartTimer={() => {
            setShowNotes(true)
            onStartTimer()
          }}
          onStopTimer={() => onStopTimer(notes)}
          disabled={startPending || stopPending}
        />

        {/* Date / time range — hidden while timer is running */}
        {!isRunning && (
          <DateTimeRangeRow
            startedAt={startedAt}
            endedAt={endedAt}
            onChangeStart={setStartedAt}
            onChangeEnd={setEndedAt}
          />
        )}

        {/* Notes row */}
        {showNotes ? (
          <textarea
            autoFocus
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add a note..."
            rows={3}
            className="w-full border border-[#E9EAEB] rounded-lg px-3 py-2 text-[13px] text-[#344054] placeholder-[#A4A7AE] outline-none focus:border-[#7F56D9] resize-none overflow-y-auto"
            style={{ maxHeight: 96 }}
          />
        ) : (
          <button
            type="button"
            onClick={() => setShowNotes(true)}
            className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-[#E9EAEB] text-[13px] text-[#A4A7AE] hover:text-[#344054] hover:border-[#D0D5DD] transition-colors text-left"
          >
            <AlignLeft width={15} height={15} className="shrink-0" />
            <span>Notes</span>
          </button>
        )}

        {/* Billable (disabled) + Save — shown only when user has entered something */}
        {!isRunning && (timeInput.trim() || notes.trim()) && (
          <div className="flex items-center justify-between">
            {/* Billable — disabled, visual only */}
            <div className="flex items-center gap-2 opacity-40 cursor-not-allowed select-none" title="Billable (coming soon)">
              <div className="w-9 h-5 bg-[#17B26A] rounded-full flex items-center px-0.5">
                <div className="w-4 h-4 bg-white rounded-full shadow-sm ml-auto" />
              </div>
              <span className="w-5 h-5 rounded-full bg-[#F2F4F7] flex items-center justify-center text-[11px] font-bold text-[#535862]">
                $
              </span>
            </div>

            <button
              type="button"
              onClick={handleSave}
              disabled={savePending || (!timeInput && !startedAt)}
              className="px-4 py-2 rounded-lg bg-[#7F56D9] text-white text-[13px] font-semibold hover:bg-[#6941C6] transition-colors disabled:opacity-50"
            >
              {savePending ? 'Saving…' : 'Save'}
            </button>
          </div>
        )}
      </div>

      {/* ── Entries list — provided by wrapper ──────────────────────────── */}
      {entriesSlot}
    </div>
  )
}
