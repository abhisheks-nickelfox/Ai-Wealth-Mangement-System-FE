import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ChevronRight,
  ChevronDown,
  X,
  ArrowRight,
  Plus,
  Clock,
} from '@untitled-ui/icons-react';
import CountBadge from '../../components/ui/CountBadge';
import EmptyState from '../../components/ui/EmptyState';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import SectionLabel from '../../components/ui/SectionLabel';
import InlineAssigneePicker from '../../components/ui/InlineAssigneePicker';
import AttachmentsSection from '../../components/tasks/AttachmentsSection';
import SubTaskRow from '../../components/tasks/SubTaskRow';
import ActivityPanel from '../../components/activity';
import { useFirmDetail, useProjects, useUpdateProject } from '../../hooks/useFirms';
import { useTasksByFirm, useCreateTask, useUpdateTask } from '../../hooks/useTasks';
import { useActiveUsers } from '../../hooks/useUsers';
import AddTaskModal from '../../components/tasks/AddTaskModal';
import TaskDetailPanel from '../../components/tasks/TaskDetailPanel';
import ProjectDetailPanel from '../../components/projects/ProjectDetailPanel';
import type { ProjectDetail } from '../../components/projects/ProjectDetailPanel';
import type { TaskFormData } from '../../components/tasks/AddTaskModal';
import type { TaskDetailData } from '../../components/tasks/TaskDetailPanel';
import { PRIORITY_BADGE, PRIORITY_LABEL } from '../../lib/constants';
import { WORKFLOW_LABEL, WORKFLOW_TO_KEY } from '../../lib/projectConstants';
import { resolveInitialStatus } from '../../lib/taskUtils';
import { useDropdown } from '../../hooks/useDropdown';
import { projectsApi, messagesApi } from '../../lib/api';
import { queryKeys } from '../../lib/queryKeys';
import ProjectIcon from '../../components/icons/ProjectIcon';
import ProjectTimesheetPanel from '../../components/timesheet/ProjectTimesheetPanel';
import { useProjectTimeEntries, useStartProjectTimer, useStopProjectTimer } from '../../hooks/useTimeEntries';
import { useTimer } from '../../context/TimerContext';
import { formatSeconds, formatElapsed } from '../../lib/timeUtils';
import type { Task } from '../../lib/api';

// ── ProjectFullContent (shared between page and panel) ────────────────────────

export interface ProjectFullContentProps {
  firmId?:    string;
  projectId?: string;
  onClose?:   () => void;
}

