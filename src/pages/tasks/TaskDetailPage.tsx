import { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ChevronRight,
  DotsVertical,
  Edit01,
  Trash01,
  FileCheck01,
  Plus,
  Clock,
} from '@untitled-ui/icons-react';
import AvatarStack from '../../components/ui/AvatarStack';
import AssigneePickerDropdown from '../../components/ui/AssigneePickerDropdown';
import DropdownMenu from '../../components/ui/DropdownMenu';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import CountBadge from '../../components/ui/CountBadge';
import SectionLabel from '../../components/ui/SectionLabel';
import AttachmentsSection from '../../components/tasks/AttachmentsSection';
import SubTaskRow from '../../components/tasks/SubTaskRow';
import TaskActivityPanel from '../../components/tasks/TaskActivityPanel';
import { TaskStatusBadge, PriorityBadge, TypeBadge } from '../../components/tasks/TaskBadges';
import TaskDetailPanel from '../../components/tasks/TaskDetailPanel';
import AddTaskModal from '../../components/tasks/AddTaskModal';
import TaskIcon from '../../components/icons/TaskIcon';
import TimesheetPanel from '../../components/timesheet/TimesheetPanel';
import { useTaskDetail } from '../../hooks/useTaskDetail';
import { useTimeEntries, useStartTimer, useStopTimer } from '../../hooks/useTimeEntries';
import { formatSeconds, formatElapsed } from '../../lib/timeUtils';
import { useTimer } from '../../context/TimerContext';

// ── Metadata grid cell ────────────────────────────────────────────────────────

function MetaCell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <SectionLabel>{label}</SectionLabel>
      <div className="text-[13px] text-[#181D27]">{children}</div>
    </div>
  );
}

// ── TaskDetailPage ────────────────────────────────────────────────────────────

