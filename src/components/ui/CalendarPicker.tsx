import { useState } from 'react'
import { ChevronUp, ChevronDown } from '@untitled-ui/icons-react'

interface CalendarPickerProps {
  value:    Date
  onChange: (date: Date) => void
  onClose:  () => void
}

const DAYS   = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
         a.getMonth()    === b.getMonth()    &&
         a.getDate()     === b.getDate()
}

export default function CalendarPicker({ value, onChange, onClose }: CalendarPickerProps) {
  const today = new Date()
  const [cursor, setCursor] = useState(new Date(value.getFullYear(), value.getMonth(), 1))

  function prevMonth() {
    setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))
  }
  function nextMonth() {
    setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))
  }
  function goToday() {
    setCursor(new Date(today.getFullYear(), today.getMonth(), 1))
    onChange(new Date(today))
    onClose()
  }

  // Build grid: start from Sunday of the week containing the 1st
  const firstDay  = cursor.getDay()                                    // 0–6
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
          const isSelected = isSameDay(date, value)
          const isToday    = isSameDay(date, today)
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
    </div>
  )
}
