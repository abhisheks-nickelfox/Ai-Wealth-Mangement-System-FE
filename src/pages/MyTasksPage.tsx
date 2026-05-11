import { useState, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  ChevronDown,
  ChevronRight,
  Plus,
  FilterLines,
  X,
} from '@untitled-ui/icons-react';

import { useAuth } from '../context/AuthContext';
import { useMyTasks, useUpdateTask, useDeleteTask } from '../hooks/useTasks';
import { useUsers } from '../hooks/useUsers';
import { useFirms } from '../hooks/useFirms';
import {
  TaskRow,
  COL_ASSIGNEE,
  COL_DATE,
  COL_PRIORITY,
  COL_STATUS,
  COL_MENU,
} from '../components/firms/TaskRow';
import TaskDetailPanel from '../components/firms/TaskDetailPanel';
import AddTaskModal from '../components/firms/AddTaskModal';
import {
  FilterCheckbox,
  FilterStatusBadge,
  FILTER_STATUS_OPTIONS,
} from '../components/firms/TaskFilterPanel';
import SearchInput from '../components/ui/SearchInput';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { useCreateTask } from '../hooks/useTasks';
import type { Task, Firm } from '../lib/api';
import type { TaskDetailData } from '../components/firms/TaskDetailPanel';
import type { TaskFormData } from '../components/firms/AddTaskModal';

// ── Filter ID → predicate ─────────────────────────────────────────────────────

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function applySubFilter(tasks: Task[], filterId: string): Task[] {
  const today = todayStr();
  switch (filterId) {
    case 'todo':        return tasks.filter((t) => t.status === 'to_do');
    case 'assigned-me': return tasks; // already all my tasks
    case 'today-due':   return tasks.filter((t) => t.deadline === today);
    case 'overdue':     return tasks.filter((t) => !!t.deadline && t.deadline < today);
    case 'active':      return tasks.filter((t) => t.status === 'in_progress' || t.status === 'assigned');
    case 'assigned':    return tasks.filter((t) => t.status === 'assigned');
    case 'in-progress': return tasks.filter((t) => t.status === 'in_progress');
    case 'urgent':      return tasks.filter((t) => t.priority === 'urgent');
    case 'blocked':     return tasks.filter((t) => t.status === 'blocked');
    case 'revisions':   return tasks.filter((t) => t.status === 'revisions');
    case 'closed':      return tasks.filter((t) => t.status === 'closed' as string);
    case 'complete':    return tasks.filter((t) => t.status === 'completed');
    default:            return tasks;
  }
}

// ── Status groups order ───────────────────────────────────────────────────────

const STATUS_GROUP_ORDER: Task['status'][] = [
  'to_do',
  'assigned',
  'in_progress',
  'revisions',
  'internal_review',
  'client_review',
  'completed',
  'blocked',
];

const STATUS_GROUP_LABEL: Record<string, string> = {
  to_do:           'To Do',
  assigned:        'Assigned',
  in_progress:     'In Progress',
  revisions:       'Revisions',
  internal_review: 'Internal Review',
  client_review:   'Client Review',
  completed:       'Completed',
  blocked:         'Blocked',
  closed:          'Closed',
};

// ── Column header row ─────────────────────────────────────────────────────────

function ColumnHeaders() {
  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-[#F9FAFB] border-b border-[#E9EAEB]">
      {/* Expand chevron + status dot + task icon space */}
      <div className="flex items-center gap-2 shrink-0" style={{ width: 13 + 8 + 16 + 8 + 14 }}>
        <span className="w-[13px] shrink-0" />
        <span className="w-4 shrink-0" />
        <span className="w-[14px] shrink-0" />
      </div>
      {/* Task title column */}
      <span className="flex-1 min-w-0 text-[10px] font-semibold uppercase tracking-wider text-[#A4A7AE]">
        Tasks
      </span>
      <span className={`${COL_ASSIGNEE} text-[10px] font-semibold uppercase tracking-wider text-[#A4A7AE] text-center`}>
        Assignee
      </span>
      <span className={`${COL_DATE} text-[10px] font-semibold uppercase tracking-wider text-[#A4A7AE]`}>
        Due date
      </span>
      <span className={`${COL_PRIORITY} text-[10px] font-semibold uppercase tracking-wider text-[#A4A7AE]`}>
        Priority
      </span>
      <span className={`${COL_STATUS} text-[10px] font-semibold uppercase tracking-wider text-[#A4A7AE]`}>
        Status
      </span>
      <span className={COL_MENU} />
    </div>
  );
}

