import { useTimer } from '../../context/TimerContext'
import { useStopTimer } from '../../hooks/useTimeEntries'
import { formatElapsed } from '../../lib/timeUtils'

export default function GlobalTimerBar() {
  const { running, elapsed } = useTimer()
  const stopTimer = useStopTimer(running?.taskId ?? '')

  if (!running) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-3 bg-[#7F56D9] text-white shadow-[0_-2px_12px_rgba(0,0,0,0.15)]">
      <div className="flex items-center gap-3 min-w-0">
        {/* Pulsing dot */}
        <span className="relative flex h-2.5 w-2.5 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-60" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white" />
        </span>
        <div className="min-w-0">
          <p className="text-[11px] font-medium opacity-70 leading-none mb-0.5">Timer running</p>
          {running.taskTitle && (
            <p className="text-[13px] font-semibold truncate max-w-[280px] leading-none">
              {running.taskTitle}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4 shrink-0">
        <span className="text-[18px] font-bold font-mono tracking-wider">{formatElapsed(elapsed)}</span>
        <button
          onClick={() => stopTimer.mutate(running.entryId)}
          disabled={stopTimer.isPending}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-white text-[#7F56D9] text-[13px] font-bold hover:bg-[#F4F3FF] transition-colors disabled:opacity-50"
        >
          {/* Stop square */}
          <span className="w-2.5 h-2.5 bg-[#7F56D9] rounded-[2px]" />
          Stop
        </button>
      </div>
    </div>
  )
}
