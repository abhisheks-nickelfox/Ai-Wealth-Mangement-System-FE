import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ChevronRight,
  ChevronDown,
  FolderClosed,
  Plus,
  FilterLines,
  SearchLg,
  X,
  Calendar,
  User01,
} from '@untitled-ui/icons-react';

import type { Firm, Task, User } from '../lib/api';
import { useFirmDetail } from '../hooks/useFirms';
import { useTasksByFirm } from '../hooks/useTasks';
import { useUsers } from '../hooks/useUsers';
import AvatarStack from '../components/ui/AvatarStack';
import Avatar from '../components/ui/Avatar';
import { PriorityBadge, TaskStatusBadge } from '../components/tasks/TaskBadges';
import AddProjectModal from '../components/firms/AddProjectModal';
import ProjectDetailPanel, { type ProjectDetail } from '../components/firms/ProjectDetailPanel';

// ── Types ─────────────────────────────────────────────────────────────────────

type TabId =
  | 'overview'
  | 'client-requests'
  | 'projects'
  | 'hubspot'
  | 'lead-pipeline'
  | 'client-assets'
  | 'time-reports'
  | 'meetings'
  | 'notes-sops'
  | 'activities';

interface TabDef {
  id: TabId;
  label: string;
}

// ── Status group definitions ──────────────────────────────────────────────────

interface StatusGroup {
  id: string;
  label: string;
  statuses: string[];
}

const STATUS_GROUPS: StatusGroup[] = [
  { id: 'todo',        label: 'ToDo',       statuses: ['draft'] },
  { id: 'inprogress',  label: 'In progress', statuses: ['in_progress', 'revisions'] },
  { id: 'inreview',    label: 'In Review',  statuses: ['internal_review', 'client_review', 'compliance_review'] },
  { id: 'approved',    label: 'Approved',   statuses: ['approved'] },
  { id: 'completed',   label: 'Completed',  statuses: ['closed'] },
];

const TABS: TabDef[] = [
  { id: 'overview',        label: 'Overview' },
  { id: 'client-requests', label: 'Client Requests' },
  { id: 'projects',        label: 'Projects' },
  { id: 'hubspot',         label: 'HubSpot' },
  { id: 'lead-pipeline',   label: 'Lead & Pipeline Mgt' },
  { id: 'client-assets',   label: 'Client Assets' },
  { id: 'time-reports',    label: 'Time Reports' },
  { id: 'meetings',        label: 'Meetings' },
  { id: 'notes-sops',      label: 'Notes & SOPs' },
  { id: 'activities',      label: 'Activities' },
];

// ── Status dot SVG ────────────────────────────────────────────────────────────

function StatusDot({ status }: { status: string }) {
  if (status === 'draft') {
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <circle cx="8" cy="8" r="6" stroke="#A4A7AE" strokeWidth="1.5" fill="none" />
      </svg>
    );
  }
  if (status === 'in_progress' || status === 'revisions') {
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <circle cx="8" cy="8" r="6" fill="#7F56D9" />
      </svg>
    );
  }
  if (status === 'approved' || status === 'closed') {
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <circle cx="8" cy="8" r="6" fill="#17B26A" />
      </svg>
    );
  }
  // internal_review, client_review, compliance_review
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="6" fill="#F79009" />
    </svg>
  );
}

// ── Status group dot (for group headers — representative of the group) ────────

function GroupStatusDot({ groupId }: { groupId: string }) {
  const representativeStatus: Record<string, string> = {
    todo:       'draft',
    inprogress: 'in_progress',
    inreview:   'internal_review',
    approved:   'approved',
    completed:  'closed',
  };
  return <StatusDot status={representativeStatus[groupId] ?? 'draft'} />;
}

// ── Due date label ─────────────────────────────────────────────────────────────

function dueDateLabel(deadline: string | null): string {
  if (!deadline) return '—';
  const d = new Date(deadline);
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays === -1) return 'Yesterday';
  if (diffDays > 0 && diffDays < 7) return `In ${diffDays} days`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ── Task row ──────────────────────────────────────────────────────────────────

interface TaskRowProps {
  task: Task;
  firm: Firm | null;
  usersMap: Map<string, User>;
  indented?: boolean;
}

