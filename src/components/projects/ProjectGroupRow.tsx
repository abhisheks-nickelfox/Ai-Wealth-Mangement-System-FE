import { useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDoubleClick } from '../../hooks/useDoubleClick';
import {
  ChevronRight,
  ChevronDown,
  Plus,
  DotsVertical,
  Edit01,
  Trash01,
} from '@untitled-ui/icons-react';
import DropdownMenu from '../ui/DropdownMenu';
import AvatarStack from '../ui/AvatarStack';
import AssigneePickerDropdown from '../ui/AssigneePickerDropdown';
import { useUpdateProject } from '../../hooks/useFirms';
import ProjectIcon from '../icons/ProjectIcon';
import { TaskRow, StatusDot, COL_ASSIGNEE, COL_DATE, COL_PRIORITY, COL_STATUS, COL_MENU, PRIORITY_BADGE, PRIORITY_LABEL, formatDeadline } from '../tasks/TaskRow';
import type { Task, User, Project, Firm } from '../../lib/api';

// ── Status group definition (shared with ProjectsTab) ────────────────────────

export interface StatusGroup {
  id: string;
  label: string;
  statuses: string[];
}

// ── Workflow status badge ─────────────────────────────────────────────────────

const WORKFLOW_BADGE: Record<string, { label: string; style: string }> = {
  todo:        { label: 'To Do',       style: 'bg-gray-100 text-gray-500' },
  in_progress: { label: 'In Progress', style: 'bg-purple-50 text-purple-600' },
  in_review:   { label: 'In Review',   style: 'bg-yellow-50 text-yellow-700' },
  approved:    { label: 'Approved',    style: 'bg-green-50 text-green-700' },
  completed:   { label: 'Completed',   style: 'bg-gray-100 text-gray-600' },
};

// ── ProjectGroupRow ───────────────────────────────────────────────────────────

export interface ProjectGroupRowProps {
  projectId: string | null;
  project?: Project;
  tasks: Task[];
  firm: Firm | null;
  usersMap: Map<string, User>;
  projects?: Project[];
  groupStatus: string;
  onProjectClick?: (projectId: string | null, label: string, groupStatus: string) => void;
  onEditTask?: (task: Task) => void;
  onDeleteTask?: (task: Task) => void;
  onAddTask?: (projectId: string | null, status: string) => void;
  onOpenTaskDetail?: (task: Task) => void;
  onAssigneeChange?: (taskId: string, assigneeId: string | null) => void;
  onProjectChange?: (taskId: string, projectId: string | null) => void;
  onDeleteProject?: (projectId: string) => void;
  onAddSubTask?: (parentTask: Task) => void;
}

