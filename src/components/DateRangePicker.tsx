import { useRef, useState } from 'react';
import { DayPicker } from 'react-day-picker';
import { format } from 'date-fns';
import { Calendar } from '@untitled-ui/icons-react';
import type { DateRange } from 'react-day-picker';
import 'react-day-picker/style.css';
import { useClickOutside } from '../hooks/useClickOutside';

export default function DateRangePicker() {
  const [open, setOpen] = useState(false);
  const [range, setRange] = useState<DateRange | undefined>({
    from: new Date(2025, 0, 10),
    to:   new Date(2025, 0, 16),
  });

  const ref = useRef<HTMLDivElement>(null);

  useClickOutside(ref, () => setOpen(false));

  const label =
    range?.from && range?.to
      ? `${format(range.from, 'MMM d, yyyy')} – ${format(range.to, 'MMM d, yyyy')}`
      : range?.from
      ? format(range.from, 'MMM d, yyyy')
      : 'Select date range';

  return (
    <div ref={ref} className="relative">
      {/* Trigger button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 px-3.5 py-2 text-[13px] font-semibold text-gray-700 bg-white rounded-lg border border-gray-300 shadow-sm hover:bg-gray-50 transition-colors whitespace-nowrap"
      >
        <Calendar width={18} height={18} className="text-gray-400 shrink-0" />
        {label}
      </button>

      {/* Calendar dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-2 z-50 bg-white border border-gray-200 rounded-xl shadow-lg p-1 rdp-untitled">
          <DayPicker
            mode="range"
            selected={range}
            onSelect={setRange}
            numberOfMonths={2}
            defaultMonth={range?.from}
          />
          {/* Actions */}
          <div className="flex items-center justify-end gap-2 px-3 pb-3 pt-1 border-t border-gray-100 mt-1">
            <button
              onClick={() => { setRange(undefined); setOpen(false); }}
              className="px-3 py-1.5 text-[13px] font-semibold text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => setOpen(false)}
              className="px-3 py-1.5 text-[13px] font-semibold text-white bg-brand-700 rounded-lg hover:bg-brand-800 transition-colors"
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