function TaskRow({ task, firm, usersMap, indented = false }: TaskRowProps) {
  const assignee = task.assignee_id ? usersMap.get(task.assignee_id) : null;

  const avatars = assignee
    ? [{ name: assignee.name, src: assignee.avatar_url ?? undefined }]
    : [];

  return (
    <div
      className={`grid grid-cols-[1fr_160px_120px_100px_120px] items-center border-b border-[#E9EAEB] hover:bg-[#F9FAFB] transition-colors ${indented ? 'pl-8' : ''}`}
      role="row"
    >
      {/* Column 1: Task title */}
      <div className="flex items-center gap-2 px-4 py-2.5 min-w-0">
        <span className="text-[#A4A7AE] shrink-0">
          <StatusDot status={task.status} />
        </span>
        <FolderClosed
          width={15}
          height={15}
          className="text-[#A4A7AE] shrink-0"
          aria-hidden="true"
        />
        <span className="text-[13px] text-[#181D27] truncate leading-snug">
          {task.title}
          {firm && (
            <span className="text-[#A4A7AE] font-normal ml-1">
              For {firm.name}
            </span>
          )}
        </span>
      </div>

      {/* Column 2: Assignee */}
      <div className="flex items-center px-3 py-2.5">
        <AvatarStack avatars={avatars} max={3} showAddButton={true} />
      </div>

      {/* Column 3: Due date */}
      <div className="px-3 py-2.5">
        <span className="text-[13px] text-[#414651]">
          {dueDateLabel(task.deadline)}
        </span>
      </div>

      {/* Column 4: Priority */}
      <div className="px-3 py-2.5">
        <PriorityBadge priority={task.priority} />
      </div>

      {/* Column 5: Status */}
      <div className="px-3 py-2.5">
        <TaskStatusBadge status={task.status} />
      </div>
    </div>
  );
}

// ── Project group row (expandable) ────────────────────────────────────────────

interface ProjectGroupRowProps {
  projectId: string | null;
  tasks: Task[];
  firm: Firm | null;
  usersMap: Map<string, User>;
  onProjectClick?: (projectId: string | null, label: string) => void;
}

function ProjectGroupRow({ projectId, tasks, firm, usersMap, onProjectClick }: ProjectGroupRowProps) {
  const [expanded, setExpanded] = useState(true);
  const label = projectId ?? 'No Project';

  // Collect all unique assignees across tasks in this project
  const allAvatars = useMemo(() => {
    const seen = new Set<string>();
    const result: { name: string; src?: string }[] = [];
    for (const task of tasks) {
      if (task.assignee_id && !seen.has(task.assignee_id)) {
        seen.add(task.assignee_id);
        const u = usersMap.get(task.assignee_id);
        if (u) result.push({ name: u.name, src: u.avatar_url ?? undefined });
      }
    }
    return result;
  }, [tasks, usersMap]);

  // Representative status is taken from the first task
  const repStatus = tasks[0]?.status ?? 'draft';

  return (
    <>
      {/* Project header row */}
      <div
        className="grid grid-cols-[1fr_160px_120px_100px_120px] items-center border-b border-[#E9EAEB] bg-[#F9FAFB] hover:bg-[#F2F4F7] transition-colors cursor-pointer"
        role="row"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-2 px-4 py-2.5 min-w-0">
          <span className="shrink-0 text-[#717680] transition-transform duration-150" onClick={(e) => { e.stopPropagation(); setExpanded((v) => !v); }}>
            {expanded ? (
              <ChevronDown width={14} height={14} aria-hidden="true" />
            ) : (
              <ChevronRight width={14} height={14} aria-hidden="true" />
            )}
          </span>
          <span className="text-[#A4A7AE] shrink-0">
            <StatusDot status={repStatus} />
          </span>
          <FolderClosed
            width={15}
            height={15}
            className="text-[#7F56D9] shrink-0"
            aria-hidden="true"
          />
          <span
            className="text-[13px] font-semibold text-[#181D27] truncate hover:text-[#7F56D9] hover:underline cursor-pointer"
            onClick={(e) => { e.stopPropagation(); onProjectClick?.(projectId, label); }}
          >
            {label}
          </span>
          {firm && (
            <span className="text-[13px] text-[#A4A7AE] font-normal ml-1 truncate">
              For {firm.name}
            </span>
          )}
        </div>

        <div className="flex items-center px-3 py-2.5">
          <AvatarStack avatars={allAvatars} max={3} showAddButton={true} />
        </div>

        <div className="px-3 py-2.5" />
        <div className="px-3 py-2.5" />
        <div className="px-3 py-2.5" />
      </div>

      {/* Sub-tasks */}
      {expanded &&
        tasks.map((task) => (
          <TaskRow
            key={task.id}
            task={task}
            firm={firm}
            usersMap={usersMap}
            indented
          />
        ))}
    </>
  );
}

