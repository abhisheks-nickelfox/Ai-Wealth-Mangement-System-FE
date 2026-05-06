import { useState, useRef, useMemo } from 'react';
import {
  ChevronRight,
  ChevronDown,
  FolderClosed,
  Plus,
  DotsVertical,
  Edit01,
  Trash01,
} from '@untitled-ui/icons-react';
import DropdownMenu from '../ui/DropdownMenu';
import AvatarStack from '../ui/AvatarStack';
import Avatar from '../ui/Avatar';
import { useClickOutside } from '../../hooks/useClickOutside';
import { useUpdateProject } from '../../hooks/useFirms';
import { TaskRow } from './TaskRow';
import { StatusDot } from './TaskRow';
import type { Task, User, Project, Firm } from '../../lib/api';

// ── Status group definition (shared with ProjectsTab) ────────────────────────

export interface StatusGroup {
  id: string;
  label: string;
  statuses: string[];
}

// ── ProjectGroupRow ───────────────────────────────────────────────────────────

export interface ProjectGroupRowProps {
  projectId: string | null;
  project?: Project;
  tasks: Task[];
  firm: Firm | null;
  usersMap: Map<string, User>;
  projects?: Project[];
  groupStatus: string;
  onProjectClick?: (projectId: string | null, label: string) => void;
  onEditTask?: (task: Task) => void;
  onDeleteTask?: (task: Task) => void;
  onAddTask?: (projectId: string | null, status: string) => void;
  onOpenTaskDetail?: (task: Task) => void;
  onAssigneeChange?: (taskId: string, assigneeId: string | null) => void;
  onProjectChange?: (taskId: string, projectId: string | null) => void;
  onDeleteProject?: (projectId: string) => void;
}

