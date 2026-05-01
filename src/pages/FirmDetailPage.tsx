import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ChevronRight,
  ChevronDown,
  FolderClosed,
  Plus,
  FilterLines,
  X,
  Calendar,
  User01,
  Edit01,
  Trash01,
} from '@untitled-ui/icons-react';
import Toast from '../components/ui/Toast';
import ConfirmDeleteModal from '../components/ui/ConfirmDeleteModal';
import DropdownMenu from '../components/ui/DropdownMenu';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { useDeleteFirm } from '../hooks/useFirms';
import TabBar from '../components/ui/TabBar';
import iconDropbox  from '../assets/quick-links/icon-dropbox.svg';
import iconReports  from '../assets/quick-links/icon-reports.svg';
import iconHubspot  from '../assets/quick-links/icon-hubspot.svg';
import iconPhone    from '../assets/contact-icons/icon-phone.svg';
import iconMail     from '../assets/contact-icons/icon-mail.svg';
import iconCalendar from '../assets/contact-icons/icon-calendar.svg';

import type { Firm, Task, User } from '../lib/api';
import { useFirmDetail } from '../hooks/useFirms';
import { useTasksByFirm } from '../hooks/useTasks';
import { useUsers } from '../hooks/useUsers';
import AvatarStack from '../components/ui/AvatarStack';
import Avatar from '../components/ui/Avatar';
import SearchInput from '../components/ui/SearchInput';
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
  | 'activities'
  | 'firm-details';

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
  { id: 'firm-details',    label: 'Firm Details' },
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
          <SearchInput
            value={assigneeSearch}
            onChange={setAssigneeSearch}
            placeholder="Search"
            className="mb-1"
          />

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
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search"
          className="w-56 py-1.5 border-[#E9EAEB]"
        />

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

// ── Firm Details tab ──────────────────────────────────────────────────────────

interface FirmDetailsTabProps {
  firm: Firm;
  users: User[];
}

// Mock chat messages (grouped: before "Today" separator and after)
const MESSAGES_BEFORE: { id: number; sender: string; time: string; text: string; isSelf: boolean }[] = [
  { id: 1, sender: 'You',           time: 'Thursday 11:41am', text: 'Awesome! Thanks.',                                   isSelf: true  },
  { id: 2, sender: 'Demi Wilkinson', time: 'Thursday 11:44am', text: 'Good timing—was just looking at this.',              isSelf: false },
];
const MESSAGES_TODAY: { id: number; sender: string; time: string; text: string; isSelf: boolean }[] = [
  { id: 3, sender: 'Phoenix Baker',  time: 'Friday 2:20pm',    text: 'Hey Olivia, can you please review the latest design?', isSelf: false },
  { id: 4, sender: 'You',            time: 'Friday 2:20pm',    text: "Sure thing, I'll have a look today.",                isSelf: true  },
];

// ── Reusable contact row (avatar + name/role + phone/mail/calendar) ───────────

interface ContactRowProps {
  name: string;
  role?: string | null;
  avatarSrc?: string;
  phone?: string | null;
  email?: string | null;
}

function ContactRow({ name, role, avatarSrc, phone, email }: ContactRowProps) {
  return (
    <div className="flex items-center gap-3 mt-2.5">
      <Avatar name={name} src={avatarSrc} size="sm" className="shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-[#7c3aed] truncate">{name}</p>
        {role && <p className="text-[12px] text-[#6b7280] truncate mt-0.5">{role}</p>}
      </div>
      <div className="flex gap-1.5 shrink-0">
        <a
          href={phone ? `tel:${phone}` : '#'}
          onClick={!phone ? (e) => e.preventDefault() : undefined}
          className="w-7 h-7 rounded-full border border-[#e5e7eb] bg-white flex items-center justify-center hover:border-[#d4d6db] transition-colors"
          aria-label="Call"
        >
          <img src={iconPhone} alt="" width={13} height={13} />
        </a>
        <a
          href={email ? `mailto:${email}` : '#'}
          onClick={!email ? (e) => e.preventDefault() : undefined}
          className="w-7 h-7 rounded-full border border-[#e5e7eb] bg-white flex items-center justify-center hover:border-[#d4d6db] transition-colors"
          aria-label="Email"
        >
          <img src={iconMail} alt="" width={13} height={13} />
        </a>
        <button
          className="w-7 h-7 rounded-full border border-[#e5e7eb] bg-white flex items-center justify-center hover:border-[#d4d6db] transition-colors"
          aria-label="Schedule meeting"
        >
          <img src={iconCalendar} alt="" width={13} height={13} />
        </button>
      </div>
    </div>
  );
}

