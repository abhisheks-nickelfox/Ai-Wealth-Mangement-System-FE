import { useState } from 'react';
import { SearchLg, X } from '@untitled-ui/icons-react';
import type { Firm } from '../../lib/api';

export interface FilterPanelProps {
  open: boolean;
  onClose: () => void;
  firms: Firm[];
  selectedFirmIds: string[];
  onFirmToggle: (id: string) => void;
  onClear: () => void;
}

export default function FilterPanel({
  open,
  onClose,
  firms,
  selectedFirmIds,
  onFirmToggle,
  onClear,
}: FilterPanelProps) {
  const [search, setSearch] = useState('');
  const [showAll, setShowAll] = useState(false);

  const filtered = firms.filter((f) =>
    f.name.toLowerCase().includes(search.toLowerCase()),
  );
  const visible = showAll ? filtered : filtered.slice(0, 8);
  const remaining = filtered.length - 8;

  return (
    <>
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 transition-opacity duration-200 ${
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />
      <div
        className={`fixed inset-y-0 right-0 z-50 flex flex-col bg-white border-l border-[#E9EAEB] shadow-xl transition-transform duration-300 ease-in-out w-[320px] ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-start justify-between px-5 pt-5 pb-4 border-b border-[#E9EAEB]">
          <div>
            <h2 className="text-base font-semibold text-[#181D27]">Filters</h2>
            <p className="text-xs text-[#717680] mt-0.5">Apply filters to table data.</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-[#717680] hover:text-[#414651] hover:bg-gray-100 transition-colors"
          >
            <X width={18} height={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <div className="mb-5">
            <p className="text-xs font-semibold text-[#414651] uppercase tracking-wider mb-3">
              Firms
            </p>
            <div className="flex items-center gap-2 border border-[#D5D7DA] rounded-lg px-3 py-2 bg-white mb-3">
              <SearchLg width={14} height={14} className="text-[#A4A7AE] shrink-0" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search firms"
                className="flex-1 text-sm text-[#181D27] placeholder-[#A4A7AE] bg-transparent outline-none"
              />
            </div>
            <div className="flex flex-col gap-1">
              {visible.map((firm) => (
                <label key={firm.id} className="flex items-center gap-2.5 py-1 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={selectedFirmIds.includes(firm.id)}
                    onChange={() => onFirmToggle(firm.id)}
                    className="w-4 h-4 rounded accent-[#7F56D9] cursor-pointer shrink-0"
                  />
                  <span className="text-sm text-[#414651] group-hover:text-[#181D27] transition-colors">
                    {firm.name}
                  </span>
                </label>
              ))}
            </div>
            {!showAll && remaining > 0 && (
              <button
                onClick={() => setShowAll(true)}
                className="mt-2 text-sm font-medium text-[#7F56D9] hover:text-[#6941C6] transition-colors"
              >
                Show {remaining} more
              </button>
            )}
            {showAll && filtered.length > 8 && (
              <button
                onClick={() => setShowAll(false)}
                className="mt-2 text-sm font-medium text-[#7F56D9] hover:text-[#6941C6] transition-colors"
              >
                Show less
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 px-5 py-4 border-t border-[#E9EAEB]">
          <button
            onClick={() => { onClear(); setSearch(''); }}
            className="flex-1 px-4 py-2.5 text-sm font-semibold text-[#414651] border border-[#D5D7DA] rounded-lg bg-white hover:bg-gray-50 transition-colors"
          >
            Clear Filter
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-[#7F56D9] hover:bg-[#6941C6] rounded-lg transition-colors"
          >
            Apply
          </button>
        </div>
      </div>
    </>
  );
}
