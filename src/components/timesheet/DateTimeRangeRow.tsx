import { useState, useRef, useEffect } from 'react'
import { Clock } from '@untitled-ui/icons-react'
import CalendarPicker from '../ui/CalendarPicker'
import TimeListPicker from '../ui/TimeListPicker'
import { formatEntryDate, formatEntryTime } from '../../lib/timeUtils'

interface DateTimeRangeRowProps {
  startedAt:     string   // datetime-local "2024-05-14T19:44"
  endedAt:       string
  onChangeStart: (v: string) => void
  onChangeEnd:   (v: string) => void
}

// "2024-05-14T19:44" → Date + "19:44"
function parse(v: string) {
  const d = new Date(v)
  return {
    date:    d,
    timeStr: `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`,
  }
}

// Date + "19:44" → "2024-05-14T19:44"
function combine(date: Date, timeStr: string): string {
  const [hh, mm] = timeStr.split(':').map(Number)
  const d = new Date(date)
  d.setHours(hh, mm, 0, 0)
  return d.toISOString().slice(0, 16)
}

type Popover = 'startDate' | 'startTime' | 'endTime' | null

export default function DateTimeRangeRow({ startedAt, endedAt, onChangeStart, onChangeEnd }: DateTimeRangeRowProps) {
  const [popover, setPopover] = useState<Popover>(null)
  const containerRef          = useRef<HTMLDivElement>(null)

  const start = parse(startedAt)
  const end   = parse(endedAt)

  useEffect(() => {
    if (!popover) return
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setPopover(null)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [popover])

  function toggle(p: Popover) {
    setPopover((prev) => (prev === p ? null : p))
  }

  return (
    <div ref={containerRef} className="relative flex items-center gap-1.5 px-3 py-2.5 rounded-lg border border-[#E9EAEB] bg-white">
      <Clock width={15} height={15} className="text-[#A4A7AE] shrink-0" />

      {/* Start date */}
      <button
        type="button"
        onClick={() => toggle('startDate')}
        className={`text-[13px] font-medium transition-colors ${
          popover === 'startDate' ? 'text-[#7F56D9]' : 'text-[#344054] hover:text-[#7F56D9]'
        }`}
      >
        {formatEntryDate(startedAt)}
      </button>

      {/* Start time */}
      <button
        type="button"
        onClick={() => toggle('startTime')}
        className={`text-[12px] font-medium transition-colors ${
          popover === 'startTime' ? 'text-[#7F56D9] bg-[#F4F3FF] rounded px-1' : 'text-[#717680] hover:text-[#7F56D9] px-1'
        }`}
      >
        {formatEntryTime(startedAt)}
      </button>

      <span className="text-[13px] text-[#A4A7AE]">—</span>

      {/* End time */}
      <button
        type="button"
        onClick={() => toggle('endTime')}
        className={`text-[12px] font-medium transition-colors ${
          popover === 'endTime' ? 'text-[#7F56D9] bg-[#F4F3FF] rounded px-1' : 'text-[#717680] hover:text-[#7F56D9] px-1'
        }`}
      >
        {formatEntryTime(endedAt)}
      </button>

      {/* Calendar popover — start date */}
      {popover === 'startDate' && (
        <div className="absolute left-0 top-full mt-1 z-50">
          <CalendarPicker
            value={start.date}
            onChange={(date) => onChangeStart(combine(date, start.timeStr))}
            onClose={() => setPopover(null)}
          />
        </div>
      )}

      {/* Time list — start time */}
      {popover === 'startTime' && (
        <div className="absolute left-24 top-full mt-1 z-50">
          <TimeListPicker
            value={start.timeStr}
            onChange={(t) => onChangeStart(combine(start.date, t))}
            onClose={() => setPopover(null)}
          />
        </div>
      )}

      {/* Time list — end time */}
      {popover === 'endTime' && (
        <div className="absolute left-44 top-full mt-1 z-50">
          <TimeListPicker
            value={end.timeStr}
            onChange={(t) => onChangeEnd(combine(end.date, t))}
            onClose={() => setPopover(null)}
          />
        </div>
      )}
    </div>
  )
}
