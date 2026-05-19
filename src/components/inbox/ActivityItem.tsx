import type { Message } from '../../lib/api';
import { formatMessageTime } from '../../lib/inboxUtils';

export interface ActivityLog {
  id: string;
  user_id: string;
  log_type: string;
  comment: string | null;
  hours?: number;
  created_at: string;
  users?: { name: string; email: string; avatar_url?: string | null } | null;
}

export type FeedItem =
  | { kind: 'message'; data: Message; ts: string }
  | { kind: 'activity'; data: ActivityLog; ts: string };

const STATUS_COLOURS: Record<string, string> = {
  in_progress:     '#2E90FA',
  internal_review: '#7F56D9',
  client_review:   '#3538CD',
  completed:       '#12B76A',
  revisions:       '#F79009',
  blocked:         '#F04438',
  assigned:        '#F79009',
  to_do:           '#98A2B3',
};

function fmtStatus(s: string): string {
  return s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function fmtHours(h: number): string {
  const total = Math.round(h * 60);
  const hrs   = Math.floor(total / 60);
  const mins  = total % 60;
  if (hrs === 0)  return `${mins}m`;
  if (mins === 0) return `${hrs}h`;
  return `${hrs}h ${mins}m`;
}

function extractToStatus(comment: string | null): string | null {
  if (!comment) return null;
  const arrowMatch = comment.match(/→\s*(.+)$/);
  if (arrowMatch) return arrowMatch[1].trim();
  const toMatch = comment.match(/to\s+(\w+)$/i);
  if (toMatch) return toMatch[1].trim();
  return null;
}

function UserIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0 text-[#98A2B3]" aria-hidden="true">
      <circle cx="7" cy="4.5" r="2.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M1.5 12.5c0-3 2.5-5 5.5-5s5.5 2 5.5 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0 text-[#98A2B3]" aria-hidden="true">
      <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M7 4v3.5l2 1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function AssignIcon({ added }: { added: boolean }) {
  return added ? (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0" aria-hidden="true">
      <circle cx="5.5" cy="4" r="2.5" stroke="#12B76A" strokeWidth="1.3" />
      <path d="M1 12c0-2.5 2-4.5 4.5-4.5" stroke="#12B76A" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M10 8.5v4M8 10.5h4" stroke="#12B76A" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ) : (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0" aria-hidden="true">
      <circle cx="5.5" cy="4" r="2.5" stroke="#F04438" strokeWidth="1.3" />
      <path d="M1 12c0-2.5 2-4.5 4.5-4.5" stroke="#F04438" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M8.5 10.5h4" stroke="#F04438" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function ActivityItem({ log }: { log: ActivityLog }) {
  const actorName = log.users?.name ?? 'Someone';

  // ── Timer log ────────────────────────────────────────────────────────────────
  if (log.log_type === 'partial') {
    const duration = fmtHours(log.hours ?? 0);
    return (
      <div className="flex items-center justify-center gap-1.5 py-1 text-[11px] text-[#667085]">
        <ClockIcon />
        <span className="leading-snug">
          <span className="font-medium text-[#344054]">{actorName}</span>
          {' logged '}
          <span className="font-semibold text-[#344054]">{duration}</span>
          {log.comment && (
            <span className="text-[#98A2B3]"> · {log.comment}</span>
          )}
        </span>
        <span className="text-[#A4A7AE] text-[10px]">{formatMessageTime(log.created_at)}</span>
      </div>
    );
  }

  // ── Estimate log ─────────────────────────────────────────────────────────────
  if (log.log_type === 'estimate') {
    const duration = fmtHours(log.hours ?? 0);
    return (
      <div className="flex items-center justify-center gap-1.5 py-1 text-[11px] text-[#667085]">
        <ClockIcon />
        <span className="leading-snug">
          <span className="font-medium text-[#344054]">{actorName}</span>
          {' estimated '}
          <span className="font-semibold text-[#344054]">{duration}</span>
        </span>
        <span className="text-[#A4A7AE] text-[10px]">{formatMessageTime(log.created_at)}</span>
      </div>
    );
  }

  // ── Assignee / member system message ─────────────────────────────────────────
  if (log.log_type === 'system') {
    const body      = log.comment ?? '';
    const [first, ...rest] = body.split(' ');
    const isAdded   = /^(assigned|added)$/i.test(first);
    const isRemoved = /^removed$/i.test(first);
    const actionColor = isAdded ? '#12B76A' : isRemoved ? '#F04438' : '#667085';
    return (
      <div className="flex items-center justify-center gap-1.5 py-1 text-[11px] text-[#667085]">
        <AssignIcon added={isAdded} />
        <span className="leading-snug">
          <span className="font-medium text-[#344054]">{actorName}</span>
          {' '}
          <span className="font-medium" style={{ color: actionColor }}>{first}</span>
          {' '}
          <span>{rest.join(' ')}</span>
        </span>
        <span className="text-[#A4A7AE] text-[10px]">{formatMessageTime(log.created_at)}</span>
      </div>
    );
  }

  // ── Revision marker ───────────────────────────────────────────────────────────
  if (log.log_type === 'revision') {
    return (
      <div className="flex items-center justify-center gap-1.5 py-1 text-[11px] text-[#667085]">
        <UserIcon />
        <span className="leading-snug">
          <span className="font-medium text-[#344054]">{actorName}</span>
          {' sent to '}
          <span className="inline-flex items-center gap-1">
            <span className="inline-block w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: STATUS_COLOURS['revisions'] }} />
            <span>Revisions</span>
          </span>
        </span>
        <span className="text-[#A4A7AE] text-[10px]">{formatMessageTime(log.created_at)}</span>
      </div>
    );
  }

  // ── Status transition ─────────────────────────────────────────────────────────
  const toStatus = extractToStatus(log.comment);
  const colour   = toStatus ? (STATUS_COLOURS[toStatus] ?? '#98A2B3') : '#98A2B3';
  return (
    <div className="flex items-center justify-center gap-1.5 py-1 text-[11px] text-[#667085]">
      <UserIcon />
      <span className="leading-snug">
        <span className="font-medium text-[#344054]">{actorName}</span>
        {' changed status'}
        {toStatus && (
          <>
            {': '}
            <span className="inline-flex items-center gap-1">
              <span className="inline-block w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: colour }} />
              <span>{fmtStatus(toStatus)}</span>
            </span>
          </>
        )}
      </span>
      <span className="text-[#A4A7AE] text-[10px]">{formatMessageTime(log.created_at)}</span>
    </div>
  );
}