export function ProjectGroupRow({
  projectId, project, tasks, firm, usersMap, projects = [],
  groupStatus, onProjectClick, onEditTask, onDeleteTask, onAddTask,
  onOpenTaskDetail, onAssigneeChange, onProjectChange, onDeleteProject, onAddSubTask,
}: ProjectGroupRowProps) {
  const [expanded,    setExpanded]    = useState(true);
  const [contextOpen, setContextOpen] = useState(false);
  const [pickerOpen,  setPickerOpen]  = useState(false);
  const anchorRef  = useRef<HTMLDivElement>(null);
  const updateProject = useUpdateProject();
  const navigate = useNavigate();

  const handleProjectNameClick = useDoubleClick(
    () => onProjectClick?.(projectId, label, groupStatus),
    () => { if (projectId && firm?.id) navigate(`/firms/${firm.id}/projects/${projectId}`); },
  );

  const label = project?.name ?? projectId ?? 'Project';
  const currentMemberIds = useMemo(() => project?.members.map((m) => m.id) ?? [], [project]);

  async function toggleMember(userId: string) {
    if (!projectId) return;
    const next = currentMemberIds.includes(userId)
      ? currentMemberIds.filter((id) => id !== userId)
      : [...currentMemberIds, userId];
    await updateProject.mutateAsync({ id: projectId, payload: { member_ids: next } }).catch(() => {});
  }

  console.log('[ProjectGroupRow]', project?.name, { end_date: project?.end_date, start_date: project?.start_date, priority: project?.priority });

  const memberAvatars = (project?.members ?? []).map((m) => ({ name: m.name, src: m.avatar_url ?? undefined }));
  const workflowBadge = project ? (WORKFLOW_BADGE[project.workflow_status] ?? { label: project.workflow_status, style: 'bg-gray-100 text-gray-500' }) : null;
  const priorityStyle = project ? (PRIORITY_BADGE[project.priority] ?? 'bg-gray-100 text-gray-500') : null;

  return (
    <>
      {/* Project header row */}
      <div
        className="group/proj flex items-center gap-2 pl-4 pr-2 py-2.5 border-b border-[#E9EAEB] bg-[#F9FAFB] hover:bg-[#F2F4F7] transition-colors cursor-pointer"
        onClick={() => setExpanded((v) => !v)}
      >
        {/* Expand chevron */}
        <span className="shrink-0 text-[#717680]">
          {expanded
            ? <ChevronDown  width={14} height={14} aria-hidden="true" />
            : <ChevronRight width={14} height={14} aria-hidden="true" />}
        </span>

        {/* Status dot */}
        <span className="shrink-0"><StatusDot status={tasks[0]?.status ?? 'to_do'} /></span>

        {/* Folder + project name — flex-1 */}
        <div className="flex-1 min-w-0 flex items-center gap-2">
          <ProjectIcon width={15} height={15} className="text-[#7F56D9] shrink-0" />
          <button
            type="button"
            className="text-[13px] font-semibold text-[#181D27] truncate hover:text-[#7F56D9] hover:underline"
            onClick={(e) => { e.stopPropagation(); handleProjectNameClick(); }}
          >
            {label}
          </button>
        </div>

        {/* Assignee column: member avatars + picker */}
        <div
          ref={anchorRef}
          className={`${COL_ASSIGNEE} relative flex justify-center`}
          onClick={(e) => e.stopPropagation()}
        >
          <AvatarStack
            avatars={memberAvatars}
            max={4}
            showAddButton={true}
            onAdd={() => setPickerOpen((v) => !v)}
          />
          <AssigneePickerDropdown
            open={pickerOpen}
            onClose={() => setPickerOpen(false)}
            anchorRef={anchorRef as React.RefObject<HTMLElement | null>}
            users={Array.from(usersMap.values())}
            selected={currentMemberIds}
            onToggle={(uid) => { toggleMember(uid); }}
          />
        </div>

        {/* Due date column — project end_date */}
        {(() => {
          const { text, overdue } = formatDeadline(project?.end_date ?? null);
          return (
            <div className={`${COL_DATE} text-[12px] shrink-0 ${overdue ? 'text-red-500 font-medium' : project?.end_date ? 'text-[#344054]' : 'text-[#C8CAD0]'}`}>
              {text}
            </div>
          );
        })()}

        {/* Priority column */}
        <div className={COL_PRIORITY}>
          {priorityStyle && project && (
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${priorityStyle}`}>
              {PRIORITY_LABEL[project.priority] ?? project.priority}
            </span>
          )}
        </div>

        {/* Status column */}
        <div className={COL_STATUS}>
          {workflowBadge && (
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold truncate max-w-full ${workflowBadge.style}`}>
              {workflowBadge.label}
            </span>
          )}
        </div>

        {/* Context menu */}
        <div
          className={`${COL_MENU} flex items-center justify-center`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="relative opacity-0 group-hover/proj:opacity-100 transition-opacity">
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
                  onClick: () => { setContextOpen(false); onProjectClick?.(projectId, label, groupStatus); },
                },
                {
                  label: 'Delete',
                  icon: <Trash01 width={14} height={14} aria-hidden="true" />,
                  onClick: () => { setContextOpen(false); projectId && onDeleteProject?.(projectId); },
                  variant: 'danger' as const,
                },
              ]}
            />
          </div>
        </div>
      </div>

      {/* Tasks inside project */}
      {expanded && (
        <>
          {tasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              firm={firm}
              usersMap={usersMap}
              projects={projects}
              indented
              onEdit={onEditTask}
              onDelete={onDeleteTask}
              onOpenDetail={onOpenTaskDetail}
              onNavigate={firm?.id ? (t) => navigate(`/firms/${firm.id}/tasks/${t.id}`) : undefined}
              onAssigneeChange={onAssigneeChange}
              onProjectChange={onProjectChange}
              onAddSubTask={onAddSubTask}
            />
          ))}
          <button
            className="group flex items-center gap-2 pl-10 pr-2 py-2.5 w-full text-left border-b border-[#E9EAEB] hover:bg-[#F4F3FF] transition-colors"
            onClick={() => onAddTask?.(projectId, groupStatus)}
          >
            <span className="w-[18px] h-[18px] rounded-full border border-dashed border-gray-300 flex items-center justify-center shrink-0 text-gray-400 group-hover:border-[#7F56D9] group-hover:text-[#7F56D9] transition-colors">
              <Plus width={9} height={9} aria-hidden="true" />
            </span>
            <span className="text-[13px] font-semibold text-[#A4A7AE] group-hover:text-[#6941C6] transition-colors">Add Task</span>
          </button>
        </>
      )}
    </>
  );
}