// ── Status section ────────────────────────────────────────────────────────────

interface StatusSectionProps {
  group: StatusGroup;
  tasks: Task[];
  firm: Firm | null;
  usersMap: Map<string, User>;
  groupedByProject: boolean;
  onProjectClick?: (projectId: string | null, label: string) => void;
}

function StatusSection({ group, tasks, firm, usersMap, groupedByProject, onProjectClick }: StatusSectionProps) {
  const [collapsed, setCollapsed] = useState(false);

  // Group tasks by project_id
  const byProject = useMemo<Map<string | null, Task[]>>(() => {
    const map = new Map<string | null, Task[]>();
    for (const task of tasks) {
      const key = task.project_id ?? null;
      const arr = map.get(key);
      if (arr) arr.push(task);
      else map.set(key, [task]);
    }
    return map;
  }, [tasks]);

  return (
    <section aria-label={group.label}>
      {/* Section header */}
      <div className="flex items-center gap-2 px-4 py-2 bg-[#F2F4F7] border-b border-[#E9EAEB]">
        <button
          onClick={() => setCollapsed((v) => !v)}
          className="flex items-center gap-2 flex-1 text-left"
          aria-expanded={!collapsed}
          aria-controls={`section-body-${group.id}`}
        >
          <span className="shrink-0 text-[#717680]">
            {collapsed ? (
              <ChevronRight width={14} height={14} aria-hidden="true" />
            ) : (
              <ChevronDown width={14} height={14} aria-hidden="true" />
            )}
          </span>
          <GroupStatusDot groupId={group.id} />
          <span className="text-[12px] font-bold text-[#181D27] uppercase tracking-wide">
            {group.label}
          </span>
          <span className="text-[12px] text-[#717680] font-normal">{tasks.length}</span>
        </button>
        <button
          className="w-6 h-6 rounded flex items-center justify-center text-[#717680] hover:bg-[#E9EAEB] transition-colors"
          aria-label={`Add task to ${group.label}`}
        >
          <Plus width={14} height={14} aria-hidden="true" />
        </button>
      </div>

      {/* Section body */}
      {!collapsed && (
        <div id={`section-body-${group.id}`}>
          {tasks.length === 0 ? (
            <p className="text-[13px] text-[#A4A7AE] px-4 py-3">No tasks</p>
          ) : groupedByProject ? (
            Array.from(byProject.entries()).map(([projectId, projectTasks]) => (
              <ProjectGroupRow
                key={projectId ?? '__none__'}
                projectId={projectId}
                tasks={projectTasks}
                firm={firm}
                usersMap={usersMap}
                onProjectClick={onProjectClick}
              />
            ))
          ) : (
            tasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                firm={firm}
                usersMap={usersMap}
              />
            ))
          )}

          {/* Add task row */}
          <button className="flex items-center gap-2 px-4 py-2 w-full text-left text-[13px] text-[#717680] hover:bg-[#F9FAFB] transition-colors border-b border-[#E9EAEB]">
            <Plus width={14} height={14} className="text-[#A4A7AE]" aria-hidden="true" />
            Add Task
          </button>
        </div>
      )}
    </section>
  );
}

// ── Filter panel status definitions ──────────────────────────────────────────

type DateRangeOption = 'daily' | 'weekly' | 'monthly';

const FILTER_STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: 'draft',            label: 'To Do' },
  { value: 'in_progress',      label: 'In Progress' },
  { value: 'revisions',        label: 'Revisions' },
  { value: 'internal_review',  label: 'Internal Review' },
  { value: 'client_review',    label: 'Client Review' },
  { value: 'approved',         label: 'Approved' },
  { value: 'closed',           label: 'Completed' },
];

// ── Square checkbox (matches screenshot) ─────────────────────────────────────

