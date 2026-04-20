import { useState } from 'react';
import { ChevronRight, Archive } from '@untitled-ui/icons-react';
import Avatar from '../ui/Avatar';
import type { Task, User } from '../../lib/api';
import { TypeBadge, PriorityBadge, TaskStatusBadge } from './TaskBadges';
import { formatDate } from '../../lib/transcriptUtils';

export interface TaskCardProps {
  task: Task;
  users: User[];
  onClick: () => void;
}

export default function TaskCard({ task, users, onClick }: TaskCardProps) {
  const [sourceOpen, setSourceOpen] = useState(false);
  const assignee = users.find((u) => u.id === task.assignee_id);
  const isDiscarded = task.status === 'discarded';
  const isArchived = task.archived;

  return (
    <div
      className={`mb-3 rounded-xl border overflow-hidden cursor-pointer transition-shadow hover:shadow-md ${
        isArchived
          ? 'border-[#D5D7DA] bg-[#F9FAFB] opacity-75'
          : isDiscarded
          ? 'border-red-300 bg-[#FFF8F8]'
          : 'border-[#E9EAEB] bg-white'
      }`}
      onClick={onClick}
    >
      {/* Card body */}
      <div className="px-5 pt-4 pb-4">
        {isArchived && (
          <div className="flex items-center gap-1.5 mb-2.5 text-xs font-medium text-[#717680]">
            <Archive width={12} height={12} />
            <span>Archived</span>
          </div>
        )}
        <div className="flex items-center gap-2 flex-wrap mb-2">
          <span className={`text-sm font-semibold ${isArchived ? 'text-[#717680]' : 'text-[#181D27]'}`}>{task.title}</span>
          <TypeBadge type={task.type} />
          <PriorityBadge priority={task.priority} />
          <TaskStatusBadge status={task.status} />
        </div>
        {task.description && (
          <p className="text-sm text-[#535862] line-clamp-2 mb-4">{task.description}</p>
        )}
        <div className="flex items-start gap-10 text-xs">
          <div className="min-w-0">
            <p className="text-[#A4A7AE] mb-1.5">Assignee</p>
            {assignee ? (
              <div className="flex items-center gap-1.5">
                <Avatar name={assignee.name} size="xs" src={assignee.avatar_url ?? undefined} />
                <span className="text-[#181D27] font-medium">{assignee.name}</span>
              </div>
            ) : (
              <span className="text-[#A4A7AE]">Unassigned</span>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-[#A4A7AE] mb-1.5">Due date</p>
            <span className="text-[#181D27]">{task.deadline ? formatDate(task.deadline) : '—'}</span>
          </div>
          <div className="min-w-0">
            <p className="text-[#A4A7AE] mb-1.5">Project list</p>
            <span className="text-[#181D27]">{task.firms?.name ?? task.type ?? '—'}</span>
          </div>
        </div>
      </div>

      {/* Source Quote footer */}
      <div className="border-t border-[#E9EAEB] bg-[#F2F4F7]" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setSourceOpen((v) => !v); }}
          className="flex items-center gap-2 w-full px-5 py-3 text-sm text-[#535862] hover:text-[#181D27] transition-colors"
        >
          <ChevronRight width={15} height={15} className={`text-[#717680] transition-transform shrink-0 ${sourceOpen ? 'rotate-90' : ''}`} />
          <span className="font-medium">Source Quote</span>
        </button>
        {sourceOpen && (
          <div className="px-5 pb-4">
            <blockquote className="border-l-4 border-[#D9D6FE] pl-3 text-xs text-[#535862] italic leading-relaxed">
              "{task.description?.slice(0, 300) ?? 'No source excerpt available.'}"
            </blockquote>
          </div>
        )}
      </div>
    </div>
  );
}