export function ProjectGroupRow({ projectId, project, tasks, firm, usersMap, projects = [], groupStatus, onProjectClick, onEditTask, onDeleteTask, onAddTask, onOpenTaskDetail, onAssigneeChange, onProjectChange, onDeleteProject }: ProjectGroupRowProps) {
  const [expanded,    setExpanded]    = useState(true);
  const [contextOpen, setContextOpen] = useState(false);
  const [pickerOpen,  setPickerOpen]  = useState(false);
  const pickerRef    = useRef<HTMLDivElement>(null);
  const updateProject = useUpdateProject();
  useClickOutside(pickerRef, () => setPickerOpen(false));

  const label = project?.name ?? projectId ?? 'No Project';
  const currentMemberIds = useMemo(() => project?.members.map((m) => m.id) ?? [], [project]);

  async function toggleMember(userId: string) {
    if (!projectId) return;
    const next = currentMemberIds.includes(userId)
      ? currentMemberIds.filter((id) => id !== userId)
      : [...currentMemberIds, userId];
    await updateProject.mutateAsync({ id: projectId, payload: { member_ids: next } }).catch(() => {});
  }

  const memberAvatars = (project?.members ?? []).map((m) => ({ name: m.name, src: m.avatar_url ?? undefined }));

  return (
    <>
      {/* Project header */}
      <div
        className="relative group/proj flex items-center gap-2 px-4 py-2.5 border-b border-[#E9EAEB] bg-[#F9FAFB] hover:bg-[#F2F4F7] transition-colors cursor-pointer pr-10"
        onClick={() => setExpanded((v) => !v)}
      >
        {/* Expand chevron */}
        <span className="shrink-0 text-[#717680]">
          {expanded
            ? <ChevronDown width={14} height={14} aria-hidden="true" />
            : <ChevronRight width={14} height={14} aria-hidden="true" />}
        </span>

        {/* Status dot */}
        <span className="shrink-0"><StatusDot status={tasks[0]?.status ?? 'to_do'} /></span>

        {/* Left: folder + name — grows to fill left half */}
        <div className="flex-1 min-w-0 flex items-center gap-2">
          <FolderClosed width={15} height={15} className="text-[#7F56D9] shrink-0" aria-hidden="true" />
          <button
            type="button"
            className="text-[13px] font-semibold text-[#181D27] truncate hover:text-[#7F56D9] hover:underline"
            onClick={(e) => { e.stopPropagation(); onProjectClick?.(projectId, label); }}
          >
            {label}
          </button>
        </div>

        {/* Center: member avatars + picker */}
        <div ref={pickerRef} className="relative shrink-0" onClick={(e) => e.stopPropagation()}>
          <AvatarStack
            avatars={memberAvatars}
            max={3}
            showAddButton={true}
            onAdd={() => setPickerOpen((v) => !v)}
          />
          {pickerOpen && (
            <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1 z-50 bg-white border border-[#E9EAEB] rounded-lg shadow-lg py-1 min-w-[200px] max-h-60 overflow-y-auto">
              {Array.from(usersMap.values()).map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => toggleMember(u.id)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-[#F9FAFB] transition-colors"
                >
                  <Avatar name={u.name} src={u.avatar_url ?? undefined} size="xs" />
                  <span className="flex-1 text-[13px] text-[#181D27] truncate">{u.name}</span>
                  {currentMemberIds.includes(u.id) && (
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                      <path d="M2 7L5.5 10.5L12 3.5" stroke="#7F56D9" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: firm name — grows to fill right half */}
        <div className="flex-1 flex justify-end min-w-0">
          {firm && (
            <span className="text-[13px] text-[#A4A7AE] font-normal truncate max-w-[140px]">
              {firm.name}
            </span>
          )}
        </div>

        {/* Context menu */}
        <div
          className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover/proj:opacity-100 transition-opacity z-10"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="relative">
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
                  onClick: () => { setContextOpen(false); onProjectClick?.(projectId, label); },
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
              onAssigneeChange={onAssigneeChange}
              onProjectChange={onProjectChange}
            />
          ))}
          <button
            className="flex items-center gap-2 pl-10 pr-4 py-2 w-full text-left text-[13px] border-b border-[#E9EAEB] hover:bg-[#F0EDFF] transition-colors"
            onClick={() => onAddTask?.(projectId, groupStatus)}
          >
            <Plus width={13} height={13} className="text-[#7F56D9] shrink-0" aria-hidden="true" />
            <span className="text-[#7F56D9] font-medium">Add Task</span>
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
  onProjectClick?: (projectId: string | null, label: string) => void;
  onEditTask?: (task: Task) => void;
  onDeleteTask?: (task: Task) => void;
  onAddProject?: (workflowStatus: string) => void;
  onAddTask?: (projectId: string | null, status: string) => void;
  onOpenTaskDetail?: (task: Task) => void;
  onAssigneeChange?: (taskId: string, assigneeId: string | null) => void;
  onProjectChange?: (taskId: string, projectId: string | null) => void;
  onDeleteProject?: (projectId: string) => void;
}

export function StatusSection({ group, tasks, emptyProjects = [], projectsMap, firm, usersMap, viewMode, onProjectClick, onEditTask, onDeleteTask, onAddProject, onAddTask, onOpenTaskDetail, onAssigneeChange, onProjectChange, onDeleteProject }: StatusSectionProps) {
  const [collapsed, setCollapsed] = useState(false);

  const byProject = useMemo<Map<string | null, Task[]>>(() => {
    const map = new Map<string | null, Task[]>();
    for (const task of tasks) {
      const key = task.project_id ?? null;
      if (map.has(key)) map.get(key)!.push(task);
      else map.set(key, [task]);
    }
    return map;
  }, [tasks]);

  const hasContent = tasks.length > 0 || (viewMode === 'project' && emptyProjects.length > 0);
  const totalCount = tasks.length + (viewMode === 'project' ? emptyProjects.length : 0);

  return (
    <section aria-label={group.label}>
      {/* Section header */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-white border-b border-[#E9EAEB]">
        <button
          onClick={() => setCollapsed((v) => !v)}
          className="flex items-center gap-2 flex-1 text-left"
          aria-expanded={!collapsed}
        >
          {collapsed
            ? <ChevronRight width={14} height={14} className="shrink-0 text-[#717680]" aria-hidden="true" />
            : <ChevronDown width={14} height={14} className="shrink-0 text-[#717680]" aria-hidden="true" />}
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

      {/* Sub-label "Tasks" */}
      {!collapsed && hasContent && (
        <div className="px-4 py-1 border-b border-[#E9EAEB] bg-white">
          <span className="text-[11px] font-semibold text-[#A4A7AE] uppercase tracking-wide">{viewMode === 'project' ? 'Projects' : 'Tasks'}</span>
        </div>
      )}

      {/* Section body */}
      {!collapsed && (
        <div>
          {!hasContent ? (
            <p className="text-[13px] text-[#A4A7AE] px-4 py-3 border-b border-[#E9EAEB]">No tasks</p>
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
                  groupStatus={group.statuses[0]}
                  onProjectClick={onProjectClick}
                  onEditTask={onEditTask}
                  onDeleteTask={onDeleteTask}
                  onAddTask={onAddTask}
                  onOpenTaskDetail={onOpenTaskDetail}
                  onAssigneeChange={onAssigneeChange}
                  onProjectChange={onProjectChange}
                  onDeleteProject={onDeleteProject}
                />
              ))}
              {Array.from(byProject.entries()).map(([pid, projectTasks]) => (
                <ProjectGroupRow
                  key={pid ?? '__none__'}
                  projectId={pid}
                  project={pid ? projectsMap?.get(pid) : undefined}
                  tasks={projectTasks}
                  firm={firm}
                  usersMap={usersMap}
                  projects={projectsMap ? Array.from(projectsMap.values()) : []}
                  groupStatus={group.statuses[0]}
                  onProjectClick={onProjectClick}
                  onEditTask={onEditTask}
                  onDeleteTask={onDeleteTask}
                  onAddTask={onAddTask}
                  onOpenTaskDetail={onOpenTaskDetail}
                  onAssigneeChange={onAssigneeChange}
                  onProjectChange={onProjectChange}
                  onDeleteProject={onDeleteProject}
                />
              ))}
            </>
          ) : (
            tasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                firm={firm}
                usersMap={usersMap}
                projects={projectsMap ? Array.from(projectsMap.values()) : []}
                onEdit={onEditTask}
                onDelete={onDeleteTask}
                onOpenDetail={onOpenTaskDetail}
                onAssigneeChange={onAssigneeChange}
                onProjectChange={onProjectChange}
              />
            ))
          )}

          {/* Add Task at section level */}
          <button
            className="flex items-center gap-2 px-4 py-2 w-full text-left text-[13px] text-[#717680] hover:bg-[#F9FAFB] transition-colors border-b border-[#E9EAEB]"
            onClick={() => onAddTask?.(null, group.statuses[0])}
          >
            <Plus width={13} height={13} className="text-[#A4A7AE] shrink-0" aria-hidden="true" />
            Add Task
          </button>
        </div>
      )}
    </section>
  );
}
