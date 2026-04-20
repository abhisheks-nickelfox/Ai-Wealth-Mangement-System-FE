import { useState } from 'react';
import { X, CheckCircle, Tag01, Calendar } from '@untitled-ui/icons-react';
import Avatar from '../ui/Avatar';
import type { Task } from '../../lib/api';
import { formatDate } from '../../lib/transcriptUtils';

export interface ApprovalConfirmModalProps {
  open: boolean;
  task: Task | null;
  assigneeName: string;
  assigneeId: string;
  deadline: string;
  onCancel: () => void;
  onConfirm: () => Promise<void>;
}

export default function ApprovalConfirmModal({
  open, task, assigneeName, assigneeId, deadline, onCancel, onConfirm,
}: ApprovalConfirmModalProps) {
  const [confirming, setConfirming] = useState(false);

  async function handleConfirm() {
    setConfirming(true);
    try { await onConfirm(); } finally { setConfirming(false); }
  }

  if (!open || !task) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4">
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-start justify-between mb-4">
            <div className="w-10 h-10 rounded-full bg-[#ECFDF3] flex items-center justify-center">
              <CheckCircle width={20} height={20} className="text-[#17B26A]" />
            </div>
            <button onClick={onCancel} className="p-1 rounded text-[#717680] hover:bg-gray-100 transition-colors">
              <X width={18} height={18} />
            </button>
          </div>
          <h2 className="text-lg font-semibold text-[#181D27] mb-1">Approval Confirmation</h2>
          <p className="text-sm text-[#535862]">
            Once approved, the task will be assigned to{' '}
            <span className="font-medium text-[#181D27]">{assigneeName || 'the assignee'}</span>.
            Before please confirm.
          </p>
        </div>

        <div className="px-6 pb-5 flex flex-col gap-3">
          {assigneeId && (
            <div className="flex items-center gap-3 p-3 bg-[#F9FAFB] rounded-lg">
              <Avatar name={assigneeName} size="sm" />
              <div>
                <p className="text-xs text-[#717680]">Assignee</p>
                <p className="text-sm font-medium text-[#181D27]">{assigneeName}</p>
              </div>
            </div>
          )}
          <div className="flex items-center gap-3 p-3 bg-[#F9FAFB] rounded-lg">
            <div className="w-8 h-8 rounded-full bg-[#EFF8FF] flex items-center justify-center">
              <Tag01 width={14} height={14} className="text-[#1565C0]" />
            </div>
            <div>
              <p className="text-xs text-[#717680]">Task Type</p>
              <p className="text-sm font-medium text-[#181D27] capitalize">{task.type?.replace(/_/g, ' ') || 'General'}</p>
            </div>
          </div>
          {deadline && (
            <div className="flex items-center gap-3 p-3 bg-[#F9FAFB] rounded-lg">
              <div className="w-8 h-8 rounded-full bg-[#F4F3FF] flex items-center justify-center">
                <Calendar width={14} height={14} className="text-[#5925DC]" />
              </div>
              <div>
                <p className="text-xs text-[#717680]">Due Date</p>
                <p className="text-sm font-medium text-[#181D27]">{formatDate(deadline)}</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 px-6 py-4 border-t border-[#E9EAEB]">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 text-sm font-semibold text-[#414651] border border-[#D5D7DA] rounded-lg bg-white hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={confirming}
            className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-[#7F56D9] hover:bg-[#6941C6] disabled:opacity-60 rounded-lg transition-colors"
          >
            {confirming ? 'Approving…' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}
