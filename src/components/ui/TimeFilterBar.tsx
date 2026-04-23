import { Calendar } from '@untitled-ui/icons-react';

export type TimeFilter = 'all' | 'custom' | '30d' | '7d' | '24h';

const TIME_FILTER_OPTIONS: { key: TimeFilter; label: string }[] = [
  { key: 'all',    label: 'All time'  },
  { key: 'custom', label: 'Custom'    },
  { key: '30d',    label: '30 days'   },
  { key: '7d',     label: '7 days'    },
  { key: '24h',    label: '24 hours'  },
];

interface TimeFilterBarProps {
  value: TimeFilter;
  onChange: (v: TimeFilter) => void;
  dateFrom?: string;
  onDateFromChange?: (v: string) => void;
  dateTo?: string;
  onDateToChange?: (v: string) => void;
}

export default function TimeFilterBar({
  value,
  onChange,
  dateFrom = '',
  onDateFromChange,
  dateTo = '',
  onDateToChange,
}: TimeFilterBarProps) {
  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center gap-0.5 bg-gray-50 border border-gray-200 rounded-lg p-0.5">
        {TIME_FILTER_OPTIONS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => onChange(key)}
            className={`px-3 py-1.5 rounded-md text-[13px] font-semibold whitespace-nowrap transition-all ${
              value === key
                ? 'bg-white text-gray-700 border border-gray-300 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {value === 'custom' && (
        <div className="flex items-center gap-1 border border-[#D5D7DA] rounded-full px-3 py-1.5 bg-white ml-1">
          <Calendar width={14} height={14} className="text-[#A4A7AE] shrink-0" />
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => onDateFromChange?.(e.target.value)}
            className="text-sm text-[#181D27] bg-transparent outline-none w-32"
          />
          <span className="text-[#A4A7AE] text-sm">–</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => onDateToChange?.(e.target.value)}
            className="text-sm text-[#181D27] bg-transparent outline-none w-32"
          />
        </div>
      )}
    </div>
  );
}