// ── StatusSection ─────────────────────────────────────────────────────────────

export interface StatusSectionProps {
  group: StatusGroup;
  tasks: Task[];
  emptyProjects?: Project[];
  projectsMap?: Map<string, Project>;
  firm: Firm | null;
  usersMap: Map<string, User>;
  viewMode: 'project' | 'task';
  onProjectClick?: (projectId: string | null, label: string, groupStatus: string) => void;
  onEditTask?: (task: Task) => void;
  onDeleteTask?: (task: Task) => void;
  onAddProject?: (workflowStatus: string) => void;
  onAddTask?: (projectId: string | null, status: string) => void;
  onOpenTaskDetail?: (task: Task) => void;
  onAssigneeChange?: (taskId: string, assigneeId: string | null) => void;
  onProjectChange?: (taskId: string, projectId: string | null) => void;
  onDeleteProject?: (projectId: string) => void;
  onAddSubTask?: (parentTask: Task) => void;
}

const LOAD_MORE_PAGE_SIZE = 30;

export function StatusSection({
  group, tasks, emptyProjects = [], projectsMap, firm, usersMap, viewMode,
  onProjectClick, onEditTask, onDeleteTask, onAddProject, onAddTask,
  onOpenTaskDetail, onAssigneeChange, onProjectChange, onDeleteProject, onAddSubTask,
}: StatusSectionProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [visibleCount, setVisibleCount] = useState(LOAD_MORE_PAGE_SIZE);
  const navigate = useNavigate();

  const byProject = useMemo<Map<string | null, Task[]>>(() => {
    const map = new Map<string | null, Task[]>();
    for (const task of tasks) {
      const key = task.project_id ?? null;
      if (map.has(key)) map.get(key)!.push(task);
      else map.set(key, [task]);
    }
    return map;
  }, [tasks]);

  // In project view, hide tasks with no project_id (all tasks now require a project)
  const visibleByProject = useMemo(() => {
    if (viewMode !== 'project') return byProject;
    const m = new Map(byProject);
    m.delete(null);
    return m;
  }, [byProject, viewMode]);

  const hasContent = viewMode === 'project'
    ? visibleByProject.size > 0 || emptyProjects.length > 0
    : tasks.length > 0;

  const totalCount = viewMode === 'project'
    ? Array.from(visibleByProject.values()).reduce((s, t) => s + t.length, 0) + emptyProjects.length
    : tasks.length;

  return (
    <section aria-label={group.label}>
      {/* Section header */}
      <div className="flex items-center gap-2 pl-4 pr-2 py-2.5 bg-white border-b border-[#E9EAEB]">
        <button
          onClick={() => setCollapsed((v) => !v)}
          className="flex items-center gap-2 flex-1 text-left"
          aria-expanded={!collapsed}
        >
          {collapsed
            ? <ChevronRight width={14} height={14} className="shrink-0 text-[#717680]" aria-hidden="true" />
            : <ChevronDown  width={14} height={14} className="shrink-0 text-[#717680]" aria-hidden="true" />}
          <span className="text-[13px] font-semibold text-[#181D27]">{group.label}</span>
          {totalCount > 0 && (
            <span className="text-[12px] text-[#717680]">{totalCount}</span>
          )}
        </button>
        {onAddProject && viewMode === 'project' && (
          <button
            onClick={() => onAddProject(group.id)}
            className="w-6 h-6 rounded flex items-center justify-center text-[#717680] hover:bg-[#E9EAEB] transition-colors"
            aria-label="Add project"
          >
            <Plus width={14} height={14} aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Column header row */}
      {!collapsed && hasContent && (
        <div className="flex items-center gap-2 pl-4 pr-2 py-1.5 border-b border-[#E9EAEB] bg-white">
          <span className="flex-1 min-w-0 text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">
            {viewMode === 'project' ? 'Projects' : 'Tasks'}
          </span>
          <div className={`${COL_ASSIGNEE} text-[11px] font-bold text-[#6B7280] uppercase tracking-wider text-center shrink-0`}>Assignee</div>
          <div className={`${COL_DATE}     text-[11px] font-bold text-[#6B7280] uppercase tracking-wider shrink-0`}>Due date</div>
          <div className={`${COL_PRIORITY} text-[11px] font-bold text-[#6B7280] uppercase tracking-wider shrink-0`}>Priority</div>
          <div className={`${COL_STATUS}   text-[11px] font-bold text-[#6B7280] uppercase tracking-wider shrink-0`}>Status</div>
          <div className={`${COL_MENU} shrink-0`} />
        </div>
      )}

      {/* Section body */}
      {!collapsed && (
        <div>
          {!hasContent ? (
            <div className="border-b border-[#E9EAEB]">
              <button
                className="group flex items-center gap-2 px-4 py-2.5 w-full text-left hover:bg-[#F4F3FF] transition-colors"
                onClick={() => onAddTask?.(null, group.statuses[0])}
              >
                <span className="w-[18px] h-[18px] rounded-full border border-dashed border-gray-300 flex items-center justify-center shrink-0 text-gray-400 group-hover:border-[#7F56D9] group-hover:text-[#7F56D9] transition-colors">
                  <Plus width={9} height={9} aria-hidden="true" />
                </span>
                <span className="text-[13px] font-semibold text-[#A4A7AE] group-hover:text-[#6941C6] transition-colors">Add Task</span>
              </button>
            </div>
          ) : viewMode === 'project' ? (
            <>
              {emptyProjects.map((p) => (
                <ProjectGroupRow
                  key={p.id}
                  projectId={p.id}
                  project={p}
                  tasks={[]}
                  firm={firm}
                  usersMap={usersMap}
                  projects={projectsMap ? Array.from(projectsMap.values()) : []}
                  groupStatus={group.id}
                  onProjectClick={onProjectClick}
                  onEditTask={onEditTask}
                  onDeleteTask={onDeleteTask}
                  onAddTask={onAddTask}
                  onOpenTaskDetail={onOpenTaskDetail}
                  onAssigneeChange={onAssigneeChange}
                  onProjectChange={onProjectChange}
                  onDeleteProject={onDeleteProject}
                  onAddSubTask={onAddSubTask}
                />
              ))}
              {Array.from(visibleByProject.entries()).map(([pid, projectTasks]) => (
                <ProjectGroupRow
                  key={pid ?? '__none__'}
                  projectId={pid}
                  project={pid ? projectsMap?.get(pid) : undefined}
                  tasks={projectTasks}
                  firm={firm}
                  usersMap={usersMap}
                  projects={projectsMap ? Array.from(projectsMap.values()) : []}
                  groupStatus={group.id}
                  onProjectClick={onProjectClick}
                  onEditTask={onEditTask}
                  onDeleteTask={onDeleteTask}
                  onAddTask={onAddTask}
                  onOpenTaskDetail={onOpenTaskDetail}
                  onAssigneeChange={onAssigneeChange}
                  onProjectChange={onProjectChange}
                  onDeleteProject={onDeleteProject}
                  onAddSubTask={onAddSubTask}
                />
              ))}
            </>
          ) : (
            <>
              {tasks.slice(0, visibleCount).map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  firm={firm}
                  usersMap={usersMap}
                  projects={projectsMap ? Array.from(projectsMap.values()) : []}
                  onEdit={onEditTask}
                  onDelete={onDeleteTask}
                  onOpenDetail={onOpenTaskDetail}
                  onNavigate={firm?.id ? (t) => navigate(`/firms/${firm.id}/tasks/${t.id}`) : undefined}
                  onAssigneeChange={onAssigneeChange}
                  onProjectChange={onProjectChange}
                  onAddSubTask={onAddSubTask}
                />
              ))}
              {visibleCount < tasks.length && (
                <button
                  type="button"
                  className="text-xs text-gray-400 hover:text-gray-600 py-2 w-full text-center border-b border-[#E9EAEB] transition-colors"
                  onClick={() => setVisibleCount((prev) => prev + LOAD_MORE_PAGE_SIZE)}
                >
                  Show {tasks.length - visibleCount} more
                </button>
              )}
              <button
                className="group flex items-center gap-2 pl-4 pr-2 py-2.5 w-full text-left border-b border-[#E9EAEB] hover:bg-[#F4F3FF] transition-colors"
                onClick={() => onAddTask?.(null, group.statuses[0])}
              >
                <span className="w-[18px] h-[18px] rounded-full border border-dashed border-gray-300 flex items-center justify-center shrink-0 text-gray-400 group-hover:border-[#7F56D9] group-hover:text-[#7F56D9] transition-colors">
                  <Plus width={9} height={9} aria-hidden="true" />
                </span>
                <span className="text-[13px] font-semibold text-[#A4A7AE] group-hover:text-[#6941C6] transition-colors">Add Task</span>
              </button>
            </>
          )}
        </div>
      )}
    </section>
  );
}
