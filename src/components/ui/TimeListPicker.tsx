import { useEffect, useRef } from 'react'

interface TimeListPickerProps {
  value:    string    // "HH:MM" 24h format
  onChange: (time: string) => void
  onClose:  () => void
}

// Build 15-min slot list: "00:00", "00:15", … "23:45"
const SLOTS: string[] = []
for (let h = 0; h < 24; h++) {
  for (const m of [0, 15, 30, 45]) {
    SLOTS.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`)
  }
}

function to12h(time24: string): string {
  const [hStr, mStr] = time24.split(':')
  let h = parseInt(hStr)
  const m = mStr
  const ampm = h < 12 ? 'am' : 'pm'
  if (h === 0) h = 12
  else if (h > 12) h -= 12
  return `${h}:${m} ${ampm}`
}

// Find closest slot index to a given "HH:MM"
function closestIndex(value: string): number {
  const [hStr, mStr] = value.split(':')
  const totalMin = parseInt(hStr) * 60 + parseInt(mStr)
  let best = 0
  let bestDiff = Infinity
  SLOTS.forEach((s, i) => {
    const [sh, sm] = s.split(':').map(Number)
    const diff = Math.abs(sh * 60 + sm - totalMin)
    if (diff < bestDiff) { bestDiff = diff; best = i }
  })
  return best
}

export default function TimeListPicker({ value, onChange, onClose }: TimeListPickerProps) {
  const listRef    = useRef<HTMLDivElement>(null)
  const activeRef  = useRef<HTMLButtonElement>(null)
  const activeIdx  = closestIndex(value)

  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: 'center' })
  }, [])

  return (
    <div
      ref={listRef}
      className="bg-white border border-[#E9EAEB] rounded-xl shadow-xl w-[160px] overflow-y-auto"
      style={{ maxHeight: 260 }}
    >
      {SLOTS.map((slot, i) => {
        const isActive = i === activeIdx
        return (
          <button
            key={slot}
            ref={isActive ? activeRef : undefined}
            type="button"
            onClick={() => { onChange(slot); onClose() }}
            className={`w-full text-left px-4 py-2 text-[13px] transition-colors ${
              isActive
                ? 'bg-[#F4F3FF] text-[#6941C6] font-semibold'
                : 'text-[#344054] hover:bg-[#F9FAFB]'
            }`}
          >
            {to12h(slot)}
          </button>
        )
      })}
    </div>
  )
}