export default function TaskDetailPage() {
  const { firmId, taskId } = useParams<{ firmId: string; taskId: string }>();
  const navigate           = useNavigate();

  const [actionsOpen,        setActionsOpen]        = useState(false);
  const [showEditTask,       setShowEditTask]       = useState(false);
  const [selectedSubTask,    setSelectedSubTask]    = useState<import('../../lib/api').Task | null>(null);
  const [showAddSubTask,     setShowAddSubTask]     = useState(false);
  const [assigneePickerOpen, setAssigneePickerOpen] = useState(false);
  const [showTimesheet,      setShowTimesheet]      = useState(false);
  const assigneePickerRef  = useRef<HTMLDivElement>(null);
  const timesheetBtnRef    = useRef<HTMLDivElement>(null);
  const { running, elapsed } = useTimer();
  const isTimerRunningHere   = running?.taskId === taskId;
  const startTimer           = useStartTimer(taskId!);
  const stopTimer            = useStopTimer(taskId!);

  const {
    firm, task, projects, users, assignableUsers, parentTask,
    isSubTask, taskProject, loading, deadline, assignees, subTasks,
    updateTask, handleSaveTask, toggleTaskAssignee, handleCreateSubTask,
  } = useTaskDetail(firmId, taskId);

  const { data: timeEntrySummary } = useTimeEntries(taskId);

  // ── Render: loading ───────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  // ── Render: not found ─────────────────────────────────────────────────────

  if (!task) {
    return (
      <div className="flex h-full items-center justify-center px-6">
        <EmptyState
          icon={<TaskIcon width={40} height={40} className="text-[#C8CDD6]" />}
          title="Task not found"
          description="This task may have been deleted or you may not have access."
          action={{ label: 'Go back', onClick: () => navigate(-1) }}
        />
      </div>
    );
  }

  // ── Render: main ─────────────────────────────────────────────────────────

  return (
    <>
    <div className="flex h-full overflow-hidden bg-white">

      {/* ── Left column ── */}
      <div className="flex-1 min-w-0 flex flex-col overflow-y-auto">

        {/* Header */}
        <div className="px-8 pt-7 pb-0">

          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-[12px] text-[#717680] mb-5 flex-wrap" aria-label="Breadcrumb">
            <button type="button" onClick={() => navigate('/firms')} className="hover:text-[#7F56D9] transition-colors font-medium">
              Firms
            </button>
            <ChevronRight width={12} height={12} className="text-[#C8CDD6]" aria-hidden="true" />
            <button type="button" onClick={() => navigate(`/firms/${firmId}`)} className="hover:text-[#7F56D9] transition-colors font-medium truncate max-w-[140px]">
              {firm?.name ?? '...'}
            </button>
            {taskProject && (
              <>
                <ChevronRight width={12} height={12} className="text-[#C8CDD6]" aria-hidden="true" />
                <button type="button" onClick={() => navigate(`/firms/${firmId}`)} className="hover:text-[#7F56D9] transition-colors font-medium">
                  Projects
                </button>
                <ChevronRight width={12} height={12} className="text-[#C8CDD6]" aria-hidden="true" />
                <button type="button" onClick={() => navigate(`/firms/${firmId}/projects/${taskProject.id}`)} className="hover:text-[#7F56D9] transition-colors font-medium truncate max-w-[140px]">
                  {taskProject.name}
                </button>
              </>
            )}
            {isSubTask && parentTask && (
              <>
                <ChevronRight width={12} height={12} className="text-[#C8CDD6]" aria-hidden="true" />
                <button type="button" onClick={() => navigate(`/firms/${firmId}/tasks/${parentTask.id}`)} className="hover:text-[#7F56D9] transition-colors font-medium truncate max-w-[140px]">
                  {parentTask.title}
                </button>
              </>
            )}
            <ChevronRight width={12} height={12} className="text-[#C8CDD6]" aria-hidden="true" />
            <span className="truncate max-w-[200px] text-[#414651] font-semibold">{task.title}</span>
          </nav>

          {/* Title + Actions */}
          <div className="flex items-start justify-between gap-4 mb-1">
            <h1 className="text-xl font-semibold text-[#181D27] leading-snug">{task.title}</h1>
            <div className="relative shrink-0 mt-0.5">
              <button
                type="button"
                onClick={() => setActionsOpen((v) => !v)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[#E9EAEB] text-[13px] font-medium text-[#414651] hover:bg-[#F9FAFB] transition-colors"
                aria-haspopup="true"
                aria-expanded={actionsOpen}
              >
                Actions
                <DotsVertical width={14} height={14} className="text-[#717680]" aria-hidden="true" />
              </button>
              <DropdownMenu
                open={actionsOpen}
                onClose={() => setActionsOpen(false)}
                align="right"
                items={[
                  { label: 'Edit', icon: <Edit01 width={14} height={14} className="text-[#717680]" />, onClick: () => { setActionsOpen(false); setShowEditTask(true); } },
                  { label: 'Convert to Template', icon: <FileCheck01 width={14} height={14} className="text-[#717680]" />, onClick: () => setActionsOpen(false) },
                  { label: 'Delete', icon: <Trash01 width={14} height={14} />, onClick: () => setActionsOpen(false), variant: 'danger' },
                ]}
              />
            </div>
          </div>

          {/* Created date */}
          <p className="text-[12px] text-[#A4A7AE] mb-6">
            Created on{' '}
            {new Date(task.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            {task.ai_generated && (
              <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-purple-50 text-purple-600">
                AI generated
              </span>
            )}
          </p>
        </div>

        {/* Metadata grid */}
        <div className="px-8 py-5 border-y border-[#E9EAEB] grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-5">

          {/* Assignee */}
          <div className="flex flex-col gap-1.5">
            <SectionLabel>Assignee</SectionLabel>
            <div ref={assigneePickerRef} className="inline-flex">
              {assignees.length > 0 ? (
                <AvatarStack
                  avatars={assignees.map((a) => ({ name: a.name, src: 'avatar_url' in a && a.avatar_url ? a.avatar_url : undefined }))}
                  max={4}
                  showAddButton={true}
                  onAdd={() => setAssigneePickerOpen((v) => !v)}
                />
              ) : (
                <button type="button" onClick={() => setAssigneePickerOpen((v) => !v)} className="text-[13px] text-[#A4A7AE] hover:text-[#7F56D9] transition-colors">
                  + Add assignee
                </button>
              )}
              <AssigneePickerDropdown
                open={assigneePickerOpen}
                onClose={() => setAssigneePickerOpen(false)}
                anchorRef={assigneePickerRef as React.RefObject<HTMLElement | null>}
                users={assignableUsers}
                selected={assignees.map((a) => a.id)}
                onToggle={(uid) => toggleTaskAssignee(uid)}
              />
            </div>
          </div>

          <MetaCell label="Status"><TaskStatusBadge status={task.status} /></MetaCell>
          <MetaCell label="Priority"><PriorityBadge priority={task.priority} /></MetaCell>

          <MetaCell label="Due Date">
            {deadline ? (
              <span className={`text-[13px] font-medium ${deadline.overdue ? 'text-red-500' : 'text-[#181D27]'}`}>
                {deadline.text}
              </span>
            ) : (
              <span className="text-[#A4A7AE]">—</span>
            )}
          </MetaCell>

          <MetaCell label="Task Type"><TypeBadge type={task.type} /></MetaCell>

          <div className="flex flex-col gap-1.5 relative">
            <SectionLabel>Timesheet</SectionLabel>
            <div ref={timesheetBtnRef} className="relative flex items-center gap-2">
              {/* Clock icon — start/stop timer toggle */}
              <button
                type="button"
                disabled={startTimer.isPending || stopTimer.isPending}
                onClick={() => isTimerRunningHere
                  ? stopTimer.mutate({ entryId: running!.entryId })
                  : startTimer.mutate()
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
              {/* Text — opens timesheet panel for manual entry */}
              <button
                type="button"
                onClick={() => setShowTimesheet((v) => !v)}
                className="text-[13px] font-semibold text-[#7F56D9] hover:text-[#6941C6] transition-colors"
              >
                {timeEntrySummary?.total_seconds ? formatSeconds(timeEntrySummary.total_seconds) : 'Log time'}
              </button>
              <TimesheetPanel
                taskId={taskId!}
                taskTitle={task?.title}
                projectId={task?.project_id ?? undefined}
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

        {/* Description */}
        <section className="px-8 py-5 border-b border-[#E9EAEB]">
          <SectionLabel className="mb-3">Description</SectionLabel>
          {task.description ? (
            <p className="text-[14px] text-[#414651] leading-relaxed whitespace-pre-wrap">{task.description}</p>
          ) : (
            <p className="text-[13px] text-[#A4A7AE] italic">No description provided.</p>
          )}
        </section>

        {/* Attachments */}
        <section className="px-8 py-5 border-b border-[#E9EAEB]">
          <AttachmentsSection projectId={task?.project_id ?? null} immediate />
        </section>

        {/* Sub-tasks — hidden for sub-tasks */}
        {!isSubTask && (
          <section className="px-8 py-5">
            <div className="flex items-center gap-2 mb-3">
              <SectionLabel>Sub Tasks</SectionLabel>
              {subTasks.length > 0 && <CountBadge count={subTasks.length} />}
            </div>

            {subTasks.length > 0 ? (
              <div className="rounded-lg border border-[#E9EAEB] overflow-hidden">
                {/* Column header */}
                <div className="flex items-center px-3 py-2 bg-[#F9FAFB] border-b border-[#E9EAEB]">
                  <div className="flex items-center gap-3 flex-1 min-w-0 pr-4">
                    <div className="w-2 shrink-0" /><div className="w-[13px] shrink-0" />
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[#A4A7AE]">Task name</span>
                  </div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[#A4A7AE] w-[100px] text-center shrink-0">Status</span>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[#A4A7AE] w-[120px] text-center shrink-0">Assignee</span>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[#A4A7AE] w-[80px] text-center shrink-0">Due Date</span>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[#A4A7AE] w-[64px] text-center shrink-0">Priority</span>
                </div>
                {subTasks.map((sub) => (
                  <SubTaskRow
                    key={sub.id}
                    task={sub}
                    users={users}
                    onClick={() => setSelectedSubTask(sub)}
                    onNavigate={() => navigate(`/firms/${firmId}/tasks/${sub.id}`)}
                    onUpdateAssignees={(tid, ids) =>
                      updateTask.mutateAsync({ id: tid, payload: { assignee_ids: ids } }).catch(() => {})
                    }
                  />
                ))}
              </div>
            ) : (
              <p className="text-[13px] text-[#A4A7AE] mb-3">No sub-tasks yet.</p>
            )}

            <button
              type="button"
              onClick={() => setShowAddSubTask(true)}
              className="group mt-3 flex items-center gap-2 text-[#717680] text-[13px] font-semibold hover:text-[#6941C6] transition-colors"
            >
              <span className="w-5 h-5 rounded-full border border-dashed border-gray-300 flex items-center justify-center shrink-0 text-gray-400 group-hover:border-[#7F56D9] group-hover:text-[#7F56D9] transition-colors">
                <Plus width={9} height={9} />
              </span>
              Add Sub-task
            </button>
          </section>
        )}
      </div>

      {/* ── Right column: activity ── */}
      <TaskActivityPanel taskId={taskId!} />
    </div>

    {/* Edit task slide-over */}
    <TaskDetailPanel
      open={showEditTask}
      onClose={() => setShowEditTask(false)}
      task={task ?? null}
      firmId={firmId}
      users={users}
      projects={projects}
      onSave={handleSaveTask}
      viewLabel="View Task"
      onViewTask={() => setShowEditTask(false)}
    />

    {/* Sub-task slide-over */}
    <TaskDetailPanel
      open={!!selectedSubTask}
      onClose={() => setSelectedSubTask(null)}
      task={selectedSubTask}
      firmId={firmId}
      users={users}
      projects={projects}
      parentTaskDeadline={task?.deadline ?? undefined}
      onSave={handleSaveTask}
      onViewTask={() => {
        setSelectedSubTask(null);
        navigate(`/firms/${firmId}/tasks/${selectedSubTask?.id}`);
      }}
      viewLabel="View Sub-task"
    />

    {/* Add sub-task modal */}
    <AddTaskModal
      open={showAddSubTask}
      onClose={() => setShowAddSubTask(false)}
      firmName={firm?.name}
      users={users}
      projects={projects}
      defaultProjectId={task?.project_id ?? undefined}
      parentTaskId={taskId}
      onCreate={(data) => handleCreateSubTask(firmId!, data).then(() => setShowAddSubTask(false))}
    />
    </>
  );
}
