import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FilterLines, Mail01, XClose, CornerDownLeft, Send01 } from '@untitled-ui/icons-react';
import type { AppNotification, Message, TimeLog } from '../lib/api';
import { timeLogsApi } from '../lib/api';
import { formatDateShort, formatMessageTime } from '../lib/dateUtils';
import { TASK_STATUS_DOT } from '../lib/constants';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import SearchInput from '../components/ui/SearchInput';
import SlideOver from '../components/ui/SlideOver';
import Checkbox from '../components/ui/Checkbox';
import Avatar from '../components/ui/Avatar';
import EmptyState from '../components/ui/EmptyState';
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from '../hooks/useNotifications';
import { useFirms, useProjects } from '../hooks/useFirms';
import { useTask } from '../hooks/useTasks';
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

// ── SVG icons ─────────────────────────────────────────────────────────────────

function FirmIcon({ className = '' }: { className?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className={className} aria-hidden="true">
      <rect x="1" y="5" width="14" height="10" rx="1.2" stroke="currentColor" strokeWidth="1.4" />
      <path d="M5 5V3.5A1.5 1.5 0 0 1 6.5 2h3A1.5 1.5 0 0 1 11 3.5V5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M1 9h14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M6.5 9v2.5M9.5 9v2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function ProjectIcon({ className = '' }: { className?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className={className} aria-hidden="true">
      <path d="M1.5 4.5A1.5 1.5 0 0 1 3 3h3.5l1.5 2H13a1.5 1.5 0 0 1 1.5 1.5v6A1.5 1.5 0 0 1 13 14H3a1.5 1.5 0 0 1-1.5-1.5v-8z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
}

function TaskIcon({ className = '' }: { className?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className={className} aria-hidden="true">
      <rect x="1.5" y="1.5" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.4" />
      <rect x="8.5" y="1.5" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.4" />
      <rect x="1.5" y="8.5" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.4" />
      <path d="M11.5 8.5v6M8.5 11.5h6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
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

// ── Feed types ────────────────────────────────────────────────────────────────

interface ActivityLog {
  id: string;
  user_id: string;
  log_type: string;
  comment: string | null;
  created_at: string;
  users?: { name: string; email: string; avatar_url?: string | null } | null;
}

type FeedItem =
  | { kind: 'message'; data: Message; ts: string }
  | { kind: 'activity'; data: ActivityLog; ts: string };


function fmtStatus(s: string): string {
  return s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function extractToStatus(comment: string | null): string | null {
  if (!comment) return null;
  // Expect format like "status: old → new" or just capture the last word/phrase
  const arrowMatch = comment.match(/→\s*(.+)$/);
  if (arrowMatch) return arrowMatch[1].trim();
  const toMatch = comment.match(/to\s+(\w+)$/i);
  if (toMatch) return toMatch[1].trim();
  return null;
}

// ── Activity item ─────────────────────────────────────────────────────────────

function ActivityItem({ log }: { log: ActivityLog }) {
  const actorName = log.users?.name ?? 'Someone';

  let label: React.ReactNode;

  if (log.log_type === 'revision') {
    label = (
      <>
        <span className="font-medium text-[#344054]">{actorName}</span>
        {' sent to '}
        <span className="inline-flex items-center gap-1">
          <span
            className="inline-block w-1.5 h-1.5 rounded-full shrink-0"
            style={{ backgroundColor: TASK_STATUS_DOT['revisions'] }}
          />
          <span>Revisions</span>
        </span>
      </>
    );
  } else {
    // transition log — try to extract the destination status from comment
    const toStatus = extractToStatus(log.comment);
    const colour = toStatus ? (TASK_STATUS_DOT[toStatus] ?? '#98A2B3') : '#98A2B3';
    label = (
      <>
        <span className="font-medium text-[#344054]">{actorName}</span>
        {' changed status'}
        {toStatus && (
          <>
            {': '}
            <span className="inline-flex items-center gap-1">
              <span
                className="inline-block w-1.5 h-1.5 rounded-full shrink-0"
                style={{ backgroundColor: colour }}
              />
              <span>{fmtStatus(toStatus)}</span>
            </span>
          </>
        )}
      </>
    );
  }

  return (
    <div className="flex items-center gap-2 py-1.5 px-1 text-[12px] text-[#667085]">
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0 text-[#98A2B3]" aria-hidden="true">
        <circle cx="7" cy="4.5" r="2.5" stroke="currentColor" strokeWidth="1.3" />
        <path d="M1.5 12.5c0-3 2.5-5 5.5-5s5.5 2 5.5 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
      <span className="leading-snug flex-1">{label}</span>
      <span className="text-[#A4A7AE] shrink-0 text-[11px] ml-3">{formatMessageTime(log.created_at)}</span>
    </div>
  );
}

function ThreadPanel({ notification, onClose, onMarkRead }: ThreadPanelProps) {
  const [draft, setDraft] = useState('');
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scope   = notification.scope   ?? 'task';
  const scopeId = notification.scope_id ?? notification.ticket_id ?? '';
  const { data: messages, isLoading: messagesLoading } = useMessages(scope, scopeId);
  useMessageStream(scope, scopeId);
  const sendMessage = useSendMessage();

  // Fetch task + project details to build the breadcrumb (only for task scope)
  const taskId = scope === 'task' ? (notification.scope_id ?? notification.ticket_id) : null;
  const { data: task } = useTask(taskId);
  const { data: projects } = useProjects(task?.project_id ? task.firm_id : undefined);
  const project = projects?.find((p) => p.id === task?.project_id);

  // Fetch time logs for activity feed — only for task scope
  const { data: timeLogs } = useQuery<TimeLog[]>({
    queryKey: ['timeLogs', scopeId],
    queryFn: () => timeLogsApi.list(scopeId),
    enabled: !!scopeId && scope === 'task',
  });

  const firmName = task?.firms?.name ?? '';

  // Breadcrumb: scope first, then firm
  let breadcrumbLeft: string | null = null;
  if (task?.parent_task_id) {
    breadcrumbLeft = 'Sub-task';
  } else if (task?.project_id && project) {
    breadcrumbLeft = project.name;
  }
  // If no project and no sub-task, show only firmName (no left label)

  // Build combined chronological feed
  const activityLogs: ActivityLog[] = (timeLogs ?? [])
    .filter((l) => l.log_type === 'transition' || l.log_type === 'revision')
    .map((l) => ({
      id:         l.id,
      user_id:    l.user_id,
      log_type:   l.log_type,
      comment:    l.comment,
      created_at: l.created_at,
      users:      l.users,
    }));

  const feed: FeedItem[] = [
    ...(messages ?? []).map((m): FeedItem => ({ kind: 'message', data: m, ts: m.created_at })),
    ...activityLogs.map((a): FeedItem => ({ kind: 'activity', data: a, ts: a.created_at })),
  ].sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime());

  // Auto-scroll to bottom when feed changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [feed.length]);

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
    if (!body || !scopeId) return;
    sendMessage.mutate({
      scope,
      scope_id: scopeId,
      body,
      parent_id: replyTo?.id,
    });
    setDraft('');
    setReplyTo(null);
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
          {/* Title row — scope icon + actor avatar + title */}
          <div className="flex items-center gap-2">
            {notification.scope === 'firm' ? (
              <FirmIcon className="text-[#98A2B3] shrink-0" />
            ) : notification.scope === 'project' ? (
              <ProjectIcon className="text-[#98A2B3] shrink-0" />
            ) : (
              <TaskIcon className="text-[#98A2B3] shrink-0" />
            )}
            {notification.actor && (
              <Avatar
                name={notification.actor.name}
                src={notification.actor.avatar_url ?? undefined}
                size="xs"
              />
            )}
            <span className="text-[15px] font-semibold text-[#181D27] truncate">
              {notification.title}
            </span>
          </div>
          {/* Breadcrumb: scope first, then firm */}
          {(breadcrumbLeft || firmName) && (
            <div className="flex items-center gap-1.5 mt-1 text-[12px] text-[#667085]">
              <FileIcon className="text-[#98A2B3] shrink-0" />
              {breadcrumbLeft && <span>{breadcrumbLeft}</span>}
              {breadcrumbLeft && firmName && (
                <span className="text-[#D0D5DD]">|</span>
              )}
              {firmName && <span>{firmName}</span>}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {/* "/ Clear all" button */}
          <button
            onClick={() => onMarkRead(notification.id)}
            className="flex items-center gap-1 px-2 py-1 text-[12px] font-semibold text-[#6941C6] hover:text-[#53389E] transition-colors rounded-lg hover:bg-[#F9F5FF]"
            aria-label="Clear all notifications for this thread"
          >
            <span className="text-[#98A2B3] font-normal">/</span>
            <span>Clear all</span>
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

      {/* Feed area — messages + activity mixed chronologically */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col bg-[#F9FAFB]">
        {messagesLoading && (
          <div className="flex justify-center py-4">
            <LoadingSpinner />
          </div>
        )}

        {!messagesLoading && feed.length === 0 && scopeId && (
          <p className="text-[12px] text-[#A4A7AE] text-center py-4">
            No activity yet. Start the conversation.
          </p>
        )}

        {!scopeId && (
          <div className="text-[13px] text-[#414651] leading-relaxed py-2">
            {highlightMentions(notification.message)}
          </div>
        )}

        {feed.map((item) => {
          if (item.kind === 'activity') {
            return <ActivityItem key={`activity-${item.data.id}`} log={item.data} />;
          }
          return (
            <MessageItem
              key={`message-${item.data.id}`}
              msg={item.data}
              notificationId={notification.id}
              onMarkRead={onMarkRead}
              onReply={(msg) => {
                setReplyTo(msg);
                textareaRef.current?.focus();
              }}
            />
          );
        })}

        <div ref={messagesEndRef} />
      </div>

      {/* Composer */}
      <div className="shrink-0 border-t border-[#E9EAEB] px-4 py-3">
        {/* Reply-to banner */}
        {replyTo && (
          <div className="flex items-start justify-between gap-2 mb-2 px-3 py-2 bg-[#F9F5FF] border-l-2 border-[#7F56D9] rounded-r-lg">
            <p className="text-[12px] text-[#6941C6] leading-snug min-w-0">
              <span className="font-semibold">{replyTo.author.name}:</span>{' '}
              {replyTo.body.slice(0, 60)}{replyTo.body.length > 60 ? '…' : ''}
            </p>
            <button
              onClick={() => setReplyTo(null)}
              aria-label="Dismiss reply"
              className="shrink-0 text-[#98A2B3] hover:text-[#667085] transition-colors"
            >
              <XClose width={13} height={13} />
            </button>
          </div>
        )}
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
            disabled={!draft.trim() || sendMessage.isPending || !scopeId}
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
  onReply: (msg: Message) => void;
}

function MessageItem({ msg, notificationId, onMarkRead, onReply }: MessageItemProps) {
  return (
    <div className="rounded-xl border border-[#E4E7EC] bg-white mb-3 shadow-sm">
      {/* Top: avatar + name + time + body */}
      <div className="px-4 pt-4 pb-4">
        <div className="flex items-center gap-2.5 mb-3">
          <Avatar
            name={msg.author.name}
            src={msg.author.avatar_url ?? undefined}
            size="sm"
          />
          <span className="text-[13px] font-semibold text-[#101828]">{msg.author.name}</span>
          <span className="text-[12px] text-[#98A2B3] ml-1">{formatMessageTime(msg.created_at)}</span>
        </div>
        <p className="text-[13px] text-[#344054] leading-[1.6] pl-[38px]">
          {highlightMentions(msg.body)}
        </p>
      </div>
      {/* Divider */}
      <div className="h-px bg-[#F2F4F7]" />
      {/* Reactions + actions row */}
      <div className="flex items-center px-4 py-2.5">
        <button aria-label="👍" className="text-[16px] hover:opacity-70 transition-opacity mr-2">👍</button>
        <button aria-label="😊" className="text-[16px] hover:opacity-70 transition-opacity">😊</button>
        <div className="flex-1" />
        <button
          onClick={() => onMarkRead(notificationId)}
          className="text-[13px] font-medium text-[#6941C6] hover:text-[#53389E] transition-colors mr-4"
        >
          Clear
        </button>
        <button
          onClick={() => onReply(msg)}
          className="flex items-center gap-1.5 text-[13px] font-medium text-[#344054] hover:text-[#101828] transition-colors"
        >
          <CornerDownLeft width={14} height={14} />
          Reply
        </button>
      </div>
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
      {/* Left section — status dot + scope icon + actor avatar (all always shown) */}
      <div className="flex items-center gap-2 shrink-0">
        <StatusCircle read={item.read} />
        <span className="text-[#98A2B3]">
          {item.scope === 'firm' ? (
            <FirmIcon className="text-[#98A2B3]" />
          ) : item.scope === 'project' ? (
            <ProjectIcon className="text-[#98A2B3]" />
          ) : (
            <TaskIcon className="text-[#98A2B3]" />
          )}
        </span>
        {item.actor && (
          <Avatar
            name={item.actor.name}
            src={item.actor.avatar_url ?? undefined}
            size="sm"
          />
        )}
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
            <EmptyState
              title="No notifications yet."
              description="You're all caught up."
              className="py-20"
            />
          )}

          {!isLoading && !isError && allNotifications.length > 0 && filtered.length === 0 && (
            <EmptyState
              title="No results match your filters."
              action={{ label: 'Clear filters', onClick: () => setActiveFilters(DEFAULT_FILTERS) }}
              className="py-20"
            />
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
