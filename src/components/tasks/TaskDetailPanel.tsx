import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { HelpCircle, ChevronDown, ChevronRight, Plus, X } from '@untitled-ui/icons-react';
import CountBadge from '../ui/CountBadge';
import AvatarNameRow from '../ui/AvatarNameRow';
import PanelFooter from '../ui/PanelFooter';
import { TASK_STATUS_DOT } from '../../lib/constants';
import ActivityPanel from '../activity';
import { useTransitionTask, useUpdateTask } from '../../hooks/useTasks';
import ProjectIcon from '../icons/ProjectIcon';
import TaskIcon from '../icons/TaskIcon';
import AvatarStack from '../ui/AvatarStack';
import AssigneePickerDropdown from '../ui/AssigneePickerDropdown';
import SlideOver from '../ui/SlideOver';
import Input from '../ui/Input';
import AttachmentsSection, { type AttachmentsSectionHandle } from './AttachmentsSection';
import TaskTimerRow from './TaskTimerRow';
import { useClickOutside } from '../../hooks/useClickOutside';
import { useAssignableUsers } from '../../hooks/useAssignableUsers';
import type { Task, User, Project } from '../../lib/api';
import { TASK_STATUS_BADGE } from '../../lib/constants';
import { PriorityBadge } from './TaskBadges';
import { STATUS_LABELS, VALID_TRANSITIONS } from '../../lib/projectConstants';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface TaskDetailData {
  title:        string;
  description:  string;
  priority:     'low' | 'normal' | 'high' | 'urgent';
  assignee_ids: string[];
  deadline:     string;
  project_id:   string | null;
}

interface TaskDetailPanelProps {
  open:                boolean;
  onClose:             () => void;
  task:                Task | null;
  users:               User[];
  projects?:           Project[];
  firmId?:             string;
  parentTaskDeadline?: string;
  onSave?:             (taskId: string, data: TaskDetailData) => Promise<void>;
  onViewTask?:         () => void;
  viewLabel?:          string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const PRIORITY_OPTIONS: { value: 'low' | 'normal' | 'high' | 'urgent'; label: string; dot: string }[] = [
  { value: 'urgent', label: 'Urgent', dot: 'bg-red-500'    },
  { value: 'high',   label: 'High',   dot: 'bg-orange-400' },
  { value: 'normal', label: 'Normal', dot: 'bg-yellow-400' },
  { value: 'low',    label: 'Low',    dot: 'bg-green-500'  },
];

const TYPE_LABELS: Record<string, string> = {
  task:               'Task',
  design:             'Design',
  development:        'Development',
  account_management: 'Account Management',
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function TaskDetailPanel({
  open,
  onClose,
  task,
  users,
  projects = [],
  firmId,
  parentTaskDeadline,
  onSave,
  onViewTask,
  viewLabel = 'View Task',
}: TaskDetailPanelProps) {
  const navigate = useNavigate();
  const [title,        setTitle]        = useState('');
  const [description,  setDescription]  = useState('');
  const [priority,     setPriority]     = useState<'low' | 'normal' | 'high' | 'urgent'>('normal');
  const [assigneeIds,  setAssigneeIds]  = useState<string[]>([]);
  const [deadline,     setDeadline]     = useState('');
  const [projectId,    setProjectId]    = useState<string | null>(null);
  const [taskStatus,   setTaskStatus]   = useState('');
  const [saving,        setSaving]       = useState(false);
  const [deadlineError, setDeadlineError] = useState('');
  const [saveError,     setSaveError]     = useState('');
  const [statusError,   setStatusError]   = useState('');

  const [showPriority,  setShowPriority]  = useState(false);
  const [showPicker,    setShowPicker]    = useState(false);
  const [showProject,   setShowProject]   = useState(false);
  const [showStatus,    setShowStatus]    = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const [showActivity,  setShowActivity]  = useState(true);

  const priorityRef    = useRef<HTMLDivElement>(null);
  const pickerRef      = useRef<HTMLDivElement>(null);
  const projectRef     = useRef<HTMLDivElement>(null);
  const statusRef      = useRef<HTMLDivElement>(null);
  const attachmentsRef = useRef<AttachmentsSectionHandle>(null);
  useClickOutside(priorityRef, () => setShowPriority(false));
  // pickerRef: no useClickOutside — AssigneePickerDropdown owns its own fixed backdrop
  useClickOutside(projectRef,  () => setShowProject(false));
  useClickOutside(statusRef,   () => setShowStatus(false));

  const transitionTask = useTransitionTask();
  const updateTask     = useUpdateTask();

  // Sync fields when task changes or panel opens
  useEffect(() => {
    if (task && open) {
      setTitle(task.title);
      setDescription(task.description ?? '');
      setPriority(task.priority ?? 'normal');
      setDeadline(task.deadline ?? '');
      setProjectId(task.project_id ?? null);
      setTaskStatus(task.status ?? 'to_do');
      setStatusError('');
      // Prefer assignees[] (multi), fall back to single assignee_id
      if (task.assignees && task.assignees.length > 0) {
        setAssigneeIds(task.assignees.map((a) => a.id));
      } else if (task.assignee_id) {
        setAssigneeIds([task.assignee_id]);
      } else {
        setAssigneeIds([]);
      }
    }
  }, [task, open]);

  const assignableUsers = useAssignableUsers(task?.task_type_id, users);

  if (!task) return null;

  const assignedUsers = users.filter((u) => assigneeIds.includes(u.id));

  const toggleAssignee = (userId: string) => {
    setAssigneeIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId],
    );
  };

