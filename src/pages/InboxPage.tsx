import { useState, useRef, useEffect } from 'react';
import { FilterLines, Mail01, XClose, CornerDownLeft, Send01 } from '@untitled-ui/icons-react';
import type { AppNotification, Message } from '../lib/api';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import SearchInput from '../components/ui/SearchInput';
import SlideOver from '../components/ui/SlideOver';
import Checkbox from '../components/ui/Checkbox';
import Avatar from '../components/ui/Avatar';
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from '../hooks/useNotifications';
import { useFirms } from '../hooks/useFirms';
import { useMessages, useSendMessage } from '../hooks/useMessages';
import { useMessageStream } from '../hooks/useMessageStream';

// ── Helper functions ──────────────────────────────────────────────────────────

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function getDateBucket(iso: string): string {
  const now = new Date();
  const date = new Date(iso);
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(todayStart.getDate() - 1);
  const sevenDaysStart = new Date(todayStart);
  sevenDaysStart.setDate(todayStart.getDate() - 6);

  const itemDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (itemDay >= todayStart) return 'Today';
  if (itemDay >= yesterdayStart) return 'Yesterday';
  if (itemDay >= sevenDaysStart) return 'Last 7 Days';
  return MONTH_NAMES[date.getMonth()];
}

function groupNotifications(
  items: AppNotification[],
): { label: string; items: AppNotification[] }[] {
  const bucketOrder: string[] = ['Today', 'Yesterday', 'Last 7 Days'];
  const map = new Map<string, AppNotification[]>();

  for (const item of items) {
    const bucket = getDateBucket(item.created_at);
    const existing = map.get(bucket);
    if (existing) {
      existing.push(item);
    } else {
      map.set(bucket, [item]);
    }
  }

  // Build ordered result: Today → Yesterday → Last 7 Days → months desc
  const result: { label: string; items: AppNotification[] }[] = [];

  for (const label of bucketOrder) {
    if (map.has(label)) {
      result.push({ label, items: map.get(label)! });
      map.delete(label);
    }
  }

  // Remaining keys are month names — sort desc by year+month
  const monthKeys = Array.from(map.keys()).sort((a, b) => {
    const idxA = MONTH_NAMES.indexOf(a);
    const idxB = MONTH_NAMES.indexOf(b);
    // Higher index = more recent month
    return idxB - idxA;
  });

  for (const key of monthKeys) {
    result.push({ label: key, items: map.get(key)! });
  }

  return result;
}

function highlightMentions(text: string): React.ReactNode {
  const parts = text.split(/(@\w+)/g);
  return parts.map((part, i) =>
    part.startsWith('@') ? (
      <span key={i} className="text-[#6941C6] font-medium">
        {part}
      </span>
    ) : (
      part
    ),
  );
}

function formatDateShort(iso: string): string {
  const date = new Date(iso);
  return `${MONTH_NAMES[date.getMonth()]} ${date.getDate()}`;
}

function formatMessageTime(iso: string): string {
  const now = new Date();
  const date = new Date(iso);
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(todayStart.getDate() - 1);
  const itemDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  const h = date.getHours();
  const m = date.getMinutes();
  const ampm = h >= 12 ? 'pm' : 'am';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  const min = String(m).padStart(2, '0');
  const timeStr = `${hour12}:${min} ${ampm}`;

  if (itemDay >= todayStart) return `Today at ${timeStr}`;
  if (itemDay >= yesterdayStart) return `Yesterday at ${timeStr}`;
  return `${MONTH_NAMES[date.getMonth()]} ${date.getDate()} at ${timeStr}`;
}

// ── SVG icons ─────────────────────────────────────────────────────────────────

function SubtaskIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <rect x="1" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.4" />
      <rect x="9" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.4" />
      <rect x="1" y="9" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.4" />
      <path d="M12 9v6M9 12h6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function FileIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <rect x="2" y="1" width="10" height="14" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M5 5h6M5 8h6M5 11h3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function ActivityPersonIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
      <circle cx="5" cy="3.5" r="2" stroke="#98A2B3" strokeWidth="1.2" />
      <path d="M1 9c0-2.2 1.8-4 4-4s4 1.8 4 4" stroke="#98A2B3" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M2.5 7L5.5 10L11.5 4" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ── Status circle ─────────────────────────────────────────────────────────────

