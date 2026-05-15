import type { AppNotification } from './api';

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function getDateBucket(iso: string): string {
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

export function groupNotifications(
  items: AppNotification[],
): { label: string; items: AppNotification[] }[] {
  const bucketOrder: string[] = ['Today', 'Yesterday', 'Last 7 Days'];
  const map = new Map<string, AppNotification[]>();

  for (const item of items) {
    // Use updated_at so a notification updated today appears in "Today" even if
    // it was originally created yesterday.
    const bucket = getDateBucket(item.updated_at ?? item.created_at);
    const existing = map.get(bucket);
    if (existing) {
      existing.push(item);
    } else {
      map.set(bucket, [item]);
    }
  }

  const result: { label: string; items: AppNotification[] }[] = [];

  for (const label of bucketOrder) {
    if (map.has(label)) {
      result.push({ label, items: map.get(label)! });
      map.delete(label);
    }
  }

  // Remaining keys are month names — sort desc by position in MONTH_NAMES
  const monthKeys = Array.from(map.keys()).sort((a, b) => {
    const idxA = MONTH_NAMES.indexOf(a);
    const idxB = MONTH_NAMES.indexOf(b);
    return idxB - idxA;
  });

  for (const key of monthKeys) {
    result.push({ label: key, items: map.get(key)! });
  }

  return result;
}

export function highlightMentions(text: string): React.ReactNode {
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

export function formatDateShort(iso: string): string {
  const date = new Date(iso);
  return `${MONTH_NAMES[date.getMonth()]} ${date.getDate()}`;
}

export function formatMessageTime(iso: string): string {
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

export interface ActiveFilters {
  mentions: boolean;
  replies: boolean;
  unread: boolean;
  assignedToMe: boolean;
  overdue: boolean;
  cleared: boolean;
  clients: string[];
}

export const DEFAULT_FILTERS: ActiveFilters = {
  mentions: false,
  replies: false,
  unread: false,
  assignedToMe: false,
  overdue: false,
  cleared: false,
  clients: [],
};

export function applyFilters(
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