// ── Double-check SVG ──────────────────────────────────────────────────────────

function DoubleCheck() {
  return (
    <svg width="16" height="10" viewBox="0 0 16 10" fill="none" aria-hidden="true">
      <path d="M1 5L4.5 8.5L10 2" stroke="#12B76A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M6 5L9.5 8.5L15 2" stroke="#12B76A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function OverviewTab({ firm, users, onEditFirm, onDeleteFirm }: FirmDetailsTabProps & { onEditFirm: () => void; onDeleteFirm: () => void }) {
  const [commTab,     setCommTab]     = useState<'communications' | 'requests'>('communications');
  const [actionsOpen, setActionsOpen] = useState(false);

  const accountManager = users.find((u) => u.id === firm.account_manager_id) ?? null;
  const firmHref = firm.website
    ? (firm.website.startsWith('http') ? firm.website : `https://${firm.website}`)
    : '#';

  return (
    <div className="flex flex-1 min-h-0 overflow-hidden bg-white">

      {/* ── Left: main content ──────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-10 py-6 min-w-0">

        {/* Firm header row */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {/* Logo / Initials — 36×36 */}
            {firm.logo_url ? (
              <img
                src={firm.logo_url}
                alt={firm.name}
                className="w-9 h-9 rounded-lg object-cover border border-[#e5e7eb] shrink-0"
              />
            ) : (
              <div className="w-9 h-9 rounded-lg bg-[#EEF4FF] flex items-center justify-center shrink-0">
                <span className="text-[14px] font-bold text-[#3538CD]">{firm.name.charAt(0).toUpperCase()}</span>
              </div>
            )}
            <span
              className="font-bold text-[#0f172a]"
              style={{ fontSize: '22px', letterSpacing: '-0.01em' }}
            >
              {firm.name}
            </span>
          </div>

          {/* Actions dropdown */}
          <div className="relative">
            <button
              onClick={() => setActionsOpen((v) => !v)}
              className="border border-[#e5e7eb] rounded-lg px-3.5 py-[7px] text-[13px] font-medium text-[#0f172a] bg-white flex items-center gap-2"
            >
              Actions
              <ChevronDown width={14} height={14} aria-hidden="true" />
            </button>
            <DropdownMenu
              open={actionsOpen}
              onClose={() => setActionsOpen(false)}
              align="right"
              items={[
                {
                  label: 'Edit firm',
                  icon: <Edit01 width={14} height={14} className="text-[#6b7280]" aria-hidden="true" />,
                  onClick: () => { setActionsOpen(false); onEditFirm(); },
                },
                {
                  label: 'Delete firm',
                  icon: <Trash01 width={14} height={14} aria-hidden="true" />,
                  onClick: () => { setActionsOpen(false); onDeleteFirm(); },
                  variant: 'danger',
                },
              ]}
            />
          </div>
        </div>

        {/* About this firm */}
        <p className="text-[12.5px] font-semibold text-[#0f172a] mt-3.5 mb-1.5">About this firm</p>
        <p className="text-[13px] leading-[1.55] text-[#6b7280] max-w-[540px]">
          {firm.description || 'No description provided.'}
        </p>

        {/* Sub-tabs */}
        <div className="flex items-center gap-1 mt-[30px] mb-[18px]">
          {(['communications', 'requests'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setCommTab(t)}
              className={`px-3.5 py-1.5 text-[13px] font-medium rounded-lg cursor-pointer transition-colors ${
                commTab === t
                  ? 'bg-[#f3f4f6] text-[#0f172a]'
                  : 'text-[#6b7280] hover:text-[#0f172a]'
              }`}
            >
              {t === 'communications' ? 'Communications' : 'Requests'}
            </button>
          ))}
        </div>

        {/* Chat area */}
        {commTab === 'communications' ? (
          <div className="flex flex-col gap-[22px]">
            {/* Messages before today */}
            {MESSAGES_BEFORE.map((msg) => (
              msg.isSelf ? (
                /* "me" message — right-aligned */
                <div key={msg.id} className="flex flex-col items-end gap-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[12.5px] font-medium text-[#6b7280]">{msg.sender}</span>
                    <span className="text-[12px] text-[#9ca3af]">{msg.time}</span>
                    <DoubleCheck />
                  </div>
                  <div className="bg-white border border-[#e5e7eb] rounded-[10px] px-3.5 py-2.5 text-[13.5px] leading-[1.5] text-[#0f172a]">
                    {msg.text}
                  </div>
                </div>
              ) : (
                /* "them" message — left-aligned */
                <div key={msg.id} className="flex items-start gap-3">
                  <div className="relative shrink-0">
                    <Avatar name={msg.sender} size="sm" />
                    <span
                      className="absolute bottom-0 right-0 rounded-full border-2 border-white bg-[#22c55e]"
                      style={{ width: 10, height: 10 }}
                      aria-hidden="true"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="bg-[#f4f5f7] rounded-[10px] px-3.5 py-2.5 text-[13.5px] leading-[1.5] text-[#0f172a]">
                      {msg.text}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-[13px] text-[#0f172a]">{msg.sender}</span>
                      <span className="text-[12px] text-[#9ca3af]">{msg.time}</span>
                    </div>
                  </div>
                </div>
              )
            ))}

            {/* "Today" day separator */}
            <div className="flex items-center gap-3 my-2">
              <div className="flex-1 h-px bg-[#eef0f3]" />
              <span className="text-[12.5px] text-[#6b7280] font-medium">Today</span>
              <div className="flex-1 h-px bg-[#eef0f3]" />
            </div>

            {/* Messages today */}
            {MESSAGES_TODAY.map((msg) => (
              msg.isSelf ? (
                <div key={msg.id} className="flex flex-col items-end gap-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[12.5px] font-medium text-[#6b7280]">{msg.sender}</span>
                    <span className="text-[12px] text-[#9ca3af]">{msg.time}</span>
                    <DoubleCheck />
                  </div>
                  <div className="bg-white border border-[#e5e7eb] rounded-[10px] px-3.5 py-2.5 text-[13.5px] leading-[1.5] text-[#0f172a]">
                    {msg.text}
                  </div>
                </div>
              ) : (
                <div key={msg.id} className="flex items-start gap-3">
                  <div className="relative shrink-0">
                    <Avatar name={msg.sender} size="sm" />
                    <span
                      className="absolute bottom-0 right-0 rounded-full border-2 border-white bg-[#22c55e]"
                      style={{ width: 10, height: 10 }}
                      aria-hidden="true"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="bg-[#f4f5f7] rounded-[10px] px-3.5 py-2.5 text-[13.5px] leading-[1.5] text-[#0f172a]">
                      {msg.text}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-[13px] text-[#0f172a]">{msg.sender}</span>
                      <span className="text-[12px] text-[#9ca3af]">{msg.time}</span>
                    </div>
                  </div>
                </div>
              )
            ))}
          </div>
        ) : (
          <p className="text-[13px] text-[#9ca3af]">No requests yet.</p>
        )}
      </div>

      {/* ── Right sidebar — exactly 320px ────────────────────────────────── */}
      <aside className="w-[420px] shrink-0 overflow-y-auto overflow-x-hidden px-8 py-6">

        {/* Card 1 — firm details */}
        <div className="border border-[#e5e7eb] rounded-[12px] bg-white" style={{ padding: '18px 18px 20px' }}>

          {/* Location */}
          {firm.location && (
            <div style={{ marginBottom: 14 }}>
              <p className="text-[12px] font-semibold text-[#0f172a] mb-1.5">Location</p>
              <div className="flex items-center gap-2 text-[13px] text-[#0f172a]">
                <span aria-hidden="true">🌏</span>
                <span>{firm.location}</span>
              </div>
            </div>
          )}

          {/* Website */}
          {firm.website && (
            <div style={{ marginBottom: 14 }}>
              <p className="text-[12px] font-semibold text-[#0f172a] mb-1.5">Website</p>
              <a
                href={firmHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#7c3aed] hover:underline max-w-full overflow-hidden"
              >
                <span className="truncate">{firm.website.replace(/^https?:\/\//, '')}</span>
                {/* External link arrow (12px) */}
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true" className="shrink-0">
                  <path d="M2.5 9.5L9.5 2.5M9.5 2.5H4.5M9.5 2.5V7.5" stroke="#7c3aed" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </a>
            </div>
          )}

          {/* Point of Contact */}
          <div style={{ marginBottom: 14 }}>
            <p className="text-[12px] font-semibold text-[#0f172a] mb-1.5">Point of Contact</p>
            {firm.contact_name ? (
              <ContactRow
                name={firm.contact_name}
                role={firm.contact_role}
                phone={firm.contact_phone}
                email={firm.contact_email}
              />
            ) : (
              <p className="text-[12px] text-[#9ca3af] mt-1">Not set</p>
            )}
          </div>

          {/* MW Accounts Manager — last field, no bottom margin */}
          <div>
            <p className="text-[12px] font-semibold text-[#0f172a] mb-1.5">MW Accounts Manager</p>
            {accountManager ? (
              <ContactRow
                name={
                  accountManager.first_name && accountManager.last_name
                    ? `${accountManager.first_name} ${accountManager.last_name}`
                    : accountManager.name
                }
                role={accountManager.member_role}
                avatarSrc={accountManager.avatar_url ?? undefined}
                email={accountManager.email}
              />
            ) : (
              <p className="text-[12px] text-[#9ca3af] mt-1">Not assigned</p>
            )}
          </div>
        </div>

        {/* Card 2 — Quick Links */}
        <div className="border border-[#e5e7eb] rounded-[12px] bg-white mt-4" style={{ padding: '18px 18px 20px' }}>
          <p className="text-[13px] font-semibold text-[#0f172a] mb-3.5">Quick Links</p>

          {/* DropBox */}
          <button className="w-full flex items-center gap-3 text-left group">
            <img src={iconDropbox} alt="Dropbox" className="w-9 h-9 rounded-full object-contain shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-[#7c3aed] group-hover:underline truncate">DropBox</p>
              <p className="text-[12px] text-[#6b7280] mt-0.5 truncate">Access files and assets</p>
            </div>
          </button>

          {/* Reports */}
          <button className="w-full flex items-center gap-3 text-left group mt-3.5">
            <img src={iconReports} alt="Reports" className="w-9 h-9 rounded-full object-contain shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-[#7c3aed] group-hover:underline truncate">Reports</p>
              <p className="text-[12px] text-[#6b7280] mt-0.5 truncate">View and Analyse</p>
            </div>
          </button>

          {/* Hubspot */}
          <button className="w-full flex items-center gap-3 text-left group mt-3.5">
            <img src={iconHubspot} alt="HubSpot" className="w-9 h-9 rounded-full object-contain shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-[#7c3aed] group-hover:underline truncate">Hubspot</p>
              <p className="text-[12px] text-[#6b7280] mt-0.5 truncate">Access Client hubspot</p>
            </div>
          </button>
        </div>

      </aside>
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

  const [activeTab, setActiveTab]       = useState<TabId>('projects');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showToast, setShowToast]       = useState(false);

  const deleteFirm = useDeleteFirm();

  const { data: firm = null, isLoading: firmLoading, error: firmError } = useFirmDetail(id!);
  const { data: tasks = [],  isLoading: tasksLoading }                  = useTasksByFirm(id!);
  const { data: users = [] }                                             = useUsers();

  const loading = firmLoading || tasksLoading;
  const error   = firmError ? (firmError as Error).message : null;

  async function handleDeleteConfirm() {
    try {
      await deleteFirm.mutateAsync(id!);
      setShowDeleteModal(false);
      setShowToast(true);
      setTimeout(() => navigate('/firms'), 1500);
    } catch {
      setShowDeleteModal(false);
    }
  }

  // ── Loading state ──────────────────────────────────────────────────────────

  if (loading) {
    return (
      <main className="flex flex-col flex-1 min-h-0 overflow-hidden">
        <LoadingSpinner fullPage message="Loading firm details…" />
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
    <>
      {showToast && (
        <Toast
          message="Firm deleted successfully"
          onClose={() => setShowToast(false)}
        />
      )}
      <ConfirmDeleteModal
        open={showDeleteModal}
        isDeleting={deleteFirm.isPending}
        title="Delete Firm"
        description={
          <>
            Are you sure you want to delete{' '}
            <span className="font-bold text-[#0f172a]">{firm?.name ?? ''}</span>?{' '}
            This action cannot be undone and will permanently remove all associated data.
          </>
        }
        onConfirm={handleDeleteConfirm}
        onClose={() => setShowDeleteModal(false)}
      />
    <main className="flex flex-col flex-1 min-h-0 overflow-hidden" role="main">

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <header className="shrink-0 px-6 pt-5 pb-0 bg-white">

        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 mb-2">
          <button
            onClick={() => navigate('/firms')}
            className="text-[13px] text-[#717680] hover:text-[#414651] transition-colors"
          >
            Firms
          </button>
          <ChevronRight width={14} height={14} className="text-[#A4A7AE]" aria-hidden="true" />
          <span className="text-[13px] text-[#7F56D9] font-medium" aria-current="page">
            {firm?.name ?? '…'}
          </span>
        </nav>

        {/* Firm name title */}
        <h1 className="text-[22px] font-bold text-[#181D27] leading-tight mb-4">
          {firm?.name ?? '—'}
        </h1>

        {/* Tab bar */}
        <div
          className="overflow-x-auto"
          role="tablist"
          aria-label="Firm sections"
          style={{ scrollbarWidth: 'none' }}
        >
          <TabBar
            tabs={TABS.map((t) => ({ id: t.id, label: t.label }))}
            activeId={activeTab}
            onChange={(id) => setActiveTab(id as TabId)}
          />
        </div>
      </header>

      {/* ── Tab panel ────────────────────────────────────────────────────── */}
      <div
        className="flex flex-col flex-1 min-h-0 overflow-hidden"
        role="tabpanel"
        id={`tabpanel-${activeTab}`}
        aria-labelledby={activeTab}
      >
        {activeTab === 'firm-details' ? (
          <OverviewTab
            firm={firm!}
            users={users}
            onEditFirm={() => navigate(`/firms/${id}/edit`)}
            onDeleteFirm={() => setShowDeleteModal(true)}
          />
        ) : activeTab === 'projects' ? (
          <ProjectsTab firm={firm} tasks={tasks} users={users} />
        ) : (
          <ComingSoon />
        )}
      </div>
    </main>
    </>
  );
}
