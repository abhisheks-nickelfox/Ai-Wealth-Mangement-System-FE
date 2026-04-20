import { useState, useEffect } from 'react';
import {
  X,
  ChevronDown,
  AlertCircle,
  Users01,
  Archive,
  UploadCloud01,
} from '@untitled-ui/icons-react';
import Avatar from '../ui/Avatar';
import { tasksApi } from '../../lib/api';
import type { Task, User } from '../../lib/api';
import { PriorityBadge, TaskStatusBadge } from './TaskBadges';
import { formatDateInput } from '../../lib/transcriptUtils';
import ApprovalConfirmModal from './ApprovalConfirmModal';

export interface TaskDetailPanelProps {
  task: Task | null;
  open: boolean;
  onClose: () => void;
  users: User[];
  onSaved: (updated: Task) => void;
  onIgnored: (id: string) => void;
  onApproved: (updated: Task) => void;
  onArchived: (updated: Task) => void;
}

export default function TaskDetailPanel({ task, open, onClose, users, onSaved, onIgnored, onApproved, onArchived }: TaskDetailPanelProps) {
  const [sourceTab, setSourceTab] = useState<'quote' | 'transcript' | 'video'>('quote');
  const [sourceOpen, setSourceOpen] = useState(true);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Task['priority']>('normal');
  const [deadline, setDeadline] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [assigneePickerOpen, setAssigneePickerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [ignoring, setIgnoring] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (task && open) {
      setTitle(task.title);
      setDescription(task.description ?? '');
      setPriority(task.priority);
      setDeadline(formatDateInput(task.deadline));
      setAssigneeId(task.assignee_id ?? '');
      setError('');
      setShowConfirm(false);
    }
  }, [task, open]);

  const selectedAssignee = users.find((u) => u.id === assigneeId) ?? null;

  async function handleSave() {
    if (!task) return;
    setSaving(true);
    setError('');
    try {
      const updated = await tasksApi.update(task.id, { title, description, priority, deadline: deadline || null });
      onSaved(updated);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Save failed.');
    } finally {
      setSaving(false);
    }
  }

  async function handleIgnore() {
    if (!task) return;
    setIgnoring(true);
    setError('');
    try {
      await tasksApi.discard(task.id);
      onIgnored(task.id);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to ignore task.');
    } finally {
      setIgnoring(false);
    }
  }

  async function handleArchive() {
    if (!task) return;
    setArchiving(true);
    setError('');
    try {
      const updated = await tasksApi.archive(task.id, !task.archived);
      onArchived(updated);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to archive task.');
    } finally {
      setArchiving(false);
    }
  }

  async function handleConfirmApprove() {
    if (!task || !assigneeId) return;
    const updated = await tasksApi.assignApprove(task.id, {
      assignee_id: assigneeId,
      priority,
      deadline: deadline || undefined,
    });
    setShowConfirm(false);
    onApproved(updated);
  }

  const excerptText = task?.description?.slice(0, 300) ?? 'No transcript excerpt available.';

  return (
    <>
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/20 transition-opacity duration-200 ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      />
      <div
        className={`fixed inset-y-0 right-0 z-50 flex flex-col bg-white border-l border-[#E9EAEB] shadow-xl transition-transform duration-300 ease-in-out w-[560px] ${open ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-[#E9EAEB] shrink-0">
          <div className="flex-1 min-w-0 pr-4">
            <p className="text-sm font-semibold text-[#181D27] truncate mb-1">{task?.title ?? ''}</p>
            {task && <TaskStatusBadge status={task.status} />}
          </div>
          <button onClick={onClose} className="p-1 rounded text-[#717680] hover:text-[#414651] hover:bg-gray-100 transition-colors shrink-0">
            <X width={18} height={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">
          {task?.firms?.name && <p className="text-sm text-[#535862]">{task.firms.name}</p>}

          {/* Source Quote */}
          <div className="border border-[#E9EAEB] rounded-xl overflow-hidden">
            <button
              onClick={() => setSourceOpen((v) => !v)}
              className="flex items-center justify-between w-full px-4 py-3 text-sm font-semibold text-[#181D27] hover:bg-[#FAFAFA] transition-colors"
            >
              <span>Source Quote</span>
              <ChevronDown width={16} height={16} className={`text-[#A4A7AE] transition-transform ${sourceOpen ? 'rotate-180' : ''}`} />
            </button>
            {sourceOpen && (
              <>
                <div className="flex border-t border-b border-[#E9EAEB] bg-[#F9FAFB]">
                  {([['quote', 'Source Quote'], ['transcript', 'Full meeting Transcript'], ['video', 'Video']] as const).map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => setSourceTab(key)}
                      className={`flex-1 px-3 py-2.5 text-xs font-medium transition-colors ${sourceTab === key ? 'text-[#7F56D9] border-b-2 border-[#7F56D9] bg-white' : 'text-[#717680] hover:text-[#414651]'}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <div className="px-4 py-4">
                  {sourceTab === 'quote' && (
                    <blockquote className="border-l-4 border-[#7F56D9] pl-4">
                      <p className="text-sm text-[#535862] italic leading-relaxed">"{excerptText}"</p>
                    </blockquote>
                  )}
                  {sourceTab === 'transcript' && (
                    <p className="text-sm text-[#535862] leading-relaxed whitespace-pre-wrap max-h-60 overflow-y-auto">
                      {task?.description ?? 'No transcript available.'}
                    </p>
                  )}
                  {sourceTab === 'video' && (
                    <p className="text-sm text-[#A4A7AE] text-center py-4">No video available for this transcript.</p>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-[#414651] mb-1.5">Priority <span className="text-red-500">*</span></label>
            <div className="relative">
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Task['priority'])}
                className="w-full appearance-none border border-[#D5D7DA] rounded-lg px-3 py-2.5 text-sm text-[#181D27] outline-none focus:ring-2 focus:ring-[#7F56D9] focus:border-transparent bg-white"
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
              <ChevronDown width={16} height={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A4A7AE] pointer-events-none" />
            </div>
          </div>

          {/* Task name */}
          <div>
            <label className="block text-sm font-medium text-[#414651] mb-1.5">Task name <span className="text-red-500">*</span></label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border border-[#D5D7DA] rounded-lg px-3 py-2.5 text-sm text-[#181D27] outline-none focus:ring-2 focus:ring-[#7F56D9] focus:border-transparent"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-[#414651] mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="A little about the task..."
              className="w-full border border-[#D5D7DA] rounded-lg px-3 py-2.5 text-sm text-[#181D27] placeholder-[#A4A7AE] outline-none focus:ring-2 focus:ring-[#7F56D9] focus:border-transparent resize-none"
            />
          </div>

          {/* Due date + Assignee */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#414651] mb-1.5">Due date</label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full border border-[#D5D7DA] rounded-lg px-3 py-2.5 text-sm text-[#181D27] outline-none focus:ring-2 focus:ring-[#7F56D9] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#414651] mb-1.5">Assignee</label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setAssigneePickerOpen((v) => !v)}
                  className="w-full flex items-center gap-2 border border-[#D5D7DA] rounded-lg px-3 py-2.5 text-sm text-left hover:bg-[#FAFAFA] transition-colors"
                >
                  {selectedAssignee ? (
                    <>
                      <Avatar name={selectedAssignee.name} size="xs" />
                      <span className="flex-1 truncate text-[#181D27]">{selectedAssignee.name}</span>
                    </>
                  ) : (
                    <>
                      <Users01 width={16} height={16} className="text-[#A4A7AE]" />
                      <span className="flex-1 text-[#A4A7AE]">Select assignee</span>
                    </>
                  )}
                  <ChevronDown width={14} height={14} className="text-[#A4A7AE] shrink-0" />
                </button>
                {assigneePickerOpen && (
                  <div className="absolute top-full mt-1 left-0 right-0 bg-white border border-[#E9EAEB] rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                    <button
                      type="button"
                      onClick={() => { setAssigneeId(''); setAssigneePickerOpen(false); }}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-[#717680] hover:bg-[#FAFAFA] transition-colors"
                    >
                      Unassigned
                    </button>
                    {users.map((u) => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => { setAssigneeId(u.id); setAssigneePickerOpen(false); }}
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-[#181D27] hover:bg-[#FAFAFA] transition-colors"
                      >
                        <Avatar name={u.name} size="xs" src={u.avatar_url ?? undefined} />
                        <span className="flex-1 truncate">{u.name}</span>
                        {u.id === assigneeId && <span className="w-1.5 h-1.5 rounded-full bg-[#7F56D9]" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Attach a file */}
          <div>
            <label className="block text-sm font-medium text-[#414651] mb-1.5">Attach a file</label>
            <div className="flex flex-col items-center gap-2 py-6 border-2 border-dashed border-[#D5D7DA] rounded-xl bg-[#FAFAFA] cursor-pointer hover:border-[#7F56D9] transition-colors">
              <UploadCloud01 width={28} height={28} className="text-[#A4A7AE]" />
              <p className="text-sm text-[#535862]">
                <span className="text-[#7F56D9] font-medium">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-[#A4A7AE]">SVG, PNG, JPG or GIF (max. 800×400px)</p>
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              <AlertCircle width={15} height={15} className="shrink-0 mt-0.5" />
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-2 px-6 py-4 border-t border-[#E9EAEB] shrink-0">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-3.5 py-2.5 text-sm font-semibold text-[#414651] border border-[#D5D7DA] rounded-lg bg-white hover:bg-gray-50 disabled:opacity-60 transition-colors"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
          <button
            onClick={handleIgnore}
            disabled={ignoring || !!task?.archived}
            className="px-3.5 py-2.5 text-sm font-semibold text-white bg-[#DC2626] hover:bg-[#B91C1C] disabled:opacity-60 rounded-lg transition-colors"
          >
            {ignoring ? 'Ignoring…' : 'Ignore'}
          </button>
          <button
            onClick={handleArchive}
            disabled={archiving}
            title={task?.archived ? 'Unarchive task' : 'Archive task'}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 text-sm font-semibold rounded-lg transition-colors disabled:opacity-60 ${
              task?.archived
                ? 'text-[#7F56D9] border border-[#7F56D9] bg-white hover:bg-[#F4EBFF]'
                : 'text-[#414651] border border-[#D5D7DA] bg-white hover:bg-gray-50'
            }`}
          >
            <Archive width={14} height={14} />
            {archiving ? '…' : task?.archived ? 'Unarchive' : 'Archive'}
          </button>
          <button
            onClick={() => {
              if (!assigneeId) { setError('Please select an assignee before approving.'); return; }
              setError('');
              setShowConfirm(true);
            }}
            disabled={!!task?.archived}
            className="ml-auto px-3.5 py-2.5 text-sm font-semibold text-white bg-[#7F56D9] hover:bg-[#6941C6] disabled:opacity-60 rounded-lg transition-colors"
          >
            Approve
          </button>
        </div>
      </div>

      <ApprovalConfirmModal
        open={showConfirm}
        task={task}
        assigneeName={selectedAssignee?.name ?? ''}
        assigneeId={assigneeId}
        deadline={deadline}
        onCancel={() => setShowConfirm(false)}
        onConfirm={handleConfirmApprove}
      />
    </>
  );
}

// Re-export PriorityBadge so callers that were importing it from here still work
export { PriorityBadge };
