import { useTimer } from '../../context/TimerContext'
import { formatElapsed } from '../../lib/timeUtils'

interface TimeInputFieldProps {
  value:        string
  onChange:     (v: string) => void
  onStartTimer: () => void
  onStopTimer:  () => void
  taskId?:      string
  projectId?:   string
  disabled?:    boolean
}

export default function TimeInputField({ value, onChange, onStartTimer, onStopTimer, taskId, projectId, disabled }: TimeInputFieldProps) {
  const { running, elapsed } = useTimer()
  const isRunning = projectId
    ? running?.projectId === projectId
    : running?.taskId === taskId

  return (
    <div className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border-2 transition-colors ${
      isRunning ? 'border-[#7F56D9] bg-[#F9F5FF]' : 'border-[#D0D5DD] bg-white hover:border-[#A4A7AE]'
    }`}>
      {isRunning ? (
        <span className="flex-1 text-[14px] font-mono font-semibold text-[#7F56D9] tracking-wider">
          {formatElapsed(elapsed)}
        </span>
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Enter time (ex: 3h 20m) or start timer"
          disabled={disabled}
          className="flex-1 text-[13px] text-[#344054] placeholder-[#A4A7AE] bg-transparent outline-none"
        />
      )}
      {/* Circular play/stop button */}
      <button
        type="button"
        onClick={isRunning ? onStopTimer : onStartTimer}
        disabled={disabled}
        className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-colors disabled:opacity-50 ${
          isRunning
            ? 'bg-[#F04438] hover:bg-[#D92D20] text-white'
            : 'bg-[#7F56D9] hover:bg-[#6941C6] text-white'
        }`}
        aria-label={isRunning ? 'Stop timer' : 'Start timer'}
      >
        {isRunning ? (
          /* Stop square */
          <span className="w-2.5 h-2.5 bg-white rounded-[2px]" />
        ) : (
          /* Play triangle */
          <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
            <path d="M2 1.5l6 3.5-6 3.5V1.5z" />
          </svg>
        )}
      </button>
    </div>
  )
}
