import { useRef, useState } from 'react'
import { CalendarDate } from '@untitled-ui/icons-react'
import { useClickOutside } from '../../hooks/useClickOutside'
import CalendarPicker from './CalendarPicker'

// ── Helpers ───────────────────────────────────────────────────────────────────

const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function parseLocalDate(s: string): Date | null {
  if (!s) return null
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function dateToYMD(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function formatDisplay(s: string): string {
  const d = parseLocalDate(s)
  if (!d) return ''
  return `${MONTHS_SHORT[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface DatePickerFieldProps {
  label?:       string
  value:        string           // YYYY-MM-DD or ''
  onChange:     (val: string) => void
  min?:         string           // YYYY-MM-DD
  max?:         string           // YYYY-MM-DD
  error?:       string
  required?:    boolean
  placeholder?: string
  clearable?:   boolean
  disabled?:    boolean
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function DatePickerField({
  label,
  value,
  onChange,
  min,
  max,
  error,
  required,
  placeholder = 'Select date',
  clearable,
  disabled,
}: DatePickerFieldProps) {
  const [open, setOpen] = useState(false)
  const containerRef    = useRef<HTMLDivElement>(null)

  useClickOutside(containerRef, () => setOpen(false))

  const displayValue = formatDisplay(value)
  const dateValue    = parseLocalDate(value)
  const minDate      = min ? parseLocalDate(min) : undefined
  const maxDate      = max ? parseLocalDate(max) : undefined

  const borderClass = error
    ? 'border-red-400 focus:ring-red-400'
    : open
    ? 'border-[#7F56D9] ring-2 ring-[#7F56D9] ring-opacity-30'
    : 'border-[#D0D5DD] hover:border-[#7F56D9]'

  return (
    <div ref={containerRef} className="relative">
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium text-[#344054] mb-1.5">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}

      {/* Trigger button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((v) => !v)}
        className={`
          w-full flex items-center justify-between border rounded-lg px-3 py-2.5 text-sm bg-white outline-none transition-colors
          disabled:opacity-50 disabled:cursor-not-allowed
          ${borderClass}
        `}
      >
        <span className={displayValue ? 'text-[#181D27]' : 'text-[#A4A7AE]'}>
          {displayValue || placeholder}
        </span>
        <CalendarDate width={16} height={16} className="text-[#717680] shrink-0 ml-2" />
      </button>

      {/* Error message */}
      {error && (
        <p className="mt-1 text-xs text-red-500">{error}</p>
      )}

      {/* Calendar popup */}
      {open && (
        <div className="absolute top-full mt-1 left-0 z-30">
          <CalendarPicker
            value={dateValue ?? null}
            onChange={(date) => {
              onChange(dateToYMD(date))
              setOpen(false)
            }}
            onClose={() => setOpen(false)}
            onClear={clearable ? () => { onChange(''); setOpen(false) } : undefined}
            min={minDate ?? undefined}
            max={maxDate ?? undefined}
          />
        </div>
      )}
    </div>
  )
}
