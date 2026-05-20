import { useState, useEffect } from 'react';
import { projectsApi } from '../../lib/api';
import { Trash01, AlertTriangle, Lock01, CheckCircle } from '@untitled-ui/icons-react';
import { TaskStatusBadge } from '../tasks/TaskBadges';
import { StatusDot } from '../tasks/TaskRow';

interface ProjectTask {
  id:             string;
  title:          string;
  status:         string;
  priority:       string;
  parent_task_id: string | null;
}

interface DeleteProjectModalProps {
  open:        boolean;
  projectId:   string;
  projectName: string;
  onConfirm:   (taskIds: string[]) => Promise<void>;
  onClose:     () => void;
  isDeleting:  boolean;
}


const BLOCKING_STATUSES = new Set([
  'assigned', 'in_progress', 'revisions',
  'internal_review', 'client_review', 'compliance_review',
  'completed', 'closed', 'blocked', 'draft',
]);

function Checkbox({ checked, onClick }: { checked: boolean; onClick: () => void }) {
  return (
    <div
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 cursor-pointer transition-colors ${
        checked ? 'bg-[#D92D20] border-[#D92D20]' : 'border-[#D0D5DD] hover:border-[#7F56D9]'
      }`}
    >
      {checked && (
        <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
          <path d="M1 3.5L3 5.5L8 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </div>
  );
}

export default function DeleteProjectModal({
  open, projectId, projectName, onConfirm, onClose, isDeleting,
}: DeleteProjectModalProps) {
  const [tasks,   setTasks]   = useState<ProjectTask[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

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

  const blockingTasks  = tasks.filter((t) => BLOCKING_STATUSES.has(t.status));
  const todoTasks      = tasks.filter((t) => t.status === 'to_do');
  const isProjectInUse = blockingTasks.length > 0;
  const hasNoTasks     = tasks.length === 0;

  // Build blocking task tree
  const blockingIds     = new Set(blockingTasks.map((t) => t.id));
  const blockingParents = blockingTasks.filter((t) => !t.parent_task_id || !blockingIds.has(t.parent_task_id));
  const blockingSubMap  = blockingTasks.reduce<Record<string, ProjectTask[]>>((acc, t) => {
    if (t.parent_task_id && blockingIds.has(t.parent_task_id)) {
      if (!acc[t.parent_task_id]) acc[t.parent_task_id] = [];
      acc[t.parent_task_id].push(t);
    }
    return acc;
  }, {});

  // Build to_do tree (used in both states)
  const todoIds     = new Set(todoTasks.map((t) => t.id));
  const todoParents = todoTasks.filter((t) => !t.parent_task_id || !todoIds.has(t.parent_task_id));
  const todoSubMap  = todoTasks.reduce<Record<string, ProjectTask[]>>((acc, t) => {
    if (t.parent_task_id && todoIds.has(t.parent_task_id)) {
      if (!acc[t.parent_task_id]) acc[t.parent_task_id] = [];
      acc[t.parent_task_id].push(t);
    }
    return acc;
  }, {});

  const displayedTodoIds = new Set<string>([
    ...todoParents.map((t) => t.id),
    ...Object.values(todoSubMap).flat().map((t) => t.id),
  ]);
  const allTodoSelected = displayedTodoIds.size > 0 && [...displayedTodoIds].every((id) => selected.has(id));

  function toggleAll() {
    if (allTodoSelected) setSelected(new Set());
    else setSelected(new Set(displayedTodoIds));
  }
  function toggleTask(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  const selectedIds = Array.from(selected);

  // Footer label
  let confirmLabel = 'Delete Project';
  if (!hasNoTasks && todoTasks.length > 0) {
    if (allTodoSelected && !isProjectInUse) {
      confirmLabel = `Delete ${selectedIds.length} task${selectedIds.length > 1 ? 's' : ''} & project`;
    } else if (selectedIds.length > 0) {
      confirmLabel = `Delete ${selectedIds.length} to-do task${selectedIds.length > 1 ? 's' : ''}`;
    }
  }

  // ── To-do task list (shared between both states) ──────────────────────────
  function TodoTaskTree() {
    if (todoTasks.length === 0) return null;
    return (
      <div className="flex flex-col gap-2">
        {/* Section header + select all */}
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-[#717680] uppercase tracking-wider">
            To Do ({todoTasks.length}) — can be deleted
          </span>
          {todoTasks.length > 1 && (
            <button
              type="button"
              onClick={toggleAll}
              className="text-[11px] font-semibold text-[#7F56D9] hover:text-[#6941C6] transition-colors"
            >
              {allTodoSelected ? 'Deselect all' : 'Select all'}
            </button>
          )}
        </div>

        <div className="flex flex-col gap-1">
          {todoParents.map((task) => {
            const subs      = todoSubMap[task.id] ?? [];
            const isChecked = selected.has(task.id);
            return (
              <div key={task.id}>
                <div
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer transition-all border ${
                    isChecked
                      ? 'bg-[#FEF3F2] border-[#FECDCA]'
                      : 'bg-white border-[#E9EAEB] hover:border-[#D0D5DD] hover:bg-[#FAFAFA]'
                  }`}
                  onClick={() => toggleTask(task.id)}
                >
                  <Checkbox checked={isChecked} onClick={() => toggleTask(task.id)} />
                  <StatusDot status={task.status} />
                  <span className="flex-1 text-[13px] font-medium text-[#181D27] truncate">{task.title}</span>
                </div>

                {subs.length > 0 && (
                  <div className="ml-5 pl-4 border-l border-[#E4E7EC] flex flex-col gap-0.5 mt-0.5">
                    {subs.map((sub) => {
                      const sc = selected.has(sub.id);
                      return (
                        <div
                          key={sub.id}
                          className={`flex items-center gap-2.5 px-3 py-1.5 rounded-lg cursor-pointer transition-all border ${
                            sc ? 'bg-[#FEF3F2] border-[#FECDCA]' : 'bg-white border-[#E9EAEB] hover:border-[#D0D5DD]'
                          }`}
                          onClick={() => toggleTask(sub.id)}
                        >
                          <Checkbox checked={sc} onClick={() => toggleTask(sub.id)} />
                          <StatusDot status={sub.status} />
                          <span className="flex-1 text-[12px] text-[#344054] truncate">{sub.title}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[85vh]">

        {/* ── Header ── */}
        <div className="flex items-start gap-3 px-6 py-5 border-b border-[#F2F4F7]">
          <div className="w-10 h-10 rounded-full bg-[#FEF3F2] flex items-center justify-center shrink-0">
            <Trash01 width={18} height={18} className="text-[#D92D20]" />
          </div>
          <div className="min-w-0">
            <p className="text-[15px] font-semibold text-[#101828]">Delete Project</p>
            <p className="text-[13px] text-[#667085] mt-0.5 truncate">{projectName}</p>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5 flex flex-col gap-5">
          {loading ? (
            <p className="text-[13px] text-[#A4A7AE] py-4 text-center">Loading tasks…</p>

          ) : hasNoTasks ? (
            /* ── No tasks — safe to delete ── */
            <div className="flex items-start gap-3 bg-[#FFF8F7] border border-[#FECDCA] rounded-xl px-4 py-3.5">
              <Trash01 width={15} height={15} className="text-[#D92D20] shrink-0 mt-0.5" />
              <p className="text-[13px] text-[#344054]">
                This project has no tasks and will be{' '}
                <span className="font-semibold text-[#D92D20]">permanently deleted</span>.
              </p>
            </div>

          ) : isProjectInUse ? (
            /* ── Project in use ── */
            <>
              {/* Amber warning */}
              <div className="flex items-start gap-3 bg-[#FFFAEB] border border-[#FEC84B] rounded-xl px-4 py-3.5">
                <AlertTriangle width={16} height={16} className="text-[#B54708] shrink-0 mt-0.5" />
                <div>
                  <p className="text-[13px] font-semibold text-[#B54708]">
                    This project is currently in use
                  </p>
                  <p className="text-[12px] text-[#92400E] mt-0.5 leading-[1.6]">
                    It has <span className="font-semibold">{blockingTasks.length} active task{blockingTasks.length > 1 ? 's' : ''}</span>. Move or close them first, then you can delete the project.
                  </p>
                </div>
              </div>

              {/* How-to steps */}
              <div className="bg-[#F9F5FF] border border-[#E9D7FE] rounded-xl px-4 py-4">
                <p className="text-[12px] font-semibold text-[#6941C6] mb-3">How to empty this project:</p>
                <div className="flex flex-col gap-3">
                  <div className="flex items-start gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-[#7F56D9] text-white flex items-center justify-center shrink-0 text-[10px] font-bold mt-0.5">1</div>
                    <div>
                      <p className="text-[12px] font-semibold text-[#344054]">Move tasks to another project</p>
                      <p className="text-[11px] text-[#717680] mt-0.5">Open each task → change its project to move it out.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-px bg-[#D9D6FE]" />
                    <span className="text-[11px] text-[#9E77ED] shrink-0 font-medium">or</span>
                    <div className="flex-1 h-px bg-[#D9D6FE]" />
                  </div>
                  <div className="flex items-start gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-[#7F56D9] text-white flex items-center justify-center shrink-0 text-[10px] font-bold mt-0.5">2</div>
                    <div>
                      <p className="text-[12px] font-semibold text-[#344054]">Complete or cancel each task</p>
                      <p className="text-[11px] text-[#717680] mt-0.5">Mark tasks as closed or cancelled one by one.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 pt-2 border-t border-[#D9D6FE]">
                    <CheckCircle width={13} height={13} className="text-[#7F56D9] shrink-0 mt-0.5" />
                    <p className="text-[11px] text-[#6941C6]">Once all tasks are moved or removed, come back and delete the project.</p>
                  </div>
                </div>
              </div>

              {/* Active tasks — tree view */}
              <div>
                <p className="text-[11px] font-semibold text-[#A4A7AE] uppercase tracking-wider mb-2">
                  Active Tasks ({blockingTasks.length})
                </p>
                <div className="flex flex-col gap-1">
                  {blockingParents.map((task) => {
                    const subs = blockingSubMap[task.id] ?? [];
                    return (
                      <div key={task.id}>
                        <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-white border border-[#E9EAEB]">
                          <Lock01 width={11} height={11} className="text-[#C4C7CE] shrink-0" />
                          <StatusDot status={task.status} />
                          <span className="flex-1 text-[12px] text-[#344054] truncate">{task.title}</span>
                          <TaskStatusBadge status={task.status} />
                        </div>
                        {subs.length > 0 && (
                          <div className="ml-5 pl-4 border-l border-[#E4E7EC] flex flex-col gap-0.5 mt-0.5">
                            {subs.map((sub) => (
                              <div key={sub.id} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-[#E9EAEB]">
                                <Lock01 width={10} height={10} className="text-[#C4C7CE] shrink-0" />
                                <StatusDot status={sub.status} />
                                <span className="flex-1 text-[11px] text-[#344054] truncate">{sub.title}</span>
                                <TaskStatusBadge status={sub.status} />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* To-do tasks (deletable even when in-use) */}
              {todoTasks.length > 0 && (
                <div className="pt-1 border-t border-[#F2F4F7]">
                  <TodoTaskTree />
                </div>
              )}
            </>

          ) : (
            /* ── Only to-do tasks ── */
            <div className="flex flex-col gap-4">
              <p className="text-[13px] text-[#344054]">
                This project has <span className="font-semibold">{todoTasks.length} to-do task{todoTasks.length > 1 ? 's' : ''}</span>.
                Select tasks to delete. If all are removed, the project is also deleted.
              </p>
              <TodoTaskTree />
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="px-6 py-4 border-t border-[#F2F4F7] flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-lg border border-[#D5D7DA] text-sm font-semibold text-[#344054] hover:bg-[#F9FAFB] transition-colors"
          >
            {isProjectInUse && selectedIds.length === 0 ? 'Got it' : 'Cancel'}
          </button>

          {/* Show delete button if: no tasks, or to-do tasks selected */}
          {(!isProjectInUse || selectedIds.length > 0) && (
            <button
              type="button"
              disabled={isDeleting || (!hasNoTasks && selectedIds.length === 0 && todoTasks.length > 0)}
              onClick={() => onConfirm(hasNoTasks ? [] : selectedIds)}
              className="px-4 py-2.5 rounded-lg bg-[#D92D20] hover:bg-[#B42318] disabled:opacity-50 text-white text-sm font-semibold transition-colors"
            >
              {isDeleting ? 'Deleting…' : confirmLabel}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
