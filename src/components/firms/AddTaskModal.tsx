import { useState, useRef, useEffect } from 'react';
import {
  HelpCircle,
  CalendarDate,
  ChevronDown,
  Plus,
  X,
  UploadCloud01,
  Trash01,
} from '@untitled-ui/icons-react';
import Avatar from '../ui/Avatar';
import SlideOver from '../ui/SlideOver';
import Input from '../ui/Input';
import { useClickOutside } from '../../hooks/useClickOutside';
import { useTaskTypes } from '../../hooks/useTaskTypes';
import type { User, Project } from '../../lib/api';

// ── Types ─────────────────────────────────────────────────────────────────────

interface AddTaskModalProps {
  open: boolean;
  onClose: () => void;
  firmName?: string;
  users?: User[];
  projects?: Project[];
  /** Pre-select a project when opened from within a project row. */
  defaultProjectId?: string;
  /** Pre-set the initial task status when opened from within a status section. */
  defaultStatus?: string;
  onCreate?: (data: TaskFormData) => Promise<void>;
}

export interface TaskFormData {
  title: string;
  description: string;
  type: string;
  priority: TaskPriority;
  projectId: string;
  assigneeIds: string[];
  startDate: string;
  endDate: string;
  files: File[];
  initialStatus?: string;
}

type TaskPriority = 'High' | 'Medium' | 'Low' | 'Urgent';
type TaskSubtype  = 'task' | 'subtask';

const SUBTASK_OPTIONS: { value: TaskSubtype; label: string }[] = [
  { value: 'task',    label: 'Task' },
  { value: 'subtask', label: 'Subtask' },
];

const PRIORITY_OPTIONS = ['Urgent', 'High', 'Medium', 'Low'] as const;
const PRIORITY_DOT: Record<string, string> = {
  Urgent: 'bg-red-500',
  High:   'bg-orange-400',
  Medium: 'bg-yellow-400',
  Low:    'bg-green-500',
};

// ── Assignee picker (multi) ───────────────────────────────────────────────────

