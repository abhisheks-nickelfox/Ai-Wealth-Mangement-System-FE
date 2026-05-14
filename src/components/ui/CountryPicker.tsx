import { useState, useRef, useEffect } from 'react';
import { ChevronDown, X } from '@untitled-ui/icons-react';
import { COUNTRIES, flagEmoji, flagFromName } from '../../lib/countries';
import { useClickOutside } from '../../hooks/useClickOutside';

interface CountryPickerProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string;
  required?: boolean;
  placeholder?: string;
}

export default function CountryPicker({
  label,
  value,
  onChange,
  onBlur,
  error,
  required,
  placeholder = 'Select a country',
}: CountryPickerProps) {
  const [query, setQuery]     = useState('');
  const [open, setOpen]       = useState(false);
  const containerRef          = useRef<HTMLDivElement>(null);
  const inputRef              = useRef<HTMLInputElement>(null);

  useClickOutside(containerRef, () => {
    setOpen(false);
    setQuery('');
    onBlur?.();
  });

  const flag        = value ? flagFromName(value) : '';
  const filtered    = query.trim()
    ? COUNTRIES.filter((c) => c.name.toLowerCase().startsWith(query.toLowerCase()))
        .concat(COUNTRIES.filter((c) =>
          !c.name.toLowerCase().startsWith(query.toLowerCase()) &&
          c.name.toLowerCase().includes(query.toLowerCase()),
        ))
    : COUNTRIES;

  function select(name: string) {
    onChange(name);
    setQuery('');
    setOpen(false);
    onBlur?.();
  }

  function clear(e: React.MouseEvent) {
    e.stopPropagation();
    onChange('');
    setQuery('');
  }

  function handleOpen() {
    setOpen(true);
    setQuery('');
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  // Keep query in sync when closed externally
  useEffect(() => {
    if (!open) setQuery('');
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      {label && (
        <label className="block text-sm font-medium text-[#414651] mb-1.5">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}

      {/* Trigger */}
      <button
        type="button"
        onClick={handleOpen}
        className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm text-left transition-colors bg-white
          ${error ? 'border-red-400 focus-within:ring-red-300' : 'border-[#D0D5DD] focus-within:border-[#7F56D9]'}
          ${open ? 'border-[#7F56D9] ring-2 ring-[#7F56D9]/20' : 'hover:border-[#B0B5BF]'}`}
      >
        {flag && (
          <span className="text-xl leading-none shrink-0">{flag}</span>
        )}
        <span className={`flex-1 truncate ${value ? 'text-[#181D27]' : 'text-[#9DA4AE]'}`}>
          {value || placeholder}
        </span>
        {value ? (
          <span
            onClick={clear}
            className="shrink-0 text-[#9DA4AE] hover:text-[#535862] transition-colors cursor-pointer"
          >
            <X width={14} height={14} />
          </span>
        ) : (
          <ChevronDown width={16} height={16} className={`shrink-0 text-[#9DA4AE] transition-transform ${open ? 'rotate-180' : ''}`} />
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-[#E9EAEB] rounded-lg shadow-lg overflow-hidden">
          {/* Search input */}
          <div className="px-3 py-2 border-b border-[#F2F4F7]">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search countries…"
              className="w-full text-sm text-[#181D27] placeholder-[#9DA4AE] outline-none bg-transparent"
            />
          </div>

          {/* List */}
          <div className="max-h-52 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="px-3 py-3 text-sm text-[#9DA4AE]">No countries found</p>
            ) : (
              filtered.map((c) => (
                <button
                  key={c.iso2}
                  type="button"
                  onClick={() => select(c.name)}
                  className={`flex items-center gap-2.5 w-full px-3 py-2 text-left text-sm transition-colors
                    ${c.name === value
                      ? 'bg-[#F4F3FF] text-[#7F56D9] font-medium'
                      : 'text-[#344054] hover:bg-[#F9FAFB]'}`}
                >
                  <span className="text-xl leading-none shrink-0">{flagEmoji(c.iso2)}</span>
                  <span className="truncate">{c.name}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {error && (
        <p className="mt-1 text-xs text-red-500">{error}</p>
      )}
    </div>
  );
}
