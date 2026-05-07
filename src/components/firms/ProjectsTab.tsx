import { useState, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Plus, FilterLines } from '@untitled-ui/icons-react';
import Toast from '../ui/Toast';
import ConfirmDeleteModal from '../ui/ConfirmDeleteModal';
import SearchInput from '../ui/SearchInput';
import { useCreateProject, useUpdateProject, useDeleteProject, useProjects } from '../../hooks/useFirms';
import { useDeleteTask, useCreateTask, useUpdateTask } from '../../hooks/useTasks';
import { useToast } from '../../hooks/useToast';
import { StatusSection } from './ProjectGroupRow';
import { FilterPanel } from './TaskFilterPanel';
import AddProjectModal from './AddProjectModal';
import AddTaskModal, { type TaskFormData } from './AddTaskModal';
import TaskDetailPanel from './TaskDetailPanel';
import ProjectDetailPanel, { type ProjectDetail } from './ProjectDetailPanel';
import DeleteProjectModal from './DeleteProjectModal';
import { queryKeys } from '../../lib/queryKeys';
import type { Firm, Task, TaskAssignee, User, Project } from '../../lib/api';

// ── Status group definitions ──────────────────────────────────────────────────

export interface StatusGroup {
  id: string;
  label: string;
  statuses: string[];
}

export const STATUS_GROUPS: StatusGroup[] = [
  { id: 'todo',         label: 'To Do',           statuses: ['to_do'] },
  { id: 'assigned',     label: 'Assigned',         statuses: ['assigned'] },
  { id: 'inprogress',   label: 'In Progress',      statuses: ['in_progress'] },
  { id: 'revisions',    label: 'Revisions',        statuses: ['revisions'] },
  { id: 'inreview',     label: 'Internal Review',  statuses: ['internal_review'] },
  { id: 'clientreview', label: 'Client Review',    statuses: ['client_review'] },
  { id: 'completed',    label: 'Completed',        statuses: ['completed'] },
  { id: 'blocked',      label: 'Blocked',          statuses: ['blocked'] },
];

// ProjectDetail display status → DB workflow_status
export const DISPLAY_TO_WORKFLOW: Record<string, string> = {
  'To Do':       'todo',
  'In progress': 'in_progress',
  'In Review':   'in_review',
  'Approved':    'approved',
  'Completed':   'completed',
};

// Map section group IDs → project workflow_status values
export const GROUP_TO_WORKFLOW: Record<string, string> = {
  todo:        'todo',
  assigned:    'todo',
  inprogress:  'in_progress',
  revisions:   'in_progress',
  inreview:    'in_review',
  clientreview:'in_review',
  completed:   'completed',
  blocked:     'todo',
};

// Which group should an empty project appear in based on its workflow_status
export const WORKFLOW_TO_GROUP: Record<string, string> = {
  todo:        'todo',
  in_progress: 'inprogress',
  in_review:   'inreview',
  approved:    'completed',
  completed:   'completed',
};

export type DateRangeOption = 'daily' | 'weekly' | 'monthly';

export interface ProjectsTabProps {
  firm: Firm | null;
  tasks: Task[];
  users: User[];
}