function AssigneePicker({
  users,
  selected,
  onToggle,
}: {
  users: User[];
  selected: string[];
  onToggle: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setOpen(false));

  const selectedUsers = users.filter((u) => selected.includes(u.id));
  const extra = selectedUsers.length > 3 ? selectedUsers.length - 3 : 0;

  return (
    <div ref={ref} className="relative">
      <label className="block text-sm font-medium text-[#344054] mb-1.5 whitespace-nowrap">
        Assignee
      </label>
      <div className="flex items-center gap-1 h-[42px]">
        {selectedUsers.slice(0, 3).map((u) => (
          <button
            key={u.id}
            type="button"
            onClick={() => onToggle(u.id)}
            title={`Remove ${u.name}`}
            className="relative group shrink-0"
          >
            <Avatar name={u.name} src={u.avatar_url ?? undefined} size="sm" />
            <span className="absolute -top-0.5 -right-0.5 hidden group-hover:flex w-3.5 h-3.5 bg-red-500 rounded-full items-center justify-center">
              <X width={8} height={8} className="text-white" />
            </span>
          </button>
        ))}
        {extra > 0 && (
          <span className="w-7 h-7 rounded-full bg-[#F2F4F7] flex items-center justify-center text-[11px] font-semibold text-[#414651] border-2 border-white -ml-1 shrink-0">
            +{extra}
          </span>
        )}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="w-7 h-7 rounded-full border-2 border-dashed border-[#D5D7DA] flex items-center justify-center text-[#A4A7AE] hover:border-[#7F56D9] hover:text-[#7F56D9] transition-colors shrink-0 ml-0.5"
        >
          <Plus width={12} height={12} />
        </button>
      </div>

      {open && (
        <div className="absolute top-full mt-1 left-0 z-20 bg-white border border-[#E9EAEB] rounded-xl shadow-lg py-1 min-w-[220px] max-h-52 overflow-y-auto">
          {users.length === 0 ? (
            <p className="px-3 py-2 text-sm text-[#717680]">No team members</p>
          ) : (
            users.map((u) => {
              const checked = selected.includes(u.id);
              return (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => onToggle(u.id)}
                  className="flex items-center gap-2.5 w-full px-3 py-2 hover:bg-[#F9FAFB] text-left"
                >
                  <Avatar name={u.name} src={u.avatar_url ?? undefined} size="xs" />
                  <span className="flex-1 text-sm text-[#344054] truncate">{u.name}</span>
                  {checked && (
                    <span className="w-4 h-4 rounded-full bg-[#7F56D9] flex items-center justify-center shrink-0">
                      <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                        <path d="M1 3L3 5L7 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

// ── File upload zone ──────────────────────────────────────────────────────────

interface UploadedFile { file: File; preview: string | null }

function FileUploadZone({ files, onAdd, onRemove }: {
  files: UploadedFile[];
  onAdd: (f: File) => void;
  onRemove: (idx: number) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function handleFiles(list: FileList | null) {
    if (!list) return;
    Array.from(list).forEach((f) => onAdd(f));
  }

  return (
    <div className="flex flex-col gap-3">
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
        className={`flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-xl px-6 py-8 cursor-pointer transition-colors select-none ${
          dragging
            ? 'border-[#7F56D9] bg-[#F4F3FF]'
            : 'border-[#D5D7DA] bg-white hover:border-[#7F56D9] hover:bg-[#F9F5FF]'
        }`}
      >
        <div className="flex items-center justify-center w-10 h-10 rounded-full border border-[#E9EAEB] bg-white shadow-sm">
          <UploadCloud01 width={20} height={20} className="text-[#535862]" />
        </div>
        <div className="text-center">
          <p className="text-sm text-[#535862]">
            <span className="font-semibold text-[#6941C6]">Click to upload</span>{' '}
            or drag and drop
          </p>
          <p className="text-xs text-[#A4A7AE] mt-0.5">SVG, PNG, JPG or GIF (max. 800×400px)</p>
        </div>
      </div>

      {files.length > 0 && (
        <div className="flex flex-col gap-2">
          {files.map(({ file, preview }, idx) => (
            <div key={idx} className="flex items-center gap-3 p-3 border border-[#E9EAEB] rounded-lg bg-white">
              {preview ? (
                <img src={preview} alt={file.name} className="w-10 h-10 rounded-lg object-cover shrink-0 border border-[#E9EAEB]" />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-[#F2F4F7] flex items-center justify-center shrink-0">
                  <UploadCloud01 width={16} height={16} className="text-[#717680]" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#344054] truncate">{file.name}</p>
                <p className="text-xs text-[#717680]">{(file.size / 1024).toFixed(0)} KB</p>
              </div>
              <button type="button" onClick={() => onRemove(idx)} className="shrink-0 text-[#717680] hover:text-[#D92D20] transition-colors p-1 rounded">
                <Trash01 width={14} height={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/svg+xml,image/png,image/jpeg,image/gif"
        multiple
        className="hidden"
        onChange={(e) => { handleFiles(e.target.files); e.target.value = ''; }}
      />
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function AddTaskModal({
  open,
  onClose,
  firmName = '',
  users = [],
  projects = [],
  defaultProjectId = '',
  defaultStatus,
  onCreate,
}: AddTaskModalProps) {
  const { data: taskTypes = [] } = useTaskTypes();

  const [taskTypeId,  setTaskTypeId]  = useState('');
  const [title,       setTitle]       = useState('');
  const [description, setDescription] = useState('');
  const [projectId,   setProjectId]   = useState(defaultProjectId);
  const [subtype,     setSubtype]     = useState<TaskSubtype>('task');
  const [startDate,   setStartDate]   = useState('');
  const [endDate,     setEndDate]     = useState('');
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
  const [priority,    setPriority]    = useState<TaskPriority>('High');
  const [files,       setFiles]       = useState<UploadedFile[]>([]);
  const [saving,      setSaving]      = useState(false);

  const [showTypeMenu,     setShowTypeMenu]     = useState(false);
  const [showProjectMenu,  setShowProjectMenu]  = useState(false);
  const [showSubtypeMenu,  setShowSubtypeMenu]  = useState(false);
  const [showPriorityMenu, setShowPriorityMenu] = useState(false);

  // Sync projectId whenever the modal opens with a new default
  useEffect(() => {
    if (open) setProjectId(defaultProjectId);
  }, [open, defaultProjectId]);

  const typeRef     = useRef<HTMLDivElement>(null);
  const projectRef  = useRef<HTMLDivElement>(null);
  const subtypeRef  = useRef<HTMLDivElement>(null);
  const priorityRef = useRef<HTMLDivElement>(null);

  useClickOutside(typeRef,     () => setShowTypeMenu(false));
  useClickOutside(projectRef,  () => setShowProjectMenu(false));
  useClickOutside(subtypeRef,  () => setShowSubtypeMenu(false));
  useClickOutside(priorityRef, () => setShowPriorityMenu(false));

  const toggleAssignee = (id: string) =>
    setAssigneeIds((prev) => prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]);

  function addFile(f: File) {
    const preview = f.type.startsWith('image/') ? URL.createObjectURL(f) : null;
    setFiles((prev) => [...prev, { file: f, preview }]);
  }

  function removeFile(idx: number) {
    setFiles((prev) => {
      const copy = [...prev];
      const removed = copy.splice(idx, 1)[0];
      if (removed.preview) URL.revokeObjectURL(removed.preview);
      return copy;
    });
  }

  const handleCreate = async () => {
    if (!title.trim() || !taskTypeId || !projectId) return;
    const selected = taskTypes.find((t) => t.id === taskTypeId);
    setSaving(true);
    try {
      await onCreate?.({
        title,
        description,
        type:          selected?.name ?? taskTypeId,
        priority,
        projectId,
        assigneeIds,
        startDate,
        endDate,
        files:         files.map((f) => f.file),
        initialStatus: defaultStatus,
      });
      handleClose();
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    files.forEach((f) => { if (f.preview) URL.revokeObjectURL(f.preview); });
    setTaskTypeId(''); setTitle(''); setDescription('');
    setProjectId(defaultProjectId); setSubtype('task'); setStartDate('');
    setEndDate(''); setAssigneeIds([]); setPriority('High');
    setFiles([]); setSaving(false);
    onClose();
  };

  const selectedTaskType     = taskTypes.find((t) => t.id === taskTypeId);
  const selectedProjectLabel = projects.find((p) => p.id === projectId)?.name ?? '';
  const selectedSubtypeLabel = SUBTASK_OPTIONS.find((o) => o.value === subtype)?.label ?? 'Task';

  return (
    <SlideOver
      open={open}
      onClose={handleClose}
      title={title.trim() || 'Create a Task'}
      subtitle={firmName ? firmName : 'Fill in the details below'}
      width="max-w-[680px]"
      footer={
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2.5 rounded-lg border border-[#D5D7DA] bg-white text-sm font-semibold text-[#344054] hover:bg-[#F9FAFB] transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleCreate}
            disabled={saving || !title.trim() || !taskTypeId || !projectId}
            className="px-4 py-2.5 rounded-lg bg-[#7F56D9] hover:bg-[#6941C6] disabled:opacity-50 text-white text-sm font-semibold transition-colors"
          >
            {saving ? 'Creating…' : 'Create'}
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-5">

        {/* Task type — dynamic from project settings */}
        <div ref={typeRef} className="relative">
          <label className="block text-sm font-medium text-[#344054] mb-1.5">
            Task Type <span className="text-red-500">*</span>
          </label>
          <button
            type="button"
            onClick={() => setShowTypeMenu((v) => !v)}
            className="w-full flex items-center justify-between border border-[#D5D7DA] rounded-lg px-3 py-2.5 text-sm text-[#181D27] bg-white hover:border-[#7F56D9] focus:ring-2 focus:ring-[#7F56D9] outline-none transition-colors"
          >
            {selectedTaskType ? (
              <span className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: selectedTaskType.color ?? '#6B7280' }}
                />
                {selectedTaskType.name}
              </span>
            ) : (
              <span className="text-[#A4A7AE]">Select task type</span>
            )}
            <ChevronDown width={16} height={16} className="text-[#717680] shrink-0" />
          </button>
          {showTypeMenu && (
            <div className="absolute top-full mt-1 left-0 right-0 z-20 bg-white border border-[#E9EAEB] rounded-xl shadow-lg py-1 max-h-52 overflow-y-auto">
              {taskTypes.length === 0 ? (
                <p className="px-3 py-2 text-sm text-[#717680]">No task types configured</p>
              ) : (
                taskTypes.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => { setTaskTypeId(t.id); setShowTypeMenu(false); }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-[#F9FAFB] ${taskTypeId === t.id ? 'text-[#7F56D9] font-semibold' : 'text-[#344054]'}`}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: t.color ?? '#6B7280' }}
                    />
                    {t.name}
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* Task name */}
        <Input
          label="Name of project"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Design homepage hero section"
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
            placeholder="A little about the company and the team that you'll be working with."
            rows={4}
            className="w-full border border-[#D5D7DA] rounded-lg px-3 py-2.5 text-sm text-[#181D27] placeholder-[#A4A7AE] outline-none focus:ring-2 focus:ring-[#7F56D9] focus:border-transparent transition bg-white resize-none"
          />
        </div>

        {/* Project + Tasks/Subtask — 2-col row */}
        <div className="grid grid-cols-2 gap-4">

          {/* Project */}
          <div ref={projectRef} className="relative">
            <label className="block text-sm font-medium text-[#344054] mb-1.5">
              Project <span className="text-red-500">*</span>
            </label>
            <button
              type="button"
              onClick={() => setShowProjectMenu((v) => !v)}
              className={`w-full flex items-center justify-between border rounded-lg px-3 py-2.5 text-sm bg-white hover:border-[#7F56D9] focus:ring-2 focus:ring-[#7F56D9] outline-none transition-colors ${
                !projectId ? 'border-[#D5D7DA]' : 'border-[#D5D7DA]'
              }`}
            >
              {selectedProjectLabel
                ? <span className="truncate text-[#181D27]">{selectedProjectLabel}</span>
                : <span className="text-[#A4A7AE]">Select a project</span>
              }
              <ChevronDown width={16} height={16} className="text-[#717680] shrink-0 ml-2" />
            </button>
            {showProjectMenu && (
              <div className="absolute top-full mt-1 left-0 right-0 z-20 bg-white border border-[#E9EAEB] rounded-xl shadow-lg py-1 max-h-52 overflow-y-auto">
                {projects.length === 0 ? (
                  <p className="px-3 py-2 text-sm text-[#717680]">No projects available</p>
                ) : (
                  projects.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => { setProjectId(p.id); setShowProjectMenu(false); }}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-[#F9FAFB] ${projectId === p.id ? 'text-[#7F56D9] font-semibold' : 'text-[#344054]'}`}
                    >
                      {p.name}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Tasks/Subtask */}
          <div ref={subtypeRef} className="relative">
            <label className="block text-sm font-medium text-[#344054] mb-1.5">
              Tasks/Subtask <span className="text-red-500">*</span>
            </label>
            <button
              type="button"
              onClick={() => setShowSubtypeMenu((v) => !v)}
              className="w-full flex items-center justify-between border border-[#D5D7DA] rounded-lg px-3 py-2.5 text-sm text-[#181D27] bg-white hover:border-[#7F56D9] focus:ring-2 focus:ring-[#7F56D9] outline-none transition-colors"
            >
              <span>{selectedSubtypeLabel}</span>
              <ChevronDown width={16} height={16} className="text-[#717680] shrink-0" />
            </button>
            {showSubtypeMenu && (
              <div className="absolute top-full mt-1 left-0 right-0 z-20 bg-white border border-[#E9EAEB] rounded-xl shadow-lg py-1">
                {SUBTASK_OPTIONS.map((o) => (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => { setSubtype(o.value); setShowSubtypeMenu(false); }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-[#F9FAFB] ${subtype === o.value ? 'text-[#7F56D9] font-semibold' : 'text-[#344054]'}`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Start date / End date / Assignee / Priority — 4-col row */}
        <div className="grid grid-cols-[1fr_1fr_auto_auto] gap-4 items-end">

          <Input
            label="Start date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
            rightIcon={<CalendarDate width={16} height={16} className="text-[#717680] pointer-events-none" />}
          />

          <Input
            label="End date"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            required
            rightIcon={<CalendarDate width={16} height={16} className="text-[#717680] pointer-events-none" />}
          />

          <AssigneePicker users={users} selected={assigneeIds} onToggle={toggleAssignee} />

          {/* Priority */}
          <div ref={priorityRef} className="relative">
            <label className="block text-sm font-medium text-[#344054] mb-1.5">
              Priority <span className="text-red-500">*</span>
            </label>
            <button
              type="button"
              onClick={() => setShowPriorityMenu((v) => !v)}
              className="w-full border border-[#D5D7DA] rounded-lg px-3 py-2.5 text-sm text-[#181D27] outline-none focus:ring-2 focus:ring-[#7F56D9] transition bg-white flex items-center gap-2 whitespace-nowrap"
            >
              <span className={`w-2 h-2 rounded-full shrink-0 ${PRIORITY_DOT[priority]}`} />
              {priority}
              <ChevronDown width={14} height={14} className="ml-auto text-[#717680]" />
            </button>
            {showPriorityMenu && (
              <div className="absolute bottom-full mb-1 left-0 z-10 bg-white border border-[#E9EAEB] rounded-xl shadow-lg py-1 min-w-[130px]">
                {PRIORITY_OPTIONS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => { setPriority(p); setShowPriorityMenu(false); }}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-[#344054] hover:bg-[#F9FAFB]"
                  >
                    <span className={`w-2 h-2 rounded-full shrink-0 ${PRIORITY_DOT[p]}`} />
                    {p}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Assignee chips */}
        {assigneeIds.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {users.filter((u) => assigneeIds.includes(u.id)).map((u) => (
              <div key={u.id} className="flex items-center gap-1.5 px-2.5 py-1 bg-[#F9F5FF] border border-[#E9D7FE] rounded-full">
                <Avatar name={u.name} src={u.avatar_url ?? undefined} size="xs" />
                <span className="text-xs font-medium text-[#6941C6] max-w-[120px] truncate">{u.name}</span>
                <button type="button" onClick={() => toggleAssignee(u.id)} className="text-[#9E77ED] hover:text-[#6941C6]">
                  <X width={12} height={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Upload files */}
        <div>
          <label className="block text-sm font-medium text-[#344054] mb-1.5">
            Upload files <span className="text-red-500">*</span>
          </label>
          <FileUploadZone files={files} onAdd={addFile} onRemove={removeFile} />
        </div>

      </div>
    </SlideOver>
  );
}
