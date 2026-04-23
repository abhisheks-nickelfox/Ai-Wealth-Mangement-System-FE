import { SearchLg } from '@untitled-ui/icons-react';

interface SearchInputProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}

export default function SearchInput({
  value,
  onChange,
  placeholder = 'Search…',
  className = '',
}: SearchInputProps) {
  return (
    <div className={`flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-2 bg-white ${className}`}>
      <SearchLg width={14} height={14} className="text-[#A4A7AE] shrink-0" aria-hidden="true" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 text-sm text-[#181D27] placeholder-[#A4A7AE] bg-transparent outline-none"
      />
      <kbd className="border border-[#E9EAEB] rounded px-1.5 py-0.5 text-[11px] text-[#A4A7AE] font-medium leading-none shrink-0">
        ⌘K
      </kbd>
    </div>
  );
}
