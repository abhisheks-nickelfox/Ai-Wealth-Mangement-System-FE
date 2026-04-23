import { useState } from 'react';
import { Link01, Copy01, HelpCircle, CalendarDate, ChevronDown, Plus } from '@untitled-ui/icons-react';
import Avatar from '../ui/Avatar';
import SlideOver from '../ui/SlideOver';
import Input from '../ui/Input';
import FileUpload from '../ui/FileUpload';
import type { User } from '../../lib/api';

// ── Types ─────────────────────────────────────────────────────────────────────

interface AddProjectModalProps {
  open: boolean;
  onClose: () => void;
  firmName?: string;
  users?: User[];
  onCreate?: (data: ProjectFormData) => Promise<void>;
}

export interface ProjectFormData {
  name: string;
  description: string;
  project: string;
  tasks: string;
  startDate: string;
  endDate: string;
  assigneeIds: string[];
  priority: 'High' | 'Medium' | 'Low';
  files: File[];
}

const PRIORITY_OPTIONS = ['High', 'Medium', 'Low'] as const;
const PRIORITY_DOT: Record<string, string> = {
  High:   'bg-red-500',
  Medium: 'bg-yellow-400',
  Low:    'bg-green-500',
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function AddProjectModal({
  open,
  onClose,
  firmName = '',
  users = [],
  onCreate,
}: AddProjectModalProps) {
  const [name,        setName]        = useState('');
  const [description, setDescription] = useState('');
  const [project,     setProject]     = useState('');
  const [tasks,       setTasks]       = useState('');
  const [startDate,   setStartDate]   = useState('');
  const [endDate,     setEndDate]     = useState('');
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
  const [priority,    setPriority]    = useState<'High' | 'Medium' | 'Low'>('High');
  const [files,       setFiles]       = useState<File[]>([]);
  const [saving,      setSaving]      = useState(false);
  const [copied,      setCopied]      = useState(false);
  const [showPriorityMenu, setShowPriorityMenu] = useState(false);

  const shareLink = firmName
    ? `untitledui.com/project/${firmName.toLowerCase().replace(/\s+/g, '-')}`
    : 'untitledui.com/project/new';

  const handleCopy = () => {
    navigator.clipboard.writeText(`https://${shareLink}`).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFiles = (file: File) => {
    setFiles((prev) => [...prev, file]);
  };

  const toggleAssignee = (id: string) => {
    setAssigneeIds((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id],
    );
  };

  const handleCreate = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await onCreate?.({ name, description, project, tasks, startDate, endDate, assigneeIds, priority, files });
      handleClose();
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setName(''); setDescription(''); setProject(''); setTasks('');
    setStartDate(''); setEndDate(''); setAssigneeIds([]); setPriority('High');
    setFiles([]); setSaving(false); setCopied(false);
    onClose();
  };

  const selectedAssignees = users.filter((u) => assigneeIds.includes(u.id));

  return (
    <SlideOver
      open={open}
      onClose={handleClose}
      title={name.trim() || 'New Project'}
      subtitle={firmName ? `Project for ${firmName}` : 'Fill in the details below'}
      width="max-w-[680px]"
    >
      <div className="flex flex-col gap-5">

        {/* Share project */}
        <div>
          <p className="text-sm font-medium text-[#344054] mb-2">Share project</p>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-[#6941C6]">
              <Link01 width={16} height={16} className="shrink-0" />
              <span className="truncate max-w-[280px]">{shareLink}</span>
            </div>
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-[#D5D7DA] rounded-lg text-sm text-[#344054] bg-white hover:bg-[#F9FAFB] transition-colors shrink-0"
            >
              <Copy01 width={14} height={14} />
              {copied ? 'Copied!' : 'Copy link'}
            </button>
          </div>
        </div>

        {/* Name of project */}
        <Input
          label="Name of project"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Marketing site redesign"
          required
        />

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-[#344054] mb-1.5 flex items-center gap-1">
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

        {/* Project + Tasks row */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#344054] mb-1.5">
              Project <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                value={project}
                onChange={(e) => setProject(e.target.value)}
                className="w-full border border-[#D5D7DA] rounded-lg px-3 py-2.5 text-sm text-[#181D27] placeholder-[#A4A7AE] outline-none focus:ring-2 focus:ring-[#7F56D9] focus:border-transparent transition bg-white appearance-none pr-9"
              >
                <option value="" disabled>Select project</option>
                <option>Email Campaign management</option>
                <option>Website Redesign</option>
                <option>Brand Strategy</option>
                <option>Social Media</option>
              </select>
              <ChevronDown width={16} height={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#717680] pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#344054] mb-1.5">
              Tasks <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                value={tasks}
                onChange={(e) => setTasks(e.target.value)}
                className="w-full border border-[#D5D7DA] rounded-lg px-3 py-2.5 text-sm text-[#181D27] placeholder-[#A4A7AE] outline-none focus:ring-2 focus:ring-[#7F56D9] focus:border-transparent transition bg-white appearance-none pr-9"
              >
                <option value="" disabled>Select task type</option>
                <option>Marketing</option>
                <option>Design</option>
                <option>Development</option>
                <option>Research</option>
              </select>
              <ChevronDown width={16} height={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#717680] pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Start date + End date + Assignee + Priority row */}
        <div className="grid grid-cols-[1fr_1fr_auto_auto] gap-4 items-end">

          {/* Start date */}
          <div>
            <Input
              label="Start date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
              rightIcon={<CalendarDate width={16} height={16} className="text-[#717680] pointer-events-none" />}
            />
          </div>

          {/* End date */}
          <div>
            <Input
              label="End date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
              rightIcon={<CalendarDate width={16} height={16} className="text-[#717680] pointer-events-none" />}
            />
          </div>

          {/* Assignee */}
          <div>
            <label className="block text-sm font-medium text-[#344054] mb-1.5 whitespace-nowrap">Assignee</label>
            <div className="flex items-center gap-1.5 h-[42px]">
              {selectedAssignees.slice(0, 3).map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => toggleAssignee(u.id)}
                  title={u.name}
                  className="shrink-0"
                >
                  <Avatar name={u.name} src={u.avatar_url ?? undefined} size="sm" />
                </button>
              ))}
              {selectedAssignees.length > 3 && (
                <span className="w-7 h-7 rounded-full bg-[#F2F4F7] flex items-center justify-center text-[11px] font-semibold text-[#414651]">
                  +{selectedAssignees.length - 3}
                </span>
              )}
              {/* Picker dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {}}
                  className="w-7 h-7 rounded-full border-2 border-dashed border-[#D5D7DA] flex items-center justify-center text-[#A4A7AE] hover:border-[#7F56D9] hover:text-[#7F56D9] transition-colors"
                >
                  <Plus width={12} height={12} />
                </button>
                {/* Simple user picker */}
                {users.length > 0 && (
                  <div className="absolute bottom-full mb-2 left-0 z-10 bg-white border border-[#E9EAEB] rounded-xl shadow-lg p-2 min-w-[180px] max-h-48 overflow-y-auto hidden group-focus-within:block">
                    {users.map((u) => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => toggleAssignee(u.id)}
                        className="flex items-center gap-2 w-full px-2 py-1.5 rounded-lg hover:bg-[#F9FAFB] text-left"
                      >
                        <Avatar name={u.name} src={u.avatar_url ?? undefined} size="xs" />
                        <span className="text-sm text-[#344054] truncate">{u.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Priority */}
          <div className="relative">
            <label className="block text-sm font-medium text-[#344054] mb-1.5">
              Priority <span className="text-red-500">*</span>
            </label>
            <button
              type="button"
              onClick={() => setShowPriorityMenu((v) => !v)}
              className="w-full border border-[#D5D7DA] rounded-lg px-3 py-2.5 text-sm text-[#181D27] outline-none focus:ring-2 focus:ring-[#7F56D9] focus:border-transparent transition bg-white flex items-center gap-2 pr-9 whitespace-nowrap"
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

        {/* Upload files */}
        <div>
          <label className="block text-sm font-medium text-[#344054] mb-1.5">
            Upload files <span className="text-red-500">*</span>
          </label>
          <FileUpload
            accept="image/svg+xml,image/png,image/jpeg,image/gif"
            onFile={handleFiles}
          />
          {files.length > 0 && (
            <p className="text-xs text-[#6941C6] font-medium mt-2">
              {files.length} file{files.length > 1 ? 's' : ''} selected
            </p>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex items-center border-t border-[#E9EAEB] pt-4">
          <button
            type="button"
            className="text-sm font-semibold text-[#6941C6] hover:text-[#53389E] hover:underline mr-auto transition-colors"
          >
            Save filter
          </button>
          <div className="flex items-center gap-3">
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
              disabled={saving || !name.trim()}
              className="px-4 py-2.5 rounded-lg bg-[#7F56D9] hover:bg-[#6941C6] disabled:opacity-50 text-white text-sm font-semibold transition-colors"
            >
              {saving ? 'Creating…' : 'Create'}
            </button>
          </div>
        </div>

      </div>
    </SlideOver>
  );
}
