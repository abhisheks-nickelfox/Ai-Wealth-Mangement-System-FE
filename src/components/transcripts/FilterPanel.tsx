import { useState } from 'react';
import SlideOver from '../ui/SlideOver';
import SearchInput from '../ui/SearchInput';
import Checkbox from '../ui/Checkbox';
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
    <SlideOver
      open={open}
      onClose={onClose}
      title="Filters"
      subtitle="Apply filters to table data."
      width="max-w-[320px]"
    >
      <div className="flex flex-col h-full">
        <div className="flex-1">
          <div className="mb-5">
            <p className="text-xs font-semibold text-[#414651] uppercase tracking-wider mb-3">
              Firms
            </p>
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search firms"
              className="mb-3"
            />
            <div className="flex flex-col gap-1">
              {visible.map((firm) => (
                <Checkbox
                  key={firm.id}
                  checked={selectedFirmIds.includes(firm.id)}
                  onChange={() => onFirmToggle(firm.id)}
                  label={firm.name}
                  className="py-1"
                />
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

        <div className="flex items-center gap-3 pt-4 border-t border-[#E9EAEB] mt-4">
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
    </SlideOver>
  );
}
