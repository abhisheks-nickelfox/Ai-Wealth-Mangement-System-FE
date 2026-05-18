import { useState } from 'react';
import { Plus, ChevronDown, ChevronRight } from '@untitled-ui/icons-react';
import { SummaryProjectRow } from './SummaryProjectRow';
import { COL_CLIENT } from './SummaryProjectRow';
import { COL_ASSIGNEE, COL_DATE, COL_PRIORITY, COL_STATUS, COL_MENU } from '../tasks/TaskRow';
import type { Project } from '../../lib/api';

export interface ProjectStatusSectionProps {
  label: string;
  groupId: string;
  projects: { project: Project; taskCount: number }[];
  showFirmBadge?: boolean;
  allUsers: { id: string; name: string; avatar_url?: string | null }[];
  onProjectClick: (p: Project) => void;
  onDeleteProject: (p: Project) => void;
  onNavigate: (p: Project) => void;
  onAddProject?: (groupId: string) => void;
  onMembersChange: (projectId: string, memberIds: string[]) => void;
}

export function SummaryProjectStatusSection({
  label, groupId, projects, showFirmBadge, allUsers,
  onProjectClick, onDeleteProject, onNavigate, onAddProject, onMembersChange,
}: ProjectStatusSectionProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <section aria-label={label}>
      <div className="flex items-center gap-2 pl-4 pr-2 py-2.5 bg-white border-b border-[#E9EAEB]">
        <button
          onClick={() => setCollapsed((v) => !v)}
          className="flex items-center gap-2 flex-1 text-left"
          aria-expanded={!collapsed}
        >
          {collapsed
            ? <ChevronRight width={14} height={14} className="shrink-0 text-[#717680]" aria-hidden="true" />
            : <ChevronDown  width={14} height={14} className="shrink-0 text-[#717680]" aria-hidden="true" />}
          <span className="text-[13px] font-semibold text-[#181D27]">{label}</span>
          {projects.length > 0 && (
            <span className="text-[12px] text-[#717680]">{projects.length}</span>
          )}
        </button>
        {onAddProject && (
          <button
            onClick={() => onAddProject(groupId)}
            className="w-6 h-6 rounded flex items-center justify-center text-[#717680] hover:bg-[#E9EAEB] transition-colors"
            aria-label={`Add project to ${label}`}
          >
            <Plus width={14} height={14} aria-hidden="true" />
          </button>
        )}
      </div>

      {!collapsed && projects.length > 0 && (
        <div className="flex items-center gap-2 pl-6 pr-2 py-1.5 border-b border-[#E9EAEB] bg-[#F9FAFB]">
          <span className="flex-1 text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">Project</span>
          <div className={`${COL_CLIENT} text-[11px] font-bold text-[#6B7280] uppercase tracking-wider`}>Client</div>
          <div className={`${COL_ASSIGNEE} text-[11px] font-bold text-[#6B7280] uppercase tracking-wider text-center`}>Assignee</div>
          <div className={`${COL_DATE}     text-[11px] font-bold text-[#6B7280] uppercase tracking-wider`}>Due date</div>
          <div className={`${COL_PRIORITY} text-[11px] font-bold text-[#6B7280] uppercase tracking-wider`}>Priority</div>
          <div className={`${COL_STATUS}   text-[11px] font-bold text-[#6B7280] uppercase tracking-wider`}>Status</div>
          <div className={`${COL_MENU}`} />
        </div>
      )}

      {!collapsed && (
        projects.length === 0 ? (
          <div className="border-b border-[#E9EAEB]">
            {onAddProject ? (
              <button
                className="group flex items-center gap-2 px-6 py-2.5 w-full text-left hover:bg-[#F4F3FF] transition-colors"
                onClick={() => onAddProject(groupId)}
              >
                <span className="w-[18px] h-[18px] rounded-full border border-dashed border-gray-300 flex items-center justify-center shrink-0 text-gray-400 group-hover:border-[#7F56D9] group-hover:text-[#7F56D9] transition-colors">
                  <Plus width={9} height={9} aria-hidden="true" />
                </span>
                <span className="text-[13px] font-semibold text-[#A4A7AE] group-hover:text-[#6941C6] transition-colors">Add Project</span>
              </button>
            ) : null}
          </div>
        ) : (
          projects.map(({ project, taskCount }) => (
            <SummaryProjectRow
              key={`${project.id}-${groupId}`}
              project={project}
              taskCount={taskCount}
              showFirmBadge={showFirmBadge}
              sectionGroupId={groupId}
              allUsers={allUsers}
              onProjectClick={onProjectClick}
              onDeleteProject={onDeleteProject}
              onNavigate={onNavigate}
              onMembersChange={onMembersChange}
            />
          ))
        )
      )}
    </section>
  );
}
