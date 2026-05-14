import { useState, useEffect, useRef } from 'react';
import { ChevronDown, Plus, X } from '@untitled-ui/icons-react';
import Avatar from '../ui/Avatar';
import AvatarStack from '../ui/AvatarStack';
import SlideOver from '../ui/SlideOver';
import Input from '../ui/Input';
import AttachmentsSection, { type AttachmentsSectionHandle } from '../tasks/AttachmentsSection';
import { useClickOutside } from '../../hooks/useClickOutside';
import { useTasks } from '../../hooks/useTasks';
import type { User, Task } from '../../lib/api';
import { TASK_STATUS_BADGE } from './TaskRow';
import TaskIcon from '../icons/TaskIcon';

// ── Types ─────────────────────────────────────────────────────────────────────

export type ProjectStatus = 'In progress' | 'To Do' | 'In Review' | 'Approved' | 'Completed' | 'Blocked';

export interface ProjectDetail {
  id:              string;
  name:            string;
  description?:    string;
  status:          ProjectStatus;
  workflowStatus?: string;
  memberIds:       string[];
  firmName:        string;
  firmAbbr:        string;
  startDate?:      string;
  endDate?:        string;
  priority?:       'high' | 'medium' | 'low';
  createdAt?:      string;
}

interface ProjectDetailPanelProps {
  open:        boolean;
  onClose:     () => void;
  project:     ProjectDetail | null;
  users:       User[];
  onSave?:       (updated: ProjectDetail) => Promise<void>;
  onViewTask?:   (projectId: string) => void;
  onOpenTask?:   (task: Task) => void;
  onArchive?:    (projectId: string) => void;
  onDelete?:     (project: ProjectDetail) => void;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const STATUS_OPTIONS: { value: ProjectStatus; dot: string }[] = [
  { value: 'To Do',       dot: 'bg-[#A4A7AE]' },
  { value: 'In progress', dot: 'bg-[#17B26A]' },
  { value: 'In Review',   dot: 'bg-[#F79009]' },
  { value: 'Approved',    dot: 'bg-[#6941C6]' },
  { value: 'Completed',   dot: 'bg-[#181D27]' },
  { value: 'Blocked',     dot: 'bg-red-500'   },
];

const PRIORITY_OPTIONS: { value: 'high' | 'medium' | 'low'; label: string; dot: string }[] = [
  { value: 'high',   label: 'High',   dot: 'bg-red-400'    },
  { value: 'medium', label: 'Medium', dot: 'bg-yellow-400' },
  { value: 'low',    label: 'Low',    dot: 'bg-green-500'  },
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function ProjectDetailPanel({
  open, onClose, project, users,
  onSave, onViewTask, onOpenTask,
}: ProjectDetailPanelProps) {

  // ── state ──
  const [name,        setName]        = useState('');
  const [description, setDescription] = useState('');
  const [status,      setStatus]      = useState<ProjectStatus>('To Do');
  const [priority,    setPriority]    = useState<'high' | 'medium' | 'low'>('medium');
  const [memberIds,   setMemberIds]   = useState<string[]>([]);
  const [startDate,   setStartDate]   = useState('');
  const [endDate,     setEndDate]     = useState('');
  const [saving,      setSaving]      = useState(false);
  const [dateError,   setDateError]   = useState('');
  const [saveError,   setSaveError]   = useState('');

  const [showStatus,   setShowStatus]   = useState(false);
  const [showPriority, setShowPriority] = useState(false);
  const [showPicker,   setShowPicker]   = useState(false);

  const statusRef      = useRef<HTMLDivElement>(null);
  const priorityRef    = useRef<HTMLDivElement>(null);
  const pickerRef      = useRef<HTMLDivElement>(null);
  const attachmentsRef = useRef<AttachmentsSectionHandle>(null);
  useClickOutside(statusRef,   () => setShowStatus(false));
  useClickOutside(priorityRef, () => setShowPriority(false));
  useClickOutside(pickerRef,   () => setShowPicker(false));

  // ── data ──
  const { data: projectTasks = [] } = useTasks(
    project?.id ? { project_id: project.id } : undefined
  );

  // ── sync on open ──
  useEffect(() => {
    if (project && open) {
      setName(project.name);
      setDescription(project.description ?? '');
      setStatus(project.status);
      setPriority(project.priority ?? 'medium');
      setMemberIds(project.memberIds);
      setStartDate(project.startDate ?? '');
      setEndDate(project.endDate ?? '');
      setDateError('');
      setSaveError('');
    }
  }, [project, open]);

  if (!project) return null;

  const assignedUsers = users.filter((u) => memberIds.includes(u.id));
  const statusOpt   = STATUS_OPTIONS.find((s) => s.value === status) ?? STATUS_OPTIONS[0];
  const priorityOpt = PRIORITY_OPTIONS.find((p) => p.value === priority) ?? PRIORITY_OPTIONS[1];

  const toggleMember = (userId: string) =>
    setMemberIds((prev) => prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaveError('');
    setDateError('');
    if (startDate && endDate && endDate < startDate) {
      setDateError('End date must be after start date.');
      return;
    }
    setSaving(true);
    try {
      await onSave?.({ ...project, name, description, status, priority, memberIds, startDate, endDate });
      await attachmentsRef.current?.commit();
      onClose();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save project.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SlideOver
      open={open}
      onClose={onClose}
      title={project.name}
      subtitle={project.firmName}
      width="max-w-[480px]"
    >
      <div className="flex flex-col gap-5">

        {/* Meta pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-2.5 py-1 rounded-full bg-[#F4F3FF] text-[12px] font-medium text-[#6941C6]">
            Project
          </span>
          {project.firmName && (
            <span className="px-2.5 py-1 rounded-full bg-[#F2F4F7] text-[12px] font-medium text-[#414651]">
              {project.firmName}
            </span>
          )}
          {project.createdAt && (
            <span className="px-2.5 py-1 rounded-full bg-[#F2F4F7] text-[12px] font-medium text-[#717680]">
              Created {new Date(project.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          )}
        </div>

        {/* Project name */}
        <Input
          label="Project name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-[#344054] mb-1.5">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the project…"
            rows={3}
            className="w-full border border-[#D5D7DA] rounded-lg px-3 py-2.5 text-sm text-[#181D27] placeholder-[#A4A7AE] outline-none focus:ring-2 focus:ring-[#7F56D9] focus:border-transparent transition bg-white resize-none"
          />
        </div>

        {/* Status */}
        <div ref={statusRef} className="relative">
          <label className="block text-sm font-medium text-[#344054] mb-1.5">Status</label>
          <button
            type="button"
            onClick={() => setShowStatus((v) => !v)}
            className="w-full flex items-center gap-2 border border-[#D5D7DA] rounded-lg px-3 py-2.5 text-sm text-[#181D27] bg-white hover:border-[#7F56D9] outline-none transition-colors"
          >
            <span className={`w-2 h-2 rounded-full shrink-0 ${statusOpt.dot}`} />
            <span className="flex-1 text-left">{status}</span>
            <ChevronDown width={15} height={15} className="text-[#717680] shrink-0" />
          </button>
          {showStatus && (
            <div className="absolute top-full mt-1 left-0 right-0 z-20 bg-white border border-[#E9EAEB] rounded-xl shadow-lg py-1">
              {STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => { setStatus(opt.value); setShowStatus(false); }}
                  className={`flex items-center gap-2.5 w-full px-3 py-2 text-sm hover:bg-[#F9FAFB] transition-colors ${
                    status === opt.value ? 'text-[#6941C6] font-medium' : 'text-[#344054]'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full shrink-0 ${opt.dot}`} />
                  {opt.value}
                </button>
              ))}
            </div>
          )}
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

        {/* Dates */}
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Start Date"
            type="date"
            value={startDate}
            onChange={(e) => { setStartDate(e.target.value); setDateError(''); }}
          />
          <Input
            label="End Date"
            type="date"
            value={endDate}
            onChange={(e) => { setEndDate(e.target.value); setDateError(''); }}
          />
        </div>
        {dateError && <p className="text-xs text-red-500 -mt-3">{dateError}</p>}

        {/* Assignees */}
        <div>
          <p className="text-sm font-semibold text-[#181D27] mb-0.5">Assignees</p>
          <p className="text-xs text-[#717680] mb-3">Team members assigned to this project.</p>

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
                    onClick={() => toggleMember(u.id)}
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
                {users.map((u) => {
                  const selected = memberIds.includes(u.id);
                  return (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => toggleMember(u.id)}
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
                })}
              </div>
            )}
          </div>
        </div>

        {/* Sub Tasks */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <p className="text-sm font-semibold text-[#181D27]">Tasks</p>
            {projectTasks.length > 0 && (
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#F4F3FF] text-[10px] font-bold text-[#7F56D9]">
                {projectTasks.length}
              </span>
            )}
          </div>

          {projectTasks.length > 0 ? (
            <div className="rounded-lg border border-[#E9EAEB] overflow-hidden mb-2">
              {projectTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center gap-2.5 px-3 py-2 border-b border-[#F2F4F7] last:border-0 hover:bg-[#F9FAFB] transition-colors group"
                >
                  <TaskIcon width={12} height={12} className="text-[#A4A7AE] shrink-0" />
                  <button
                    type="button"
                    onClick={() => onOpenTask?.(task)}
                    className="flex-1 min-w-0 text-[13px] text-[#344054] truncate text-left hover:text-[#7F56D9] transition-colors"
                  >
                    {task.title}
                  </button>
                  {(() => {
                    const s = TASK_STATUS_BADGE[task.status];
                    return s ? (
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold shrink-0 ${s.style}`}>
                        {s.label}
                      </span>
                    ) : null;
                  })()}
                  {(task.assignees ?? []).length > 0 && (
                    <AvatarStack
                      avatars={(task.assignees ?? []).map((a) => ({ name: a.name, src: a.avatar_url ?? undefined }))}
                      max={3}
                    />
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[13px] text-[#A4A7AE] mb-2">No tasks yet.</p>
          )}
        </div>

        {/* Attachments */}
        <div className="pt-2 border-t border-[#F2F4F7]">
          <AttachmentsSection ref={attachmentsRef} projectId={project.id} />
        </div>

        {/* Save error */}
        {saveError && (
          <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600">
            {saveError}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center gap-3 pt-4 border-t border-[#E9EAEB]">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !name.trim()}
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
                onClick={() => onViewTask(project.id)}
                className="px-4 py-2.5 rounded-lg bg-[#7F56D9] text-white text-sm font-semibold hover:bg-[#6941C6] transition-colors"
              >
                View Project
              </button>
            )}
          </div>
        </div>

      </div>
    </SlideOver>
  );
}
