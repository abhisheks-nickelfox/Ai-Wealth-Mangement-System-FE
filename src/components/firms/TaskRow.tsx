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

// ── Status dot SVG ────────────────────────────────────────────────────────────

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

// ── Task row ──────────────────────────────────────────────────────────────────

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

  const currentProject = projects.find((p) => p.id === task.project_id) ?? null;

  const currentAssignees = task.assignees && task.assignees.length > 0
    ? task.assignees
    : (task.assignee_id && usersMap.get(task.assignee_id)
        ? [{ id: task.assignee_id, name: usersMap.get(task.assignee_id)!.name, avatar_url: usersMap.get(task.assignee_id)!.avatar_url ?? null }]
        : []);

  const currentAssigneeIds = currentAssignees.map((a) => a.id);

  return (
    <div
      className={`relative group flex items-center gap-2 border-b border-[#E9EAEB] hover:bg-[#F9FAFB] transition-colors py-2 pr-10 ${indented ? 'pl-10' : 'pl-4'}`}
      role="row"
    >
      {/* Expand chevron */}
      <ChevronRight width={13} height={13} className="shrink-0 text-[#C8CDD6]" aria-hidden="true" />

      {/* Status dot */}
      <span className="shrink-0"><StatusDot status={task.status} /></span>

      {/* Task icon */}
      <Dataflow03 width={14} height={14} className="shrink-0 text-[#A4A7AE]" aria-hidden="true" />

      {/* Left: title — fills left half */}
      <button
        type="button"
        onClick={() => onOpenDetail?.(task)}
        className="flex-1 min-w-0 text-[13px] text-[#181D27] truncate text-left hover:text-[#7F56D9] transition-colors"
      >
        {task.title}
      </button>

      {/* Center: assignee picker — single <button> wrapper; "+" rendered as div (addAs="div") to avoid nested buttons */}
      <div ref={pickerRef} className="relative shrink-0" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={() => setPickerOpen((v) => !v)}
          aria-label="Assign"
          className={`transition-opacity ${currentAssignees.length === 0 ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'}`}
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

      {/* Right: project picker — flex-1 so it balances the title on the left */}
      {onProjectChange && (
        <div className="flex-1 flex justify-end min-w-0">
        <div ref={projectPickerRef} className="relative shrink-0" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => setProjectPickerOpen((v) => !v)}
            className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium transition-colors max-w-[110px] truncate ${
              currentProject
                ? 'bg-[#F4F3FF] text-[#6941C6]'
                : 'opacity-40 group-hover:opacity-100 bg-[#F9FAFB] text-[#717680] hover:text-[#7F56D9] hover:bg-[#F4F3FF]'
            }`}
            title={currentProject ? currentProject.name : 'Assign project'}
          >
            <FolderClosed width={10} height={10} className="shrink-0" aria-hidden="true" />
            <span className="truncate">{currentProject ? currentProject.name : 'Assign project'}</span>
          </button>
          {projectPickerOpen && (
            <div className="absolute right-0 top-full mt-1 z-50 bg-white border border-[#E9EAEB] rounded-lg shadow-lg py-1 min-w-[180px] max-h-52 overflow-y-auto">
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
        </div>
      )}

      {/* Context menu */}
      <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <div className="relative">
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
    </div>
  );
}
