import { FilterLines } from '@untitled-ui/icons-react';

interface FilterTriggerButtonProps {
  activeCount: number;
  onClick: () => void;
  label?: string;
  ariaExpanded?: boolean;
  className?: string;
}

export default function FilterTriggerButton({
  activeCount,
  onClick,
  label = 'Filter',
  ariaExpanded,
  className = '',
}: FilterTriggerButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Open filters"
      aria-expanded={ariaExpanded}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[13px] font-semibold transition-colors ${
        activeCount > 0
          ? 'border-[#7F56D9] bg-[#F4F3FF] text-[#7F56D9]'
          : 'border-[#D0D5DD] bg-white text-[#344054] hover:bg-[#F9FAFB]'
      } ${className}`}
    >
      <FilterLines width={14} height={14} aria-hidden="true" />
      {label}
      {activeCount > 0 && (
        <span className="flex items-center justify-center w-4 h-4 rounded-full bg-[#7F56D9] text-white text-[10px] font-bold leading-none">
          {activeCount}
        </span>
      )}
    </button>
  );
}
