import type { Message } from '../../lib/api';
import { formatMessageTime } from '../../lib/inboxUtils';

export interface ActivityLog {
  id: string;
  user_id: string;
  log_type: string;
  comment: string | null;
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

function extractToStatus(comment: string | null): string | null {
  if (!comment) return null;
  const arrowMatch = comment.match(/→\s*(.+)$/);
  if (arrowMatch) return arrowMatch[1].trim();
  const toMatch = comment.match(/to\s+(\w+)$/i);
  if (toMatch) return toMatch[1].trim();
  return null;
}

export function ActivityItem({ log }: { log: ActivityLog }) {
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
            style={{ backgroundColor: STATUS_COLOURS['revisions'] }}
          />
          <span>Revisions</span>
        </span>
      </>
    );
  } else {
    const toStatus = extractToStatus(log.comment);
    const colour = toStatus ? (STATUS_COLOURS[toStatus] ?? '#98A2B3') : '#98A2B3';
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
