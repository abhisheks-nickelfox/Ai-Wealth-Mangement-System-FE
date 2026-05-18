import { useState } from 'react';
import { X, SearchLg } from '@untitled-ui/icons-react';

interface SearchPickerModalProps<T extends { id: string }> {
  open: boolean;
  title: string;
  items: T[];
  getLabel: (item: T) => string;
  onSelect: (id: string) => void;
  onClose: () => void;
  placeholder?: string;
  emptyMessage?: string;
}

export default function SearchPickerModal<T extends { id: string }>({
  open,
  title,
  items,
  getLabel,
  onSelect,
  onClose,
  placeholder = 'Search…',
  emptyMessage = 'No items found',
}: SearchPickerModalProps<T>) {
  const [search, setSearch] = useState('');
  if (!open) return null;

  const filtered = search.trim()
    ? items.filter((item) => getLabel(item).toLowerCase().includes(search.toLowerCase()))
    : items;

  function handleSelect(id: string) {
    setSearch('');
    onSelect(id);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-semibold text-[#181D27]">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded text-[#717680] hover:bg-[#F2F4F7] transition-colors"
          >
            <X width={16} height={16} aria-hidden="true" />
          </button>
        </div>
        <div className="flex items-center gap-2 border border-[#E9EAEB] rounded-lg px-3 py-2">
          <SearchLg width={14} height={14} className="text-[#A4A7AE] shrink-0" aria-hidden="true" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={placeholder}
            className="flex-1 text-[13px] text-[#181D27] placeholder-[#A4A7AE] outline-none bg-transparent"
            autoFocus
          />
        </div>
        <div className="flex flex-col gap-1 max-h-60 overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="text-[13px] text-[#A4A7AE] py-2 text-center">{emptyMessage}</p>
          ) : (
            filtered.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelect(item.id)}
                className="text-left px-3 py-2.5 rounded-lg text-[13px] text-[#344054] hover:bg-[#F4F3FF] hover:text-[#6941C6] transition-colors font-medium"
              >
                {getLabel(item)}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