function StatusCircle({ read, cleared }: { read: boolean; cleared?: boolean }) {
  if (cleared) {
    return (
      <div className="w-5 h-5 rounded-full bg-[#12B76A] flex items-center justify-center shrink-0">
        <CheckIcon />
      </div>
    );
  }
  if (!read) {
    return (
      <div className="w-5 h-5 rounded-full bg-[#2E90FA] flex items-center justify-center shrink-0">
        <CheckIcon />
      </div>
    );
  }
  return (
    <div className="w-5 h-5 rounded-full border-2 border-[#D0D5DD] shrink-0" />
  );
}

// ── Active filters state ──────────────────────────────────────────────────────

interface ActiveFilters {
  mentions: boolean;
  replies: boolean;
  unread: boolean;
  assignedToMe: boolean;
  overdue: boolean;
  cleared: boolean;
  clients: string[];
}

const DEFAULT_FILTERS: ActiveFilters = {
  mentions: false,
  replies: false,
  unread: false,
  assignedToMe: false,
  overdue: false,
  cleared: false,
  clients: [],
};

function applyFilters(
  items: AppNotification[],
  filters: ActiveFilters,
): AppNotification[] {
  const anyTypeActive =
    filters.mentions ||
    filters.replies ||
    filters.unread ||
    filters.assignedToMe ||
    filters.overdue ||
    filters.cleared;
  const anyClientActive = filters.clients.length > 0;

  if (!anyTypeActive && !anyClientActive) return items;

  return items.filter((n) => {
    if (anyTypeActive) {
      if (filters.mentions && /@\w+/.test(n.message)) return true;
      if (filters.replies && n.message.toLowerCase().includes('reply')) return true;
      if (filters.unread && !n.read) return true;
      if (filters.assignedToMe && n.message.toLowerCase().includes('assigned')) return true;
      if (filters.overdue && n.message.toLowerCase().includes('overdue')) return true;
      if (filters.cleared && n.read) return true;
      if (!anyClientActive) return false;
    }
    // Client filter would need firm mapping — pass through if no match data
    return true;
  });
}

// ── Thread panel ──────────────────────────────────────────────────────────────

interface ThreadPanelProps {
  notification: AppNotification;
  onClose: () => void;
  onMarkRead: (id: string) => void;
}