// ── Collapsible status group ──────────────────────────────────────────────────

interface StatusGroupProps {
  status: string;
  tasks: Task[];
  firmsMap: Map<string, Firm>;
  usersMap: Map<string, import('../lib/api').User>;
  onOpenDetail: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onAssigneeChange: (taskId: string, assigneeId: string | null) => void;
}

function StatusGroup({
  status,
  tasks,
  firmsMap,
  usersMap,
  onOpenDetail,
  onEdit,
  onDelete,
  onAssigneeChange,
}: StatusGroupProps) {
  const [expanded, setExpanded] = useState(true);
  const label = STATUS_GROUP_LABEL[status] ?? status;

  return (
    <div>
      {/* Group heading */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-2 px-4 py-2.5 bg-[#F9FAFB] border-b border-[#E9EAEB] hover:bg-[#F2F4F7] transition-colors text-left"
        aria-expanded={expanded}
      >
        <span className="shrink-0 text-[#717680]">
          {expanded
            ? <ChevronDown width={13} height={13} aria-hidden="true" />
            : <ChevronRight width={13} height={13} aria-hidden="true" />}
        </span>
        <span className="text-[12px] font-semibold text-[#344054]">{label}</span>
        <span className="ml-1 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-[#E9EAEB] text-[10px] font-bold text-[#717680]">
          {tasks.length}
        </span>
      </button>

      {/* Column headers — shown when expanded */}
      {expanded && <ColumnHeaders />}

      {/* Task rows */}
      {expanded && tasks.map((task) => (
        <TaskRow
          key={task.id}
          task={task}
          firm={firmsMap.get(task.firm_id) ?? null}
          usersMap={usersMap}
          onOpenDetail={onOpenDetail}
          onEdit={onEdit}
          onDelete={onDelete}
          onAssigneeChange={onAssigneeChange}
        />
      ))}
    </div>
  );
}

// ── MyTasks filter panel ──────────────────────────────────────────────────────

interface MyTasksFilterPanelProps {
  open: boolean;
  onClose: () => void;
  firms: Firm[];
  pendingStatuses: string[];
  pendingFirmIds: string[];
  onToggleStatus: (v: string) => void;
  onToggleFirm: (v: string) => void;
  onApply: () => void;
  onCancel: () => void;
}

function MyTasksFilterPanel({
  open,
  onClose,
  firms,
  pendingStatuses,
  pendingFirmIds,
  onToggleStatus,
  onToggleFirm,
  onApply,
  onCancel,
}: MyTasksFilterPanelProps) {
  const [firmSearch, setFirmSearch] = useState('');

  const filteredFirms = useMemo(() => {
    if (!firmSearch.trim()) return firms;
    const q = firmSearch.toLowerCase();
    return firms.filter((f) => f.name.toLowerCase().includes(q));
  }, [firms, firmSearch]);

  return (
    <>
      <div
        className={`fixed inset-0 z-40 transition-opacity duration-200 ${
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        aria-hidden="true"
        onClick={onClose}
      />
      <aside
        className={`fixed inset-y-0 right-0 z-50 w-[380px] bg-white border-l border-[#E9EAEB] shadow-xl flex flex-col transition-transform duration-300 ease-in-out ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Filter my tasks"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-[#E9EAEB] shrink-0">
          <h2 className="text-base font-semibold text-[#181D27]">Filter</h2>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-md text-[#717680] hover:bg-[#F2F4F7] transition-colors"
            aria-label="Close filter panel"
          >
            <X width={16} height={16} aria-hidden="true" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 pb-6">

          {/* Status section */}
          <p className="text-sm font-semibold text-[#181D27] pt-5 pb-2">Status</p>
          <ul className="flex flex-col" role="group" aria-label="Filter by status">
            {FILTER_STATUS_OPTIONS.map((opt) => (
              <li key={opt.value}>
                <label className="flex items-center gap-3 py-2 cursor-pointer">
                  <FilterCheckbox
                    checked={pendingStatuses.includes(opt.value)}
                    onChange={() => onToggleStatus(opt.value)}
                    id={`my-filter-status-${opt.value}`}
                  />
                  <FilterStatusBadge value={opt.value} label={opt.label} />
                </label>
              </li>
            ))}
          </ul>

          {/* Firm section */}
          <p className="text-sm font-semibold text-[#181D27] pt-5 pb-2">Firm</p>
          <SearchInput
            value={firmSearch}
            onChange={setFirmSearch}
            placeholder="Search firms"
            className="mb-1"
          />
          <ul className="flex flex-col" role="group" aria-label="Filter by firm">
            {filteredFirms.map((firm) => (
              <li key={firm.id}>
                <label className="flex items-center gap-3 py-2 cursor-pointer">
                  <FilterCheckbox
                    checked={pendingFirmIds.includes(firm.id)}
                    onChange={() => onToggleFirm(firm.id)}
                    id={`my-filter-firm-${firm.id}`}
                  />
                  <span className="text-[13px] text-[#414651] truncate">{firm.name}</span>
                </label>
              </li>
            ))}
            {filteredFirms.length === 0 && (
              <li className="py-2 text-[13px] text-[#A4A7AE]">No firms found</li>
            )}
          </ul>
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-[#E9EAEB] px-5 py-4 flex items-center gap-3 bg-white">
          <button
            type="button"
            onClick={onApply}
            className="text-[13px] font-semibold text-[#7F56D9] hover:underline mr-auto"
          >
            Save filter
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-lg border border-[#D0D5DD] bg-white text-[13px] font-semibold text-[#344054] hover:bg-[#F9FAFB] transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onApply}
            className="px-4 py-2 rounded-lg bg-[#7F56D9] text-[13px] font-semibold text-white hover:bg-[#6941C6] transition-colors"
          >
            Apply
          </button>
        </div>
      </aside>
    </>
  );
}

// ── MyTasksPage ───────────────────────────────────────────────────────────────

export default function MyTasksPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate       = useNavigate();
  const subFilter      = searchParams.get('filter') ?? 'assigned-me';

  const { data: allTasks = [], isLoading } = useMyTasks(user?.id);
  const { data: users   = [] }             = useUsers();
  const { data: firms   = [] }             = useFirms();
  const updateTask                         = useUpdateTask();
  const deleteTask                         = useDeleteTask();
  const createTask                         = useCreateTask();

  // ── Filter panel state ────────────────────────────────────────────────────
  const [filterOpen,      setFilterOpen]      = useState(false);
  const [activeStatuses,  setActiveStatuses]  = useState<string[]>([]);
  const [activeFirmIds,   setActiveFirmIds]   = useState<string[]>([]);
  const [pendingStatuses, setPendingStatuses] = useState<string[]>([]);
  const [pendingFirmIds,  setPendingFirmIds]  = useState<string[]>([]);

  // ── Panel / modal state ───────────────────────────────────────────────────
  const [selectedTask,   setSelectedTask]   = useState<Task | null>(null);
  const [showAddTask,    setShowAddTask]    = useState(false);
  const [searchQuery,    setSearchQuery]    = useState('');

  // ── Derived lookups ───────────────────────────────────────────────────────
  const usersMap = useMemo(
    () => new Map(users.map((u) => [u.id, u])),
    [users],
  );

  const firmsMap = useMemo(
    () => new Map(firms.map((f) => [f.id, f])),
    [firms],
  );

  // ── Top-level tasks only (no sub-tasks in this view) ─────────────────────
  const rootTasks = useMemo(
    () => allTasks.filter((t) => !t.parent_task_id),
    [allTasks],
  );

  // ── Apply URL sub-filter ──────────────────────────────────────────────────
  const subFilteredTasks = useMemo(
    () => applySubFilter(rootTasks, subFilter),
    [rootTasks, subFilter],
  );

  // ── Apply panel filters (status + firm) ──────────────────────────────────
  const filteredTasks = useMemo(() => {
    let tasks = subFilteredTasks;

    if (activeStatuses.length > 0) {
      tasks = tasks.filter((t) => activeStatuses.includes(t.status));
    }
    if (activeFirmIds.length > 0) {
      tasks = tasks.filter((t) => activeFirmIds.includes(t.firm_id));
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      tasks = tasks.filter((t) => t.title.toLowerCase().includes(q));
    }

    return tasks;
  }, [subFilteredTasks, activeStatuses, activeFirmIds, searchQuery]);

  // ── Group by status ───────────────────────────────────────────────────────
  const groups = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const task of filteredTasks) {
      const s = task.status as string;
      if (!map.has(s)) map.set(s, []);
      map.get(s)!.push(task);
    }

    const ordered: { status: string; tasks: Task[] }[] = [];
    for (const status of STATUS_GROUP_ORDER) {
      if (map.has(status)) {
        ordered.push({ status, tasks: map.get(status)! });
        map.delete(status);
      }
    }
    // Any remaining statuses not in the ordered list
    for (const [status, tasks] of map) {
      ordered.push({ status, tasks });
    }
    return ordered;
  }, [filteredTasks]);

  // ── Active filter count badge ─────────────────────────────────────────────
  const activeFilterCount = activeStatuses.length + activeFirmIds.length;

  // ── Handlers ─────────────────────────────────────────────────────────────
  function openFilter() {
    setPendingStatuses([...activeStatuses]);
    setPendingFirmIds([...activeFirmIds]);
    setFilterOpen(true);
  }

  function applyFilter() {
    setActiveStatuses([...pendingStatuses]);
    setActiveFirmIds([...pendingFirmIds]);
    setFilterOpen(false);
  }

  function cancelFilter() {
    setPendingStatuses([...activeStatuses]);
    setPendingFirmIds([...activeFirmIds]);
    setFilterOpen(false);
  }

  function togglePendingStatus(v: string) {
    setPendingStatuses((prev) =>
      prev.includes(v) ? prev.filter((s) => s !== v) : [...prev, v],
    );
  }

  function togglePendingFirm(v: string) {
    setPendingFirmIds((prev) =>
      prev.includes(v) ? prev.filter((id) => id !== v) : [...prev, v],
    );
  }

  async function handleSaveTask(taskId: string, data: TaskDetailData) {
    await updateTask.mutateAsync({
      id: taskId,
      payload: {
        title:        data.title,
        description:  data.description,
        priority:     data.priority,
        assignee_ids: data.assignee_ids,
        deadline:     data.deadline || undefined,
        project_id:   data.project_id,
      },
    });
    setSelectedTask(null);
  }

  async function handleDeleteTask(task: Task) {
    await deleteTask.mutateAsync(task.id).catch(() => {});
  }

  const priorityMap: Record<string, 'low' | 'normal' | 'high' | 'urgent'> = {
    Low: 'low', Medium: 'normal', High: 'high', Urgent: 'urgent',
  };

  async function handleCreateTask(data: TaskFormData) {
    if (!addTaskFirmId) return;
    await createTask.mutateAsync({
      firm_id:      addTaskFirmId,
      project_id:   data.projectId || undefined,
      title:        data.title,
      description:  data.description || undefined,
      type:         (data.type as 'task' | 'design' | 'development' | 'account_management') || 'task',
      priority:     priorityMap[data.priority] ?? 'normal',
      deadline:     data.endDate || undefined,
      assignee_ids: data.assigneeIds,
    });
    setShowAddTask(false);
  }

  // ── Firm picker for "Add task" ────────────────────────────────────────────
  // The AddTaskModal doesn't carry firm_id in its output — we resolve it here
  // by pre-selecting from the active firm filter (if exactly one is active) or
  // defaulting to the first firm in the list.
  const addTaskFirmId   = activeFirmIds.length === 1 ? activeFirmIds[0] : (firms[0]?.id ?? '');
  const addTaskFirmName = firmsMap.get(addTaskFirmId)?.name ?? '';

  // ── Page title from sub-filter ────────────────────────────────────────────
  const subFilterLabel: Record<string, string> = {
    'todo':          'To Do',
    'assigned-me':   'Assigned to me',
    'today-due':     'Today Due',
    'overdue':       'Overdue',
    'active':        'Active',
    'assigned':      'Assigned',
    'in-progress':   'In Progress',
    'urgent':        'Urgent',
    'blocked':       'Blocked',
    'revisions':     'Revisions',
    'closed':        'Closed',
    'complete':      'Complete',
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-white">

      {/* ── Top bar ──────────────────────────────────────────────────────── */}
      <div className="shrink-0 px-8 pt-6 pb-4 border-b border-[#E9EAEB]">

        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 mb-4">
          <span className="text-[12px] text-[#717680] font-medium">My Tasks</span>
          <ChevronRight width={12} height={12} className="text-[#C8CDD6]" aria-hidden="true" />
          <span className="text-[12px] font-semibold text-[#6941C6]">
            {subFilterLabel[subFilter] ?? 'All Tasks'}
          </span>
        </div>

        {/* Actions row */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Left: action buttons */}
          <button
            type="button"
            onClick={() => setShowAddTask(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#7F56D9] text-white text-[13px] font-semibold hover:bg-[#6941C6] transition-colors"
            aria-label="Add task"
          >
            <Plus width={14} height={14} aria-hidden="true" />
            Add Task
          </button>

          <button
            type="button"
            onClick={openFilter}
            className={`relative flex items-center gap-1.5 px-3.5 py-2 rounded-lg border text-[13px] font-semibold transition-colors ${
              activeFilterCount > 0
                ? 'border-[#7F56D9] bg-[#F4F3FF] text-[#6941C6]'
                : 'border-[#D0D5DD] bg-white text-[#344054] hover:bg-[#F9FAFB]'
            }`}
            aria-label="Open filters"
          >
            <FilterLines width={14} height={14} aria-hidden="true" />
            Filter
            {activeFilterCount > 0 && (
              <span className="ml-0.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-[#7F56D9] text-[10px] font-bold text-white">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Right: search */}
          <div className="ml-auto w-[260px]">
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search tasks..."
            />
          </div>
        </div>
      </div>

      {/* ── Page heading ─────────────────────────────────────────────────── */}
      <div className="shrink-0 px-8 pt-5 pb-2">
        <h1 className="text-[18px] font-semibold text-[#181D27]">
          Task Assigned to you
        </h1>
        <p className="text-[13px] text-[#717680] mt-0.5">
          {filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''}
          {activeFilterCount > 0 ? ' (filtered)' : ''}
        </p>
      </div>

      {/* ── Task table ───────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-8 pb-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <LoadingSpinner />
          </div>
        ) : groups.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
            <div className="w-12 h-12 rounded-full bg-[#F4F3FF] flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M9 11L12 14L22 4" stroke="#7F56D9" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M21 12V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H16" stroke="#7F56D9" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <p className="text-[15px] font-semibold text-[#181D27]">No tasks found</p>
            <p className="text-[13px] text-[#717680] max-w-[280px]">
              {activeFilterCount > 0
                ? 'Try adjusting your filters to see more tasks.'
                : 'You have no tasks assigned matching this view.'}
            </p>
            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={() => { setActiveStatuses([]); setActiveFirmIds([]); }}
                className="mt-1 text-[13px] font-semibold text-[#7F56D9] hover:underline"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="mt-4 rounded-xl border border-[#E9EAEB] overflow-hidden" role="table" aria-label="My tasks">
            {groups.map(({ status, tasks }) => (
              <StatusGroup
                key={status}
                status={status}
                tasks={tasks}
                firmsMap={firmsMap}
                usersMap={usersMap}
                onOpenDetail={setSelectedTask}
                onEdit={setSelectedTask}
                onDelete={handleDeleteTask}
                onAssigneeChange={(taskId, assigneeId) =>
                  updateTask.mutateAsync({
                    id: taskId,
                    payload: { assignee_id: assigneeId },
                  }).catch(() => {})
                }
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Task detail panel ─────────────────────────────────────────────── */}
      <TaskDetailPanel
        open={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        task={selectedTask}
        users={users}
        firmId={selectedTask?.firm_id}
        onSave={handleSaveTask}
        viewLabel="View Task"
        onViewTask={
          selectedTask
            ? () => {
                const task = selectedTask;
                setSelectedTask(null);
                navigate(`/firms/${task.firm_id}/tasks/${task.id}`);
              }
            : undefined
        }
      />

      {/* ── Add task modal ───────────────────────────────────────────────── */}
      <AddTaskModal
        open={showAddTask}
        onClose={() => setShowAddTask(false)}
        firmName={addTaskFirmName}
        users={users}
        onCreate={handleCreateTask}
      />

      {/* ── Filter panel ─────────────────────────────────────────────────── */}
      <MyTasksFilterPanel
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        firms={firms}
        pendingStatuses={pendingStatuses}
        pendingFirmIds={pendingFirmIds}
        onToggleStatus={togglePendingStatus}
        onToggleFirm={togglePendingFirm}
        onApply={applyFilter}
        onCancel={cancelFilter}
      />
    </div>
  );
}
