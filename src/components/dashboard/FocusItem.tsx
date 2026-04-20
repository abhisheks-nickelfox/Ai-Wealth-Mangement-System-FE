import type { ElementType } from 'react';

interface FocusItemProps {
  Icon: ElementType;
  bg: string;
  color: string;
  label: string;
  sub: string;
  count: number;
}

export function FocusItem({ Icon, bg, color, label, sub, count }: FocusItemProps) {
  return (
    <div className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
        style={{ backgroundColor: bg }}
      >
        <Icon width={18} height={18} style={{ color }} />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 leading-tight truncate">{label}</p>
        <p className="text-xs text-gray-500 leading-tight mt-0.5 truncate">{sub}</p>
      </div>

      <span className="text-2xl font-bold text-gray-900 shrink-0 leading-none tabular-nums">
        {String(count).padStart(2, '0')}
      </span>
    </div>
  );
}