function ThreadPanel({ notification, onClose, onMarkRead }: ThreadPanelProps) {
  const [draft, setDraft] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scopeId = notification.ticket_id ?? '';
  const { data: messages, isLoading: messagesLoading } = useMessages(
    'task',
    scopeId,
  );
  useMessageStream('task', scopeId);
  const sendMessage = useSendMessage();

  // Auto-scroll to bottom when messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages?.length]);

  // Auto-resize textarea
  function handleDraftChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setDraft(e.target.value);
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = '22px';
      ta.style.height = `${Math.min(ta.scrollHeight, 112)}px`;
    }
  }

  function handleSend() {
    const body = draft.trim();
    if (!body || !notification.ticket_id) return;
    sendMessage.mutate({ scope: 'task', scope_id: notification.ticket_id, body });
    setDraft('');
    if (textareaRef.current) textareaRef.current.style.height = '22px';
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="flex flex-col flex-1 border-l border-[#E9EAEB] bg-white h-full overflow-hidden">
      {/* Thread header */}
      <div className="flex items-start justify-between px-5 py-4 border-b border-[#E9EAEB] shrink-0">
        <div className="min-w-0 flex-1 mr-3">
          {/* Title row */}
          <div className="flex items-center gap-2">
            <StatusCircle read={notification.read} />
            <SubtaskIcon className="text-[#98A2B3] shrink-0" />
            <span className="text-[15px] font-semibold text-[#181D27] truncate">
              {notification.title}
            </span>
          </div>
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 mt-1 text-[12px] text-[#667085]">
            <FileIcon className="text-[#98A2B3] shrink-0" />
            <span>IDA Wealth management</span>
            <span className="text-[#D0D5DD]">|</span>
            <span>Project</span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => onMarkRead(notification.id)}
            className="text-[12px] font-semibold text-[#6941C6] flex items-center gap-1 hover:text-[#53389E] transition-colors"
          >
            Clear all
          </button>
          <button
            onClick={onClose}
            aria-label="Close thread"
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#F2F4F7] text-[#667085] transition-colors"
          >
            <XClose width={16} height={16} />
          </button>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-0">
        {/* Activity entry for the notification itself */}
        <div className="flex items-start gap-2.5 py-2 text-[12px] text-[#667085]">
          <div className="w-5 h-5 rounded-full bg-[#F2F4F7] flex items-center justify-center shrink-0 mt-0.5">
            <ActivityPersonIcon />
          </div>
          <span>
            {highlightMentions(notification.message)}{' '}
            <span className="text-[#A4A7AE]">{formatMessageTime(notification.created_at)}</span>
          </span>
        </div>

        {/* Messages */}
        {messagesLoading && (
          <div className="flex justify-center py-4">
            <LoadingSpinner />
          </div>
        )}

        {!messagesLoading && notification.ticket_id && messages && messages.length === 0 && (
          <p className="text-[12px] text-[#A4A7AE] text-center py-4">
            No replies yet. Start the conversation.
          </p>
        )}

        {!notification.ticket_id && (
          <div className="text-[13px] text-[#414651] leading-relaxed py-2">
            {highlightMentions(notification.message)}
          </div>
        )}

        {messages?.map((msg: Message) => (
          <MessageItem
            key={msg.id}
            msg={msg}
            notificationId={notification.id}
            onMarkRead={onMarkRead}
          />
        ))}

        <div ref={messagesEndRef} />
      </div>

      {/* Composer */}
      <div className="shrink-0 border-t border-[#E9EAEB] px-4 py-3">
        <div className="flex items-end gap-2 bg-white rounded-xl border border-[#E9EAEB] px-3.5 py-2.5 focus-within:border-[#7F56D9] focus-within:ring-2 focus-within:ring-[#7F56D9]/10 transition-all">
          <textarea
            ref={textareaRef}
            value={draft}
            onChange={handleDraftChange}
            onKeyDown={handleKeyDown}
            placeholder="Reply..."
            rows={1}
            className="flex-1 resize-none text-[13px] text-[#181D27] placeholder-[#A4A7AE] outline-none leading-[1.55] max-h-28 overflow-y-auto bg-transparent"
            style={{ minHeight: '22px' }}
          />
          <button
            onClick={handleSend}
            disabled={!draft.trim() || sendMessage.isPending || !notification.ticket_id}
            aria-label="Send reply"
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#7F56D9] hover:bg-[#6941C6] text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
          >
            <Send01 width={15} height={15} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Message item ──────────────────────────────────────────────────────────────

interface MessageItemProps {
  msg: Message;
  notificationId: string;
  onMarkRead: (id: string) => void;
}

function MessageItem({ msg, notificationId, onMarkRead }: MessageItemProps) {
  return (
    <div className="flex flex-col mb-4">
      {/* Author row */}
      <div className="flex items-center gap-2.5 mb-2">
        <Avatar
          name={msg.author.name}
          src={msg.author.avatar_url ?? undefined}
          size="sm"
        />
        <span className="text-[13px] font-semibold text-[#181D27]">{msg.author.name}</span>
        <span className="text-[11px] text-[#A4A7AE]">{formatMessageTime(msg.created_at)}</span>
      </div>
      {/* Body */}
      <div className="ml-0 text-[13px] text-[#414651] leading-relaxed mb-2">
        {highlightMentions(msg.body)}
      </div>
      {/* Actions row */}
      <div className="flex items-center gap-1">
        <button
          aria-label="React with thumbs up"
          className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-[#F2F4F7] text-[#98A2B3] transition-colors text-[13px]"
        >
          👍
        </button>
        <button
          aria-label="React with smile"
          className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-[#F2F4F7] text-[#98A2B3] transition-colors text-[13px]"
        >
          😊
        </button>
        <div className="flex-1" />
        <button
          onClick={() => onMarkRead(notificationId)}
          className="px-2.5 py-1 text-[12px] font-medium text-[#667085] hover:text-[#414651] transition-colors"
        >
          Clear
        </button>
        <button className="flex items-center gap-1 px-2.5 py-1 text-[12px] font-medium text-[#667085] hover:text-[#414651] transition-colors">
          <CornerDownLeft width={13} height={13} />
          Reply
        </button>
      </div>
      <div className="h-px bg-[#F2F4F7] mt-2" />
    </div>
  );
}

// ── Inbox row ─────────────────────────────────────────────────────────────────

interface InboxRowProps {
  item: AppNotification;
  isSelected: boolean;
  onSelect: (item: AppNotification) => void;
  onMarkRead: (id: string) => void;
}

function InboxRow({ item, isSelected, onSelect, onMarkRead }: InboxRowProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(item)}
      onKeyDown={(e) => e.key === 'Enter' && onSelect(item)}
      className={`flex items-center px-6 py-3.5 gap-4 border-b border-[#F2F4F7] cursor-pointer relative group transition-colors ${
        isSelected ? 'bg-[#F9F5FF]' : 'hover:bg-[#FAFAFA]'
      }`}
    >
      {/* Left section */}
      <div className="flex items-center gap-2 shrink-0">
        <StatusCircle read={item.read} />
        <span className="text-[#98A2B3]">
          {item.ticket_id ? (
            <SubtaskIcon className="text-[#98A2B3]" />
          ) : (
            <FileIcon className="text-[#98A2B3]" />
          )}
        </span>
      </div>

      {/* Middle section */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className={`text-[13px] font-semibold truncate ${
              !item.read ? 'text-[#181D27]' : 'text-[#667085]'
            }`}
          >
            {item.title}
          </span>
          <span className="text-[12px] text-[#A4A7AE] shrink-0">
            {formatDateShort(item.created_at)}
          </span>
        </div>
        <p className="text-[12px] text-[#667085] truncate leading-snug mt-0.5">
          {highlightMentions(item.message)}
        </p>
      </div>

      {/* Right section — hover actions */}
      <div className="hidden group-hover:flex items-center gap-2 shrink-0">
        <button
          aria-label="Mark as read"
          onClick={(e) => {
            e.stopPropagation();
            onMarkRead(item.id);
          }}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#F2F4F7] text-[#98A2B3] transition-colors"
        >
          <Mail01 width={16} height={16} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onMarkRead(item.id);
          }}
          className="px-3 py-1.5 text-[12px] font-semibold text-[#414651] border border-[#D5D7DA] rounded-lg bg-white hover:bg-[#F9FAFB] transition-colors"
        >
          Clear
        </button>
      </div>
    </div>
  );
}

