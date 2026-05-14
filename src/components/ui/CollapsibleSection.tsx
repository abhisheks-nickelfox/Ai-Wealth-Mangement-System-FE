import { useState } from 'react';
import { ChevronDown, ChevronRight } from '@untitled-ui/icons-react';
import CountBadge from './CountBadge';

interface CollapsibleSectionProps {
  label: string;
  count?: number;
  defaultExpanded?: boolean;
  dotColor?: string;
  children: React.ReactNode;
  className?: string;
}

export default function CollapsibleSection({
  label,
  count,
  defaultExpanded = true,
  dotColor,
  children,
  className = '',
}: CollapsibleSectionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-2 text-left"
        aria-expanded={expanded}
      >
        {expanded
          ? <ChevronDown width={13} height={13} className="shrink-0 text-[#717680]" aria-hidden="true" />
          : <ChevronRight width={13} height={13} className="shrink-0 text-[#717680]" aria-hidden="true" />}
        {dotColor && (
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: dotColor }}
            aria-hidden="true"
          />
        )}
        <span className="text-[12px] font-semibold text-[#344054]">{label}</span>
        {count !== undefined && (
          <CountBadge count={count} className="ml-1" />
        )}
      </button>
      {expanded && <div>{children}</div>}
    </div>
  );
}
