import { useState } from 'react'
import { ChevronUp, ChevronDown } from '@untitled-ui/icons-react'

interface CalendarPickerProps {
  value:     Date | null
  onChange:  (date: Date) => void
  onClose:   () => void
  onClear?:  () => void
  min?:      Date
  max?:      Date
}

const DAYS   = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
         a.getMonth()    === b.getMonth()    &&
         a.getDate()     === b.getDate()
}

function stripTime(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

export default function CalendarPicker({ value, onChange, onClose, onClear, min, max }: CalendarPickerProps) {
  const today = new Date()

  // When value is null, default cursor to current month
  const initialCursor = value
    ? new Date(value.getFullYear(), value.getMonth(), 1)
    : new Date(today.getFullYear(), today.getMonth(), 1)

  const [cursor, setCursor] = useState(initialCursor)

  function prevMonth() {
    setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))
  }
  function nextMonth() {
    setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))
  }
  function goToday() {
    const stripped = stripTime(today)
    const minStripped = min ? stripTime(min) : null
    const maxStripped = max ? stripTime(max) : null
    // No-op if today is outside min/max range
    if (minStripped && stripped < minStripped) return
    if (maxStripped && stripped > maxStripped) return
    setCursor(new Date(today.getFullYear(), today.getMonth(), 1))
    onChange(new Date(today))
    onClose()
  }

  function isDisabled(date: Date): boolean {
    const stripped = stripTime(date)
    if (min && stripped < stripTime(min)) return true
    if (max && stripped > stripTime(max)) return true
    return false
  }

  // Build grid: start from Sunday of the week containing the 1st
  const firstDay    = cursor.getDay()
  const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate()
  const cells: { date: Date; inMonth: boolean }[] = []

  // Prev month overflow
  const prevMonthDays = new Date(cursor.getFullYear(), cursor.getMonth(), 0).getDate()
  for (let i = firstDay - 1; i >= 0; i--) {
    cells.push({ date: new Date(cursor.getFullYear(), cursor.getMonth() - 1, prevMonthDays - i), inMonth: false })
  }
  // Current month
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ date: new Date(cursor.getFullYear(), cursor.getMonth(), d), inMonth: true })
  }
  // Next month overflow to complete last row
  const remaining = 7 - (cells.length % 7)
  if (remaining < 7) {
    for (let d = 1; d <= remaining; d++) {
      cells.push({ date: new Date(cursor.getFullYear(), cursor.getMonth() + 1, d), inMonth: false })
    }
  }

  return (
    <div className="bg-white border border-[#E9EAEB] rounded-xl shadow-xl p-3 w-[260px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-2 px-1">
        <span className="text-[13px] font-semibold text-[#344054]">
          {MONTHS[cursor.getMonth()]} {cursor.getFullYear()}
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={goToday}
            className="text-[11px] font-semibold text-[#7F56D9] hover:underline px-1.5 py-0.5 rounded"
          >
            Today
          </button>
          <button
            type="button"
            onClick={prevMonth}
            className="p-0.5 rounded hover:bg-[#F9FAFB] text-[#717680] transition-colors"
          >
            <ChevronUp width={14} height={14} />
          </button>
          <button
            type="button"
            onClick={nextMonth}
            className="p-0.5 rounded hover:bg-[#F9FAFB] text-[#717680] transition-colors"
          >
            <ChevronDown width={14} height={14} />
          </button>
        </div>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAYS.map((d) => (
          <div key={d} className="text-center text-[11px] font-semibold text-[#A4A7AE] py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Date grid */}
      <div className="grid grid-cols-7">
        {cells.map(({ date, inMonth }, i) => {
          const isSelected = value ? isSameDay(date, value) : false
          const isToday    = isSameDay(date, today)
          const disabled   = isDisabled(date)

          if (disabled) {
            return (
              <div
                key={i}
                className="w-8 h-8 mx-auto flex items-center justify-center rounded-full text-[12px] text-[#D0D5DD] cursor-not-allowed"
              >
                {date.getDate()}
              </div>
            )
          }

          return (
            <button
              key={i}
              type="button"
              onClick={() => { onChange(date); onClose() }}
              className={`
                w-8 h-8 mx-auto flex items-center justify-center rounded-full text-[12px] transition-colors
                ${isSelected ? 'bg-[#7F56D9] text-white font-semibold' : ''}
                ${!isSelected && isToday ? 'border border-[#7F56D9] text-[#7F56D9] font-semibold' : ''}
                ${!isSelected && !isToday && inMonth ? 'text-[#344054] hover:bg-[#F4F3FF]' : ''}
                ${!isSelected && !isToday && !inMonth ? 'text-[#D0D5DD] hover:bg-[#F9FAFB]' : ''}
              `}
            >
              {date.getDate()}
            </button>
          )
        })}
      </div>

      {/* Footer — Clear link */}
      {onClear && value && (
        <div className="mt-2 pt-2 border-t border-[#F2F4F7] flex justify-end px-1">
          <button
            type="button"
            onClick={() => { onClear(); onClose() }}
            className="text-[11px] font-semibold text-[#717680] hover:text-[#344054] transition-colors"
          >
            Clear
          </button>
        </div>
      )}
    </div>
  )
}
