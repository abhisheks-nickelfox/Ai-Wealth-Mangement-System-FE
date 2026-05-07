import { useState, useRef } from 'react';
import {
  ChevronRight,
  FolderClosed,
  Dataflow03,
  DotsVertical,
  Edit01,
  Trash01,
} from '@untitled-ui/icons-react';
import DropdownMenu from '../ui/DropdownMenu';
import AvatarStack from '../ui/AvatarStack';
import Avatar from '../ui/Avatar';
import { useClickOutside } from '../../hooks/useClickOutside';
import type { Task, User, Project } from '../../lib/api';

// ── Shared column widths (imported by ProjectGroupRow) ────────────────────────
export const COL_ASSIGNEE = 'w-[140px] shrink-0';
export const COL_DATE     = 'w-[110px] shrink-0';
export const COL_PRIORITY = 'w-[100px] shrink-0';
export const COL_STATUS   = 'w-[120px] shrink-0';
export const COL_MENU     = 'w-8 shrink-0';

// ── Status dot ────────────────────────────────────────────────────────────────

const STATUS_DOT_COLOR: Record<string, string> = {
  to_do:           'stroke',
  assigned:        '#7F56D9',
  in_progress:     '#7F56D9',
  revisions:       '#F79009',
  internal_review: '#F79009',
  client_review:   '#444CE7',
  completed:       '#17B26A',
  blocked:         '#F04438',
};

export function StatusDot({ status }: { status: string }) {
  if (status === 'to_do') {
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <circle cx="8" cy="8" r="6" stroke="#A4A7AE" strokeWidth="1.5" fill="none" />
      </svg>
    );
  }
  const fill = STATUS_DOT_COLOR[status] ?? '#A4A7AE';
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="6" fill={fill} />
    </svg>
  );
}

// ── Badge helpers ─────────────────────────────────────────────────────────────

export const PRIORITY_BADGE: Record<string, string> = {
  urgent: 'bg-red-50 text-red-600',
  high:   'bg-orange-50 text-orange-600',
  normal: 'bg-yellow-50 text-yellow-700',
  low:    'bg-green-50 text-green-600',
};

export const TASK_STATUS_BADGE: Record<string, { label: string; style: string }> = {
  draft:             { label: 'Draft',       style: 'bg-gray-100 text-gray-500' },
  to_do:             { label: 'To Do',       style: 'bg-gray-100 text-gray-500' },
  assigned:          { label: 'Assigned',    style: 'bg-blue-50 text-blue-600' },
  in_progress:       { label: 'In Progress', style: 'bg-purple-50 text-purple-600' },
  revisions:         { label: 'Revisions',   style: 'bg-orange-50 text-orange-600' },
  internal_review:   { label: 'In Review',   style: 'bg-yellow-50 text-yellow-700' },
  client_review:     { label: 'Client Rev',  style: 'bg-indigo-50 text-indigo-600' },
  compliance_review: { label: 'Compliance',  style: 'bg-amber-50 text-amber-700' },
  approved:          { label: 'Approved',    style: 'bg-green-50 text-green-700' },
  closed:            { label: 'Closed',      style: 'bg-gray-200 text-gray-600' },
  completed:         { label: 'Completed',   style: 'bg-green-50 text-green-600' },
  blocked:           { label: 'Blocked',     style: 'bg-red-50 text-red-600' },
  discarded:         { label: 'Discarded',   style: 'bg-red-50 text-red-600' },
};

export function formatDeadline(deadline: string | null): { text: string; overdue: boolean } {
  if (!deadline) return { text: '—', overdue: false };
  const d = new Date(deadline + 'T00:00:00');
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const diff = Math.round((d.getTime() - today.getTime()) / 86_400_000);
  if (diff < 0)  return { text: `${Math.abs(diff)}d overdue`, overdue: true };
  if (diff === 0) return { text: 'Today',    overdue: true };
  if (diff === 1) return { text: 'Tomorrow', overdue: false };
  return {
    text: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    overdue: false,
  };
}

// ── TaskRow ───────────────────────────────────────────────────────────────────

export interface TaskRowProps {
  task: Task;
  firm: import('../../lib/api').Firm | null;
  usersMap: Map<string, User>;
  projects?: Project[];
  indented?: boolean;
  onEdit?: (task: Task) => void;
  onDelete?: (task: Task) => void;
  onOpenDetail?: (task: Task) => void;
  onAssigneeChange?: (taskId: string, assigneeId: string | null) => void;
  onProjectChange?: (taskId: string, projectId: string | null) => void;
}