export function ProjectsTab({ firm, tasks, users }: ProjectsTabProps) {
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'project' | 'task'>('project');
  const [showAddProject, setShowAddProject] = useState(false);
  const [addProjectWorkflowStatus, setAddProjectWorkflowStatus] = useState('todo');
  const [showAddTask, setShowAddTask] = useState(false);
  const [addTaskDefaultProjectId, setAddTaskDefaultProjectId] = useState('');
  const [addTaskDefaultStatus, setAddTaskDefaultStatus] = useState<string | undefined>(undefined);
  const [selectedProject, setSelectedProject] = useState<ProjectDetail | null>(null);
  const qc = useQueryClient();
  const createProject = useCreateProject();
  const updateProject = useUpdateProject();
  const createTask = useCreateTask();
  const { toast: tabToast, notify: notifyTab, dismiss: dismissTab } = useToast();

  // Fetch real projects for this firm
  const { data: projects = [] } = useProjects(firm?.id);

  // ── Delete task state ──────────────────────────────────────────────────────
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const deleteTask = useDeleteTask();

  // ── Task detail panel ──────────────────────────────────────────────────────
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const updateTask = useUpdateTask();

  // ── Project delete ─────────────────────────────────────────────────────────
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const deleteProject = useDeleteProject();

  const handleDeleteTaskConfirm = async () => {
    if (!taskToDelete) return;
    await deleteTask.mutateAsync(taskToDelete.id);
    setTaskToDelete(null);
  };

  const PRIORITY_MAP: Record<string, 'low' | 'normal' | 'high' | 'urgent'> = {
    Low: 'low', Medium: 'normal', High: 'high', Urgent: 'urgent',
  };

  const handleCreateTask = async (data: TaskFormData) => {
    if (!firm?.id) return;
    try {
      await createTask.mutateAsync({
        firm_id:        firm.id,
        title:          data.title,
        description:    data.description || undefined,
        type:           data.type as 'task' | 'design' | 'development' | 'account_management',
        priority:       PRIORITY_MAP[data.priority] ?? 'normal',
        project_id:     data.projectId          || undefined,
        assignee_ids:   data.assigneeIds.length > 0 ? data.assigneeIds : undefined,
        deadline:       data.endDate            || undefined,
        initial_status: data.initialStatus      || undefined,
      });
      setShowAddTask(false);
      notifyTab('Task created successfully');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to create task';
      notifyTab(msg);
      throw err;
    }
  };

  /** Opens AddTaskModal with optional project + status context. */
  const openAddTask = (projectId: string | null, status?: string) => {
    setAddTaskDefaultProjectId(projectId ?? '');
    setAddTaskDefaultStatus(status);
    setShowAddTask(true);
  };

  /** Saves edits from TaskDetailPanel. */
  const handleSaveTask = async (taskId: string, data: import('./TaskDetailPanel').TaskDetailData) => {
    try {
      await updateTask.mutateAsync({ id: taskId, payload: {
        title:        data.title,
        description:  data.description,
        priority:     data.priority,
        assignee_ids: data.assignee_ids,
        deadline:     data.deadline || undefined,
        project_id:   data.project_id,
      }});
    } catch (err) {
      notifyTab(err instanceof Error ? err.message : 'Failed to save task');
      throw err;
    }
  };

  /**
   * Toggles a single assignee on a task row inline picker.
   * Reads current assignees from the task object (assignees[] or assignee_id fallback),
   * adds if not present, removes if already present.
   */
  const handleProjectChange = async (taskId: string, projectId: string | null) => {
    try {
      await updateTask.mutateAsync({ id: taskId, payload: { project_id: projectId } });
    } catch (err) {
      notifyTab(err instanceof Error ? err.message : 'Failed to update project');
    }
  };

  const handleAssigneeChange = async (taskId: string, userId: string | null) => {
    if (!userId) return;
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const current: string[] = task.assignees && task.assignees.length > 0
      ? task.assignees.map((a) => a.id)
      : (task.assignee_id ? [task.assignee_id] : []);

    const isAdding = !current.includes(userId);
    const next = isAdding
      ? [...current, userId]
      : current.filter((id) => id !== userId);

    // Optimistic update so the avatar appears immediately without waiting for refetch
    if (firm?.id) {
      const userInfo = usersMap.get(userId);
      const newAssignees: TaskAssignee[] = isAdding
        ? [...(task.assignees ?? []), { id: userId, name: userInfo?.name ?? '', email: userInfo?.email ?? '', avatar_url: userInfo?.avatar_url ?? null }]
        : (task.assignees ?? []).filter((a) => a.id !== userId);

      qc.setQueryData(queryKeys.tasks.byFirm(firm.id), (old: Task[] | undefined) =>
        old ? old.map((t) => t.id === taskId ? { ...t, assignees: newAssignees, assignee_id: next[0] ?? null } : t) : old
      );
    }

    try {
      await updateTask.mutateAsync({ id: taskId, payload: { assignee_ids: next } });
    } catch (err) {
      // Rollback optimistic update on error
      if (firm?.id) qc.invalidateQueries({ queryKey: queryKeys.tasks.byFirm(firm.id) });
      notifyTab(err instanceof Error ? err.message : 'Failed to update assignee');
    }
  };

  const handleCreateProject = async (data: import('./AddProjectModal').ProjectFormData) => {
    if (!firm?.id) return;
    await createProject.mutateAsync({
      firm_id:         firm.id,
      name:            data.name,
      description:     data.description || undefined,
      member_ids:      data.assigneeIds,
      workflow_status: data.workflowStatus as import('../../lib/api').Project['workflow_status'],
    });
  };

  // ── Filter state (committed = active filters; pending = inside panel) ──────
  const [filterOpen, setFilterOpen] = useState(false);

  // Committed (applied) filter values
  const [filterDateRange, setFilterDateRange] = useState<DateRangeOption | null>(null);
  const [filterStatuses, setFilterStatuses] = useState<string[]>([]);
  const [filterAssigneeIds, setFilterAssigneeIds] = useState<string[]>([]);

  // Pending (inside panel — not yet committed)
  const [pendingDateRange, setPendingDateRange] = useState<DateRangeOption | null>(null);
  const [pendingStatuses, setPendingStatuses] = useState<string[]>([]);
  const [pendingAssigneeIds, setPendingAssigneeIds] = useState<string[]>([]);

  // Sync pending ← committed when panel opens
  const openFilter = () => {
    setPendingDateRange(filterDateRange);
    setPendingStatuses([...filterStatuses]);
    setPendingAssigneeIds([...filterAssigneeIds]);
    setFilterOpen(true);
  };

  const handleApply = () => {
    setFilterDateRange(pendingDateRange);
    setFilterStatuses([...pendingStatuses]);
    setFilterAssigneeIds([...pendingAssigneeIds]);
    setFilterOpen(false);
  };

  const handleCancel = () => {
    // Clear all active filters and close
    setFilterDateRange(null);
    setFilterStatuses([]);
    setFilterAssigneeIds([]);
    setPendingDateRange(null);
    setPendingStatuses([]);
    setPendingAssigneeIds([]);
    setFilterOpen(false);
  };

  const togglePendingStatus = (value: string) => {
    setPendingStatuses((prev) =>
      prev.includes(value) ? prev.filter((s) => s !== value) : [...prev, value],
    );
  };

  const togglePendingAssignee = (value: string) => {
    setPendingAssigneeIds((prev) =>
      prev.includes(value) ? prev.filter((a) => a !== value) : [...prev, value],
    );
  };

  // Active filter badge count (for the Filter button badge)
  const activeFilterCount =
    (filterDateRange ? 1 : 0) +
    (filterStatuses.length > 0 ? 1 : 0) +
    (filterAssigneeIds.length > 0 ? 1 : 0);

  const usersMap = new Map<string, User>(users.map((u) => [u.id, u]));

  // Filter tasks: search query first, then active filters
  const filteredTasks = useMemo(() => {
    let result = tasks;

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          (t.description ?? '').toLowerCase().includes(q),
      );
    }

    // Status filter
    if (filterStatuses.length > 0) {
      result = result.filter((t) => filterStatuses.includes(t.status));
    }

    // Assignee filter
    if (filterAssigneeIds.length > 0) {
      const includeUnassigned = filterAssigneeIds.includes('unassigned');
      const assigneeSet = new Set(filterAssigneeIds.filter((a) => a !== 'unassigned'));
      result = result.filter((t) => {
        if (!t.assignee_id) return includeUnassigned;
        return assigneeSet.has(t.assignee_id);
      });
    }

    // Date range filter (based on deadline)
    if (filterDateRange) {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      result = result.filter((t) => {
        if (!t.deadline) return false;
        const dl = new Date(t.deadline);
        const dlDay = new Date(dl.getFullYear(), dl.getMonth(), dl.getDate());
        const diffMs = dlDay.getTime() - today.getTime();
        const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
        if (filterDateRange === 'daily') return diffDays === 0;
        if (filterDateRange === 'weekly') return diffDays >= 0 && diffDays <= 7;
        if (filterDateRange === 'monthly') return diffDays >= 0 && diffDays <= 30;
        return true;
      });
    }

    return result;
  }, [tasks, search, filterStatuses, filterAssigneeIds, filterDateRange]);

  // Group by status (task view)
  const tasksByGroup = useMemo(() => {
    const result = new Map<string, Task[]>();
    for (const g of STATUS_GROUPS) result.set(g.id, []);

    for (const task of filteredTasks) {
      for (const g of STATUS_GROUPS) {
        if (g.statuses.includes(task.status)) {
          result.get(g.id)?.push(task);
          break;
        }
      }
    }
    return result;
  }, [filteredTasks]);


  // Group by project (project view) — includes all real projects even with 0 tasks
  const projectRows = useMemo(() => {
    // Seed with every real project (preserves creation order)
    const map = new Map<string | null, { project: Project | null; tasks: Task[] }>();
    for (const p of projects) map.set(p.id, { project: p, tasks: [] });

    // Distribute filtered tasks into their project bucket (or null bucket)
    for (const task of filteredTasks) {
      const key = task.project_id && map.has(task.project_id) ? task.project_id : null;
      if (!map.has(key)) map.set(key, { project: null, tasks: [] });
      map.get(key)!.tasks.push(task);
    }

    return Array.from(map.entries());
  }, [projects, filteredTasks]);

  const projectsMap = useMemo(
    () => new Map(projectRows.filter(([id, { project }]) => id && project).map(([id, { project }]) => [id as string, project as Project])),
    [projectRows],
  );

  return (
    <div className="relative flex flex-col flex-1 min-h-0">
      {tabToast && <Toast message={tabToast.message} type={tabToast.type} onClose={dismissTab} />}
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-6 py-3 border-b border-[#E9EAEB] bg-white shrink-0 flex-wrap">
        {/* Search */}
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search"
          className="w-56 py-1.5 border-[#E9EAEB]"
        />

        {/* Project View / Task View toggle — selected option gets its own border box */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setViewMode('project')}
            className={`px-3 py-1.5 text-[13px] font-semibold rounded-lg transition-colors ${
              viewMode === 'project'
                ? 'border border-[#D0D5DD] bg-white text-[#181D27] shadow-sm'
                : 'text-[#717680] hover:text-[#414651]'
            }`}
          >
            Project View
          </button>
          <button
            type="button"
            onClick={() => setViewMode('task')}
            className={`px-3 py-1.5 text-[13px] font-semibold rounded-lg transition-colors ${
              viewMode === 'task'
                ? 'border border-[#D0D5DD] bg-white text-[#181D27] shadow-sm'
                : 'text-[#717680] hover:text-[#414651]'
            }`}
          >
            Task View
          </button>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          {/* Add Project */}
          <button
            onClick={() => setShowAddProject(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#D0D5DD] bg-white text-[13px] font-semibold text-[#344054] hover:bg-[#F9FAFB] transition-colors"
            aria-label="Add project"
          >
            <Plus width={14} height={14} aria-hidden="true" />
            Add Project
          </button>

          {/* Add Task */}
          <button
            onClick={() => openAddTask(null)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#D0D5DD] bg-white text-[13px] font-semibold text-[#344054] hover:bg-[#F9FAFB] transition-colors"
            aria-label="Add task"
          >
            <Plus width={14} height={14} aria-hidden="true" />
            Add Task
          </button>

          {/* Filter — opens the filter panel */}
          <button
            onClick={openFilter}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[13px] font-semibold transition-colors ${
              activeFilterCount > 0
                ? 'border-[#7F56D9] bg-[#F4F3FF] text-[#7F56D9]'
                : 'border-[#D0D5DD] bg-white text-[#344054] hover:bg-[#F9FAFB]'
            }`}
            aria-label="Filter tasks"
            aria-expanded={filterOpen}
          >
            <FilterLines width={14} height={14} aria-hidden="true" />
            Filter
            {activeFilterCount > 0 && (
              <span className="flex items-center justify-center w-4 h-4 rounded-full bg-[#7F56D9] text-white text-[10px] font-bold leading-none">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Scrollable sections body */}
      <div className="flex-1 overflow-y-auto">

        {STATUS_GROUPS.map((group) => {
          const groupTasks = tasksByGroup.get(group.id) ?? [];
          // Empty projects (no tasks) land in the section matching their workflow_status
          const emptyProjects = viewMode === 'project'
            ? projectRows
                .filter(([, { tasks: t, project: p }]) =>
                  t.length === 0 &&
                  p !== null &&
                  (WORKFLOW_TO_GROUP[p.workflow_status] ?? 'todo') === group.id,
                )
                .map(([, { project }]) => project as Project)
            : [];
          return (
            <StatusSection
              key={group.id}
              group={group}
              tasks={groupTasks}
              emptyProjects={emptyProjects}
              projectsMap={projectsMap}
              firm={firm}
              usersMap={usersMap}
              viewMode={viewMode}
              onAddTask={openAddTask}
              onOpenTaskDetail={(task) => setSelectedTask(task)}
              onAssigneeChange={handleAssigneeChange}
              onProjectChange={handleProjectChange}
              onProjectClick={(projectId, label) => {
                const matchedProject = projectRows.find(([id]) => id === projectId)?.[1].project ?? null;
                const firmAbbr = firm?.name
                  ? firm.name.split(' ').map((w) => w[0]).join('').toUpperCase()
                  : 'AWP';
                const wfToDisplay: Record<string, import('./ProjectDetailPanel').ProjectDetail['status']> = {
                  todo:        'To Do',
                  in_progress: 'In progress',
                  in_review:   'In Review',
                  approved:    'Approved',
                  completed:   'Completed',
                };
                setSelectedProject({
                  id:          projectId ?? label,
                  name:        label,
                  description: matchedProject?.description ?? '',
                  status:      wfToDisplay[matchedProject?.workflow_status ?? 'todo'] ?? 'In progress',
                  memberIds:   matchedProject?.members.map((m) => m.id) ?? [],
                  firmName:    firm?.name ?? '',
                  firmAbbr,
                  startDate:   matchedProject?.start_date ?? undefined,
                  endDate:     matchedProject?.end_date ?? undefined,
                  priority:    matchedProject?.priority ?? undefined,
                  type:        matchedProject?.type ?? undefined,
                });
              }}
              onEditTask={() => {}}
              onDeleteTask={(task) => setTaskToDelete(task)}
              onDeleteProject={(pid) => {
                const proj = projectRows.find(([id]) => id === pid)?.[1].project ?? null;
                setProjectToDelete(proj);
              }}
              onAddProject={(groupId) => {
                setAddProjectWorkflowStatus(GROUP_TO_WORKFLOW[groupId] ?? 'todo');
                setShowAddProject(true);
              }}
            />
          );
        })}
      </div>

      {/* Filter panel overlay */}
      <FilterPanel
        open={filterOpen}
        onClose={handleCancel}
        users={users}
        pendingDateRange={pendingDateRange}
        pendingStatuses={pendingStatuses}
        pendingAssigneeIds={pendingAssigneeIds}
        onChangeDateRange={setPendingDateRange}
        onToggleStatus={togglePendingStatus}
        onToggleAssignee={togglePendingAssignee}
        onApply={handleApply}
        onCancel={handleCancel}
      />

      {/* Add Project modal */}
      <AddProjectModal
        open={showAddProject}
        onClose={() => setShowAddProject(false)}
        firmName={firm?.name}
        users={users}
        defaultWorkflowStatus={addProjectWorkflowStatus}
        onCreate={handleCreateProject}
      />

      {/* Add Task modal */}
      <AddTaskModal
        open={showAddTask}
        onClose={() => setShowAddTask(false)}
        firmName={firm?.name}
        users={users}
        projects={projects}
        defaultProjectId={addTaskDefaultProjectId}
        defaultStatus={addTaskDefaultStatus}
        onCreate={handleCreateTask}
      />

      {/* Task Detail panel */}
      <TaskDetailPanel
        open={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        task={selectedTask}
        users={users}
        projects={projects}
        onSave={handleSaveTask}
      />

      {/* Project Detail panel */}
      <ProjectDetailPanel
        open={!!selectedProject}
        onClose={() => setSelectedProject(null)}
        project={selectedProject}
        users={users}
        onSave={async (updated) => {
          if (!updated.id) return;
          await updateProject.mutateAsync({
            id: updated.id,
            payload: {
              name:            updated.name,
              description:     updated.description || undefined,
              workflow_status: (DISPLAY_TO_WORKFLOW[updated.status] ?? 'todo') as import('../../lib/api').Project['workflow_status'],
              member_ids:      updated.memberIds,
              start_date:      updated.startDate || undefined,
              end_date:        updated.endDate || undefined,
              priority:        updated.priority,
              type:            updated.type || undefined,
            },
          });
          setSelectedProject(null);
        }}
      />

      {/* Delete task confirmation */}
      <ConfirmDeleteModal
        open={!!taskToDelete}
        isDeleting={deleteTask.isPending}
        title="Delete Task"
        description={
          <>
            Are you sure you want to delete{' '}
            <span className="font-bold text-[#0f172a]">{taskToDelete?.title ?? ''}</span>?{' '}
            This action cannot be undone.
          </>
        }
        onConfirm={handleDeleteTaskConfirm}
        onClose={() => setTaskToDelete(null)}
      />

      {/* Delete project modal — with task selection */}
      <DeleteProjectModal
        open={!!projectToDelete}
        projectId={projectToDelete?.id ?? ''}
        projectName={projectToDelete?.name ?? ''}
        isDeleting={deleteProject.isPending}
        onClose={() => setProjectToDelete(null)}
        onConfirm={async (taskIds) => {
          if (!projectToDelete) return;
          try {
            const result = await deleteProject.mutateAsync({ id: projectToDelete.id, taskIds });
            if (result.projectDeleted) {
              setProjectToDelete(null);
              notifyTab('Project deleted');
            } else if (result.deleted) {
              setProjectToDelete(null);
              notifyTab(`${taskIds.length} task${taskIds.length > 1 ? 's' : ''} deleted`);
            } else {
              notifyTab('Failed to delete project');
            }
          } catch {
            notifyTab('Failed to delete project');
          }
        }}
      />
    </div>
  );
}