function FilterCheckbox({ checked, onChange, id }: { checked: boolean; onChange: () => void; id?: string }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      id={id}
      onClick={onChange}
      className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
        checked
          ? 'border-[#7F56D9] bg-[#7F56D9]'
          : 'border-[#D0D5DD] bg-white hover:border-[#7F56D9]'
      }`}
    >
      {checked && (
        <svg width="9" height="7" viewBox="0 0 9 7" fill="none" aria-hidden="true">
          <path d="M1 3.5L3 5.5L8 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  );
}

// ── Filter status badge (uses filter labels, not internal ones) ───────────────

const FILTER_STATUS_COLORS: Record<string, string> = {
  draft:             'bg-[#EFF8FF] text-[#175CD3] border border-[#B2DDFF]',
  in_progress:       'bg-[#EFF8FF] text-[#1565C0] border border-[#B2DDFF]',
  revisions:         'bg-[#FFF4ED] text-[#B93815] border border-[#F9DBAF]',
  internal_review:   'bg-[#ECFDF3] text-[#027A48] border border-[#ABEFC6]',
  client_review:     'bg-[#EEF4FF] text-[#3538CD] border border-[#C7D7FD]',
  approved:          'bg-[#ECFDF3] text-[#027A48] border border-[#ABEFC6]',
  closed:            'bg-[#F2F4F7] text-[#344054] border border-[#D0D5DD]',
};

function FilterStatusBadge({ value, label }: { value: string; label: string }) {
  const cls = FILTER_STATUS_COLORS[value] ?? 'bg-[#F2F4F7] text-[#344054] border border-[#D0D5DD]';
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium ${cls}`}>
      {label}
    </span>
  );
}

// ── Filter panel ───────────────────────────────────────────────────────────────

interface FilterPanelProps {
  open: boolean;
  onClose: () => void;
  users: User[];

  // pending state (inside the panel — not yet committed)
  pendingDateRange: DateRangeOption | null;
  pendingStatuses: string[];
  pendingAssigneeIds: string[];
  onChangeDateRange: (v: DateRangeOption | null) => void;
  onToggleStatus: (v: string) => void;
  onToggleAssignee: (v: string) => void;

  // actions
  onApply: () => void;
  onCancel: () => void;
}

