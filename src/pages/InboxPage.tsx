import { useState, useCallback } from 'react';
import { FilterLines } from '@untitled-ui/icons-react';
import type { AppNotification } from '../lib/api';
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  useClearNotification,
  useClearAllNotifications,
} from '../hooks/useNotifications';
import { useFirms } from '../hooks/useFirms';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { type ActiveFilters, DEFAULT_FILTERS, applyFilters, groupNotifications } from '../lib/inboxUtils';
import InboxRow from '../components/inbox/InboxRow';
import ThreadPanel from '../components/inbox/ThreadPanel';
import InboxFilterPanel from '../components/inbox/InboxFilterPanel';

const SWIPE_MS   = 320;  // how long the slide-right takes
const COLLAPSE_EXTRA = 220; // collapse starts this many ms after slide begins

export default function InboxPage() {
  const [filterOpen,            setFilterOpen]            = useState(false);
  const [selectedNotification,  setSelectedNotification]  = useState<AppNotification | null>(null);
  const [activeFilters,         setActiveFilters]         = useState<ActiveFilters>(DEFAULT_FILTERS);
  // ids currently animating out (single clear)
  const [clearingIds,           setClearingIds]           = useState<Set<string>>(new Set());
  // all ids animating out during "Clear all"
  const [clearAllIds,           setClearAllIds]           = useState<Set<string>>(new Set());

  const { data: notifications, isLoading, isError } = useNotifications();
  const { mutate: markRead    }                       = useMarkNotificationRead();
  const { mutate: markAllRead, isPending: isMarkingAll } = useMarkAllNotificationsRead();
  const { mutate: clearOne    }                       = useClearNotification();
  const { mutate: clearAll    }                       = useClearAllNotifications();
  const { data: firms         }                       = useFirms();

  const firmNames       = firms?.map((f) => f.name) ?? [];
  const allNotifications = notifications ?? [];
  const hasUnread       = allNotifications.some((n) => !n.read);
  const filtered        = applyFilters(allNotifications, activeFilters);
  const groups          = groupNotifications(filtered);

  // ── Select row ───────────────────────────────────────────────────────────────
  function handleSelectRow(item: AppNotification) {
    setSelectedNotification((prev) => (prev?.id === item.id ? null : item));
    if (!item.read) markRead(item.id);
  }

  function handleMarkRead(id: string) {
    markRead(id);
    if (selectedNotification?.id === id)
      setSelectedNotification((prev) => (prev ? { ...prev, read: true } : null));
  }

  // ── Single clear — swipe right then delete ────────────────────────────────
  const handleClear = useCallback((id: string) => {
    // If selected, close thread panel
    if (selectedNotification?.id === id) setSelectedNotification(null);

    setClearingIds((prev) => new Set([...prev, id]));

    // After animation finishes, fire the delete (optimistic update in the hook)
    setTimeout(() => {
      clearOne(id);
      setClearingIds((prev) => { const s = new Set(prev); s.delete(id); return s; });
    }, SWIPE_MS + COLLAPSE_EXTRA + 80);
  }, [clearOne, selectedNotification]);

  // ── Clear all — staggered cascade then bulk delete ────────────────────────
  function handleClearAll() {
    if (filtered.length === 0) return;

    const ids      = filtered.map((n) => n.id);
    const newSet   = new Set(ids);
    const maxDelay = (ids.length - 1) * 40; // 40 ms stagger between rows
    const totalMs  = maxDelay + SWIPE_MS + COLLAPSE_EXTRA + 80;

    // Close thread if it's one of the items being cleared
    if (selectedNotification && newSet.has(selectedNotification.id))
      setSelectedNotification(null);

    setClearAllIds(newSet);

    setTimeout(() => {
      clearAll();
      setClearAllIds(new Set());
    }, totalMs);
  }

  // Merge both clearing sets for the row check
  function isClearing(id: string) {
    return clearingIds.has(id) || clearAllIds.has(id);
  }

  // Stagger offset for "Clear all" — each row in the flat list gets +40ms
  function clearDelay(id: string): number {
    if (clearingIds.has(id)) return 0;
    const idx = filtered.findIndex((n) => n.id === id);
    return idx >= 0 ? idx * 40 : 0;
  }

  return (
    <main className="flex flex-row flex-1 min-w-0 h-full overflow-hidden bg-white">
      {/* ── Inbox list column ── */}
      <div
        className={`flex flex-col bg-white overflow-hidden ${
          selectedNotification ? 'w-[480px] shrink-0 border-r border-[#E9EAEB]' : 'flex-1'
        }`}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-8 pb-5 border-b border-[#E9EAEB] shrink-0">
          <div>
            <h1 className="text-2xl font-semibold text-[#181D27]">Inbox</h1>
            <p className="text-sm text-[#535862] mt-1">
              Manage your team members, roles, and access across projects.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {hasUnread && (
              <button
                onClick={() => markAllRead()}
                disabled={isMarkingAll}
                className="text-[#6941C6] font-semibold text-sm hover:text-[#53389E] transition-colors disabled:opacity-50"
              >
                {isMarkingAll ? 'Marking…' : 'Mark all as read'}
              </button>
            )}
            {filtered.length > 0 && (
              <button
                onClick={handleClearAll}
                disabled={clearAllIds.size > 0}
                className="text-[#6941C6] font-semibold text-sm hover:text-[#53389E] transition-colors disabled:opacity-40"
              >
                Clear all
              </button>
            )}
            <button
              onClick={() => setFilterOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-semibold text-[#414651] bg-white border border-[#D5D7DA] rounded-lg shadow-sm hover:bg-[#F9FAFB] transition-colors"
            >
              <FilterLines width={16} height={16} className="text-[#535862]" />
              Filter
            </button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading && <LoadingSpinner message="Loading notifications…" />}

          {isError && (
            <div className="flex items-center justify-center py-20">
              <p className="text-sm text-red-500">Failed to load notifications. Please try again.</p>
            </div>
          )}

          {!isLoading && !isError && allNotifications.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 gap-2">
              <p className="text-sm font-medium text-[#181D27]">No notifications yet.</p>
              <p className="text-sm text-[#A4A7AE]">You're all caught up.</p>
            </div>
          )}

          {!isLoading && !isError && allNotifications.length > 0 && filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 gap-2">
              <p className="text-sm font-medium text-[#181D27]">No results match your filters.</p>
              <button
                onClick={() => setActiveFilters(DEFAULT_FILTERS)}
                className="text-sm text-[#6941C6] font-medium hover:text-[#53389E] transition-colors"
              >
                Clear filters
              </button>
            </div>
          )}

          {!isLoading && !isError && groups.length > 0 &&
            groups.map((group) => (
              <section key={group.label} aria-label={group.label}>
                <p className="text-[13px] font-semibold text-[#717680] px-6 pt-5 pb-2">
                  {group.label}
                </p>
                {group.items.map((item) => (
                  <InboxRow
                    key={item.id}
                    item={item}
                    isSelected={selectedNotification?.id === item.id}
                    clearing={isClearing(item.id)}
                    clearDelay={clearDelay(item.id)}
                    onSelect={handleSelectRow}
                    onMarkRead={handleMarkRead}
                    onClear={handleClear}
                  />
                ))}
              </section>
            ))}
        </div>
      </div>

      {/* ── Thread panel ── */}
      {selectedNotification && (
        <ThreadPanel
          notification={selectedNotification}
          onClose={() => setSelectedNotification(null)}
          onMarkRead={handleMarkRead}
          onClear={handleClear}
        />
      )}

      {/* Filter slide-over */}
      <InboxFilterPanel
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        firmNames={firmNames}
        notifications={allNotifications}
        activeFilters={activeFilters}
        onApply={setActiveFilters}
      />
    </main>
  );
}
