import { Plus } from '@untitled-ui/icons-react';
import TaskIcon from '../icons/TaskIcon';
import InlineAssigneePicker from '../ui/InlineAssigneePicker';
import { StatusDot } from './TaskRow';
import { formatDeadline } from '../../lib/timeUtils';
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
  onAddSubTask?:      (parentId: string, parentDeadline?: string) => void;
  isNested?:          boolean;
}

export default function SubTaskRow({
  task, users, onClick, onNavigate,
  onUpdateAssignees, onAddSubTask, isNested = false,
}: SubTaskRowProps) {
  const assignees       = task.assignees ?? [];
  const assignableUsers = useAssignableUsers(task.task_type_id, users);
  const { text: dateText, overdue } = formatDeadline(task.deadline ?? null);

  const handleTitleClick = useDoubleClick(onClick, () => onNavigate?.());

  return (
    <div
      className={`flex items-center px-4 py-2.5 border-b border-[#F2F4F7] last:border-0 hover:bg-[#F9FAFB] cursor-pointer transition-colors group ${isNested ? 'bg-[#FAFAFA]' : ''}`}
      onClick={() => handleTitleClick()}
    >
      {/* Left: indentation (nested only) + dot + icon + title */}
      <div className="flex items-center gap-3 flex-1 min-w-0 pr-4">
        {isNested && (
          <>
            <div className="w-4 shrink-0" />
            <div className="w-px h-4 bg-[#E4E7EC] shrink-0" />
          </>
        )}
        <StatusDot status={task.status} />
        <TaskIcon width={isNested ? 12 : 13} height={isNested ? 12 : 13} className="text-[#A4A7AE] shrink-0" />
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); handleTitleClick(); }}
          className={`flex-1 min-w-0 text-[13px] truncate text-left group-hover:text-[#6941C6] transition-colors ${isNested ? 'text-[#535862]' : 'text-[#181D27]'}`}
        >
          {task.title}
        </button>
        {!isNested && onAddSubTask && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onAddSubTask(task.id, task.deadline ?? undefined); }}
            className="opacity-0 group-hover:opacity-100 shrink-0 flex items-center gap-1 px-2 py-0.5 rounded text-[11px] text-[#A4A7AE] hover:text-[#6941C6] hover:bg-[#F4F3FF] transition-all"
          >
            <Plus width={10} height={10} />
            Sub-task
          </button>
        )}
      </div>

      {/* Status — fixed 100 px */}
      <div className="w-[100px] flex justify-center shrink-0">
        <TaskStatusBadge status={task.status} />
      </div>

      {/* Assignee — fixed 120 px */}
      <InlineAssigneePicker
        avatars={assignees.map((a) => ({ name: a.name, src: a.avatar_url ?? undefined }))}
        users={assignableUsers}
        selected={assignees.map((a) => a.id)}
        onToggle={(uid) => {
          const current = assignees.map((a) => a.id);
          const next = current.includes(uid)
            ? current.filter((id) => id !== uid)
            : [...current, uid];
          onUpdateAssignees?.(task.id, next);
        }}
        className="w-[120px] flex justify-center items-center shrink-0 px-3"
      />

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
