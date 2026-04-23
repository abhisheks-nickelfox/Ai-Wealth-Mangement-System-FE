import { useState, useEffect } from 'react';
import {
  ChevronDown,
  AlertCircle,
  Users01,
  Archive,
} from '@untitled-ui/icons-react';
import Avatar from '../ui/Avatar';
import SlideOver from '../ui/SlideOver';
import Input from '../ui/Input';
import FileUpload from '../ui/FileUpload';
import type { Task, User } from '../../lib/api';
import { useUpdateTask, useDiscardTask, useArchiveTask, useAssignApproveTask } from '../../hooks/useTasks';
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
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');

  const updateTask      = useUpdateTask();
  const discardTask     = useDiscardTask();
  const archiveTask     = useArchiveTask();
  const assignApprove   = useAssignApproveTask();

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
    setError('');
    try {
      const updated = await updateTask.mutateAsync({ id: task.id, payload: { title, description, priority, deadline: deadline || null } });
      onSaved(updated);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Save failed.');
    }
  }

  async function handleIgnore() {
    if (!task) return;
    setError('');
    try {
      await discardTask.mutateAsync(task.id);
      onIgnored(task.id);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to ignore task.');
    }
  }

  async function handleArchive() {
    if (!task) return;
    setError('');
    try {
      const updated = await archiveTask.mutateAsync({ id: task.id, archived: !task.archived });
      onArchived(updated);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to archive task.');
    }
  }

  async function handleConfirmApprove() {
    if (!task || !assigneeId) return;
    const updated = await assignApprove.mutateAsync({
      id: task.id,
      payload: { assignee_id: assigneeId, priority, deadline: deadline || undefined },
    });
    setShowConfirm(false);
    onApproved(updated);
  }

  const excerptText = task?.description?.slice(0, 300) ?? 'No transcript excerpt available.';

  return (
    <>
      <SlideOver
        open={open}
        onClose={onClose}
        title={task?.title ?? 'Task Details'}
        subtitle={task ? undefined : undefined}
        width="max-w-[560px]"
      >
        {/* Status badge beneath title (SlideOver header only renders title/subtitle) */}
        {task && (
          <div className="-mt-2 mb-3">
            <TaskStatusBadge status={task.status} />
          </div>
        )}

        {/* Body */}
        <div className="flex flex-col gap-5">
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
          <Input
            label="Task name"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

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
            <Input
              label="Due date"
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />
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
            <FileUpload
              accept="image/svg+xml,image/png,image/jpeg,image/gif"
              onFile={() => {}}
            />
          </div>

          {error && (
            <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              <AlertCircle width={15} height={15} className="shrink-0 mt-0.5" />
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-2 pt-4 mt-4 border-t border-[#E9EAEB]">
          <button
            onClick={handleSave}
            disabled={updateTask.isPending}
            className="px-3.5 py-2.5 text-sm font-semibold text-[#414651] border border-[#D5D7DA] rounded-lg bg-white hover:bg-gray-50 disabled:opacity-60 transition-colors"
          >
            {updateTask.isPending ? 'Saving…' : 'Save'}
          </button>
          <button
            onClick={handleIgnore}
            disabled={discardTask.isPending || !!task?.archived}
            className="px-3.5 py-2.5 text-sm font-semibold text-white bg-[#DC2626] hover:bg-[#B91C1C] disabled:opacity-60 rounded-lg transition-colors"
          >
            {discardTask.isPending ? 'Ignoring…' : 'Ignore'}
          </button>
          <button
            onClick={handleArchive}
            disabled={archiveTask.isPending}
            title={task?.archived ? 'Unarchive task' : 'Archive task'}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 text-sm font-semibold rounded-lg transition-colors disabled:opacity-60 ${
              task?.archived
                ? 'text-[#7F56D9] border border-[#7F56D9] bg-white hover:bg-[#F4EBFF]'
                : 'text-[#414651] border border-[#D5D7DA] bg-white hover:bg-gray-50'
            }`}
          >
            <Archive width={14} height={14} />
            {archiveTask.isPending ? '…' : task?.archived ? 'Unarchive' : 'Archive'}
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
      </SlideOver>

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