export function TaskRow({ task, usersMap, projects = [], indented = false, onEdit, onDelete, onOpenDetail, onAssigneeChange, onProjectChange }: TaskRowProps) {
  const [contextOpen,       setContextOpen]       = useState(false);
  const [pickerOpen,        setPickerOpen]        = useState(false);
  const [projectPickerOpen, setProjectPickerOpen] = useState(false);

  const pickerRef        = useRef<HTMLDivElement>(null);
  const projectPickerRef = useRef<HTMLDivElement>(null);
  useClickOutside(pickerRef,        () => setPickerOpen(false));
  useClickOutside(projectPickerRef, () => setProjectPickerOpen(false));

  const currentAssignees = task.assignees && task.assignees.length > 0
    ? task.assignees
    : (task.assignee_id && usersMap.get(task.assignee_id)
        ? [{ id: task.assignee_id, name: usersMap.get(task.assignee_id)!.name, avatar_url: usersMap.get(task.assignee_id)!.avatar_url ?? null }]
        : []);

  const currentAssigneeIds = currentAssignees.map((a) => a.id);
  const { text: dateText, overdue } = formatDeadline(task.deadline ?? null);
  const priorityStyle = PRIORITY_BADGE[task.priority] ?? 'bg-gray-100 text-gray-500';
  const statusInfo    = TASK_STATUS_BADGE[task.status] ?? { label: task.status, style: 'bg-gray-100 text-gray-500' };

  return (
    <div
      className={`group flex items-center gap-2 border-b border-[#E9EAEB] hover:bg-[#F9FAFB] transition-colors py-2 pr-2 ${indented ? 'pl-10' : 'pl-4'}`}
      role="row"
    >
      {/* Expand chevron */}
      <ChevronRight width={13} height={13} className="shrink-0 text-[#C8CDD6]" aria-hidden="true" />

      {/* Status dot */}
      <span className="shrink-0"><StatusDot status={task.status} /></span>

      {/* Task icon */}
      <Dataflow03 width={14} height={14} className="shrink-0 text-[#A4A7AE]" aria-hidden="true" />

      {/* Title — flex-1 */}
      <button
        type="button"
        onClick={() => onOpenDetail?.(task)}
        className="flex-1 min-w-0 text-[13px] text-[#181D27] truncate text-left hover:text-[#7F56D9] transition-colors"
      >
        {task.title}
      </button>

      {/* Assignee column */}
      <div
        ref={pickerRef}
        className={`${COL_ASSIGNEE} relative flex justify-center`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => setPickerOpen((v) => !v)}
          className={`transition-opacity ${currentAssignees.length === 0 ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'}`}
          aria-label="Assign"
        >
          <AvatarStack
            avatars={currentAssignees.map((a: { id: string; name: string; avatar_url?: string | null }) => ({ name: a.name, src: a.avatar_url ?? undefined }))}
            max={3}
            showAddButton={true}
            addAs="div"
          />
        </button>
        {pickerOpen && (
          <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1 z-50 bg-white border border-[#E9EAEB] rounded-lg shadow-lg py-1 min-w-[200px] max-h-52 overflow-y-auto">
            {Array.from(usersMap.values()).map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() => { onAssigneeChange?.(task.id, u.id); setPickerOpen(false); }}
                className="flex items-center gap-2.5 w-full px-3 py-2 text-left hover:bg-[#F9FAFB] transition-colors"
              >
                <Avatar name={u.name} src={u.avatar_url ?? undefined} size="xs" />
                <span className="flex-1 text-[13px] text-[#181D27] truncate">{u.name}</span>
                {currentAssigneeIds.includes(u.id) && (
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
                    <path d="M2 6.5L5 9.5L11 3" stroke="#7F56D9" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Due date column */}
      <div className={`${COL_DATE} text-[12px] ${overdue ? 'text-red-500 font-medium' : 'text-[#717680]'}`}>
        {dateText}
      </div>

      {/* Priority column */}
      <div className={COL_PRIORITY}>
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold capitalize ${priorityStyle}`}>
          {task.priority}
        </span>
      </div>

      {/* Status column */}
      <div className={COL_STATUS}>
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold truncate max-w-full ${statusInfo.style}`}>
          {statusInfo.label}
        </span>
      </div>

      {/* Context menu */}
      <div className={`${COL_MENU} flex items-center justify-center`} onClick={(e) => e.stopPropagation()}>
        <div className="relative opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => { e.stopPropagation(); setContextOpen((v) => !v); }}
            className="w-6 h-6 rounded flex items-center justify-center text-[#717680] hover:bg-[#E9EAEB] transition-colors"
            aria-label="Task actions"
          >
            <DotsVertical width={14} height={14} aria-hidden="true" />
          </button>
          <DropdownMenu
            open={contextOpen}
            onClose={() => setContextOpen(false)}
            align="right"
            items={[
              {
                label: 'Edit',
                icon: <Edit01 width={14} height={14} className="text-[#717680]" aria-hidden="true" />,
                onClick: () => { setContextOpen(false); onEdit?.(task); },
              },
              ...(onProjectChange ? [{
                label: 'Move to project',
                icon: <FolderClosed width={14} height={14} className="text-[#717680]" aria-hidden="true" />,
                onClick: () => { setContextOpen(false); setProjectPickerOpen(true); },
              }] : []),
              {
                label: 'Delete',
                icon: <Trash01 width={14} height={14} aria-hidden="true" />,
                onClick: () => { setContextOpen(false); onDelete?.(task); },
                variant: 'danger' as const,
              },
            ]}
          />
        </div>
      </div>

      {/* Move-to-project picker (opened from context menu) */}
      {projectPickerOpen && onProjectChange && (
        <div
          ref={projectPickerRef}
          className="absolute right-8 top-full mt-1 z-50 bg-white border border-[#E9EAEB] rounded-lg shadow-lg py-1 min-w-[190px] max-h-52 overflow-y-auto"
        >
          {projects.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => { onProjectChange(task.id, p.id); setProjectPickerOpen(false); }}
              className="flex items-center gap-2 w-full px-3 py-2 text-left hover:bg-[#F9FAFB] transition-colors"
            >
              <FolderClosed width={13} height={13} className="text-[#7F56D9] shrink-0" aria-hidden="true" />
              <span className="flex-1 text-[13px] text-[#181D27] truncate">{p.name}</span>
              {task.project_id === p.id && (
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
                  <path d="M2 6.5L5 9.5L11 3" stroke="#7F56D9" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
