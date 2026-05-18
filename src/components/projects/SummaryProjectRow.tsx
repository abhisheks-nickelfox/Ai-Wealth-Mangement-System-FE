import { useState, useRef } from 'react';
import {
  DotsVertical, Edit01, Trash01,
} from '@untitled-ui/icons-react';
import AvatarStack from '../ui/AvatarStack';
import AssigneePickerDropdown from '../ui/AssigneePickerDropdown';
import DropdownMenu from '../ui/DropdownMenu';
import ProjectIcon from '../icons/ProjectIcon';
import {
  COL_ASSIGNEE, COL_DATE, COL_PRIORITY, COL_STATUS, COL_MENU,
} from '../tasks/TaskRow';
import { PRIORITY_BADGE, PRIORITY_LABEL } from '../../lib/constants';
import { formatDeadline } from '../../lib/timeUtils';
import type { Project } from '../../lib/api';
import { WORKFLOW_BADGE } from '../../lib/projectConstants';

export const COL_CLIENT = 'w-[160px] shrink-0';

// Badge for each section group (shown in the STATUS column)
export const GROUP_BADGE: Record<string, { label: string; style: string }> = {
  todo:         { label: 'To Do',           style: 'bg-gray-100 text-gray-500'       },
  assigned:     { label: 'Assigned',        style: 'bg-blue-50 text-blue-600'        },
  inprogress:   { label: 'In Progress',     style: 'bg-purple-50 text-purple-600'    },
  revisions:    { label: 'Revisions',       style: 'bg-orange-50 text-orange-600'    },
  inreview:     { label: 'Internal Review', style: 'bg-violet-50 text-violet-600'    },
  clientreview: { label: 'Client Review',   style: 'bg-indigo-50 text-indigo-600'    },
  completed:    { label: 'Completed',       style: 'bg-green-50 text-green-700'      },
  blocked:      { label: 'Blocked',         style: 'bg-red-50 text-red-600'          },
};

// Dot color keyed by SECTION group id (matches Firm→Project view colors)
export const GROUP_DOT_COLOR: Record<string, string> = {
  todo:         '#A4A7AE',
  assigned:     '#7F56D9',
  inprogress:   '#7F56D9',
  revisions:    '#F79009',
  inreview:     '#F79009',
  clientreview: '#444CE7',
  completed:    '#17B26A',
  blocked:      '#F04438',
};

export interface ProjectRowProps {
  project: Project;
  taskCount?: number;
  showFirmBadge?: boolean;
  sectionGroupId?: string;
  allUsers: { id: string; name: string; avatar_url?: string | null }[];
  onProjectClick: (p: Project) => void;
  onDeleteProject: (p: Project) => void;
  onNavigate: (p: Project) => void;
  onMembersChange: (projectId: string, memberIds: string[]) => void;
}

