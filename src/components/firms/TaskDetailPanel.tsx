import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { HelpCircle, ChevronDown, ChevronRight, Plus, X } from '@untitled-ui/icons-react';
import ProjectIcon from '../icons/ProjectIcon';
import TaskIcon from '../icons/TaskIcon';
import Avatar from '../ui/Avatar';
import AvatarStack from '../ui/AvatarStack';
import SlideOver from '../ui/SlideOver';
import Input from '../ui/Input';
import { useClickOutside } from '../../hooks/useClickOutside';
import type { Task, User, Project } from '../../lib/api';
import { TASK_STATUS_BADGE } from './TaskRow';

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
  { value: 'normal', label: 'Medium', dot: 'bg-yellow-400' },
  { value: 'low',    label: 'Low',    dot: 'bg-green-500'  },
];

const STATUS_LABELS: Record<string, string> = {
  to_do:           'To Do',
  assigned:        'Assigned',
  in_progress:     'In Progress',
  revisions:       'Revisions',
  internal_review: 'Internal Review',
  client_review:   'Client Review',
  completed:       'Completed',
  blocked:         'Blocked',
};

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
  const [saving,        setSaving]       = useState(false);
  const [deadlineError, setDeadlineError] = useState('');
  const [saveError,     setSaveError]     = useState('');

  const [showPriority, setShowPriority] = useState(false);
  const [showPicker,   setShowPicker]   = useState(false);
  const [showProject,  setShowProject]  = useState(false);

  const priorityRef = useRef<HTMLDivElement>(null);
  const pickerRef   = useRef<HTMLDivElement>(null);
  const projectRef  = useRef<HTMLDivElement>(null);
  useClickOutside(priorityRef, () => setShowPriority(false));
  useClickOutside(pickerRef,   () => setShowPicker(false));
  useClickOutside(projectRef,  () => setShowProject(false));

  // Sync fields when task changes or panel opens
  useEffect(() => {
    if (task && open) {
      setTitle(task.title);
      setDescription(task.description ?? '');
      setPriority(task.priority ?? 'normal');
      setDeadline(task.deadline ?? '');
      setProjectId(task.project_id ?? null);
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

    if (task.status === 'completed' || task.status === 'blocked') {
      setSaveError(`This task is ${task.status} and cannot be edited.`);
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
      onClose();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save task. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Breadcrumb: Firm › Type › Status
  const firmName   = task.firms?.name ?? '';
  const typeLabel  = TYPE_LABELS[task.type]   ?? task.type;
  const statusLabel = STATUS_LABELS[task.status] ?? task.status;

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
            <span className="font-medium text-[#7F56D9]">{statusLabel}</span>
          </nav>
        )}

        {/* Read-only meta pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-2.5 py-1 rounded-full bg-[#F2F4F7] text-[12px] font-medium text-[#414651]">
            {typeLabel}
          </span>
          <span className="px-2.5 py-1 rounded-full bg-[#F2F4F7] text-[12px] font-medium text-[#414651]">
            {statusLabel}
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

        {/* Project */}
        {projects.length > 0 && (
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
                <div key={u.id} className="flex items-center gap-3">
                  <Avatar name={u.name} src={u.avatar_url ?? undefined} size="sm" className="shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#181D27] truncate">{u.name}</p>
                    <p className="text-xs text-[#717680] truncate">{u.email}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleAssignee(u.id)}
                    className="text-xs font-semibold text-red-500 hover:text-red-600 shrink-0 transition-colors flex items-center gap-1"
                  >
                    <X width={12} height={12} /> Remove
                  </button>
                </div>
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

            {showPicker && (
              <div className="absolute top-full mt-1 left-0 z-20 bg-white border border-[#E9EAEB] rounded-xl shadow-lg py-1 w-64 max-h-52 overflow-y-auto">
                {users.length === 0 ? (
                  <p className="px-3 py-2 text-sm text-[#717680]">No users available</p>
                ) : (
                  users.map((u) => {
                    const selected = assigneeIds.includes(u.id);
                    return (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => toggleAssignee(u.id)}
                        className="flex items-center gap-2.5 w-full px-3 py-2 text-left hover:bg-[#F9FAFB] transition-colors"
                      >
                        <Avatar name={u.name} src={u.avatar_url ?? undefined} size="xs" className="shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-[#344054] font-medium truncate">{u.name}</p>
                          <p className="text-xs text-[#717680] truncate">{u.email}</p>
                        </div>
                        {selected && (
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                            <path d="M2 7L5.5 10.5L12 3.5" stroke="#7F56D9" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>

        {/* Sub Tasks — only for top-level tasks */}
        {!task.parent_task_id && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <p className="text-sm font-semibold text-[#181D27]">Sub Tasks</p>
              {(task.subtasks ?? []).length > 0 && (
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#F4F3FF] text-[10px] font-bold text-[#7F56D9]">
                  {task.subtasks!.length}
                </span>
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
                        max={3}
                        showAddButton={false}
                      />
                    )}
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold capitalize shrink-0 ${
                      sub.priority === 'urgent' ? 'bg-red-100 text-red-600'
                      : sub.priority === 'high' ? 'bg-orange-100 text-orange-600'
                      : sub.priority === 'normal' ? 'bg-yellow-100 text-yellow-600'
                      : 'bg-green-100 text-green-600'
                    }`}>
                      {sub.priority}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[13px] text-[#A4A7AE] mb-2">No sub-tasks yet.</p>
            )}
          </div>
        )}

        {/* Save error */}
        {saveError && (
          <div className="mx-4 mb-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600">
            {saveError}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center gap-3 pt-4 border-t border-[#E9EAEB]">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !title.trim()}
            className="text-sm font-semibold text-[#344054] hover:text-[#181D27] transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-lg border border-[#D5D7DA] bg-white text-sm font-semibold text-[#344054] hover:bg-[#F9FAFB] transition-colors"
            >
              Cancel
            </button>
            {onViewTask && (
              <button
                type="button"
                onClick={onViewTask}
                className="px-4 py-2.5 rounded-lg bg-[#7F56D9] text-white text-sm font-semibold hover:bg-[#6941C6] transition-colors"
              >
                {viewLabel}
              </button>
            )}
          </div>
        </div>

      </div>
    </SlideOver>
  );
}
