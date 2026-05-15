import { useState, useRef } from 'react';
import AvatarStack from '../ui/AvatarStack';
import AssigneePickerDropdown from '../ui/AssigneePickerDropdown';
import TaskIcon from '../icons/TaskIcon';
import { StatusDot, formatDeadline } from './TaskRow';
import { TaskStatusBadge, PriorityBadge } from './TaskBadges';
import { useAssignableUsers } from '../../hooks/useAssignableUsers';
import { useDoubleClick } from '../../hooks/useDoubleClick';
import type { Task, User } from '../../lib/api';

interface SubTaskRowProps {
  task:               Task;
  users:              User[];
  onClick:            () => void;
  onNavigate?:        () => void;
  onUpdateAssignees?: (taskId: string, ids: string[]) => void;
}

export default function SubTaskRow({ task, users, onClick, onNavigate, onUpdateAssignees }: SubTaskRowProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const anchorRef                   = useRef<HTMLDivElement>(null);

  const assignees       = task.assignees ?? [];
  const assignableUsers = useAssignableUsers(task.task_type_id, users);
  const { text: dateText, overdue } = formatDeadline(task.deadline ?? null);

  const handleTitleClick = useDoubleClick(onClick, () => onNavigate?.());

  return (
    <div
      className="flex items-center px-3 py-2.5 border-b border-[#E9EAEB] last:border-0 hover:bg-[#F9FAFB] cursor-pointer transition-colors group"
      onClick={onClick}
    >
      {/* Left: dot + icon + title */}
      <div className="flex items-center gap-3 flex-1 min-w-0 pr-4">
        <StatusDot status={task.status} />
        <TaskIcon width={13} height={13} className="text-[#A4A7AE] shrink-0" />
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); handleTitleClick(); }}
          className="flex-1 min-w-0 text-[13px] text-[#181D27] truncate text-left group-hover:text-[#6941C6] transition-colors"
        >
          {task.title}
        </button>
      </div>

      {/* Status — fixed 100 px */}
      <div className="w-[100px] flex justify-center shrink-0">
        <TaskStatusBadge status={task.status} />
      </div>

      {/* Assignee — fixed 120 px */}
      <div
        ref={anchorRef}
        className="w-[120px] flex justify-center items-center shrink-0 px-3"
        onClick={(e) => e.stopPropagation()}
      >
        <AvatarStack
          avatars={assignees.map((a) => ({ name: a.name, src: a.avatar_url ?? undefined }))}
          max={4}
          showAddButton={true}
          onAdd={() => setPickerOpen((v) => !v)}
        />
        <AssigneePickerDropdown
          open={pickerOpen}
          onClose={() => setPickerOpen(false)}
          anchorRef={anchorRef as React.RefObject<HTMLElement | null>}
          users={assignableUsers}
          selected={assignees.map((a) => a.id)}
          onToggle={(uid) => {
            const current = assignees.map((a) => a.id);
            const next = current.includes(uid)
              ? current.filter((id) => id !== uid)
              : [...current, uid];
            onUpdateAssignees?.(task.id, next);
          }}
        />
      </div>

      {/* Due Date — fixed 80 px */}
      <span className={`w-[80px] text-[11px] text-center shrink-0 ${overdue ? 'text-red-500 font-medium' : 'text-[#717680]'}`}>
        {dateText}
      </span>

      {/* Priority — fixed 64 px */}
      <div className="w-[64px] flex justify-center shrink-0">
        <PriorityBadge priority={task.priority} />
      </div>
    </div>
  );
}
