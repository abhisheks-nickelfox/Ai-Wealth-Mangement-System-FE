import { useState, useRef } from 'react'
import { Clock } from '@untitled-ui/icons-react'
import TimesheetPanel from '../timesheet/TimesheetPanel'
import { useStartTimer, useStopTimer } from '../../hooks/useTimeEntries'
import { useTimer } from '../../context/TimerContext'
import { formatElapsed } from '../../lib/timeUtils'

interface TaskTimerRowProps {
  taskId:     string
  projectId?: string
  /** 'sm' = page grid cell (w-6/h-6 button), 'md' = panel section (w-7/h-7 button). Default 'md'. */
  size?: 'sm' | 'md'
}

export default function TaskTimerRow({ taskId, projectId, size = 'md' }: TaskTimerRowProps) {
  const [showTimesheet, setShowTimesheet] = useState(false)
  const timesheetBtnRef = useRef<HTMLDivElement>(null)

  const startTimer        = useStartTimer(taskId)
  const stopTimer         = useStopTimer(taskId)
  const { running, elapsed } = useTimer()

  const isTimerRunningHere = running?.taskId === taskId

  // Button dimensions driven by size prop
  const btnSize = size === 'sm' ? 'w-6 h-6' : 'w-7 h-7'

  return (
    <>
      <div ref={timesheetBtnRef} className="relative flex items-center gap-2">
        {/* Clock icon — start/stop timer toggle */}
        <button
          type="button"
          disabled={startTimer.isPending || stopTimer.isPending}
          onClick={() =>
            isTimerRunningHere
              ? stopTimer.mutate({ entryId: running!.entryId })
              : startTimer.mutate()
          }
          className={`flex items-center justify-center ${btnSize} rounded-full transition-colors disabled:opacity-50 ${
            size === 'md'
              ? isTimerRunningHere
                ? 'border border-[#FEE4E2] bg-[#FEF3F2] text-[#F04438] hover:bg-[#FEE4E2]'
                : 'border border-[#E9EAEB] bg-white text-[#7F56D9] hover:border-[#D0D5DD]'
              : isTimerRunningHere
                ? 'bg-[#FEF3F2] text-[#F04438] hover:bg-[#FEE4E2]'
                : 'bg-[#F4F3FF] text-[#7F56D9] hover:bg-[#EBE9FE]'
          }`}
          title={isTimerRunningHere ? 'Stop timer' : 'Start timer'}
          aria-label={isTimerRunningHere ? 'Stop timer' : 'Start timer'}
        >
          {isTimerRunningHere
            ? <span className={`rounded-[2px] bg-[#F04438] ${size === 'sm' ? 'w-2 h-2' : 'w-2.5 h-2.5'}`} />
            : <Clock width={13} height={13} />
          }
        </button>

        {/* Text — opens timesheet panel for manual entry */}
        <button
          type="button"
          onClick={() => setShowTimesheet((v) => !v)}
          className={
            size === 'sm'
              ? 'text-[13px] font-semibold text-[#7F56D9] hover:text-[#6941C6] transition-colors'
              : 'text-[13px] text-[#535862] hover:text-[#344054] transition-colors'
          }
        >
          Log Time
        </button>

        <TimesheetPanel
          taskId={taskId}
          projectId={projectId}
          open={showTimesheet}
          onClose={() => setShowTimesheet(false)}
          anchorRef={timesheetBtnRef as React.RefObject<HTMLElement | null>}
        />
      </div>

      {/* Running indicator */}
      {isTimerRunningHere && (
        <div className="flex items-center gap-1.5 mt-1">
          <span className="w-1.5 h-1.5 rounded-full bg-[#F04438] animate-pulse shrink-0" />
          <span className="text-[11px] font-mono font-semibold text-[#F04438]">{formatElapsed(elapsed)}</span>
          <span className="text-[11px] text-[#A4A7AE]">running</span>
        </div>
      )}
    </>
  )
}
