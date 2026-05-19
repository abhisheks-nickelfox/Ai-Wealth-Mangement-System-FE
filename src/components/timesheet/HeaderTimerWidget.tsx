import { useTimer } from '../../context/TimerContext'
import { useAuth } from '../../context/AuthContext'
import { useStopTimer, useStopProjectTimer } from '../../hooks/useTimeEntries'
import Avatar from '../ui/Avatar'

function formatTimerDisplay(seconds: number): string {
  const h = Math.floor(seconds / 3600).toString().padStart(2, '0')
  const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0')
  const s = (seconds % 60).toString().padStart(2, '0')
  return `${h}h:${m}m:${s}s`
}

export default function HeaderTimerWidget() {
  const { running, elapsed } = useTimer()
  const { user } = useAuth()

  const stopTask    = useStopTimer(running?.taskId ?? '')
  const stopProject = useStopProjectTimer(running?.projectId ?? '')

  if (!running) return null

  const isPending = stopTask.isPending || stopProject.isPending

  function handleStop() {
    if (running!.taskId) {
      stopTask.mutate({ entryId: running!.entryId })
    } else {
      stopProject.mutate({ entryId: running!.entryId })
    }
  }

  return (
    <div className="flex items-center gap-2 pl-1.5 pr-1.5 py-1 rounded-full border border-[#E4E7EC] bg-white shadow-sm">
      {/* User avatar */}
      <Avatar
        name={user?.name ?? ''}
        src={user?.avatar_url ?? undefined}
        size="sm"
      />

      {/* Elapsed time — "02h:30m:25s" format */}
      <span className="text-[15px] font-semibold text-[#344054] tabular-nums select-none">
        {formatTimerDisplay(elapsed)}
      </span>

      {/* Pause / stop button */}
      <button
        type="button"
        onClick={handleStop}
        disabled={isPending}
        aria-label="Stop timer"
        className="w-6 h-6 flex items-center justify-center rounded-xl border-2 border-[#F04438] text-[#F04438] hover:bg-[#FEF3F2] transition-colors disabled:opacity-50 shrink-0"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor" aria-hidden="true">
          <rect x="3"  y="2.5" width="4.5" height="13" rx="1.5" />
          <rect x="10.5" y="2.5" width="4.5" height="13" rx="1.5" />
        </svg>
      </button>
    </div>
  )
}
