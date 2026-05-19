import { useState, useMemo } from 'react';
import type { AppNotification } from '../../lib/api';
import { type ActiveFilters, DEFAULT_FILTERS } from '../../lib/inboxUtils';
import SlideOver from '../ui/SlideOver';
import Checkbox from '../ui/Checkbox';
import SearchInput from '../ui/SearchInput';

type BoolFilterKey = 'mentions' | 'replies' | 'unread' | 'assignedToMe' | 'overdue' | 'cleared';

interface InboxFilterPanelProps {
  open: boolean;
  onClose: () => void;
  firmNames: string[];
  notifications: AppNotification[];
  activeFilters: ActiveFilters;
  onApply: (filters: ActiveFilters) => void;
}

export default function InboxFilterPanel({
  open,
  onClose,
  firmNames,
  notifications,
  activeFilters,
  onApply,
}: InboxFilterPanelProps) {
  const [local, setLocal] = useState<ActiveFilters>(activeFilters);
  const [clientSearch, setClientSearch] = useState('');
  const [showAll, setShowAll] = useState(false);

  const counts = useMemo(() => ({
    mentions:     notifications.filter((n) => /@\w+/.test(n.message)).length,
    replies:      notifications.filter((n) => n.message.toLowerCase().includes('reply')).length,
    unread:       notifications.filter((n) => !n.read).length,
    assignedToMe: notifications.filter((n) => n.message.toLowerCase().includes('assigned')).length,
    overdue:      notifications.filter((n) => n.message.toLowerCase().includes('overdue')).length,
    cleared:      notifications.filter((n) => n.read).length,
  }), [notifications]);

  const filteredFirms = firmNames.filter((c) =>
    c.toLowerCase().includes(clientSearch.toLowerCase()),
  );
  const visibleFirms = showAll ? filteredFirms : filteredFirms.slice(0, 8);
  const remaining = filteredFirms.length - 8;

  function toggleClient(name: string) {
    setLocal((prev) => ({
      ...prev,
      clients: prev.clients.includes(name)
        ? prev.clients.filter((c) => c !== name)
        : [...prev.clients, name],
    }));
  }

  function handleClear() {
    setLocal(DEFAULT_FILTERS);
    setClientSearch('');
  }

  function handleApply() {
    onApply(local);
    onClose();
  }

  const filterRows: { key: BoolFilterKey; label: string }[] = [
    { key: 'mentions',     label: 'Mentions'      },
    { key: 'replies',      label: 'Replies'       },
    { key: 'unread',       label: 'Unread'        },
    { key: 'assignedToMe', label: 'Assigned to me' },
    { key: 'overdue',      label: 'Overdue'       },
    { key: 'cleared',      label: 'Cleared'       },
  ];

  return (
    <SlideOver
      open={open}
      onClose={onClose}
      title="Filters"
      subtitle="Apply filters to table data."
      width="max-w-[360px]"
      footer={
        <div className="flex items-center gap-3">
          <button
            onClick={handleClear}
            className="flex-1 px-4 py-2.5 text-sm font-semibold text-[#414651] border border-[#D5D7DA] rounded-lg bg-white hover:bg-[#F9FAFB] transition-colors"
          >
            Clear Filter
          </button>
          <button
            onClick={handleApply}
            className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-[#7F56D9] hover:bg-[#6941C6] rounded-lg transition-colors"
          >
            Apply
          </button>
        </div>
      }
    >
      <p className="text-[13px] font-semibold text-[#181D27] mb-3">Filter By</p>
      <div className="flex flex-col">
        {filterRows.map(({ key, label }) => (
          <div key={key} className="flex items-center justify-between py-2">
            <label className="flex items-center gap-2 cursor-pointer flex-1">
              <Checkbox
                checked={local[key]}
                onChange={(checked) => setLocal((prev) => ({ ...prev, [key]: checked }))}
              />
              <span className="text-[13px] text-[#414651]">{label}</span>
              <span className="px-1.5 py-0.5 text-[11px] font-semibold rounded-md bg-[#F2F4F7] text-[#414651] ml-auto">
                {counts[key]}
              </span>
            </label>
          </div>
        ))}
      </div>

      <p className="text-[13px] font-semibold text-[#181D27] mt-5 mb-3">Clients</p>
      <SearchInput
        value={clientSearch}
        onChange={setClientSearch}
        placeholder="Search"
        className="mb-3"
      />
      <div className="flex flex-col gap-1">
        {visibleFirms.map((firm) => (
          <div key={firm} className="flex items-center justify-between py-2">
            <label className="flex items-center gap-2 cursor-pointer flex-1">
              <Checkbox
                checked={local.clients.includes(firm)}
                onChange={() => toggleClient(firm)}
              />
              <span className="text-[13px] text-[#414651]">{firm}</span>
            </label>
          </div>
        ))}
      </div>
      {!showAll && remaining > 0 && (
        <button
          onClick={() => setShowAll(true)}
          className="mt-2 text-[13px] font-medium text-[#7F56D9] hover:text-[#6941C6] transition-colors"
        >
          Show {remaining} more
        </button>
      )}
      {showAll && filteredFirms.length > 8 && (
        <button
          onClick={() => setShowAll(false)}
          className="mt-2 text-[13px] font-medium text-[#7F56D9] hover:text-[#6941C6] transition-colors"
        >
          Show less
        </button>
      )}
    </SlideOver>
  );
}
