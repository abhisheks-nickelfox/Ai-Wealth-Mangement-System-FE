import { useState } from 'react';
import { FilterLines } from '@untitled-ui/icons-react';
import type { AppNotification } from '../lib/api';
import SearchInput from '../components/ui/SearchInput';
import SlideOver from '../components/ui/SlideOver';
import Checkbox from '../components/ui/Checkbox';
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from '../hooks/useNotifications';

// ── Relative time helper ──────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} min${diffMin === 1 ? '' : 's'} ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} hour${diffHr === 1 ? '' : 's'} ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay} day${diffDay === 1 ? '' : 's'} ago`;
}

// ── Inbox item row ────────────────────────────────────────────────────────────

interface InboxRowProps {
  item: AppNotification;
  onMarkRead: (id: string) => void;
}

function InboxRow({ item, onMarkRead }: InboxRowProps) {
  function handleClick() {
    if (!item.read) {
      onMarkRead(item.id);
    }
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => e.key === 'Enter' && handleClick()}
      className="flex items-start gap-5 px-6 py-5 border-b border-[#F2F4F7] hover:bg-[#FAFAFA] transition-colors cursor-pointer"
    >
      {/* Unread dot */}
      <div className="shrink-0 flex items-center justify-center w-3 h-3 mt-1.5">
        {!item.read && (
          <span className="block w-2.5 h-2.5 rounded-full bg-blue-500" aria-label="Unread" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Title + time */}
        <div className="flex items-baseline gap-2 mb-1">
          <span className={`text-sm font-semibold ${item.read ? 'text-[#535862]' : 'text-[#181D27]'}`}>
            {item.title}
          </span>
          <span className="text-xs text-[#A4A7AE] shrink-0">{timeAgo(item.created_at)}</span>
        </div>

        {/* Message */}
        <p className="text-sm text-[#535862] leading-snug">{item.message}</p>
      </div>
    </div>
  );
}

// ── Filter panel ──────────────────────────────────────────────────────────────

const CLIENTS = [
  'Ancora',
  'Accelerated Wealth Partners',
  'Azimuth Capital',
  'Badgley Phelps',
  'Brand Asset Management',
  'Coastal Bridge Advisors',
  'Fairway Wealth',
  'Focus Partners Wealth',
  'FPW | Bordeaux Wealth',
  'ICON Wealth',
  'IDA Wealth',
  'Kovitz',
  'Family Office Partners',
  'The Fiduciary Group',
  'Portfolio Strategy Group',
  'SagePoint Capital Partners',
  'SCS Financial',
];

interface FilterPanelProps {
  open: boolean;
  onClose: () => void;
}

function FilterPanel({ open, onClose }: FilterPanelProps) {
  const [assignedToMe, setAssignedToMe] = useState(true);
  const [todayOverdue, setTodayOverdue] = useState(true);
  const [clientSearch, setClientSearch] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [selectedClients, setSelectedClients] = useState<string[]>([]);

  function toggleClient(name: string) {
    setSelectedClients((prev) =>
      prev.includes(name) ? prev.filter((c) => c !== name) : [...prev, name],
    );
  }

  const filtered = CLIENTS.filter((c) =>
    c.toLowerCase().includes(clientSearch.toLowerCase()),
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

          {/* Saved filter dropdown */}
          <div className="mb-5">
            <button className="w-full flex items-center justify-between px-3 py-2 border border-[#D5D7DA] rounded-lg text-sm text-[#717680] bg-white hover:bg-gray-50 transition-colors">
              <span>Select saved filter</span>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M4 6l4 4 4-4" stroke="#717680" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>

          {/* Status */}
          <div className="mb-5">
            <p className="text-xs font-semibold text-[#414651] uppercase tracking-wider mb-3">Status</p>
            <div className="flex flex-col gap-2">
              <Checkbox
                checked={assignedToMe}
                onChange={setAssignedToMe}
                label="Assigned to me"
              />
              <Checkbox
                checked={todayOverdue}
                onChange={setTodayOverdue}
                label="Today &amp; Overdue"
              />
            </div>
          </div>

          {/* Clients */}
          <div>
            <p className="text-xs font-semibold text-[#414651] uppercase tracking-wider mb-3">Clients</p>

            <SearchInput
              value={clientSearch}
              onChange={setClientSearch}
              placeholder="Search"
              className="mb-3"
            />

            <div className="flex flex-col gap-1">
              {visible.map((client) => (
                <Checkbox
                  key={client}
                  checked={selectedClients.includes(client)}
                  onChange={() => toggleClient(client)}
                  label={client}
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

        {/* Footer */}
        <div className="flex items-center gap-3 pt-4 border-t border-[#E9EAEB] mt-4">
          <button
            onClick={() => {
              setAssignedToMe(false);
              setTodayOverdue(false);
              setSelectedClients([]);
              setClientSearch('');
            }}
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

// ── Page ──────────────────────────────────────────────────────────────────────

export default function InboxPage() {
  const [filterOpen, setFilterOpen] = useState(false);

  const { data: notifications, isLoading, isError } = useNotifications();
  const { mutate: markRead } = useMarkNotificationRead();
  const { mutate: markAllRead, isPending: isMarkingAll } = useMarkAllNotificationsRead();

  const hasUnread = notifications?.some((n) => !n.read) ?? false;

  return (
    <main className="flex-1 min-w-0 overflow-y-auto bg-white relative">

      {/* Page header */}
      <div className="flex items-start justify-between px-6 pt-8 pb-5 border-b border-[#E9EAEB]">
        <div>
          <h1 className="text-2xl font-semibold text-[#181D27]">Inbox</h1>
          <p className="text-sm text-[#535862] mt-1">
            Your notifications and activity updates.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasUnread && (
            <button
              onClick={() => markAllRead()}
              disabled={isMarkingAll}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-semibold text-[#6941C6] bg-[#F9F5FF] border border-[#D6BBFB] rounded-lg hover:bg-[#F4EBFF] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isMarkingAll ? 'Marking...' : 'Mark all read'}
            </button>
          )}
          <button
            onClick={() => setFilterOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-semibold text-[#414651] bg-white border border-[#D5D7DA] rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
          >
            <FilterLines width={18} height={18} className="text-[#535862]" />
            Filter
          </button>
        </div>
      </div>

      {/* States */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <p className="text-sm text-[#A4A7AE]">Loading notifications...</p>
        </div>
      )}

      {isError && (
        <div className="flex items-center justify-center py-20">
          <p className="text-sm text-red-500">Failed to load notifications. Please try again.</p>
        </div>
      )}

      {!isLoading && !isError && notifications?.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-2">
          <p className="text-sm font-medium text-[#181D27]">No notifications yet.</p>
          <p className="text-sm text-[#A4A7AE]">You're all caught up.</p>
        </div>
      )}

      {/* Notification list */}
      {!isLoading && !isError && notifications && notifications.length > 0 && (
        <div>
          {notifications.map((item) => (
            <InboxRow
              key={item.id}
              item={item}
              onMarkRead={markRead}
            />
          ))}
        </div>
      )}

      {/* Filter slide-over */}
      <FilterPanel open={filterOpen} onClose={() => setFilterOpen(false)} />
    </main>
  );
}
