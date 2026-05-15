import { useState, useRef, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { AlignLeft } from '@untitled-ui/icons-react'
import TimeInputField from './TimeInputField'
import DateTimeRangeRow from './DateTimeRangeRow'
import TimeEntriesList from './TimeEntriesList'
import TimesheetTaskRow from './TimesheetTaskRow'
import { parseTimeInput, todayDatetimeLocal, formatSeconds } from '../../lib/timeUtils'
import {
  useProjectTimeEntries,
  useStartProjectTimer,
  useStopProjectTimer,
  useCreateProjectTimeEntry,
  useDeleteProjectTimeEntry,
} from '../../hooks/useTimeEntries'
import { useTimer } from '../../context/TimerContext'
import { useAuth } from '../../context/AuthContext'
import { messagesApi } from '../../lib/api'
import { queryKeys } from '../../lib/queryKeys'

interface ProjectTimesheetPanelProps {
  projectId:  string
  open:       boolean
  onClose:    () => void
  anchorRef?: React.RefObject<HTMLElement | null>
}

export default function ProjectTimesheetPanel({
  projectId, open, onClose, anchorRef,
}: ProjectTimesheetPanelProps) {
  const { user }    = useAuth()
  const { running } = useTimer()
  const qc          = useQueryClient()

  const [timeInput, setTimeInput] = useState('')
  const [startedAt, setStartedAt] = useState(todayDatetimeLocal())
  const [endedAt,   setEndedAt]   = useState(todayDatetimeLocal())
  const [notes,     setNotes]     = useState('')
  const [showNotes, setShowNotes] = useState(false)

  const panelRef = useRef<HTMLDivElement>(null)

  const { data: summary } = useProjectTimeEntries(open ? projectId : undefined)
  const startTimer        = useStartProjectTimer(projectId)
  const stopTimer         = useStopProjectTimer(projectId)
  const createEntry       = useCreateProjectTimeEntry(projectId)
  const deleteEntry       = useDeleteProjectTimeEntry(projectId)

  const isRunningHere = running?.projectId === projectId

  // Close on outside click
  useEffect(() => {
    if (!open) return
    function handler(e: MouseEvent) {
      if (
        panelRef.current && !panelRef.current.contains(e.target as Node) &&
        (!anchorRef?.current || !anchorRef.current.contains(e.target as Node))
      ) { onClose() }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open, onClose, anchorRef])

  async function handleSave() {
    const seconds = parseTimeInput(timeInput)
    const computedDuration = seconds ?? Math.max(
      0,
      Math.floor((new Date(endedAt).getTime() - new Date(startedAt).getTime()) / 1000),
    )
    if (computedDuration <= 0 && !timeInput) return

    await createEntry.mutateAsync({
      started_at:       new Date(startedAt).toISOString(),
      ended_at:         new Date(endedAt).toISOString(),
      duration_seconds: computedDuration > 0 ? computedDuration : undefined,
      description:      notes || undefined,
    })
    setTimeInput('')
    setNotes('')
    setShowNotes(false)
    setStartedAt(todayDatetimeLocal())
    setEndedAt(todayDatetimeLocal())
    const savedNote = notes.trim()
    const body = `Logged ${formatSeconds(computedDuration)} directly on this project${savedNote ? ` — "${savedNote}"` : ''}`
    messagesApi.create({ scope: 'project', scope_id: projectId, body, is_system: true }).catch(() => {})
    qc.invalidateQueries({ queryKey: queryKeys.messages.byScope('project', projectId) })
  }

  const totalSeconds = summary?.total_seconds ?? 0
  const taskSeconds  = summary?.task_summary.reduce((a, t) => a + t.total_seconds, 0) ?? 0

  if (!open) return null

  return (
    <div
      ref={panelRef}
      className="absolute z-50 bg-white rounded-xl border border-[#E9EAEB] shadow-2xl w-[420px] flex flex-col overflow-hidden"
      style={{ top: '100%', right: 0, marginTop: 8, maxHeight: 'calc(100vh - 200px)' }}
    >
      {/* ── Header: project totals ──────────────────────────────────── */}
      <div className="px-4 pt-4 pb-3 border-b border-[#F2F4F7]">
        <div className="flex items-center justify-between">
          <span className="text-[13px] text-[#535862]">Time on this project</span>
          <span className="text-[13px] font-bold text-[#344054]">
            {totalSeconds > 0 ? formatSeconds(totalSeconds) : '—'}
          </span>
        </div>
        {taskSeconds > 0 && (
          <div className="flex items-center justify-between mt-1">
            <span className="text-[12px] text-[#A4A7AE]">Direct entries only</span>
            <span className="text-[12px] text-[#717680]">
              {summary!.own_total_seconds > 0 ? formatSeconds(summary!.own_total_seconds) : '—'}
            </span>
          </div>
        )}
      </div>

      {/* ── Entry form ─────────────────────────────────────────────── */}
      <div className="px-4 py-3 flex flex-col gap-2.5 border-b border-[#F2F4F7]">

        {/* Time input with start/stop button */}
        <TimeInputField
          value={timeInput}
          onChange={setTimeInput}
          projectId={projectId}
          onStartTimer={() => {
            startTimer.mutate(undefined, {
              onSuccess: () => {
                setShowNotes(true)
                messagesApi.create({ scope: 'project', scope_id: projectId, body: 'Started a timer on this project', is_system: true }).catch(() => {})
                qc.invalidateQueries({ queryKey: queryKeys.messages.byScope('project', projectId) })
              },
            })
          }}
          onStopTimer={() => {
            if (!running) return
            const noteText = notes.trim()
            stopTimer.mutate({ entryId: running.entryId, description: noteText || undefined }, {
              onSuccess: (entry) => {
                const dur  = entry.duration_seconds ?? 0
                const body = `Logged ${formatSeconds(dur)} on this project via timer${noteText ? ` — "${noteText}"` : ''}`
                messagesApi.create({ scope: 'project', scope_id: projectId, body, is_system: true }).catch(() => {})
                qc.invalidateQueries({ queryKey: queryKeys.messages.byScope('project', projectId) })
                setNotes('')
                setShowNotes(false)
              },
            })
          }}
          disabled={startTimer.isPending || stopTimer.isPending}
        />

        {/* Date / time range — hidden while timer running */}
        {!isRunningHere && (
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

        {/* Billable (disabled) + Save — only shown when user has entered something */}
        {!isRunningHere && (timeInput.trim() || notes.trim()) && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 opacity-40 cursor-not-allowed select-none" title="Billable (coming soon)">
              <div className="w-9 h-5 bg-[#17B26A] rounded-full flex items-center px-0.5">
                <div className="w-4 h-4 bg-white rounded-full shadow-sm ml-auto" />
              </div>
              <span className="w-5 h-5 rounded-full bg-[#F2F4F7] flex items-center justify-center text-[11px] font-bold text-[#535862]">$</span>
            </div>
            <button
              type="button"
              onClick={handleSave}
              disabled={createEntry.isPending || (!timeInput && !startedAt)}
              className="px-4 py-2 rounded-lg bg-[#7F56D9] text-white text-[13px] font-semibold hover:bg-[#6941C6] transition-colors disabled:opacity-50"
            >
              {createEntry.isPending ? 'Saving…' : 'Save'}
            </button>
          </div>
        )}
      </div>

      {/* ── Time Entries list ───────────────────────────────────────── */}
      <div className="flex flex-col overflow-hidden">
        <div className="px-4 py-2.5 flex items-center justify-between border-b border-[#F2F4F7]">
          <span className="text-[12px] font-semibold text-[#344054] uppercase tracking-wider">
            Time Entries
          </span>
        </div>

        <div className="overflow-y-auto flex-1" style={{ maxHeight: 280 }}>
          {/* Direct project entries grouped by user */}
          {summary && user && summary.project_entries.length > 0 ? (
            <TimeEntriesList
              summary={{
                own_entries:       summary.project_entries,
                subtask_summary:   [],
                own_total_seconds: summary.own_total_seconds,
                total_seconds:     summary.own_total_seconds,
              }}
              currentUserId={user.id}
              onDelete={(entryId) => {
                deleteEntry.mutate(entryId)
                messagesApi.create({ scope: 'project', scope_id: projectId, body: 'Deleted a time entry from this project', is_system: true }).catch(() => {})
                qc.invalidateQueries({ queryKey: queryKeys.messages.byScope('project', projectId) })
              }}
            />
          ) : summary && summary.task_summary.length === 0 ? (
            <div className="px-3 py-4 text-center text-[12px] text-[#A4A7AE]">
              No time entries yet.
            </div>
          ) : null}

          {/* Task hierarchy — expandable tasks → user groups → entries */}
          {summary && user && summary.task_summary.length > 0 && (
            <div className={summary.project_entries.length > 0 ? 'border-t border-[#F2F4F7]' : ''}>
              {summary.project_entries.length > 0 && (
                <div className="px-3 pt-2 pb-1">
                  <p className="text-[11px] font-semibold text-[#A4A7AE] uppercase tracking-wider">
                    From Tasks
                  </p>
                </div>
              )}
              {summary.task_summary.map((task) => (
                <TimesheetTaskRow
                  key={task.task_id}
                  title={task.title}
                  totalSeconds={task.total_seconds}
                  entries={task.entries}
                  subtasks={task.subtasks}
                  currentUserId={user.id}
                  onDelete={(entryId) => {
                    deleteEntry.mutate(entryId)
                    messagesApi.create({ scope: 'project', scope_id: projectId, body: 'Deleted a time entry from this project', is_system: true }).catch(() => {})
                    qc.invalidateQueries({ queryKey: queryKeys.messages.byScope('project', projectId) })
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