function FilterPanel({
  open,
  onClose,
  users,
  pendingDateRange,
  pendingStatuses,
  pendingAssigneeIds,
  onChangeDateRange,
  onToggleStatus,
  onToggleAssignee,
  onApply,
  onCancel,
}: FilterPanelProps) {
  const [assigneeSearch, setAssigneeSearch] = useState('');

  const filteredUsers = useMemo(() => {
    if (!assigneeSearch.trim()) return users;
    const q = assigneeSearch.toLowerCase();
    return users.filter((u) => u.name.toLowerCase().includes(q));
  }, [users, assigneeSearch]);

  return (
    <>
      {/* Backdrop — closes panel on click */}
      <div
        className={`fixed inset-0 z-40 transition-opacity duration-200 ${
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        aria-hidden="true"
        onClick={onClose}
      />

      {/* Panel — slides in from right, full viewport height */}
      <aside
        className={`fixed inset-y-0 right-0 z-50 w-[380px] bg-white border-l border-[#E9EAEB] shadow-xl flex flex-col transition-transform duration-300 ease-in-out ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Filter tasks"
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

          {/* ── Date Range ── */}
          <p className="text-sm font-semibold text-[#181D27] pt-5 pb-3">Date Range</p>

          {/* Daily / Weekly / Monthly + Select dates — all on one row */}
          <div className="flex items-center gap-1.5">
            {(['daily', 'weekly', 'monthly'] as const).map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => onChangeDateRange(pendingDateRange === opt ? null : opt)}
                className={`px-3 py-1.5 rounded-lg text-[13px] font-medium transition-colors whitespace-nowrap ${
                  pendingDateRange === opt
                    ? 'bg-[#7F56D9] text-white'
                    : 'bg-white text-[#414651] border border-[#D0D5DD] hover:bg-[#F9FAFB]'
                }`}
              >
                {opt.charAt(0).toUpperCase() + opt.slice(1)}
              </button>
            ))}
            <button
              type="button"
              className="flex items-center gap-1.5 border border-[#D0D5DD] rounded-lg px-2.5 py-1.5 text-[13px] text-[#414651] bg-white hover:bg-[#F9FAFB] transition-colors whitespace-nowrap shrink-0"
            >
              <Calendar width={14} height={14} className="text-[#717680] shrink-0" aria-hidden="true" />
              Select dates
            </button>
          </div>

          {/* ── Status ── */}
          <p className="text-sm font-semibold text-[#181D27] pt-5 pb-2">Status</p>

          <ul className="flex flex-col" role="group" aria-label="Filter by status">
            {FILTER_STATUS_OPTIONS.map((opt) => (
              <li key={opt.value}>
                <label className="flex items-center gap-3 py-2 cursor-pointer">
                  <FilterCheckbox
                    checked={pendingStatuses.includes(opt.value)}
                    onChange={() => onToggleStatus(opt.value)}
                    id={`filter-status-${opt.value}`}
                  />
                  <FilterStatusBadge value={opt.value} label={opt.label} />
                </label>
              </li>
            ))}
          </ul>

          {/* ── By Assignee ── */}
          <p className="text-sm font-semibold text-[#181D27] pt-5 pb-2">By Assignee</p>

          {/* Assignee search input */}
          <div className="flex items-center gap-2 border border-[#D0D5DD] rounded-lg px-3 py-2 bg-white mb-1">
            <SearchLg width={15} height={15} className="text-[#A4A7AE] shrink-0" aria-hidden="true" />
            <input
              type="search"
              value={assigneeSearch}
              onChange={(e) => setAssigneeSearch(e.target.value)}
              placeholder="Search"
              aria-label="Search assignees"
              className="flex-1 text-[13px] text-[#181D27] placeholder:text-[#A4A7AE] bg-transparent outline-none"
            />
            <kbd className="border border-[#E9EAEB] rounded px-1.5 py-0.5 text-[11px] text-[#A4A7AE] font-medium leading-none shrink-0">
              ⌘K
            </kbd>
          </div>

          {/* Assignee list */}
          <ul className="flex flex-col" role="group" aria-label="Filter by assignee">
            {/* Unassigned row */}
            <li>
              <label className="flex items-center gap-3 py-2 cursor-pointer">
                <FilterCheckbox
                  checked={pendingAssigneeIds.includes('unassigned')}
                  onChange={() => onToggleAssignee('unassigned')}
                  id="filter-assignee-unassigned"
                />
                <div className="w-7 h-7 rounded-full bg-[#F2F4F7] flex items-center justify-center shrink-0">
                  <User01 width={14} height={14} className="text-[#717680]" aria-hidden="true" />
                </div>
                <span className="text-[13px] text-[#414651]">Unassigned</span>
              </label>
            </li>

            {filteredUsers.map((user) => (
              <li key={user.id}>
                <label className="flex items-center gap-3 py-2 cursor-pointer">
                  <FilterCheckbox
                    checked={pendingAssigneeIds.includes(user.id)}
                    onChange={() => onToggleAssignee(user.id)}
                    id={`filter-assignee-${user.id}`}
                  />
                  <Avatar
                    name={user.name}
                    src={user.avatar_url ?? undefined}
                    size="sm"
                    className="shrink-0"
                  />
                  <span className="text-[13px] text-[#414651] truncate">{user.name}</span>
                </label>
              </li>
            ))}
          </ul>
        </div>

        {/* Sticky footer */}
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

// ── Projects tab content ──────────────────────────────────────────────────────

interface ProjectsTabProps {
  firm: Firm | null;
  tasks: Task[];
  users: User[];
}

function ProjectsTab({ firm, tasks, users }: ProjectsTabProps) {
  const [search, setSearch] = useState('');
  const [groupedByProject, setGroupedByProject] = useState(true);
  const [showAddProject, setShowAddProject] = useState(false);
  const [selectedProject, setSelectedProject] = useState<ProjectDetail | null>(null);

  // ── Filter state (committed = active filters; pending = inside panel) ──────
  const [filterOpen, setFilterOpen] = useState(false);

  // Committed (applied) filter values
  const [filterDateRange, setFilterDateRange] = useState<DateRangeOption | null>(null);
  const [filterStatuses, setFilterStatuses] = useState<string[]>([]);
  const [filterAssigneeIds, setFilterAssigneeIds] = useState<string[]>([]);

  // Pending (inside panel — not yet committed)
  const [pendingDateRange, setPendingDateRange] = useState<DateRangeOption | null>(null);
  const [pendingStatuses, setPendingStatuses] = useState<string[]>([]);
  const [pendingAssigneeIds, setPendingAssigneeIds] = useState<string[]>([]);

  // Sync pending ← committed when panel opens
  const openFilter = () => {
    setPendingDateRange(filterDateRange);
    setPendingStatuses([...filterStatuses]);
    setPendingAssigneeIds([...filterAssigneeIds]);
    setFilterOpen(true);
  };

  const handleApply = () => {
    setFilterDateRange(pendingDateRange);
    setFilterStatuses([...pendingStatuses]);
    setFilterAssigneeIds([...pendingAssigneeIds]);
    setFilterOpen(false);
  };

  const handleCancel = () => {
    // Discard pending changes, restore from committed
    setPendingDateRange(filterDateRange);
    setPendingStatuses([...filterStatuses]);
    setPendingAssigneeIds([...filterAssigneeIds]);
    setFilterOpen(false);
  };

  const togglePendingStatus = (value: string) => {
    setPendingStatuses((prev) =>
      prev.includes(value) ? prev.filter((s) => s !== value) : [...prev, value],
    );
  };

  const togglePendingAssignee = (value: string) => {
    setPendingAssigneeIds((prev) =>
      prev.includes(value) ? prev.filter((a) => a !== value) : [...prev, value],
    );
  };

  // Active filter badge count (for the Filter button badge)
  const activeFilterCount =
    (filterDateRange ? 1 : 0) +
    (filterStatuses.length > 0 ? 1 : 0) +
    (filterAssigneeIds.length > 0 ? 1 : 0);

  const usersMap = useMemo(() => {
    const m = new Map<string, User>();
    for (const u of users) m.set(u.id, u);
    return m;
  }, [users]);

  // Filter tasks: search query first, then active filters
  const filteredTasks = useMemo(() => {
    let result = tasks;

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          (t.description ?? '').toLowerCase().includes(q),
      );
    }

    // Status filter
    if (filterStatuses.length > 0) {
      result = result.filter((t) => filterStatuses.includes(t.status));
    }

    // Assignee filter
    if (filterAssigneeIds.length > 0) {
      const includeUnassigned = filterAssigneeIds.includes('unassigned');
      const assigneeSet = new Set(filterAssigneeIds.filter((a) => a !== 'unassigned'));
      result = result.filter((t) => {
        if (!t.assignee_id) return includeUnassigned;
        return assigneeSet.has(t.assignee_id);
      });
    }

    // Date range filter (based on deadline)
    if (filterDateRange) {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      result = result.filter((t) => {
        if (!t.deadline) return false;
        const dl = new Date(t.deadline);
        const dlDay = new Date(dl.getFullYear(), dl.getMonth(), dl.getDate());
        const diffMs = dlDay.getTime() - today.getTime();
        const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
        if (filterDateRange === 'daily') return diffDays === 0;
        if (filterDateRange === 'weekly') return diffDays >= 0 && diffDays <= 7;
        if (filterDateRange === 'monthly') return diffDays >= 0 && diffDays <= 30;
        return true;
      });
    }

    return result;
  }, [tasks, search, filterStatuses, filterAssigneeIds, filterDateRange]);

  // Group by status
  const tasksByGroup = useMemo(() => {
    const result = new Map<string, Task[]>();
    for (const g of STATUS_GROUPS) result.set(g.id, []);

    for (const task of filteredTasks) {
      for (const g of STATUS_GROUPS) {
        if (g.statuses.includes(task.status)) {
          result.get(g.id)?.push(task);
          break;
        }
      }
    }
    return result;
  }, [filteredTasks]);

  return (
    <div className="relative flex flex-col flex-1 min-h-0">
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-6 py-3 border-b border-[#E9EAEB] bg-white shrink-0 flex-wrap">
        {/* Search */}
        <div className="flex items-center gap-2 border border-[#E9EAEB] rounded-lg px-3 py-1.5 bg-white text-sm w-56">
          <SearchLg width={16} height={16} className="text-[#A4A7AE] shrink-0" aria-hidden="true" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search"
            aria-label="Search tasks"
            className="flex-1 text-[13px] text-[#181D27] placeholder:text-[#A4A7AE] bg-transparent outline-none"
          />
          <kbd className="border border-[#E9EAEB] rounded px-1.5 py-0.5 text-[11px] text-[#A4A7AE] font-medium leading-none shrink-0">
            ⌘K
          </kbd>
        </div>

        {/* Grouped by Project toggle */}
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <div
            role="checkbox"
            aria-checked={groupedByProject}
            tabIndex={0}
            onClick={() => setGroupedByProject((v) => !v)}
            onKeyDown={(e) => e.key === ' ' && setGroupedByProject((v) => !v)}
            className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${
              groupedByProject
                ? 'bg-[#7F56D9] border-[#7F56D9]'
                : 'bg-white border-[#D0D5DD]'
            }`}
          >
            {groupedByProject && (
              <svg width="10" height="8" viewBox="0 0 10 8" fill="none" aria-hidden="true">
                <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
          <span className="text-[13px] text-[#414651]">Grouped by Project</span>
        </label>

        <div className="flex items-center gap-2 ml-auto">
          {/* Add Project */}
          <button
            onClick={() => setShowAddProject(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#D0D5DD] bg-white text-[13px] font-semibold text-[#344054] hover:bg-[#F9FAFB] transition-colors"
            aria-label="Add project"
          >
            <Plus width={14} height={14} aria-hidden="true" />
            Add Project
          </button>

          {/* Add Task */}
          <button
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#7F56D9] text-[13px] font-semibold text-white hover:bg-[#6941C6] transition-colors"
            aria-label="Add task"
          >
            <Plus width={14} height={14} aria-hidden="true" />
            Add Task
          </button>

          {/* Filter — opens the filter panel */}
          <button
            onClick={openFilter}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[13px] font-semibold transition-colors ${
              activeFilterCount > 0
                ? 'border-[#7F56D9] bg-[#F4F3FF] text-[#7F56D9]'
                : 'border-[#D0D5DD] bg-white text-[#344054] hover:bg-[#F9FAFB]'
            }`}
            aria-label="Filter tasks"
            aria-expanded={filterOpen}
          >
            <FilterLines width={14} height={14} aria-hidden="true" />
            Filter
            {activeFilterCount > 0 && (
              <span className="flex items-center justify-center w-4 h-4 rounded-full bg-[#7F56D9] text-white text-[10px] font-bold leading-none">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Table column headers */}
      <div className="grid grid-cols-[1fr_160px_120px_100px_120px] border-b border-[#E9EAEB] bg-[#F9FAFB] shrink-0">
        <div className="px-4 py-2 text-[11px] font-semibold text-[#717680] uppercase tracking-wide">
          Tasks / Projects
        </div>
        <div className="px-3 py-2 text-[11px] font-semibold text-[#717680] uppercase tracking-wide">
          Assignee
        </div>
        <div className="px-3 py-2 text-[11px] font-semibold text-[#717680] uppercase tracking-wide">
          Due date
        </div>
        <div className="px-3 py-2 text-[11px] font-semibold text-[#717680] uppercase tracking-wide">
          Priority
        </div>
        <div className="px-3 py-2 text-[11px] font-semibold text-[#717680] uppercase tracking-wide">
          Status
        </div>
      </div>

      {/* Scrollable sections body */}
      <div className="flex-1 overflow-y-auto">
        {STATUS_GROUPS.map((group) => {
          const groupTasks = tasksByGroup.get(group.id) ?? [];
          return (
            <StatusSection
              key={group.id}
              group={group}
              tasks={groupTasks}
              firm={firm}
              usersMap={usersMap}
              groupedByProject={groupedByProject}
              onProjectClick={(projectId, label) => {
                const firmAbbr = firm?.name
                  ? firm.name.split(' ').map((w) => w[0]).join('').toUpperCase()
                  : 'AWP';
                setSelectedProject({
                  id: projectId ?? label,
                  name: label,
                  description: '',
                  status: 'In progress',
                  memberIds: [...usersMap.keys()].slice(0, 3),
                  firmName: firm?.name ?? '',
                  firmAbbr,
                });
              }}
            />
          );
        })}
      </div>

      {/* Filter panel overlay */}
      <FilterPanel
        open={filterOpen}
        onClose={handleCancel}
        users={users}
        pendingDateRange={pendingDateRange}
        pendingStatuses={pendingStatuses}
        pendingAssigneeIds={pendingAssigneeIds}
        onChangeDateRange={setPendingDateRange}
        onToggleStatus={togglePendingStatus}
        onToggleAssignee={togglePendingAssignee}
        onApply={handleApply}
        onCancel={handleCancel}
      />

      {/* Add Project modal */}
      <AddProjectModal
        open={showAddProject}
        onClose={() => setShowAddProject(false)}
        firmName={firm?.name}
        users={users}
      />

      {/* Project Detail panel */}
      <ProjectDetailPanel
        open={!!selectedProject}
        onClose={() => setSelectedProject(null)}
        project={selectedProject}
        users={users}
      />
    </div>
  );
}

