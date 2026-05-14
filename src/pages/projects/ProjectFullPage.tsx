import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAssignableUsers } from '../../hooks/useAssignableUsers';
import AssigneePickerDropdown from '../../components/ui/AssigneePickerDropdown';
import {
  ChevronRight,
  ChevronDown,
  X,
  ArrowRight,
  Plus,
  Clock,
} from '@untitled-ui/icons-react';
import AvatarStack from '../../components/ui/AvatarStack';
import CountBadge from '../../components/ui/CountBadge';
import EmptyState from '../../components/ui/EmptyState';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import SectionLabel from '../../components/ui/SectionLabel';
import AttachmentsSection from '../../components/tasks/AttachmentsSection';
import { TaskStatusBadge, PriorityBadge } from '../../components/tasks/TaskBadges';
import { ChatTab } from '../../components/chat/ChatTab';
import { useFirmDetail, useProjects, useUpdateProject } from '../../hooks/useFirms';
import { useTasksByFirm, useCreateTask, useUpdateTask } from '../../hooks/useTasks';
import { useActiveUsers } from '../../hooks/useUsers';
import AddTaskModal from '../../components/tasks/AddTaskModal';
import TaskDetailPanel from '../../components/tasks/TaskDetailPanel';
import ProjectDetailPanel from '../../components/projects/ProjectDetailPanel';
import type { ProjectDetail } from '../../components/projects/ProjectDetailPanel';
import type { TaskFormData } from '../../components/tasks/AddTaskModal';
import type { TaskDetailData } from '../../components/tasks/TaskDetailPanel';
import { StatusDot, formatDeadline } from '../../components/tasks/TaskRow';
import { PRIORITY_BADGE } from '../../lib/constants';
import { projectsApi, messagesApi } from '../../lib/api';
import { queryKeys } from '../../lib/queryKeys';
import TaskIcon from '../../components/icons/TaskIcon';
import ProjectIcon from '../../components/icons/ProjectIcon';
import ProjectTimesheetPanel from '../../components/timesheet/ProjectTimesheetPanel';
import { useProjectTimeEntries } from '../../hooks/useTimeEntries';
import { formatSeconds } from '../../lib/timeUtils';
import type { Task, Project, User } from '../../lib/api';

// ── Helpers ───────────────────────────────────────────────────────────────────

const WORKFLOW_LABEL: Record<Project['workflow_status'], string> = {
  todo: 'To Do', in_progress: 'In Progress', in_review: 'In Review', approved: 'Approved', completed: 'Completed',
};

// Inverse map used when saving project workflow status from display label
const WORKFLOW_TO_KEY: Record<string, Project['workflow_status']> = {
  'To Do': 'todo', 'In progress': 'in_progress', 'In Review': 'in_review',
  'Approved': 'approved', 'Completed': 'completed',
};

// ── Activity panel ─────────────────────────────────────────────────────────────

type ActivityTab = 'recent' | 'files' | 'notes';
const TABS: { id: ActivityTab; label: string }[] = [
  { id: 'recent', label: 'Recent' },
  { id: 'files',  label: 'Files & Links' },
  { id: 'notes',  label: 'Notes' },
];