  const priorityOpt = PRIORITY_OPTIONS.find((p) => p.value === priority) ?? PRIORITY_OPTIONS[1];

  const handleSave = async () => {
    if (!title.trim()) return;

    setSaveError('');

    if (taskStatus === 'completed') {
      setSaveError('This task is completed and cannot be edited.');
      return;
    }

    if (deadline) {
      if (parentTaskDeadline && deadline > parentTaskDeadline) {
        setDeadlineError(`Sub-task due date cannot exceed the parent task due date (${parentTaskDeadline})`);
        return;
      }
      if (projectId) {
        const proj = projects.find((p) => p.id === projectId);
        if (proj?.end_date && deadline > proj.end_date) {
          setDeadlineError(`Task due date cannot exceed the project end date (${proj.end_date})`);
          return;
        }
      }
    }
    setDeadlineError('');

    setSaving(true);
    try {
      await onSave?.(task.id, { title, description, priority, assignee_ids: assigneeIds, deadline, project_id: projectId });
      await attachmentsRef.current?.commit();
      onClose();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save task. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (nextStatus: string) => {
    if (nextStatus === taskStatus) { setShowStatus(false); return; }
    setShowStatus(false);
    setStatusError('');
    setTransitioning(true);
    try {
      const validNext = VALID_TRANSITIONS[taskStatus] ?? [];
      if (validNext.includes(nextStatus)) {
        await transitionTask.mutateAsync({ id: task.id, status: nextStatus });
      } else {
        await updateTask.mutateAsync({ id: task.id, payload: { status: nextStatus } });
      }
      setTaskStatus(nextStatus);
    } catch (err) {
      setStatusError(err instanceof Error ? err.message : 'Failed to update task status.');
    } finally {
      setTransitioning(false);
    }
  };

  // Breadcrumb: Firm › Type › Status
  const firmName    = task.firms?.name ?? '';
  const typeLabel   = TYPE_LABELS[task.type]   ?? task.type;
  const statusLabel = STATUS_LABELS[taskStatus] ?? taskStatus;

  return (
    <SlideOver
      open={open}
      onClose={onClose}
      title={task.title}
      subtitle={statusLabel}
      width="max-w-[440px]"
    >
      <div className="flex flex-col gap-5">

        {/* Breadcrumb */}
        {firmName && (
          <nav className="flex items-center gap-1 text-[11px] text-[#717680] flex-wrap">
            <span className="font-medium text-[#414651]">{firmName}</span>
            <ChevronRight width={11} height={11} className="shrink-0" />
            <span>{typeLabel}</span>
            <ChevronRight width={11} height={11} className="shrink-0" />
            <span className={`font-medium ${taskStatus === 'completed' ? 'text-[#12B76A]' : 'text-[#7F56D9]'}`}>{statusLabel}</span>
          </nav>
        )}

        {/* Meta pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-2.5 py-1 rounded-full bg-[#F2F4F7] text-[12px] font-medium text-[#414651]">
            {typeLabel}
          </span>
          {task.firms?.name && (
            <span className="px-2.5 py-1 rounded-full bg-[#F4F3FF] text-[12px] font-medium text-[#6941C6]">
              {task.firms.name}
            </span>
          )}
        </div>

        {/* Title */}
        <Input
          label="Task name"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        {/* Description */}
        <div>
          <label className="flex items-center gap-1 text-sm font-medium text-[#344054] mb-1.5">
            Description
            <HelpCircle width={14} height={14} className="text-[#A4A7AE]" />
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the task…"
            rows={4}
            className="w-full border border-[#D5D7DA] rounded-lg px-3 py-2.5 text-sm text-[#181D27] placeholder-[#A4A7AE] outline-none focus:ring-2 focus:ring-[#7F56D9] focus:border-transparent transition bg-white resize-none"
          />
        </div>

        {/* Priority */}
        <div ref={priorityRef} className="relative">
          <label className="block text-sm font-medium text-[#344054] mb-1.5">Priority</label>
          <button
            type="button"
            onClick={() => setShowPriority((v) => !v)}
            className="w-full flex items-center gap-2 border border-[#D5D7DA] rounded-lg px-3 py-2.5 text-sm text-[#181D27] bg-white hover:border-[#7F56D9] outline-none transition-colors"
          >
            <span className={`w-2 h-2 rounded-full shrink-0 ${priorityOpt.dot}`} />
            <span className="flex-1 text-left">{priorityOpt.label}</span>
            <ChevronDown width={15} height={15} className="text-[#717680] shrink-0" />
          </button>
          {showPriority && (
            <div className="absolute top-full mt-1 left-0 right-0 z-20 bg-white border border-[#E9EAEB] rounded-xl shadow-lg py-1">
              {PRIORITY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => { setPriority(opt.value); setShowPriority(false); }}
                  className={`flex items-center gap-2.5 w-full px-3 py-2 text-sm hover:bg-[#F9FAFB] transition-colors ${
                    priority === opt.value ? 'text-[#6941C6] font-medium' : 'text-[#344054]'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full shrink-0 ${opt.dot}`} />
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Status */}
        <div ref={statusRef} className="relative">
          <label className="block text-sm font-medium text-[#344054] mb-1.5">Status</label>
          <button
            type="button"
            disabled={transitioning}
            onClick={() => { setShowStatus((v) => !v); setStatusError(''); }}
            className={`w-full flex items-center gap-2 border rounded-lg px-3 py-2.5 text-sm text-[#181D27] bg-white hover:border-[#7F56D9] outline-none transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${statusError ? 'border-red-400' : 'border-[#D5D7DA]'}`}
          >
            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: TASK_STATUS_DOT[taskStatus] ?? '#9CA3AF' }} />
            <span className="flex-1 text-left">{statusLabel}</span>
            <ChevronDown width={15} height={15} className="text-[#717680] shrink-0" />
          </button>
          {showStatus && (
            <div className="absolute top-full mt-1 left-0 right-0 z-20 bg-white border border-[#E9EAEB] rounded-xl shadow-lg py-1 max-h-52 overflow-y-auto">
              {Object.entries(STATUS_LABELS).map(([s, label]) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => handleStatusChange(s)}
                  className={`flex items-center gap-2.5 w-full px-3 py-2 text-sm hover:bg-[#F9FAFB] transition-colors ${
                    s === taskStatus ? 'text-[#6941C6] font-medium' : 'text-[#344054]'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: TASK_STATUS_DOT[s] ?? '#9CA3AF' }} />
                  <span className="flex-1 text-left">{label}</span>
                  {s === taskStatus && (
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0">
                      <path d="M2 7L5.5 10.5L12 3.5" stroke="#7F56D9" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          )}
          {statusError && (
            <div className="mt-2 flex items-start gap-2 px-3 py-2.5 bg-red-50 border border-red-200 rounded-lg">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0 mt-0.5 text-red-500">
                <path d="M7 1.75C4.1 1.75 1.75 4.1 1.75 7S4.1 12.25 7 12.25 12.25 9.9 12.25 7 9.9 1.75 7 1.75zm0 4.375v2.625M7 9.625h.007" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <p className="text-xs text-red-600 leading-relaxed">{statusError}</p>
            </div>
          )}
        </div>

        {/* Project — hidden for sub-tasks */}
        {projects.length > 0 && !task?.parent_task_id && (
          <div ref={projectRef} className="relative">
            <label className="block text-sm font-medium text-[#344054] mb-1.5">Project</label>
            <button
              type="button"
              onClick={() => setShowProject((v) => !v)}
              className="w-full flex items-center gap-2 border border-[#D5D7DA] rounded-lg px-3 py-2.5 text-sm bg-white hover:border-[#7F56D9] outline-none transition-colors"
            >
              <ProjectIcon width={14} height={14} className={projectId ? 'text-[#7F56D9]' : 'text-[#A4A7AE]'} />
              <span className={`flex-1 text-left truncate ${projectId ? 'text-[#181D27]' : 'text-[#A4A7AE]'}`}>
                {projects.find((p) => p.id === projectId)?.name ?? 'No Project'}
              </span>
              <ChevronDown width={15} height={15} className="text-[#717680] shrink-0" />
            </button>
            {showProject && (
              <div className="absolute top-full mt-1 left-0 right-0 z-20 bg-white border border-[#E9EAEB] rounded-xl shadow-lg py-1 max-h-52 overflow-y-auto">
                <button
                  type="button"
                  onClick={() => { setProjectId(null); setShowProject(false); }}
                  className={`flex items-center gap-2.5 w-full px-3 py-2 text-sm hover:bg-[#F9FAFB] transition-colors ${
                    !projectId ? 'text-[#6941C6] font-medium' : 'text-[#717680]'
                  }`}
                >
                  <span className="flex-1 text-left">No Project</span>
                  {!projectId && (
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7L5.5 10.5L12 3.5" stroke="#7F56D9" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  )}
                </button>
                {projects.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => { setProjectId(p.id); setShowProject(false); }}
                    className={`flex items-center gap-2.5 w-full px-3 py-2 text-sm hover:bg-[#F9FAFB] transition-colors ${
                      projectId === p.id ? 'text-[#6941C6] font-medium' : 'text-[#344054]'
                    }`}
                  >
                    <ProjectIcon width={13} height={13} className="text-[#7F56D9] shrink-0" />
                    <span className="flex-1 text-left truncate">{p.name}</span>
                    {projectId === p.id && (
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7L5.5 10.5L12 3.5" stroke="#7F56D9" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Deadline */}
        <div>
          <Input
            label="Deadline"
            type="date"
            value={deadline}
            onChange={(e) => { setDeadline(e.target.value); setDeadlineError(''); }}
            max={(() => {
              const projEnd = projects.find((p) => p.id === projectId)?.end_date;
              if (parentTaskDeadline && projEnd) return projEnd < parentTaskDeadline ? projEnd : parentTaskDeadline;
              return parentTaskDeadline ?? projEnd ?? undefined;
            })()}
          />
          {deadlineError && (
            <p className="mt-1 text-xs text-red-500">{deadlineError}</p>
          )}
        </div>

        {/* Assignees — multi-select */}
        <div>
          <p className="text-sm font-semibold text-[#181D27] mb-0.5">Assignees</p>
          <p className="text-xs text-[#717680] mb-3">Team members responsible for this task.</p>

          {/* Current assignees */}
          {assignedUsers.length > 0 ? (
            <div className="flex flex-col gap-2.5 mb-3">
              {assignedUsers.map((u) => (
                <AvatarNameRow
                  key={u.id}
                  name={u.name}
                  avatarUrl={u.avatar_url}
                  subtitle={u.email}
                  action={
                    <button
                      type="button"
                      onClick={() => toggleAssignee(u.id)}
                      className="text-xs font-semibold text-red-500 hover:text-red-600 transition-colors flex items-center gap-1"
                    >
                      <X width={12} height={12} /> Remove
                    </button>
                  }
                />
              ))}
            </div>
          ) : (
            <p className="text-[13px] text-[#A4A7AE] mb-3">No assignees</p>
          )}

          {/* Add assignee picker */}
          <div ref={pickerRef} className="relative">
            <button
              type="button"
              onClick={() => setShowPicker((v) => !v)}
              className="flex items-center gap-1.5 text-sm text-[#344054] font-medium hover:text-[#181D27] transition-colors"
            >
              <span className="w-6 h-6 rounded-full border-2 border-dashed border-[#D5D7DA] flex items-center justify-center text-[#A4A7AE] hover:border-[#7F56D9] hover:text-[#7F56D9] transition-colors">
                <Plus width={11} height={11} />
              </span>
              Add assignee
            </button>
            <AssigneePickerDropdown
              open={showPicker}
              onClose={() => setShowPicker(false)}
              anchorRef={pickerRef as React.RefObject<HTMLElement | null>}
              users={assignableUsers}
              selected={assigneeIds}
              onToggle={toggleAssignee}
            />
          </div>
        </div>

        {/* Sub Tasks — only for top-level tasks */}
        {!task.parent_task_id && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <p className="text-sm font-semibold text-[#181D27]">Sub Tasks</p>
              {(task.subtasks ?? []).length > 0 && (
                <CountBadge count={task.subtasks!.length} />
              )}
            </div>

            {(task.subtasks ?? []).length > 0 ? (
              <div className="rounded-lg border border-[#E9EAEB] overflow-hidden mb-2">
                {task.subtasks!.map((sub) => (
                  <div
                    key={sub.id}
                    className="flex items-center gap-2.5 px-3 py-2 border-b border-[#F2F4F7] last:border-0 hover:bg-[#F9FAFB] cursor-pointer transition-colors group"
                    onClick={() => {
                      if (firmId) {
                        onClose();
                        navigate(`/firms/${firmId}/tasks/${sub.id}`);
                      }
                    }}
                  >
                    <TaskIcon width={12} height={12} className="text-[#A4A7AE] shrink-0" />
                    <span className="flex-1 min-w-0 text-[13px] text-[#344054] truncate group-hover:text-[#6941C6] transition-colors">
                      {sub.title}
                    </span>
                    {(() => {
                      const s = TASK_STATUS_BADGE[sub.status];
                      return s ? (
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold shrink-0 ${s.style}`}>
                          {s.label}
                        </span>
                      ) : null;
                    })()}
                    {(sub.assignees ?? []).length > 0 && (
                      <AvatarStack
                        avatars={(sub.assignees ?? []).map((a) => ({ name: a.name, src: a.avatar_url ?? undefined }))}
                        max={4}
                        showAddButton={false}
                      />
                    )}
                    <PriorityBadge priority={sub.priority} />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[13px] text-[#A4A7AE] mb-2">No sub-tasks yet.</p>
            )}
          </div>
        )}

        {/* Attachments — universal per project */}
        <div className="pt-2 border-t border-[#F2F4F7]">
          <AttachmentsSection ref={attachmentsRef} projectId={task.project_id ?? null} />
        </div>

        {/* Timesheet */}
        <div className="border-t border-[#F2F4F7] px-5 py-3">
          <p className="text-[11px] font-semibold text-[#A4A7AE] uppercase tracking-wider mb-2.5">Timesheet</p>
          <TaskTimerRow taskId={task.id} projectId={task.project_id ?? undefined} size="md" />
        </div>

        {/* Activity — chat, files, notes per task/sub-task */}
        <div className="border-t border-[#F2F4F7]">
          <div className="flex items-center justify-between px-5 py-2.5">
            <p className="text-[11px] font-semibold text-[#A4A7AE] uppercase tracking-wider">Activity</p>
            <button
              type="button"
              onClick={() => setShowActivity((v) => !v)}
              className="text-[12px] font-medium text-[#717680] hover:text-[#6941C6] transition-colors"
            >
              {showActivity ? 'Hide' : 'Show'}
            </button>
          </div>
          {showActivity && (
            <ActivityPanel
              variant="inline"
              height={420}
              scope="task"
              scopeId={task.id}
              projectId={task.project_id ?? null}
            />
          )}
        </div>

        {/* Save error */}
        {saveError && (
          <div className="mx-4 mb-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600">
            {saveError}
          </div>
        )}

        {/* Footer */}
        <PanelFooter
          onSave={handleSave}
          onCancel={onClose}
          saving={saving}
          disabled={!title.trim()}
          secondaryAction={onViewTask ? { label: viewLabel, onClick: onViewTask } : undefined}
        />

      </div>
    </SlideOver>
  );
}