export function ProjectFullContent({ firmId: firmIdProp, projectId: projectIdProp, onClose }: ProjectFullContentProps) {
  const params                = useParams<{ firmId: string; projectId: string }>();
  const firmId                = firmIdProp   ?? params.firmId;
  const projectId             = projectIdProp ?? params.projectId;
  const navigate              = useNavigate();
  const [searchParams]        = useSearchParams();
  const statusOverride        = searchParams.get('status') ?? '';
  const { open: actionsOpen, ref: actionsRef, toggle: toggleActions, close: closeActions } = useDropdown();
  const [showEditProject, setShowEditProject] = useState(false);
  const updateProject = useUpdateProject();
  const [showAddSubTask,       setShowAddSubTask]       = useState(false);
  const [subTaskParentId,        setSubTaskParentId]        = useState<string | undefined>();
  const [subTaskParentDeadline,  setSubTaskParentDeadline]  = useState<string | undefined>();
  const [subTaskParentStartDate, setSubTaskParentStartDate] = useState<string | undefined>();
  const [selectedTask,    setSelectedTask]    = useState<Task | null>(null);
  const [showActivity,    setShowActivity]    = useState(true);

  const qc = useQueryClient();
  const { data: firm    }               = useFirmDetail(firmId!);
  const { data: project, isLoading }    = useQuery({
    queryKey: queryKeys.projects.detail(projectId!),
    queryFn:  () => projectsApi.get(projectId!),
    enabled:  !!projectId,
  });
  const { data: allTasks = [] }               = useTasksByFirm(firmId!);
  const { data: users    = [] }               = useActiveUsers();
  const { data: projects = [] }               = useProjects(firmId);
  const { data: projectTimeData }             = useProjectTimeEntries(projectId);
  const createTask                            = useCreateTask();
  const updateTask                            = useUpdateTask();
  const [showTimesheet, setShowTimesheet]     = useState(false);
  const timesheetBtnRef                       = useRef<HTMLDivElement>(null);
  const { running, elapsed }                  = useTimer();
  const isTimerRunningHere                    = running?.projectId === projectId;
  const startProjectTimer                     = useStartProjectTimer(projectId!);
  const stopProjectTimer                      = useStopProjectTimer(projectId!);

  const projectTasks = allTasks.filter((t) => t.project_id === projectId && !t.parent_task_id);

  async function toggleProjectMember(userId: string) {
    if (!project) return;
    const current = project.members.map((m) => m.id);
    const isRemoving = current.includes(userId);
    const next = isRemoving ? current.filter((id) => id !== userId) : [...current, userId];
    await updateProject.mutateAsync({ id: project.id, payload: { member_ids: next } }).catch(() => {});
    const targetUser = users.find((u) => u.id === userId);
    if (targetUser && projectId) {
      const body = isRemoving
        ? `Removed ${targetUser.name} from the project`
        : `Added ${targetUser.name} to the project`;
      messagesApi.create({ scope: 'project', scope_id: projectId, body, is_system: true }).catch(() => {});
      qc.invalidateQueries({ queryKey: queryKeys.messages.byScope('project', projectId) });
    }
  }

  async function handleSaveTask(taskId: string, data: TaskDetailData) {
    await updateTask.mutateAsync({ id: taskId, payload: {
      title: data.title, description: data.description, priority: data.priority,
      assignee_ids: data.assignee_ids, start_date: data.start_date || undefined, deadline: data.deadline || undefined, project_id: data.project_id,
    }});

    // Clamp sub-task deadlines that now exceed the updated task deadline
    if (data.deadline) {
      const task = allTasks.find((t) => t.id === taskId);
      const subUpdates = (task?.subtasks ?? [])
        .filter((s) => s.deadline && s.deadline > data.deadline!)
        .map((s) => updateTask.mutateAsync({ id: s.id, payload: { deadline: data.deadline } }));
      await Promise.all(subUpdates);
    }

    setSelectedTask(null);
  }

  async function handleSaveProject(updated: ProjectDetail) {
    await updateProject.mutateAsync({
      id: updated.id,
      payload: {
        name:            updated.name,
        description:     updated.description || undefined,
        workflow_status: (WORKFLOW_TO_KEY[updated.status] ?? 'todo') as 'todo' | 'in_progress' | 'in_review' | 'approved' | 'completed',
        member_ids:      updated.memberIds,
        start_date:      updated.startDate || undefined,
        end_date:        updated.endDate || undefined,
        priority:        updated.priority,
      },
    });
    setShowEditProject(false);
  }

  async function handleCreateSubTask(data: TaskFormData) {
    await createTask.mutateAsync({
      firm_id:        firmId!,
      project_id:     projectId,
      parent_task_id: subTaskParentId,
      title:          data.title,
      description:    data.description || undefined,
      type:           'task',
      priority:       data.priority,
      start_date:     data.startDate || undefined,
      deadline:       data.endDate || undefined,
      assignee_ids:   data.assigneeIds,
      task_type_id:   data.task_type_id || undefined,
      initial_status: resolveInitialStatus(data.initialStatus, data.assigneeIds),
    });
    setShowAddSubTask(false);
    setSubTaskParentId(undefined);
  }

  if (isLoading) {
    return <div className="flex h-full items-center justify-center"><LoadingSpinner /></div>;
  }
  if (!project) {
    return (
      <div className="flex h-full items-center justify-center">
        <EmptyState
          title="Project not found"
          action={{ label: onClose ? 'Close' : 'Back to firm', onClick: () => onClose ? onClose() : navigate(`/firms/${firmId}`) }}
        />
      </div>
    );
  }

  const members  = project.members ?? [];
  const endDate  = project.end_date
    ? new Date(project.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : 'No due date';

  return (
    <div className="flex h-full overflow-hidden bg-[#FAFAFA]">

      {/* ── Left: main content ── */}
      <div className="flex-1 min-w-0 flex flex-col overflow-y-auto bg-white">

        {/* Breadcrumb / panel header */}
        {onClose ? (
          <div className="flex items-center justify-between px-8 pt-5 pb-0 shrink-0">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-[12px] text-[#717680] font-medium truncate max-w-[160px]">{firm?.name ?? '...'}</span>
              <ChevronRight width={12} height={12} className="text-[#C8CDD6] shrink-0" />
              <span className="text-[12px] font-semibold text-[#6941C6] truncate max-w-[200px]">{project.name}</span>
            </div>
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-[#717680] hover:bg-[#F2F4F7] transition-colors shrink-0 ml-4"
              aria-label="Close panel"
            >
              <X width={16} height={16} />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 px-8 pt-6 pb-0 flex-wrap">
            <button onClick={() => navigate('/firms')} className="text-[12px] text-[#717680] hover:text-[#6941C6] font-medium transition-colors">
              Firms
            </button>
            <ChevronRight width={12} height={12} className="text-[#C8CDD6]" />
            <button onClick={() => navigate(`/firms/${firmId}`)} className="text-[12px] text-[#717680] hover:text-[#6941C6] font-medium transition-colors truncate max-w-[160px]">
              {firm?.name ?? '...'}
            </button>
            <ChevronRight width={12} height={12} className="text-[#C8CDD6]" />
            <button onClick={() => navigate(`/firms/${firmId}`)} className="text-[12px] text-[#717680] hover:text-[#6941C6] font-medium transition-colors">
              Projects
            </button>
            <ChevronRight width={12} height={12} className="text-[#C8CDD6]" />
            <span className="text-[12px] font-semibold text-[#6941C6] truncate max-w-[200px]">
              {project.name}
            </span>
          </div>
        )}

        {/* Title section */}
        <div className="px-8 pt-4 pb-5 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <ProjectIcon width={20} height={20} className="text-[#A4A7AE] shrink-0" />
              <h1
                className="text-[20px] font-semibold text-[#181D27] leading-tight"
              >{project.name}</h1>
            </div>
            <p className="text-[12px] text-[#A4A7AE] ml-[28px]">
              Created on {new Date(project.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>

          {/* Actions + Activity toggle */}
          <div className="flex items-center gap-2 shrink-0">
            {!showActivity && (
              <button
                type="button"
                onClick={() => setShowActivity(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#D5D7DA] bg-white text-[13px] font-semibold text-[#344054] hover:bg-[#F9FAFB] transition-colors"
              >
                Activity
              </button>
            )}
          <div ref={actionsRef} className="relative shrink-0">
            <button
              onClick={toggleActions}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#D5D7DA] bg-white text-[13px] font-semibold text-[#344054] hover:bg-[#F9FAFB] transition-colors"
            >
              Actions
              <ChevronDown width={14} height={14} className="text-[#717680]" />
            </button>
            {actionsOpen && (
              <div className="absolute right-0 top-full mt-1 z-30 bg-white border border-[#E9EAEB] rounded-xl shadow-lg py-1 min-w-[180px]">
                {[
                  { label: 'Edit', onClick: () => { closeActions(); setShowEditProject(true); } },
                  { label: 'Delete (with safety)', danger: true, onClick: () => closeActions() },
                  { label: 'Convert to Template', onClick: () => closeActions() },
                ].map((item) => (
                  <button
                    key={item.label}
                    onClick={item.onClick}
                    className={`flex items-center gap-2.5 w-full px-3.5 py-2.5 text-[13px] text-left hover:bg-[#F9FAFB] transition-colors ${item.danger ? 'text-red-500' : 'text-[#344054]'}`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          </div>
        </div>

        {/* ── Metadata grid ── */}
        <div className="px-8 pb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-5 border-b border-[#F2F4F7]">
          {/* Assignee */}
          <div>
            <SectionLabel className="mb-2">Assignee</SectionLabel>
            <InlineAssigneePicker
              avatars={members.map((m) => ({ name: m.name, src: m.avatar_url ?? undefined }))}
              users={users}
              selected={members.map((m) => m.id)}
              onToggle={toggleProjectMember}
            />
          </div>

          {/* Status */}
          <div>
            <SectionLabel className="mb-2">Status</SectionLabel>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#F9FAFB] border border-[#E9EAEB] text-[12px] font-medium text-[#344054]">
              {statusOverride || WORKFLOW_LABEL[project.workflow_status]}
              <ArrowRight width={12} height={12} className="text-[#A4A7AE]" />
            </div>
          </div>

          {/* Priority */}
          <div>
            <SectionLabel className="mb-2">Priority</SectionLabel>
            {(() => {
              const priorityKey = project.priority ?? 'low';
              const cls = PRIORITY_BADGE[priorityKey] ?? PRIORITY_BADGE.low;
              return (
                <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[12px] font-semibold ${cls}`}>
                  {PRIORITY_LABEL[priorityKey] ?? priorityKey}
                </span>
              );
            })()}
          </div>

          {/* Due date */}
          <div>
            <SectionLabel className="mb-2">Due date</SectionLabel>
            <span className="text-[13px] font-medium text-[#344054]">{endDate}</span>
          </div>

          {/* Task Type */}
          <div>
            <SectionLabel className="mb-2">Task Type</SectionLabel>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-50 text-purple-700">Design</span>
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-green-50 text-green-700">Content</span>
            </div>
          </div>

          {/* Timesheet */}
          <div>
            <SectionLabel className="mb-2">Timesheet</SectionLabel>
            <div ref={timesheetBtnRef} className="relative flex items-center gap-2">
              {/* Clock icon — start/stop project timer */}
              <button
                type="button"
                disabled={startProjectTimer.isPending || stopProjectTimer.isPending}
                onClick={() => isTimerRunningHere
                  ? stopProjectTimer.mutate({ entryId: running!.entryId })
                  : startProjectTimer.mutate()
                }
                className={`flex items-center justify-center w-6 h-6 rounded-full transition-colors disabled:opacity-50 ${
                  isTimerRunningHere
                    ? 'bg-[#FEF3F2] text-[#F04438] hover:bg-[#FEE4E2]'
                    : 'bg-[#F4F3FF] text-[#7F56D9] hover:bg-[#EBE9FE]'
                }`}
                title={isTimerRunningHere ? 'Stop timer' : 'Start timer'}
              >
                {isTimerRunningHere
                  ? <span className="w-2 h-2 rounded-[2px] bg-[#F04438]" />
                  : <Clock width={13} height={13} />
                }
              </button>
              {/* Text — opens timesheet panel */}
              <button
                type="button"
                onClick={() => setShowTimesheet((v) => !v)}
                className="text-[13px] font-semibold text-[#7F56D9] hover:text-[#6941C6] transition-colors"
              >
                {projectTimeData && projectTimeData.total_seconds > 0
                  ? formatSeconds(projectTimeData.total_seconds)
                  : 'Log time'}
              </button>
              <ProjectTimesheetPanel
                projectId={projectId!}
                open={showTimesheet}
                onClose={() => setShowTimesheet(false)}
                anchorRef={timesheetBtnRef as React.RefObject<HTMLElement | null>}
              />
            </div>
            {isTimerRunningHere && (
              <div className="flex items-center gap-1.5 mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#F04438] animate-pulse shrink-0" />
                <span className="text-[11px] font-mono font-semibold text-[#F04438]">{formatElapsed(elapsed)}</span>
                <span className="text-[11px] text-[#A4A7AE]">running</span>
              </div>
            )}
          </div>
        </div>

        {/* ── Description ── */}
        <section className="px-8 py-5 border-b border-[#F2F4F7]">
          <h2 className="text-[14px] font-semibold text-[#181D27] mb-3">Description</h2>
          {project.description ? (
            <p className="text-[14px] text-[#535862] leading-relaxed">{project.description}</p>
          ) : (
            <p className="text-[13px] text-[#A4A7AE] italic">No description provided.</p>
          )}
        </section>

        {/* ── Attachments ── */}
        <section className="px-8 py-5 border-b border-[#F2F4F7]">
          <AttachmentsSection projectId={projectId} immediate />
        </section>

        {/* ── Custom Fields ── */}
        <section className="px-8 py-5 border-b border-[#F2F4F7]">
          <h2 className="text-[14px] font-semibold text-[#181D27] mb-3">Custom Fields</h2>
          <div>
            <SectionLabel className="mb-2">Service type</SectionLabel>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-full bg-[#F2F4F7] text-[12px] font-medium text-[#344054]">Hubspot management</span>
              <span className="px-3 py-1 rounded-full bg-[#F2F4F7] text-[12px] font-medium text-[#344054]">Financial copy writing</span>
            </div>
          </div>
        </section>

        {/* ── Tasks ── */}
        <section className="px-8 py-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-[14px] font-semibold text-[#181D27]">Tasks</h2>
              {projectTasks.length > 0 && <CountBadge count={projectTasks.length} />}
            </div>
          </div>

          {projectTasks.length > 0 ? (
            <div className="rounded-xl border border-[#E9EAEB] overflow-x-auto">
            <div className="min-w-[560px]">
              {/* Table header — column widths must match SubTaskRow exactly */}
              <div className="flex items-center px-4 py-2 bg-[#F9FAFB] border-b border-[#E9EAEB]">
                <div className="flex items-center gap-3 flex-1 min-w-0 pr-4">
                  <div className="w-2 shrink-0" />
                  <div className="w-[13px] shrink-0" />
                  <SectionLabel>Task name</SectionLabel>
                </div>
                <SectionLabel className="w-[100px] text-center shrink-0">Status</SectionLabel>
                <SectionLabel className="w-[120px] text-center shrink-0">Assignee</SectionLabel>
                <SectionLabel className="w-[80px] text-center shrink-0">Due Date</SectionLabel>
                <SectionLabel className="w-[64px] text-center shrink-0">Priority</SectionLabel>
              </div>

              {projectTasks.map((task) => {
                const subTasks = task.subtasks ?? [];
                const handleUpdateAssignees = (taskId: string, ids: string[]) =>
                  updateTask.mutateAsync({ id: taskId, payload: { assignee_ids: ids } }).catch(() => {});
                return (
                  <div key={task.id}>
                    <SubTaskRow
                      task={task}
                      users={users}
                      onClick={() => setSelectedTask(task)}
                      onNavigate={() => navigate(`/firms/${firmId}/tasks/${task.id}`)}
                      onUpdateAssignees={handleUpdateAssignees}
                      onAddSubTask={(parentId, parentDeadline, parentStartDate) => {
                        setSubTaskParentId(parentId);
                        setSubTaskParentDeadline(parentDeadline);
                        setSubTaskParentStartDate(parentStartDate);
                        setShowAddSubTask(true);
                      }}
                    />
                    {subTasks.length > 0 && (
                      <div className="border-t border-[#F2F4F7]">
                        {subTasks.map((sub) => (
                          <SubTaskRow
                            key={sub.id}
                            task={sub}
                            users={users}
                            isNested
                            onClick={() => setSelectedTask(sub)}
                            onNavigate={() => navigate(`/firms/${firmId}/tasks/${sub.id}`)}
                            onUpdateAssignees={handleUpdateAssignees}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            </div>
          ) : (
            <EmptyState title="No tasks yet" description="Add the first task to get started." className="py-6" />
          )}

          <button
            type="button"
            onClick={() => { setSubTaskParentId(undefined); setShowAddSubTask(true); }}
            className="group mt-3 flex items-center gap-2 text-[#717680] text-[13px] font-semibold hover:text-[#6941C6] transition-colors"
          >
            <span className="w-5 h-5 rounded-full border border-dashed border-gray-300 flex items-center justify-center shrink-0 text-gray-400 group-hover:border-[#7F56D9] group-hover:text-[#7F56D9] transition-colors">
              <Plus width={9} height={9} />
            </span>
            Add Task
          </button>
        </section>
      </div>

      {/* ── Right: Activity ── */}
      {showActivity && (
        <ActivityPanel
          variant="aside"
          scope="project"
          scopeId={projectId!}
          projectId={projectId!}
          title="Activity"
          onClose={() => setShowActivity(false)}
        />
      )}

      {/* Task detail drawer */}
      <TaskDetailPanel
        open={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        task={selectedTask}
        users={users}
        projects={projects}
        firmId={firmId}
        parentTaskDeadline={
          selectedTask?.parent_task_id
            ? allTasks.find((t) => t.id === selectedTask.parent_task_id)?.deadline ?? undefined
            : undefined
        }
        parentTaskStartDate={
          selectedTask?.parent_task_id
            ? allTasks.find((t) => t.id === selectedTask.parent_task_id)?.start_date ?? undefined
            : undefined
        }
        onSave={handleSaveTask}
        viewLabel={selectedTask?.parent_task_id ? 'View Sub Task' : 'View Task'}
        onViewTask={selectedTask ? () => {
          setSelectedTask(null);
          navigate(`/firms/${firmId}/tasks/${selectedTask.id}`);
        } : undefined}
      />

      {/* Add task modal */}
      <AddTaskModal
        open={showAddSubTask}
        onClose={() => { setShowAddSubTask(false); setSubTaskParentId(undefined); setSubTaskParentDeadline(undefined); setSubTaskParentStartDate(undefined); }}
        firmName={firm?.name}
        users={users}
        projects={projects}
        defaultProjectId={projectId}
        parentTaskId={subTaskParentId}
        parentTaskDeadline={subTaskParentDeadline}
        parentTaskStartDate={subTaskParentStartDate}
        onCreate={handleCreateSubTask}
      />

      {/* Edit project panel */}
      {project && (
        <ProjectDetailPanel
          open={showEditProject}
          onClose={() => setShowEditProject(false)}
          users={users}
          project={(() => {
            const abbr = (firm?.name ?? project.name)
              .split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 3);
            return {
              id:          project.id,
              name:        project.name,
              description: project.description ?? '',
              status:      (WORKFLOW_LABEL[project.workflow_status] ?? 'To Do') as ProjectDetail['status'],
              memberIds:   project.members.map((m) => m.id),
              firmName:    firm?.name ?? '',
              firmAbbr:    abbr,
              startDate:   project.start_date ?? '',
              endDate:     project.end_date ?? '',
              priority:    project.priority ?? 'low',
            };
          })()}
          onSave={handleSaveProject}
        />
      )}
    </div>
  );
}

// ── ProjectFullPanel — slide-over wrapper ──────────────────────────────────────

interface ProjectFullPanelProps {
  open:      boolean;
  firmId:    string;
  projectId: string;
  onClose:   () => void;
}

export function ProjectFullPanel({ open, firmId, projectId, onClose }: ProjectFullPanelProps) {
  // Lock body scroll while open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/30 transition-opacity duration-300 ${
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />
      {/* Panel */}
      <div
        className={`fixed inset-y-0 right-0 z-50 flex flex-col bg-[#FAFAFA] shadow-2xl transition-transform duration-300 ease-in-out w-full max-w-[1300px] ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {open && (
          <ProjectFullContent firmId={firmId} projectId={projectId} onClose={onClose} />
        )}
      </div>
    </>
  );
}

// ── Default export — full page (reads params from URL) ─────────────────────────

export default function ProjectFullPage() {
  return <ProjectFullContent />;
}
