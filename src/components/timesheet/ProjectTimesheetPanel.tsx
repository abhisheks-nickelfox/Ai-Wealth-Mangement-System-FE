import { useQueryClient } from '@tanstack/react-query'
import BaseTimesheetPanel from './BaseTimesheetPanel'
import TimeEntriesList from './TimeEntriesList'
import TimesheetTaskRow from './TimesheetTaskRow'
import { formatSeconds } from '../../lib/timeUtils'
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

  const { data: summary } = useProjectTimeEntries(open ? projectId : undefined)
  const startTimer        = useStartProjectTimer(projectId)
  const stopTimer         = useStopProjectTimer(projectId)
  const createEntry       = useCreateProjectTimeEntry(projectId)
  const deleteEntry       = useDeleteProjectTimeEntry(projectId)

  const isRunningHere   = running?.projectId === projectId
  const totalSeconds    = summary?.total_seconds ?? 0
  const ownTotalSeconds = summary?.own_total_seconds ?? 0
  const taskSeconds     = summary?.task_summary.reduce((a, t) => a + t.total_seconds, 0) ?? 0

  function fireProjectMessage(body: string) {
    messagesApi.create({ scope: 'project', scope_id: projectId, body, is_system: true }).catch(() => {})
    qc.invalidateQueries({ queryKey: queryKeys.messages.byScope('project', projectId) })
  }

  return (
    <BaseTimesheetPanel
      open={open}
      onClose={onClose}
      anchorRef={anchorRef}
      totalLabel="Time on this project"
      ownTotalLabel="Direct entries only"
      totalSeconds={totalSeconds}
      ownTotalSeconds={ownTotalSeconds}
      showSecondaryRow={taskSeconds > 0}
      projectId={projectId}
      startPending={startTimer.isPending}
      stopPending={stopTimer.isPending}
      savePending={createEntry.isPending}
      isRunning={isRunningHere}
      onStartTimer={() => {
        startTimer.mutate(undefined, {
          onSuccess: () => fireProjectMessage('Started a timer on this project'),
        })
      }}
      onStopTimer={(notes) => {
        if (!running) return
        const noteText = notes.trim()
        stopTimer.mutate({ entryId: running.entryId, description: noteText || undefined }, {
          onSuccess: (entry) => {
            const dur  = entry.duration_seconds ?? 0
            fireProjectMessage(
              `Logged ${formatSeconds(dur)} on this project via timer${noteText ? ` — "${noteText}"` : ''}`,
            )
          },
        })
      }}
      onSave={async (payload) => {
        await createEntry.mutateAsync(payload)
        const dur      = payload.duration_seconds ?? 0
        const noteText = payload.description ?? ''
        fireProjectMessage(
          `Logged ${formatSeconds(dur)} directly on this project${noteText ? ` — "${noteText}"` : ''}`,
        )
      }}
      entriesSlot={
        <div className="flex flex-col overflow-hidden">
          <div className="px-4 py-2.5 flex items-center justify-between border-b border-[#F2F4F7]">
            <span className="text-[12px] font-semibold text-[#344054] uppercase tracking-wider">
              Time Entries
            </span>
          </div>

          <div className="overflow-y-auto flex-1" style={{ maxHeight: 280 }}>
            {/* Direct project entries */}
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
                  fireProjectMessage('Deleted a time entry from this project')
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
                      fireProjectMessage('Deleted a time entry from this project')
                    }}
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
