import { useState, useEffect } from 'react';
import { projectsApi } from '../../lib/api';
import { Trash01 } from '@untitled-ui/icons-react';

interface ProjectTask {
  id:       string;
  title:    string;
  status:   string;
  priority: string;
}

interface DeleteProjectModalProps {
  open:       boolean;
  projectId:  string;
  projectName: string;
  onConfirm:  (taskIds: string[]) => Promise<void>;
  onClose:    () => void;
  isDeleting: boolean;
}

const STATUS_LABEL: Record<string, string> = {
  to_do:           'To Do',
  assigned:        'Assigned',
  in_progress:     'In Progress',
  revisions:       'Revisions',
  internal_review: 'Internal Review',
  client_review:   'Client Review',
  completed:       'Completed',
  blocked:         'Blocked',
};

const PRIORITY_DOT: Record<string, string> = {
  urgent: 'bg-red-500',
  high:   'bg-orange-400',
  normal: 'bg-yellow-400',
  low:    'bg-green-500',
};

export default function DeleteProjectModal({
  open,
  projectId,
  projectName,
  onConfirm,
  onClose,
  isDeleting,
}: DeleteProjectModalProps) {
  const [tasks,    setTasks]    = useState<ProjectTask[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading,  setLoading]  = useState(false);

  useEffect(() => {
    if (!open || !projectId) return;
    setLoading(true);
    setSelected(new Set());
    projectsApi.getTasks(projectId)
      .then((data) => setTasks(data))
      .catch(() => setTasks([]))
      .finally(() => setLoading(false));
  }, [open, projectId]);

  if (!open) return null;

  const allSelected = tasks.length > 0 && selected.size === tasks.length;

  function toggleAll() {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(tasks.map((t) => t.id)));
  }

  function toggleTask(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const selectedIds  = Array.from(selected);
  const deletingAll  = selectedIds.length === tasks.length && tasks.length > 0;
  const deletingSome = selectedIds.length > 0 && !deletingAll;

  let confirmLabel = 'Delete';
  let confirmDesc  = '';
  if (deletingAll) {
    confirmLabel = `Delete ${tasks.length} task${tasks.length > 1 ? 's' : ''} & project`;
    confirmDesc  = 'All tasks and the project will be permanently deleted.';
  } else if (deletingSome) {
    confirmLabel = `Delete ${selectedIds.length} task${selectedIds.length > 1 ? 's' : ''}`;
    confirmDesc  = 'Selected tasks will be deleted. The project will remain.';
  } else {
    confirmDesc = 'Select tasks to delete. If all tasks are deleted, the project is also removed.';
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg flex flex-col max-h-[80vh]">

        {/* Header */}
        <div className="flex items-start gap-3 p-6 border-b border-[#E9EAEB]">
          <div className="w-10 h-10 rounded-full bg-[#FEF3F2] flex items-center justify-center shrink-0">
            <Trash01 width={18} height={18} className="text-[#D92D20]" />
          </div>
          <div>
            <p className="text-[15px] font-semibold text-[#181D27]">Delete Project</p>
            <p className="text-[13px] text-[#717680] mt-0.5">
              <span className="font-medium text-[#344054]">{projectName}</span>
            </p>
          </div>
        </div>

        {/* Task list */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <p className="text-[13px] text-[#A4A7AE] py-4 text-center">Loading tasks…</p>
          ) : tasks.length === 0 ? (
            <p className="text-[13px] text-[#717680] py-2">This project has no tasks. It will be deleted immediately.</p>
          ) : (
            <>
              <p className="text-[13px] text-[#344054] mb-3">
                Select tasks to delete. Unselected tasks will remain.
              </p>

              {/* Select all row */}
              <div
                className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-[#F9FAFB] cursor-pointer mb-1 border border-[#E9EAEB]"
                onClick={toggleAll}
              >
                <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                  allSelected ? 'bg-[#7F56D9] border-[#7F56D9]' : 'border-[#D0D5DD]'
                }`}>
                  {allSelected && (
                    <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                      <path d="M1 3.5L3 5.5L8 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <span className="text-[13px] font-semibold text-[#344054]">Select all ({tasks.length})</span>
              </div>

              {/* Task rows */}
              <div className="flex flex-col gap-1 mt-2">
                {tasks.map((task) => {
                  const isChecked = selected.has(task.id);
                  return (
                    <div
                      key={task.id}
                      className={`flex items-center gap-3 py-2 px-3 rounded-lg cursor-pointer transition-colors ${
                        isChecked ? 'bg-[#FEF3F2] border border-[#FECDCA]' : 'hover:bg-[#F9FAFB] border border-transparent'
                      }`}
                      onClick={() => toggleTask(task.id)}
                    >
                      <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                        isChecked ? 'bg-[#D92D20] border-[#D92D20]' : 'border-[#D0D5DD]'
                      }`}>
                        {isChecked && (
                          <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                            <path d="M1 3.5L3 5.5L8 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </div>
                      <span className={`w-2 h-2 rounded-full shrink-0 ${PRIORITY_DOT[task.priority] ?? 'bg-gray-300'}`} />
                      <span className="flex-1 text-[13px] text-[#181D27] truncate">{task.title}</span>
                      <span className="text-[11px] text-[#717680] shrink-0">
                        {STATUS_LABEL[task.status] ?? task.status}
                      </span>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Description + footer */}
        <div className="px-6 pb-6 pt-4 border-t border-[#E9EAEB]">
          {confirmDesc && (
            <p className="text-[12px] text-[#717680] mb-4">{confirmDesc}</p>
          )}
          <div className="flex items-center gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-lg border border-[#D5D7DA] text-sm font-semibold text-[#344054] hover:bg-[#F9FAFB] transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isDeleting || (tasks.length > 0 && selectedIds.length === 0)}
              onClick={() => onConfirm(tasks.length === 0 ? [] : selectedIds)}
              className="px-4 py-2.5 rounded-lg bg-[#D92D20] hover:bg-[#B42318] disabled:opacity-50 text-white text-sm font-semibold transition-colors"
            >
              {isDeleting ? 'Deleting…' : confirmLabel}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