// ── Coming soon placeholder ───────────────────────────────────────────────────

function ComingSoon() {
  return (
    <div className="flex-1 flex items-center justify-center">
      <p className="text-sm text-[#A4A7AE]">Coming soon</p>
    </div>
  );
}

// ── FirmDetailPage ────────────────────────────────────────────────────────────

export default function FirmDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<TabId>('projects');

  const { data: firm = null, isLoading: firmLoading, error: firmError } = useFirmDetail(id!);
  const { data: tasks = [],  isLoading: tasksLoading }                  = useTasksByFirm(id!);
  const { data: users = [] }                                             = useUsers();

  const loading = firmLoading || tasksLoading;
  const error   = firmError ? (firmError as Error).message : null;

  // ── Loading state ──────────────────────────────────────────────────────────

  if (loading) {
    return (
      <main className="flex flex-col flex-1 min-h-0 overflow-hidden">
        <div className="flex flex-col flex-1 items-center justify-center">
          <div className="w-6 h-6 border-2 border-[#7F56D9] border-t-transparent rounded-full animate-spin" aria-label="Loading" />
          <p className="text-[13px] text-[#717680] mt-3">Loading firm details…</p>
        </div>
      </main>
    );
  }

  // ── Error state ────────────────────────────────────────────────────────────

  if (error) {
    return (
      <main className="flex flex-col flex-1 min-h-0 overflow-hidden">
        <div className="flex flex-col flex-1 items-center justify-center gap-3">
          <p className="text-[13px] text-red-500">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="text-[13px] text-[#7F56D9] hover:underline"
          >
            Go back
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex flex-col flex-1 min-h-0 overflow-hidden" role="main">

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <header className="shrink-0 px-6 pt-5 pb-0 bg-white border-b border-[#E9EAEB]">

        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 mb-2">
          <button
            onClick={() => navigate('/firms')}
            className="text-[13px] text-[#717680] hover:text-[#414651] transition-colors"
          >
            Firms
          </button>
          <ChevronRight width={14} height={14} className="text-[#A4A7AE]" aria-hidden="true" />
          <button
            onClick={() => setActiveTab('overview')}
            className="text-[13px] text-[#717680] hover:text-[#414651] transition-colors"
          >
            {firm?.name ?? '…'}
          </button>
          <ChevronRight width={14} height={14} className="text-[#A4A7AE]" aria-hidden="true" />
          <span className="text-[13px] text-[#181D27] font-medium" aria-current="page">
            {TABS.find((t) => t.id === activeTab)?.label ?? 'Projects'}
          </span>
        </nav>

        {/* Firm name title */}
        <h1 className="text-[22px] font-bold text-[#181D27] leading-tight mb-4">
          {firm?.name ?? '—'}
        </h1>

        {/* Tab bar */}
        <div
          className="flex items-end gap-0 overflow-x-auto"
          role="tablist"
          aria-label="Firm sections"
          style={{ scrollbarWidth: 'none' }}
        >
          {TABS.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={`tabpanel-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={`shrink-0 px-4 py-2 text-[13px] font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-[#7F56D9] text-[#7F56D9]'
                  : 'border-transparent text-[#717680] hover:text-[#414651] hover:border-[#D0D5DD]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      {/* ── Tab panel ────────────────────────────────────────────────────── */}
      <div
        className="flex flex-col flex-1 min-h-0 overflow-hidden"
        role="tabpanel"
        id={`tabpanel-${activeTab}`}
        aria-labelledby={activeTab}
      >
        {activeTab === 'projects' ? (
          <ProjectsTab firm={firm} tasks={tasks} users={users} />
        ) : (
          <ComingSoon />
        )}
      </div>
    </main>
  );
}
