import { useQueryClient } from '@tanstack/react-query'
import BaseTimesheetPanel from './BaseTimesheetPanel'
import TimeEntriesList from './TimeEntriesList'
import TimesheetTaskRow from './TimesheetTaskRow'
import { formatSeconds } from '../../lib/timeUtils'
import {
  useTimeEntries, useStartTimer, useStopTimer,
  useCreateTimeEntry, useDeleteTimeEntry,
} from '../../hooks/useTimeEntries'
import { useTimer } from '../../context/TimerContext'
import { useAuth } from '../../context/AuthContext'
import { messagesApi } from '../../lib/api'
import { queryKeys } from '../../lib/queryKeys'

interface TimesheetPanelProps {
  taskId:     string
  taskTitle?: string
  projectId?: string
  open:       boolean
  onClose:    () => void
  anchorRef?: React.RefObject<HTMLElement | null>
}

export default function TimesheetPanel({
  taskId, taskTitle: _taskTitle, projectId, open, onClose, anchorRef,
}: TimesheetPanelProps) {
  const { user }    = useAuth()
  const { running } = useTimer()
  const qc          = useQueryClient()

  const { data: summary } = useTimeEntries(open ? taskId : undefined)
  const startTimer        = useStartTimer(taskId)
  const stopTimer         = useStopTimer(taskId)
  const createEntry       = useCreateTimeEntry(taskId)
  const deleteEntry       = useDeleteTimeEntry(taskId)

  const isRunningHere    = running?.taskId === taskId
  const totalSeconds     = summary?.total_seconds ?? 0
  const ownTotalSeconds  = summary?.own_total_seconds ?? 0
  const subtaskSeconds   = summary?.subtask_summary.reduce((acc, s) => acc + s.total_seconds, 0) ?? 0

  function fireTaskMessage(body: string) {
    messagesApi.create({ scope: 'task', scope_id: taskId, body, is_system: true }).catch(() => {})
    qc.invalidateQueries({ queryKey: queryKeys.messages.byScope('task', taskId) })
  }

  function fireProjectMessage(body: string) {
    if (!projectId) return
    messagesApi.create({ scope: 'project', scope_id: projectId, body, is_system: true }).catch(() => {})
    qc.invalidateQueries({ queryKey: queryKeys.messages.byScope('project', projectId) })
  }

  return (
    <BaseTimesheetPanel
      open={open}
      onClose={onClose}
      anchorRef={anchorRef}
      totalLabel="Time on all tasks"
      ownTotalLabel="Without subtasks"
      totalSeconds={totalSeconds}
      ownTotalSeconds={ownTotalSeconds}
      showSecondaryRow={subtaskSeconds > 0}
      taskId={taskId}
      startPending={startTimer.isPending}
      stopPending={stopTimer.isPending}
      savePending={createEntry.isPending}
      isRunning={isRunningHere}
      onStartTimer={() => {
        startTimer.mutate(undefined, {
          onSuccess: () => {
            fireTaskMessage('Started a timer')
            fireProjectMessage('Started a timer on a task')
          },
        })
      }}
      onStopTimer={(notes) => {
        if (!running) return
        const noteText = notes.trim()
        stopTimer.mutate({ entryId: running.entryId, description: noteText || undefined }, {
          onSuccess: (entry) => {
            const dur  = entry.duration_seconds ?? 0
            const body = `Logged ${formatSeconds(dur)} via timer${noteText ? ` — "${noteText}"` : ''}`
            fireTaskMessage(body)
            fireProjectMessage(`Logged ${formatSeconds(dur)} on a task via timer${noteText ? ` — "${noteText}"` : ''}`)
          },
        })
      }}
      onSave={async (payload) => {
        await createEntry.mutateAsync(payload)
        const dur      = payload.duration_seconds ?? 0
        const noteText = payload.description ?? ''
        const body     = `Logged ${formatSeconds(dur)} on a task${noteText ? ` — "${noteText}"` : ''}`
        fireTaskMessage(body)
        fireProjectMessage(body)
      }}
      entriesSlot={
        <div className="flex flex-col overflow-hidden">
          {/* Section header */}
          <div className="px-4 py-2.5 flex items-center justify-between border-b border-[#F2F4F7]">
            <span className="text-[12px] font-semibold text-[#344054] uppercase tracking-wider">
              Time Entries
            </span>
          </div>

          {/* Scrollable list */}
          <div className="overflow-y-auto flex-1" style={{ maxHeight: 280 }}>
            {summary && user ? (
              <TimeEntriesList
                summary={summary}
                currentUserId={user.id}
                onDelete={(entryId) => {
                  deleteEntry.mutate(entryId)
                  fireTaskMessage('Deleted a time entry')
                  fireProjectMessage('Deleted a time entry from a task')
                }}
              />
            ) : (
              <div className="px-3 py-4 text-center text-[12px] text-[#A4A7AE]">
                No time entries yet.
              </div>
            )}

            {/* Sub-task hierarchy — expandable rows */}
            {summary && summary.subtask_summary.length > 0 && (
              <div className="border-t border-[#F2F4F7]">
                <div className="px-3 pt-2 pb-1">
                  <p className="text-[11px] font-semibold text-[#A4A7AE] uppercase tracking-wider">
                    From Sub-tasks
                  </p>
                </div>
                {user && summary.subtask_summary.map((sub) => (
                  <TimesheetTaskRow
                    key={sub.task_id}
                    title={sub.title}
                    totalSeconds={sub.total_seconds}
                    entries={sub.entries}
                    currentUserId={user.id}
                    onDelete={(entryId) => deleteEntry.mutate(entryId)}
                    depth={1}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      }
    />
  )
}

export type { TimesheetPanelProps }
