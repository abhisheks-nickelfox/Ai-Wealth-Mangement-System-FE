// ── Reusable task badge components used across Transcripts Flow pages ──────────

import type { Task } from '../../lib/api';

// ── Priority badge ─────────────────────────────────────────────────────────────

export function PriorityBadge({ priority }: { priority: Task['priority'] }) {
  const map: Record<string, string> = {
    low:    'bg-[#F0FDF4] text-[#15803D] border border-[#86EFAC]',
    normal: 'bg-[#EFF8FF] text-[#1565C0] border border-[#B2DDFF]',
    high:   'bg-[#FFF1F3] text-[#C01048] border border-[#FEA3B4]',
    urgent: 'bg-[#FFF4ED] text-[#B93815] border border-[#F9DBAF]',
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold ${map[priority] ?? map.normal}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {priority.charAt(0).toUpperCase() + priority.slice(1)}
    </span>
  );
}

// ── Status badge ───────────────────────────────────────────────────────────────

const STATUS_MAP: Record<string, string> = {
  draft:              'bg-[#FFF3E0] text-[#E65100] border border-[#FFB74D]',
  in_progress:        'bg-[#EFF8FF] text-[#1565C0] border border-[#B2DDFF]',
  resolved:           'bg-[#F0FDF4] text-[#15803D] border border-[#86EFAC]',
  discarded:          'bg-[#FFF1F3] text-[#C01048] border border-[#FEA3B4]',
  archived:           'bg-[#F5F5F5] text-[#757575] border border-[#BDBDBD]',
  internal_review:    'bg-[#F4F3FF] text-[#5925DC] border border-[#D9D6FE]',
  client_review:      'bg-[#EEF4FF] text-[#3538CD] border border-[#C7D7FD]',
  compliance_review:  'bg-[#FFFAEB] text-[#B54708] border border-[#FEF0C7]',
  approved:           'bg-[#ECFDF3] text-[#027A48] border border-[#ABEFC6]',
  closed:             'bg-[#F8F9FC] text-[#363F72] border border-[#D5D9EB]',
  revisions:          'bg-[#FFF4ED] text-[#B93815] border border-[#F9DBAF]',
};

const STATUS_LABEL: Record<string, string> = {
  draft:              'Review Needed',
  in_progress:        'Pending',
  resolved:           'Resolved',
  discarded:          'Cancelled',
  archived:           'Archived',
  internal_review:    'Internal Review',
  client_review:      'Client Review',
  compliance_review:  'Compliance Review',
  approved:           'Approved',
  closed:             'Closed',
  revisions:          'Revisions',
};

export function TaskStatusBadge({ status }: { status: string }) {
  const colors = STATUS_MAP[status] ?? 'bg-[#F2F4F7] text-[#344054] border border-[#D0D5DD]';
  const label  = STATUS_LABEL[status] ?? status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold ${colors}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
}

// ── Type badge ─────────────────────────────────────────────────────────────────

export function TypeBadge({ type }: { type: string }) {
  const label = type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-[#EFF8FF] text-[#1565C0] border border-[#B2DDFF]">
      {label}
    </span>
  );
}