// ── Filter panel ──────────────────────────────────────────────────────────────

interface FilterPanelProps {
  open: boolean;
  onClose: () => void;
  firmNames: string[];
  notifications: AppNotification[];
  activeFilters: ActiveFilters;
  onApply: (filters: ActiveFilters) => void;
}

function FilterPanel({
  open,
  onClose,
  firmNames,
  notifications,
  activeFilters,
  onApply,
}: FilterPanelProps) {
  const [local, setLocal] = useState<ActiveFilters>(activeFilters);
  const [clientSearch, setClientSearch] = useState('');
  const [showAll, setShowAll] = useState(false);

  // Sync local state when panel reopens
  useEffect(() => {
    if (open) setLocal(activeFilters);
  }, [open, activeFilters]);

  // Counts
  const counts = {
    mentions: notifications.filter((n) => /@\w+/.test(n.message)).length,
    replies: notifications.filter((n) => n.message.toLowerCase().includes('reply')).length,
    unread: notifications.filter((n) => !n.read).length,
    assignedToMe: notifications.filter((n) => n.message.toLowerCase().includes('assigned')).length,
    overdue: notifications.filter((n) => n.message.toLowerCase().includes('overdue')).length,
    cleared: notifications.filter((n) => n.read).length,
  };

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

  type BoolFilterKey = 'mentions' | 'replies' | 'unread' | 'assignedToMe' | 'overdue' | 'cleared';

  const filterRows: { key: BoolFilterKey; label: string }[] = [
    { key: 'mentions', label: 'Mentions' },
    { key: 'replies', label: 'Replies' },
    { key: 'unread', label: 'Unread' },
    { key: 'assignedToMe', label: 'Assigned to me' },
    { key: 'overdue', label: 'Overdue' },
    { key: 'cleared', label: 'Cleared' },
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
      {/* Filter By section */}
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

      {/* Clients section */}
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

// ── Page ──────────────────────────────────────────────────────────────────────

export default function InboxPage() {
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] =
    useState<AppNotification | null>(null);
  const [activeFilters, setActiveFilters] = useState<ActiveFilters>(DEFAULT_FILTERS);

  const { data: notifications, isLoading, isError } = useNotifications();
  const { mutate: markRead } = useMarkNotificationRead();
  const { mutate: markAllRead, isPending: isMarkingAll } = useMarkAllNotificationsRead();
  const { data: firms } = useFirms();

  const firmNames = firms?.map((f) => f.name) ?? [];
  const allNotifications = notifications ?? [];
  const hasUnread = allNotifications.some((n) => !n.read);

  const filtered = applyFilters(allNotifications, activeFilters);
  const groups = groupNotifications(filtered);

  function handleSelectRow(item: AppNotification) {
    setSelectedNotification((prev) => (prev?.id === item.id ? null : item));
  }

  function handleMarkRead(id: string) {
    markRead(id);
    if (selectedNotification?.id === id) {
      setSelectedNotification((prev) => (prev ? { ...prev, read: true } : null));
    }
  }

  return (
    <main className="flex flex-row flex-1 min-w-0 h-full overflow-hidden bg-white">
      {/* ── Inbox list column ── */}
      <div
        className={`flex flex-col bg-white overflow-hidden ${
          selectedNotification ? 'w-[480px] shrink-0 border-r border-[#E9EAEB]' : 'flex-1'
        }`}
      >
        {/* Page header */}
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
                {isMarkingAll ? 'Marking...' : 'Mark all as read'}
              </button>
            )}
            <button
              onClick={() => markAllRead()}
              disabled={isMarkingAll}
              className="text-[#6941C6] font-semibold text-sm hover:text-[#53389E] transition-colors disabled:opacity-50"
            >
              Clear all
            </button>
            <button
              onClick={() => setFilterOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-semibold text-[#414651] bg-white border border-[#D5D7DA] rounded-lg shadow-sm hover:bg-[#F9FAFB] transition-colors"
            >
              <FilterLines width={16} height={16} className="text-[#535862]" />
              Filter
            </button>
          </div>
        </div>

        {/* Scrollable list */}
        <div className="flex-1 overflow-y-auto">
          {isLoading && <LoadingSpinner message="Loading notifications…" />}

          {isError && (
            <div className="flex items-center justify-center py-20">
              <p className="text-sm text-red-500">
                Failed to load notifications. Please try again.
              </p>
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
                    onSelect={handleSelectRow}
                    onMarkRead={handleMarkRead}
                  />
                ))}
              </section>
            ))}
        </div>
      </div>

      {/* ── Thread panel column ── */}
      {selectedNotification && (
        <ThreadPanel
          notification={selectedNotification}
          onClose={() => setSelectedNotification(null)}
          onMarkRead={handleMarkRead}
        />
      )}

      {/* Filter slide-over */}
      <FilterPanel
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
