// ── Reusable task badge components used across Transcripts Flow pages ──────────

import type { Task } from '../../lib/api';
import { TASK_STATUS_COLORS, TASK_STATUS_LABELS } from '../../lib/constants';

// ── Shared priority constants (single source of truth) ────────────────────────

/** Dot colour for each priority value (use with `w-2 h-2 rounded-full` span). */
export const PRIORITY_DOT: Record<string, string> = {
  urgent: 'bg-red-500',
  high:   'bg-orange-400',
  normal: 'bg-yellow-400',
  low:    'bg-green-500',
};

/** Ordered priority options for dropdowns/selects. */
export const PRIORITY_OPTIONS: { value: 'urgent' | 'high' | 'normal' | 'low'; label: string; dot: string }[] = [
  { value: 'urgent', label: 'Urgent', dot: 'bg-red-500'    },
  { value: 'high',   label: 'High',   dot: 'bg-orange-400' },
  { value: 'normal', label: 'Normal', dot: 'bg-yellow-400' },
  { value: 'low',    label: 'Low',    dot: 'bg-green-500'  },
];

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

export function TaskStatusBadge({ status }: { status: string }) {
  const colors = TASK_STATUS_COLORS[status] ?? 'bg-[#F2F4F7] text-[#344054] border border-[#D0D5DD]';
  const label  = TASK_STATUS_LABELS[status] ?? status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
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