export function SummaryProjectRow({
  project, taskCount, sectionGroupId, allUsers,
  onProjectClick, onDeleteProject, onNavigate, onMembersChange,
}: ProjectRowProps) {
  const [contextOpen, setContextOpen] = useState(false);
  const [pickerOpen, setPickerOpen]   = useState(false);
  const anchorRef = useRef<HTMLDivElement>(null);
  const isArchived = project.status === 'archived';
  const currentMemberIds = (project.members ?? []).map((m) => m.id);
  const { text: dateText, overdue } = formatDeadline(project.end_date ?? null);
  const statusBadge = sectionGroupId
    ? (GROUP_BADGE[sectionGroupId] ?? GROUP_BADGE['todo'])
    : (WORKFLOW_BADGE[project.workflow_status] ?? { label: project.workflow_status, style: 'bg-gray-100 text-gray-500' });
  const priorityStyle = PRIORITY_BADGE[project.priority] ?? 'bg-gray-100 text-gray-500';
  const dotColor = sectionGroupId
    ? (GROUP_DOT_COLOR[sectionGroupId] ?? '#A4A7AE')
    : '#A4A7AE';
  const memberAvatars = (project.members ?? []).map((m) => ({ name: m.name ?? '', src: m.avatar_url ?? undefined }));

  return (
    <div className={`group/row flex items-center gap-2 pl-6 pr-2 py-2.5 border-b border-[#E9EAEB] hover:bg-[#F9FAFB] transition-colors ${isArchived ? 'opacity-60' : ''}`}>
      {/* Status dot */}
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0" aria-hidden="true">
        <circle cx="8" cy="8" r="6.5" stroke={dotColor} strokeWidth="1.5" />
        <circle cx="8" cy="8" r="3" fill={dotColor} />
      </svg>

      {/* Name + badges */}
      <div className="flex-1 min-w-0 flex items-center gap-2">
        <ProjectIcon width={15} height={15} className="text-[#7F56D9] shrink-0" />
        <button
          type="button"
          className="text-[13px] font-semibold text-[#181D27] truncate hover:text-[#7F56D9] hover:underline"
          onClick={() => onProjectClick(project)}
        >
          {project.name}
        </button>
        {isArchived && (
          <span className="text-[10px] font-semibold text-[#717680] bg-[#F2F4F7] border border-[#E9EAEB] px-1.5 py-0.5 rounded uppercase tracking-wide shrink-0">
            Archived
          </span>
        )}
        {taskCount !== undefined && taskCount > 0 && (
          <span className="text-[11px] text-[#A4A7AE] shrink-0">
            {taskCount} task{taskCount !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Client */}
      <div className={`${COL_CLIENT} flex items-center`}>
        {project.firm_name && (
          <span className="text-[12px] text-[#535862] truncate">{project.firm_name}</span>
        )}
      </div>

      {/* Assignees */}
      <div
        ref={anchorRef}
        className={`${COL_ASSIGNEE} relative flex justify-center`}
        onClick={(e) => e.stopPropagation()}
      >
        <AvatarStack
          avatars={memberAvatars}
          max={4}
          showAddButton
          onAdd={() => setPickerOpen((v) => !v)}
        />
        <AssigneePickerDropdown
          open={pickerOpen}
          onClose={() => setPickerOpen(false)}
          anchorRef={anchorRef as React.RefObject<HTMLElement | null>}
          users={allUsers}
          selected={currentMemberIds}
          onToggle={(uid) => {
            const next = currentMemberIds.includes(uid)
              ? currentMemberIds.filter((id) => id !== uid)
              : [...currentMemberIds, uid];
            onMembersChange(project.id, next);
          }}
        />
      </div>

      {/* Due date */}
      <div className={`${COL_DATE} text-[12px] shrink-0 ${overdue ? 'text-red-500 font-medium' : project.end_date ? 'text-[#344054]' : 'text-[#C8CAD0]'}`}>
        {dateText}
      </div>

      {/* Priority */}
      <div className={COL_PRIORITY}>
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${priorityStyle}`}>
          {PRIORITY_LABEL[project.priority] ?? project.priority}
        </span>
      </div>

      {/* Status */}
      <div className={COL_STATUS}>
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${statusBadge.style}`}>
          {statusBadge.label}
        </span>
      </div>

      {/* Context menu */}
      <div className={`${COL_MENU} flex items-center justify-center`}>
        <div className="relative opacity-0 group-hover/row:opacity-100 transition-opacity">
          <button
            onClick={() => setContextOpen((v) => !v)}
            className="w-6 h-6 rounded flex items-center justify-center text-[#717680] hover:bg-[#E9EAEB] transition-colors"
            aria-label="Project actions"
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
                onClick: () => { setContextOpen(false); onProjectClick(project); },
              },
              {
                label: 'Open Project',
                onClick: () => { setContextOpen(false); onNavigate(project); },
              },
              {
                label: 'Delete',
                icon: <Trash01 width={14} height={14} aria-hidden="true" />,
                onClick: () => { setContextOpen(false); onDeleteProject(project); },
                variant: 'danger' as const,
              },
            ]}
          />
        </div>
      </div>
    </div>
  );
}
