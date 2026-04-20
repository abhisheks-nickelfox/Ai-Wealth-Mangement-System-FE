import { useState, useMemo, useRef, useCallback } from 'react';
import { ChevronDown, ChevronUp, SearchLg } from '@untitled-ui/icons-react';
import { useClickOutside } from '../../hooks/useClickOutside';

const BADGE_PALETTE = [
  'bg-[#E9D7FE] border-[#E9D7FE] text-[#6941C6]',
  'bg-[#EFF8FF] border-[#B2DDFF] text-[#175CD3]',
  'bg-[#ECFDF3] border-[#ABEFC6] text-[#067647]',
];

function badgeClass(label: string): string {
  let h = 0;
  for (let i = 0; i < label.length; i++) h = (h * 31 + label.charCodeAt(i)) & 0xffffffff;
  return BADGE_PALETTE[Math.abs(h) % BADGE_PALETTE.length];
}

interface MultiSelectOption {
  value: string;
  label: string;
}

interface MultiSelectProps {
  options: MultiSelectOption[];
  value: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  columns?: 1 | 2;
  label?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
  showBadges?: boolean;
}

export default function MultiSelect({
  options,
  value,
  onChange,
  placeholder = 'Select option(s)',
  columns = 1,
  label,
  searchable = false,
  searchPlaceholder = 'Search…',
  showBadges = false,
}: MultiSelectProps) {
  const [open,  setOpen]  = useState(false);
  const [query, setQuery] = useState('');

  const containerRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => {
    setOpen(false);
    setQuery('');
  }, []);

  useClickOutside(containerRef, close);

  const selectedSet = new Set(value);

  const selectedLabels = options
    .filter((o) => selectedSet.has(o.value))
    .map((o) => o.label);
  const displayLabel =
    selectedLabels.length === 0 ? placeholder : selectedLabels.join(', ');

  const filtered = useMemo(() => {
    if (!searchable || !query.trim()) return options;
    const q = query.toLowerCase();
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, query, searchable]);

  function toggle(optValue: string) {
    const next = new Set(selectedSet);
    if (next.has(optValue)) next.delete(optValue);
    else next.add(optValue);
    onChange([...next]);
  }

  const midpoint     = Math.ceil(filtered.length / 2);
  const leftOptions  = columns === 2 ? filtered.slice(0, midpoint) : filtered;
  const rightOptions = columns === 2 ? filtered.slice(midpoint)    : [];

  const renderOption = (opt: MultiSelectOption) => (
    <label key={opt.value} className="flex items-center gap-2.5 cursor-pointer select-none">
      <input
        type="checkbox"
        checked={selectedSet.has(opt.value)}
        onChange={() => toggle(opt.value)}
        className="w-4 h-4 rounded border-[#D5D7DA] accent-[#7F56D9] cursor-pointer"
      />
      <span className="text-sm text-[#717680]">{opt.label}</span>
    </label>
  );

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium text-[#414651]">{label}</label>
      )}

      {/* Wrapper — relative so the dropdown anchors to it */}
      <div ref={containerRef} className="relative">

        {/* Trigger */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="w-full flex items-center gap-2 bg-white border border-[#D5D7DA] rounded-lg px-3 py-2.5 shadow-sm text-left min-h-[44px]"
        >
          {showBadges && selectedLabels.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 flex-1">
              {selectedLabels.map((lbl) => (
                <span
                  key={lbl}
                  className={`inline-flex items-center border text-xs font-medium px-2 py-0.5 rounded-full ${badgeClass(lbl)}`}
                >
                  {lbl}
                </span>
              ))}
            </div>
          ) : (
            <span
              className={`flex-1 text-base leading-6 truncate ${
                value.length === 0 ? 'text-[#717680]' : 'text-[#181D27]'
              }`}
            >
              {displayLabel}
            </span>
          )}
          {open
            ? <ChevronUp   width={16} height={16} className="text-[#717680] shrink-0" />
            : <ChevronDown width={16} height={16} className="text-[#717680] shrink-0" />
          }
        </button>

        {/* Dropdown — absolute so it overlays content without shifting layout */}
        {open && (
          <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-50 bg-white border border-[#D5D7DA] rounded-lg shadow-lg overflow-hidden max-h-64 overflow-y-auto">

            {/* Search */}
            {searchable && (
              <div className="px-3 pt-3 pb-2 border-b border-[#F2F4F7] sticky top-0 bg-white">
                <div className="flex items-center gap-2 bg-[#F9FAFB] border border-[#E9EAEB] rounded-lg px-3 py-2">
                  <SearchLg width={14} height={14} className="text-[#717680] shrink-0" />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={searchPlaceholder}
                    className="flex-1 bg-transparent text-sm text-[#181D27] placeholder-[#717680] outline-none"
                  />
                </div>
              </div>
            )}

            {/* Options */}
            {filtered.length === 0 ? (
              <p className="px-4 py-4 text-sm text-[#A4A7AE]">No results found</p>
            ) : columns === 1 ? (
              <div className="flex flex-col gap-3 p-4">
                {leftOptions.map(renderOption)}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-y-3 p-4">
                <div className="flex flex-col gap-3">{leftOptions.map(renderOption)}</div>
                <div className="flex flex-col gap-3">{rightOptions.map(renderOption)}</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