function ActivityPanel({ projectId, onClose }: { projectId: string; onClose?: () => void }) {
  const [activeTab, setActiveTab] = useState<ActivityTab>('recent');

  return (
    <aside className="w-[380px] shrink-0 flex flex-col border-l border-[#E9EAEB] bg-white h-full isolate">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3 shrink-0">
        <h2 className="text-[16px] font-semibold text-[#181D27]">Activity</h2>
        <button onClick={onClose} className="w-7 h-7 rounded-md flex items-center justify-center text-[#717680] hover:bg-[#F9FAFB] transition-colors">
          <X width={16} height={16} />
        </button>
      </div>

      {/* Tabs */}
      <div className="px-4 pb-3 shrink-0">
        <div className="flex items-center rounded-lg border border-[#D5D7DA] overflow-hidden">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2 text-[12px] font-semibold transition-all border-r last:border-r-0 border-[#D5D7DA] ${
                activeTab === tab.id
                  ? 'bg-white text-[#181D27]'
                  : 'bg-white text-[#717680] hover:text-[#414651] hover:bg-[#F9FAFB]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      <div className="h-px bg-[#E9EAEB] shrink-0" />

      {activeTab === 'recent' ? (
        <ChatTab scope="project" scopeId={projectId} />
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <EmptyState
            title={activeTab === 'files' ? 'No files yet' : 'No notes yet'}
            description={activeTab === 'files' ? 'No files or links attached yet.' : 'No notes added yet.'}
          />
        </div>
      )}
    </aside>
  );
}

// ── Nested (indented) sub-task row ────────────────────────────────────────────

function NestedSubTaskRow({
  task,
  users,
  onOpen,
  onUpdateAssignees,
}: {
  task: Task;
  users: User[];
  onOpen: (t: Task) => void;
  onUpdateAssignees?: (taskId: string, ids: string[]) => void;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const pickerRef                   = useRef<HTMLDivElement>(null);

  const assignableUsers = useAssignableUsers(task.task_type_id, users);
  const assignees = task.assignees ?? [];
  const { text: dt, overdue: subOverdue } = formatDeadline(task.deadline ?? null);

  return (
    <div
      className="flex items-center px-4 py-2 border-b border-[#F2F4F7] last:border-0 hover:bg-[#F9FAFB] cursor-pointer transition-colors group bg-[#FAFAFA]"
      onClick={() => onOpen(task)}
    >
      {/* Left — indented */}
      <div className="flex items-center gap-3 flex-1 min-w-0 pr-4">
        <div className="w-4 shrink-0" />
        <div className="w-px h-4 bg-[#E4E7EC] shrink-0" />
        <StatusDot status={task.status} />
        <TaskIcon width={12} height={12} className="text-[#C8CDD6] shrink-0" />
        <span className="flex-1 min-w-0 text-[12px] text-[#535862] truncate group-hover:text-[#6941C6] transition-colors">
          {task.title}
        </span>
      </div>
      {/* Status */}
      <div className="w-[100px] flex justify-center shrink-0">
        <TaskStatusBadge status={task.status} />
      </div>
      {/* Assignee — inline picker */}
      <div
        ref={pickerRef}
        className="w-[120px] flex justify-center items-center shrink-0 relative px-3"
        onClick={(e) => e.stopPropagation()}
      >
        <AvatarStack
          avatars={assignees.map((a) => ({ name: a.name, src: a.avatar_url ?? undefined }))}
          max={4}
          showAddButton={true}
          onAdd={() => setPickerOpen(true)}
        />
        <AssigneePickerDropdown
          open={pickerOpen}
          onClose={() => setPickerOpen(false)}
          anchorRef={pickerRef as React.RefObject<HTMLElement | null>}
          users={assignableUsers}
          selected={assignees.map((a) => a.id)}
          onToggle={(uid) => {
            const current = assignees.map((a) => a.id);
            const next = current.includes(uid) ? current.filter((id) => id !== uid) : [...current, uid];
            onUpdateAssignees?.(task.id, next);
          }}
        />
      </div>
      {/* Due Date */}
      <span className={`w-[80px] text-[11px] text-center shrink-0 ${subOverdue ? 'text-red-500 font-medium' : 'text-[#717680]'}`}>
        {dt}
      </span>
      {/* Priority */}
      <div className="w-[64px] flex justify-center shrink-0">
        <PriorityBadge priority={task.priority} />
      </div>
    </div>
  );
}

// ── Parent task row ────────────────────────────────────────────────────────────

function SubTaskRow({
  task,
  users,
  onOpen,
  onUpdateAssignees,
  onAddSubTask,
}: {
  task: Task;
  users: User[];
  onOpen: (t: Task) => void;
  onUpdateAssignees?: (taskId: string, ids: string[]) => void;
  onAddSubTask?: (parentId: string, parentDeadline?: string) => void;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const pickerRef                   = useRef<HTMLDivElement>(null);

  const assignableUsers = useAssignableUsers(task.task_type_id, users);
  const assignees     = task.assignees ?? [];
  const { text: dateText, overdue } = formatDeadline(task.deadline ?? null);

  return (
    <div
      className="flex items-center px-4 py-2.5 border-b border-[#F2F4F7] last:border-0 hover:bg-[#F9FAFB] cursor-pointer transition-colors group"
      onClick={() => onOpen(task)}
    >
      {/* Left: dot + icon + title + hover sub-task button */}
      <div className="flex items-center gap-2 flex-1 min-w-0 pr-4">
        <StatusDot status={task.status} />
        <TaskIcon width={13} height={13} className="text-[#A4A7AE] shrink-0" />
        <span className="flex-1 min-w-0 text-[13px] text-[#344054] truncate group-hover:text-[#6941C6] transition-colors">
          {task.title}
        </span>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onAddSubTask?.(task.id, task.deadline ?? undefined); }}
          className="opacity-0 group-hover:opacity-100 shrink-0 flex items-center gap-1 px-2 py-0.5 rounded text-[11px] text-[#A4A7AE] hover:text-[#6941C6] hover:bg-[#F4F3FF] transition-all"
        >
          <Plus width={10} height={10} />
          Sub-task
        </button>
      </div>

      {/* Status — fixed 100 px */}
      <div className="w-[100px] flex justify-center shrink-0">
        <TaskStatusBadge status={task.status} />
      </div>

      {/* Assignee — fixed 120 px, inline picker */}
      <div
        ref={pickerRef}
        className="w-[120px] flex justify-center items-center shrink-0 relative px-3"
        onClick={(e) => e.stopPropagation()}
      >
        <AvatarStack
          avatars={assignees.map((a) => ({ name: a.name, src: a.avatar_url ?? undefined }))}
          max={4}
          showAddButton={true}
          onAdd={() => setPickerOpen(true)}
        />
        <AssigneePickerDropdown
          open={pickerOpen}
          onClose={() => setPickerOpen(false)}
          anchorRef={pickerRef as React.RefObject<HTMLElement | null>}
          users={assignableUsers}
          selected={assignees.map((a) => a.id)}
          onToggle={(uid) => {
            const current = assignees.map((a) => a.id);
            const next = current.includes(uid) ? current.filter((id) => id !== uid) : [...current, uid];
            onUpdateAssignees?.(task.id, next);
          }}
        />
      </div>

      {/* Due Date — fixed 80 px */}
      <span className={`w-[80px] text-[12px] text-center shrink-0 ${overdue ? 'text-red-500 font-medium' : 'text-[#717680]'}`}>
        {dateText}
      </span>

      {/* Priority — fixed 64 px */}
      <div className="w-[64px] flex justify-center shrink-0">
        <PriorityBadge priority={task.priority} />
      </div>
    </div>
  );
}

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
  const [actionsOpen,        setActionsOpen]        = useState(false);
  const [showEditProject,    setShowEditProject]    = useState(false);
  const [assigneePickerOpen, setAssigneePickerOpen] = useState(false);
  const assigneePickerRef = useRef<HTMLDivElement>(null);
  const updateProject = useUpdateProject();
  const [showAddSubTask,       setShowAddSubTask]       = useState(false);
  const [subTaskParentId,      setSubTaskParentId]      = useState<string | undefined>();
  const [subTaskParentDeadline, setSubTaskParentDeadline] = useState<string | undefined>();
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
      assignee_ids: data.assignee_ids, deadline: data.deadline || undefined, project_id: data.project_id,
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
        workflow_status: WORKFLOW_TO_KEY[updated.status] ?? 'todo',
        member_ids:      updated.memberIds,
        start_date:      updated.startDate || undefined,
        end_date:        updated.endDate || undefined,
        priority:        updated.priority,
      },
    });
    setShowEditProject(false);
  }

  const priorityMap: Record<string, 'low' | 'normal' | 'high' | 'urgent'> = {
    Low: 'low', Medium: 'normal', High: 'high', Urgent: 'urgent',
  };

  async function handleCreateSubTask(data: TaskFormData) {
    await createTask.mutateAsync({
      firm_id: firmId!, project_id: projectId, parent_task_id: subTaskParentId,
      title: data.title, description: data.description || undefined,
      type: 'task',
      priority: priorityMap[data.priority] ?? 'normal',
      start_date: data.startDate || undefined,
      deadline: data.endDate || undefined,
      assignee_ids: data.assigneeIds,
      task_type_id: data.task_type_id || undefined,
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
              <h1 className="text-[20px] font-semibold text-[#181D27] leading-tight">{project.name}</h1>
            </div>
            <p className="text-[12px] text-[#A4A7AE] ml-[28px]">
              Created on {new Date(project.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>

          {/* Actions */}
          <div className="relative shrink-0">
            <button
              onClick={() => setActionsOpen(v => !v)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#D5D7DA] bg-white text-[13px] font-semibold text-[#344054] hover:bg-[#F9FAFB] transition-colors"
            >
              Actions
              <ChevronDown width={14} height={14} className="text-[#717680]" />
            </button>
            {actionsOpen && (
              <div className="absolute right-0 top-full mt-1 z-30 bg-white border border-[#E9EAEB] rounded-xl shadow-lg py-1 min-w-[180px]">
                {[
                  { label: 'Edit', onClick: () => { setActionsOpen(false); setShowEditProject(true); } },
                  { label: 'Delete (with safety)', danger: true, onClick: () => setActionsOpen(false) },
                  { label: 'Convert to Template', onClick: () => setActionsOpen(false) },
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

        {/* ── Metadata grid ── */}
        <div className="px-8 pb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-5 border-b border-[#F2F4F7]">
          {/* Assignee */}
          <div ref={assigneePickerRef} className="relative">
            <SectionLabel className="mb-2">Assignee</SectionLabel>
            <AvatarStack
              avatars={members.map((m) => ({ name: m.name, src: m.avatar_url ?? undefined }))}
              max={4}
              showAddButton={true}
              onAdd={() => setAssigneePickerOpen((v) => !v)}
            />
            {members.length === 0 && (
              <button
                type="button"
                onClick={() => setAssigneePickerOpen((v) => !v)}
                className="text-[13px] text-[#A4A7AE] hover:text-[#7F56D9] transition-colors"
              >
                + Add assignee
              </button>
            )}
            <AssigneePickerDropdown
              open={assigneePickerOpen}
              onClose={() => setAssigneePickerOpen(false)}
              anchorRef={assigneePickerRef as React.RefObject<HTMLElement | null>}
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
              const p = PRIORITY_BADGE[project.priority ?? 'low'] ?? PRIORITY_BADGE.low;
              return (
                <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[12px] font-semibold ${p.className}`}>
                  {p.label}
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
            <div ref={timesheetBtnRef} className="relative">
              <button
                type="button"
                onClick={() => setShowTimesheet((v) => !v)}
                className="flex items-center gap-1.5 text-[13px] font-semibold text-[#7F56D9] hover:text-[#6941C6] transition-colors"
              >
                <Clock width={14} height={14} />
                {projectTimeData && projectTimeData.total_seconds > 0
                  ? formatSeconds(projectTimeData.total_seconds)
                  : 'View time'}
              </button>
              <ProjectTimesheetPanel
                projectId={projectId!}
                open={showTimesheet}
                onClose={() => setShowTimesheet(false)}
                anchorRef={timesheetBtnRef as React.RefObject<HTMLElement | null>}
              />
            </div>
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
                return (
                  <div key={task.id}>
                    {/* Parent task row */}
                    <SubTaskRow
                      task={task}
                      users={users}
                      onOpen={setSelectedTask}
                      onUpdateAssignees={(taskId, ids) =>
                        updateTask.mutateAsync({ id: taskId, payload: { assignee_ids: ids } }).catch(() => {})
                      }
                      onAddSubTask={(parentId, parentDeadline) => {
                        setSubTaskParentId(parentId);
                        setSubTaskParentDeadline(parentDeadline);
                        setShowAddSubTask(true);
                      }}
                    />

                    {/* Nested sub-task rows */}
                    {subTasks.length > 0 && (
                      <div className="border-t border-[#F2F4F7]">
                        {subTasks.map((sub) => (
                          <NestedSubTaskRow
                            key={sub.id}
                            task={sub}
                            users={users}
                            onOpen={setSelectedTask}
                            onUpdateAssignees={(taskId, ids) =>
                              updateTask.mutateAsync({ id: taskId, payload: { assignee_ids: ids } }).catch(() => {})
                            }
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
      {showActivity && <ActivityPanel projectId={projectId!} onClose={() => setShowActivity(false)} />}

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
        onClose={() => { setShowAddSubTask(false); setSubTaskParentId(undefined); setSubTaskParentDeadline(undefined); }}
        firmName={firm?.name}
        users={users}
        projects={projects}
        defaultProjectId={projectId}
        parentTaskId={subTaskParentId}
        parentTaskDeadline={subTaskParentDeadline}
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
