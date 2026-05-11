import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, FilterLines, ChevronDown, ChevronRight,
  DotsVertical, Edit01, Trash01, X, SearchLg,
} from '@untitled-ui/icons-react';
import { useProjects, useFirms, useDeleteProject, useCreateProject } from '../hooks/useFirms';
import { useUsers } from '../hooks/useUsers';
import { useTasks } from '../hooks/useTasks';
import AvatarStack from '../components/ui/AvatarStack';
import ProjectSummaryPanel from '../components/firms/ProjectSummaryPanel';
import ProjectDetailPanel, { type ProjectDetail } from '../components/firms/ProjectDetailPanel';
import { useUpdateProject } from '../hooks/useFirms';
import AddProjectModal, { type ProjectFormData } from '../components/firms/AddProjectModal';
import DeleteProjectModal from '../components/firms/DeleteProjectModal';
import ProjectIcon from '../components/icons/ProjectIcon';
import DropdownMenu from '../components/ui/DropdownMenu';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import {
  COL_ASSIGNEE, COL_DATE, COL_PRIORITY, COL_STATUS, COL_MENU,
  PRIORITY_BADGE, formatDeadline,
} from '../components/firms/TaskRow';
import type { Project } from '../lib/api';

// ── Constants ─────────────────────────────────────────────────────────────────

// Exact same 8 sections as FirmDetailPage / ProjectsTab
const STATUS_GROUPS = [
  { id: 'todo',         label: 'To Do'          },
  { id: 'assigned',     label: 'Assigned'       },
  { id: 'inprogress',   label: 'In Progress'    },
  { id: 'revisions',    label: 'Revisions'      },
  { id: 'inreview',     label: 'Internal Review'},
  { id: 'clientreview', label: 'Client Review'  },
  { id: 'completed',    label: 'Completed'      },
  { id: 'blocked',      label: 'Blocked'        },
];

// Maps TASK status → section group id (same logic as FirmDetailPage STATUS_GROUPS)
const TASK_STATUS_TO_GROUP: Record<string, string> = {
  to_do:             'todo',
  assigned:          'assigned',
  in_progress:       'inprogress',
  revisions:         'revisions',
  internal_review:   'inreview',
  client_review:     'clientreview',
  compliance_review: 'clientreview',
  approved:          'completed',
  closed:            'completed',
  completed:         'completed',
  blocked:           'blocked',
  draft:             'todo',
};

// For empty projects (no tasks) — maps project workflow_status → section group id
const WORKFLOW_TO_GROUP: Record<string, string> = {
  todo:        'todo',
  in_progress: 'inprogress',
  in_review:   'inreview',
  approved:    'completed',
  completed:   'completed',
};

// Maps section group id back to project workflow_status for "Add Project" from a section
const GROUP_TO_WORKFLOW: Record<string, string> = {
  todo:         'todo',
  assigned:     'todo',
  inprogress:   'in_progress',
  revisions:    'in_progress',
  inreview:     'in_review',
  clientreview: 'in_review',
  completed:    'completed',
  blocked:      'in_progress',
};

const WORKFLOW_BADGE: Record<string, { label: string; style: string }> = {
  todo:        { label: 'To Do',       style: 'bg-gray-100 text-gray-500' },
  in_progress: { label: 'In Progress', style: 'bg-purple-50 text-purple-600' },
  in_review:   { label: 'In Review',   style: 'bg-yellow-50 text-yellow-700' },
  approved:    { label: 'Approved',    style: 'bg-green-50 text-green-700' },
  completed:   { label: 'Completed',   style: 'bg-gray-100 text-gray-600' },
};

const WORKFLOW_DOT_COLOR: Record<string, string> = {
  todo:        '#A4A7AE',
  in_progress: '#7F56D9',
  in_review:   '#F79009',
  approved:    '#17B26A',
  completed:   '#181D27',
};

type ProjectStatus = 'In progress' | 'To Do' | 'In Review' | 'Approved' | 'Completed' | 'Blocked';

const WORKFLOW_TO_DISPLAY: Record<string, ProjectStatus> = {
  todo:        'To Do',
  in_progress: 'In progress',
  in_review:   'In Review',
  approved:    'Approved',
  completed:   'Completed',
};

const DISPLAY_TO_WORKFLOW: Record<string, string> = {
  'To Do':       'todo',
  'In progress': 'in_progress',
  'In Review':   'in_review',
  'Approved':    'approved',
  'Completed':   'completed',
  'Blocked':     'in_progress',
};

const PROJ_PRIORITY_MAP: Record<string, 'high' | 'medium' | 'low'> = {
  High: 'high', Medium: 'medium', Low: 'low',
};

// ── ProjectRow ────────────────────────────────────────────────────────────────

interface ProjectRowProps {
  project: Project;
  taskCount?: number;
  showFirmBadge?: boolean;
  onProjectClick: (p: Project) => void;
  onDeleteProject: (p: Project) => void;
  onNavigate: (p: Project) => void;
}

function ProjectRow({ project, taskCount, showFirmBadge = true, onProjectClick, onDeleteProject, onNavigate }: ProjectRowProps) {
  const [contextOpen, setContextOpen] = useState(false);
  const isArchived = project.status === 'archived';
  const { text: dateText, overdue } = formatDeadline(project.end_date ?? null);
  const workflowBadge = WORKFLOW_BADGE[project.workflow_status] ?? { label: project.workflow_status, style: 'bg-gray-100 text-gray-500' };
  const priorityStyle = PRIORITY_BADGE[project.priority] ?? 'bg-gray-100 text-gray-500';
  const dotColor = WORKFLOW_DOT_COLOR[project.workflow_status] ?? '#A4A7AE';
  const memberAvatars = (project.members ?? []).map((m) => ({ name: m.name ?? '', src: m.avatar_url ?? undefined }));

  return (
    <div className={`group/row flex items-center gap-2 pl-6 pr-2 py-2.5 border-b border-[#E9EAEB] hover:bg-[#F9FAFB] transition-colors ${isArchived ? 'opacity-60' : ''}`}>
      {/* Status dot */}
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0" aria-hidden="true">
        <circle cx="8" cy="8" r="6.5" stroke={dotColor} strokeWidth="1.5" />
        <circle cx="8" cy="8" r="3" fill={dotColor} />
      </svg>

      {/* Name + badges */}
      <div className="flex-1 min-w-0 flex items-center gap-2">
        <ProjectIcon width={15} height={15} className="text-[#7F56D9] shrink-0" />
        <button
          type="button"
          className="text-[13px] font-semibold text-[#181D27] truncate hover:text-[#7F56D9] hover:underline"
          onClick={() => onProjectClick(project)}
        >
          {project.name}
        </button>
        {isArchived && (
          <span className="text-[10px] font-semibold text-[#717680] bg-[#F2F4F7] border border-[#E9EAEB] px-1.5 py-0.5 rounded uppercase tracking-wide shrink-0">
            Archived
          </span>
        )}
        {showFirmBadge && project.firm_name && (
          <span className="text-[11px] font-medium text-[#717680] bg-[#F2F4F7] px-1.5 py-0.5 rounded shrink-0">
            {project.firm_name}
          </span>
        )}
        {taskCount !== undefined && taskCount > 0 && (
          <span className="text-[11px] text-[#A4A7AE] shrink-0">
            {taskCount} task{taskCount !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Assignees */}
      <div className={`${COL_ASSIGNEE} flex justify-center`}>
        <AvatarStack avatars={memberAvatars} max={3} />
      </div>

      {/* Due date */}
      <div className={`${COL_DATE} text-[12px] shrink-0 ${overdue ? 'text-red-500 font-medium' : project.end_date ? 'text-[#344054]' : 'text-[#C8CAD0]'}`}>
        {dateText}
      </div>

      {/* Priority */}
      <div className={COL_PRIORITY}>
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold capitalize ${priorityStyle}`}>
          {project.priority}
        </span>
      </div>

      {/* Status */}
      <div className={COL_STATUS}>
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${workflowBadge.style}`}>
          {workflowBadge.label}
        </span>
      </div>

      {/* Context menu */}
      <div className={`${COL_MENU} flex items-center justify-center`}>
        <div className="relative opacity-0 group-hover/row:opacity-100 transition-opacity">
          <button
            onClick={() => setContextOpen((v) => !v)}
            className="w-6 h-6 rounded flex items-center justify-center text-[#717680] hover:bg-[#E9EAEB] transition-colors"
            aria-label="Project actions"
          >
            <DotsVertical width={14} height={14} aria-hidden="true" />
          </button>
          <DropdownMenu
            open={contextOpen}
            onClose={() => setContextOpen(false)}
            align="right"
            items={[
              {
                label: 'Edit',
                icon: <Edit01 width={14} height={14} className="text-[#717680]" aria-hidden="true" />,
                onClick: () => { setContextOpen(false); onProjectClick(project); },
              },
              {
                label: 'Open Project',
                onClick: () => { setContextOpen(false); onNavigate(project); },
              },
              {
                label: 'Delete',
                icon: <Trash01 width={14} height={14} aria-hidden="true" />,
                onClick: () => { setContextOpen(false); onDeleteProject(project); },
                variant: 'danger' as const,
              },
            ]}
          />
        </div>
      </div>
    </div>
  );
}

// ── ProjectStatusSection ──────────────────────────────────────────────────────

interface ProjectStatusSectionProps {
  label: string;
  groupId: string;
  projects: { project: Project; taskCount: number }[];
  showFirmBadge?: boolean;
  onProjectClick: (p: Project) => void;
  onDeleteProject: (p: Project) => void;
  onNavigate: (p: Project) => void;
  onAddProject?: (groupId: string) => void;
}

function ProjectStatusSection({
  label, groupId, projects, showFirmBadge,
  onProjectClick, onDeleteProject, onNavigate, onAddProject,
}: ProjectStatusSectionProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <section aria-label={label}>
      <div className="flex items-center gap-2 pl-4 pr-2 py-2.5 bg-white border-b border-[#E9EAEB]">
        <button
          onClick={() => setCollapsed((v) => !v)}
          className="flex items-center gap-2 flex-1 text-left"
          aria-expanded={!collapsed}
        >
          {collapsed
            ? <ChevronRight width={14} height={14} className="shrink-0 text-[#717680]" aria-hidden="true" />
            : <ChevronDown  width={14} height={14} className="shrink-0 text-[#717680]" aria-hidden="true" />}
          <span className="text-[13px] font-semibold text-[#181D27]">{label}</span>
          {projects.length > 0 && (
            <span className="text-[12px] text-[#717680]">{projects.length}</span>
          )}
        </button>
        {onAddProject && (
          <button
            onClick={() => onAddProject(groupId)}
            className="w-6 h-6 rounded flex items-center justify-center text-[#717680] hover:bg-[#E9EAEB] transition-colors"
            aria-label={`Add project to ${label}`}
          >
            <Plus width={14} height={14} aria-hidden="true" />
          </button>
        )}
      </div>

      {!collapsed && projects.length > 0 && (
        <div className="flex items-center gap-2 pl-6 pr-2 py-1.5 border-b border-[#E9EAEB] bg-white">
          <span className="flex-1 text-[11px] font-semibold text-[#A4A7AE] uppercase tracking-wider">Project</span>
          <div className={`${COL_ASSIGNEE} text-[11px] font-semibold text-[#A4A7AE] uppercase tracking-wider text-center`}>Assignee</div>
          <div className={`${COL_DATE}     text-[11px] font-semibold text-[#A4A7AE] uppercase tracking-wider`}>Due date</div>
          <div className={`${COL_PRIORITY} text-[11px] font-semibold text-[#A4A7AE] uppercase tracking-wider`}>Priority</div>
          <div className={`${COL_STATUS}   text-[11px] font-semibold text-[#A4A7AE] uppercase tracking-wider`}>Status</div>
          <div className={`${COL_MENU}`} />
        </div>
      )}

      {!collapsed && (
        projects.length === 0 ? (
          <div className="flex items-center justify-center py-4 border-b border-[#E9EAEB]">
            <p className="text-[13px] text-[#A4A7AE]">No projects in this section</p>
          </div>
        ) : (
          projects.map(({ project, taskCount }) => (
            <ProjectRow
              key={project.id}
              project={project}
              taskCount={taskCount}
              showFirmBadge={showFirmBadge}
              onProjectClick={onProjectClick}
              onDeleteProject={onDeleteProject}
              onNavigate={onNavigate}
            />
          ))
        )
      )}
    </section>
  );
}

// ── ProjectFilterPanel ────────────────────────────────────────────────────────

const FILTER_STATUS_OPTIONS = [
  { id: 'todo',         label: 'To Do',          pill: null },
  { id: 'assigned-me',  label: 'Assigned to me',  pill: 'bg-[#EEF4FF] text-[#3538CD] border border-[#C7D7FD]' },
  { id: 'today-due',    label: 'Today Due',        pill: 'bg-[#FFFAEB] text-[#B54708] border border-[#FEDF89]' },
  { id: 'overdue',      label: 'Overdue',          pill: 'bg-[#FFF4ED] text-[#C4320A] border border-[#FDDCAB]' },
  { id: 'inprogress',   label: 'Active',           pill: 'bg-[#F6FEF9] text-[#027A48] border border-[#ABEFC6]' },
  { id: 'assigned',     label: 'Assigned',         pill: 'bg-[#F4F3FF] text-[#5925DC] border border-[#D9D6FE]' },
  { id: 'inprogress2',  label: 'In Progress',      pill: 'bg-[#EFF8FF] text-[#175CD3] border border-[#B2DDFF]' },
  { id: 'urgent',       label: 'Urgent',           pill: 'bg-[#FFF4ED] text-[#C4320A] border border-[#F9DBAF]' },
  { id: 'blocked',      label: 'Blocked',          pill: 'bg-[#FFF1F3] text-[#C01048] border border-[#FECDD6]' },
  { id: 'revisions',    label: 'Revisions',        pill: 'bg-[#F4F3FF] text-[#6941C6] border border-[#D9D6FE]' },
  { id: 'completed',    label: 'Closed',           pill: 'bg-[#F2F4F7] text-[#344054] border border-[#D0D5DD]' },
  { id: 'completed2',   label: 'Complete',         pill: 'bg-[#ECFDF3] text-[#027A48] border border-[#ABEFC6]' },
];

interface FilterPanelProps {
  open: boolean;
  firms: { id: string; name: string }[];
  pendingStatuses: string[];
  pendingFirmIds: string[];
  onToggleStatus: (s: string) => void;
  onToggleFirm: (id: string) => void;
  onApply: () => void;
  onClear: () => void;
  onClose: () => void;
}

function ProjectFilterPanel({
  open, firms, pendingStatuses, pendingFirmIds,
  onToggleStatus, onToggleFirm, onApply, onClear, onClose,
}: FilterPanelProps) {
  const [firmSearch,    setFirmSearch]    = useState('');
  const [showAllFirms,  setShowAllFirms]  = useState(false);

  const filteredFirms = useMemo(() => {
    if (!firmSearch.trim()) return firms;
    const q = firmSearch.toLowerCase();
    return firms.filter((f) => f.name.toLowerCase().includes(q));
  }, [firms, firmSearch]);

  const visibleFirms = showAllFirms || firmSearch.trim() ? filteredFirms : filteredFirms.slice(0, 8);
  const hiddenCount  = filteredFirms.length - 8;

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-[360px] bg-white border-l border-[#E9EAEB] shadow-2xl z-50 flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#E9EAEB] shrink-0">
          <span className="text-[16px] font-semibold text-[#181D27]">Filter</span>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-[#717680] hover:bg-[#F2F4F7] transition-colors"
          >
            <X width={16} height={16} aria-hidden="true" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-7">

          {/* Status */}
          <div>
            <p className="text-[13px] font-semibold text-[#181D27] mb-3">Status</p>
            <div className="flex flex-col gap-2.5">
              {FILTER_STATUS_OPTIONS.map((opt) => (
                <label key={opt.id} className="flex items-center gap-3 cursor-pointer group">
                  <div className={`w-4 h-4 rounded flex items-center justify-center border transition-colors shrink-0 ${
                    pendingStatuses.includes(opt.id)
                      ? 'bg-[#7F56D9] border-[#7F56D9]'
                      : 'border-[#D0D5DD] bg-white group-hover:border-[#7F56D9]'
                  }`}
                    onClick={() => onToggleStatus(opt.id)}
                  >
                    {pendingStatuses.includes(opt.id) && (
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path d="M2 5L4 7L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                  {opt.pill ? (
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[12px] font-medium cursor-pointer ${opt.pill}`}
                      onClick={() => onToggleStatus(opt.id)}
                    >
                      {opt.label}
                    </span>
                  ) : (
                    <span
                      className="text-[13px] text-[#344054] font-medium cursor-pointer"
                      onClick={() => onToggleStatus(opt.id)}
                    >
                      {opt.label}
                    </span>
                  )}
                </label>
              ))}
            </div>
          </div>

          {/* Firms */}
          <div>
            <p className="text-[13px] font-semibold text-[#181D27] mb-3">Firms</p>

            {/* Search */}
            <div className="flex items-center gap-2 border border-[#E9EAEB] rounded-lg px-3 py-2 mb-3 bg-white focus-within:border-[#7F56D9] focus-within:ring-1 focus-within:ring-[#7F56D9]/20 transition-all">
              <SearchLg width={14} height={14} className="text-[#A4A7AE] shrink-0" aria-hidden="true" />
              <input
                value={firmSearch}
                onChange={(e) => setFirmSearch(e.target.value)}
                placeholder="Search"
                className="flex-1 text-[13px] text-[#181D27] placeholder-[#A4A7AE] outline-none bg-transparent"
              />
              <span className="border border-[#E9EAEB] rounded px-1.5 py-0.5 text-[10px] text-[#A4A7AE] font-medium leading-none shrink-0">⌘K</span>
            </div>

            <div className="flex flex-col gap-2.5">
              {visibleFirms.map((f) => (
                <label key={f.id} className="flex items-center gap-3 cursor-pointer group">
                  <div
                    className={`w-4 h-4 rounded flex items-center justify-center border transition-colors shrink-0 ${
                      pendingFirmIds.includes(f.id)
                        ? 'bg-[#7F56D9] border-[#7F56D9]'
                        : 'border-[#D0D5DD] bg-white group-hover:border-[#7F56D9]'
                    }`}
                    onClick={() => onToggleFirm(f.id)}
                  >
                    {pendingFirmIds.includes(f.id) && (
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path d="M2 5L4 7L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                  <span
                    className="text-[13px] text-[#344054] truncate cursor-pointer"
                    onClick={() => onToggleFirm(f.id)}
                  >
                    {f.name}
                  </span>
                </label>
              ))}

              {!showAllFirms && !firmSearch.trim() && hiddenCount > 0 && (
                <button
                  type="button"
                  onClick={() => setShowAllFirms(true)}
                  className="text-[13px] font-semibold text-[#6941C6] hover:text-[#7F56D9] text-left transition-colors mt-0.5"
                >
                  Show {hiddenCount} more
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#E9EAEB] flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => { onClear(); }}
            className="text-[13px] font-semibold text-[#6941C6] hover:text-[#7F56D9] transition-colors mr-auto"
          >
            Clear filter
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-lg border border-[#D5D7DA] bg-white text-[13px] font-semibold text-[#344054] hover:bg-[#F9FAFB] transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onApply}
            className="px-4 py-2.5 rounded-lg bg-[#7F56D9] hover:bg-[#6941C6] text-white text-[13px] font-semibold transition-colors"
          >
            Apply filter
          </button>
        </div>
      </div>
    </>
  );
}

// ── FirmPickerModal ───────────────────────────────────────────────────────────

interface FirmPickerModalProps {
  open: boolean;
  firms: { id: string; name: string }[];
  onSelect: (firmId: string) => void;
  onClose: () => void;
}

function FirmPickerModal({ open, firms, onSelect, onClose }: FirmPickerModalProps) {
  const [search, setSearch] = useState('');
  if (!open) return null;

  const filtered = search.trim()
    ? firms.filter((f) => f.name.toLowerCase().includes(search.toLowerCase()))
    : firms;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-semibold text-[#181D27]">Select a Firm</h2>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded text-[#717680] hover:bg-[#F2F4F7] transition-colors">
            <X width={16} height={16} aria-hidden="true" />
          </button>
        </div>
        <div className="flex items-center gap-2 border border-[#E9EAEB] rounded-lg px-3 py-2">
          <SearchLg width={14} height={14} className="text-[#A4A7AE] shrink-0" aria-hidden="true" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search firms…"
            className="flex-1 text-[13px] text-[#181D27] placeholder-[#A4A7AE] outline-none bg-transparent"
            autoFocus
          />
        </div>
        <div className="flex flex-col gap-1 max-h-60 overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="text-[13px] text-[#A4A7AE] py-2 text-center">No firms found</p>
          ) : filtered.map((f) => (
            <button key={f.id} type="button" onClick={() => onSelect(f.id)}
              className="text-left px-3 py-2.5 rounded-lg text-[13px] text-[#344054] hover:bg-[#F4F3FF] hover:text-[#6941C6] transition-colors font-medium">
              {f.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function ProjectsSummaryPage() {
  const navigate = useNavigate();

  const [viewMode, setViewMode] = useState<'by-status' | 'by-firm'>('by-status');
  const [selectedFirmId, setSelectedFirmId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const [filterOpen, setFilterOpen] = useState(false);
  const [filterStatuses, setFilterStatuses] = useState<string[]>([]);
  const [filterFirmIds, setFilterFirmIds] = useState<string[]>([]);
  const [pendingStatuses, setPendingStatuses] = useState<string[]>([]);
  const [pendingFirmIds, setPendingFirmIds] = useState<string[]>([]);

  const [addProjectWorkflowStatus, setAddProjectWorkflowStatus] = useState('todo');
  const [addProjectFirmId, setAddProjectFirmId] = useState<string>('');
  const [showFirmPicker, setShowFirmPicker] = useState(false);
  const [showAddProject, setShowAddProject] = useState(false);

  const [selectedProject, setSelectedProject] = useState<ProjectDetail | null>(null);
  const [editProject,     setEditProject]     = useState<ProjectDetail | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

  const { data: allProjects = [], isLoading: projectsLoading } = useProjects();
  const { data: allTasks = [],    isLoading: tasksLoading    } = useTasks();
  const { data: firms = [] } = useFirms();
  const { data: users = [] } = useUsers();
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();
  const createProject = useCreateProject();

  const firmsMap = useMemo(() => new Map(firms.map((f) => [f.id, f])), [firms]);

  // Build a map: projectId → Set<groupId> based on task statuses
  // A project can appear in MULTIPLE sections (same as FirmDetailPage)
  const projectGroupsFromTasks = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const task of allTasks) {
      if (!task.project_id) continue;
      const groupId = TASK_STATUS_TO_GROUP[task.status];
      if (!groupId) continue;
      if (!map.has(task.project_id)) map.set(task.project_id, new Set());
      map.get(task.project_id)!.add(groupId);
    }
    return map;
  }, [allTasks]);

  // Build a map: projectId → task count per groupId
  const projectTaskCounts = useMemo(() => {
    const map = new Map<string, Map<string, number>>();
    for (const task of allTasks) {
      if (!task.project_id) continue;
      const groupId = TASK_STATUS_TO_GROUP[task.status];
      if (!groupId) continue;
      if (!map.has(task.project_id)) map.set(task.project_id, new Map());
      const inner = map.get(task.project_id)!;
      inner.set(groupId, (inner.get(groupId) ?? 0) + 1);
    }
    return map;
  }, [allTasks]);

  // Filtered projects based on search / firm filters
  const filteredProjects = useMemo(() => {
    let result = allProjects;

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((p) =>
        p.name.toLowerCase().includes(q) ||
        (p.firm_name ?? '').toLowerCase().includes(q),
      );
    }

    if (viewMode === 'by-firm' && selectedFirmId) {
      result = result.filter((p) => p.firm_id === selectedFirmId);
    } else if (filterFirmIds.length > 0) {
      result = result.filter((p) => filterFirmIds.includes(p.firm_id));
    }

    return result;
  }, [allProjects, search, filterFirmIds, viewMode, selectedFirmId]);

  const filteredProjectIds = useMemo(
    () => new Set(filteredProjects.map((p) => p.id)),
    [filteredProjects],
  );

  const filteredProjectsMap = useMemo(
    () => new Map(filteredProjects.map((p) => [p.id, p])),
    [filteredProjects],
  );

  // Build per-section project list (with task counts) matching FirmDetailPage logic:
  // - Projects WITH tasks → appear in every section that has tasks for that project
  // - Projects WITHOUT tasks → appear in one section based on their workflow_status
  const projectsByGroup = useMemo(() => {
    const map = new Map<string, { project: Project; taskCount: number }[]>();
    for (const g of STATUS_GROUPS) map.set(g.id, []);

    const projectsWithTasks = new Set<string>();

    // Projects that have tasks — place in each section their tasks belong to
    for (const [projectId, groupSet] of projectGroupsFromTasks) {
      if (!filteredProjectIds.has(projectId)) continue;
      const project = filteredProjectsMap.get(projectId);
      if (!project) continue;

      // Filter by status filter
      const applicableGroups = filterStatuses.length > 0
        ? [...groupSet].filter((g) => filterStatuses.includes(g))
        : [...groupSet];

      if (applicableGroups.length > 0) {
        projectsWithTasks.add(projectId);
        for (const groupId of applicableGroups) {
          const taskCount = projectTaskCounts.get(projectId)?.get(groupId) ?? 0;
          map.get(groupId)?.push({ project, taskCount });
        }
      }
    }

    // Projects WITHOUT any tasks — place by workflow_status
    // Skip if a status filter is active (empty projects don't have a meaningful status to filter on)
    if (filterStatuses.length === 0) {
      for (const project of filteredProjects) {
        if (projectsWithTasks.has(project.id)) continue;
        const groupId = WORKFLOW_TO_GROUP[project.workflow_status] ?? 'todo';
        map.get(groupId)?.push({ project, taskCount: 0 });
      }
    }

    return map;
  }, [filteredProjects, filteredProjectIds, filteredProjectsMap, projectGroupsFromTasks, projectTaskCounts, filterStatuses]);

  const activeFilterCount = (filterStatuses.length > 0 ? 1 : 0) + (filterFirmIds.length > 0 ? 1 : 0);

  const projectCountByFirm = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of allProjects) counts.set(p.firm_id, (counts.get(p.firm_id) ?? 0) + 1);
    return counts;
  }, [allProjects]);

  function openAddProject(groupId: string) {
    const workflowStatus = GROUP_TO_WORKFLOW[groupId] ?? 'todo';
    setAddProjectWorkflowStatus(workflowStatus);
    if (viewMode === 'by-firm' && selectedFirmId) {
      setAddProjectFirmId(selectedFirmId);
      setShowAddProject(true);
    } else {
      setShowFirmPicker(true);
    }
  }

  function handleFirmPickerSelect(firmId: string) {
    setAddProjectFirmId(firmId);
    setShowFirmPicker(false);
    setShowAddProject(true);
  }

  async function handleCreateProject(data: ProjectFormData) {
    if (!addProjectFirmId) return;
    await createProject.mutateAsync({
      firm_id:         addProjectFirmId,
      name:            data.name,
      description:     data.description || undefined,
      member_ids:      data.assigneeIds,
      workflow_status: data.workflowStatus as Project['workflow_status'],
      start_date:      data.startDate || undefined,
      end_date:        data.endDate   || undefined,
      priority:        PROJ_PRIORITY_MAP[data.priority] ?? 'medium',
    });
  }

  function openDetailPanel(project: Project) {
    const firm = firmsMap.get(project.firm_id);
    const firmName = firm?.name ?? project.firm_name ?? '';
    const firmAbbr = firmName.split(' ').map((w) => w[0]).join('').toUpperCase();
    setSelectedProject({
      id:          project.id,
      name:        project.name,
      description: project.description ?? '',
      status:      WORKFLOW_TO_DISPLAY[project.workflow_status] ?? 'To Do',
      memberIds:   project.members.map((m) => m.id),
      firmName,
      firmAbbr,
      startDate:   project.start_date ?? undefined,
      endDate:     project.end_date ?? undefined,
      priority:    project.priority ?? 'medium',
      createdAt:   project.created_at,
    });
  }

  async function handleSaveProject(updated: ProjectDetail) {
    if (!updated.id) return;
    await updateProject.mutateAsync({
      id: updated.id,
      payload: {
        name:            updated.name,
        description:     updated.description || undefined,
        workflow_status: (DISPLAY_TO_WORKFLOW[updated.status] ?? 'todo') as Project['workflow_status'],
        member_ids:      updated.memberIds,
        start_date:      updated.startDate || undefined,
        end_date:        updated.endDate   || undefined,
        priority:        updated.priority,
      },
    });
  }

  function applyFilters() {
    setFilterStatuses([...pendingStatuses]);
    setFilterFirmIds([...pendingFirmIds]);
    setFilterOpen(false);
  }

  function openFilter() {
    setPendingStatuses([...filterStatuses]);
    setPendingFirmIds([...filterFirmIds]);
    setFilterOpen(true);
  }

  const firmForAddModal = addProjectFirmId ? firmsMap.get(addProjectFirmId) : null;
  const isLoading = projectsLoading || tasksLoading;

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-white">

      {/* ── Header ─────────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-[#E9EAEB] bg-white shrink-0 flex-wrap">
        <h1 className="text-[18px] font-bold text-[#181D27] mr-2">Projects</h1>

        <div className="flex items-center gap-2 border border-[#E9EAEB] rounded-lg px-3 py-1.5 bg-white min-w-0 w-52">
          <SearchLg width={14} height={14} className="text-[#A4A7AE] shrink-0" aria-hidden="true" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects…"
            className="flex-1 text-[13px] text-[#181D27] placeholder-[#A4A7AE] outline-none bg-transparent"
          />
        </div>

        <div className="flex items-center gap-1">
          <button type="button" onClick={() => setViewMode('by-status')}
            className={`px-3 py-1.5 text-[13px] font-semibold rounded-lg transition-colors ${
              viewMode === 'by-status'
                ? 'border border-[#D0D5DD] bg-white text-[#181D27] shadow-sm'
                : 'text-[#717680] hover:text-[#414651]'
            }`}>
            By Status
          </button>
          <button type="button" onClick={() => setViewMode('by-firm')}
            className={`px-3 py-1.5 text-[13px] font-semibold rounded-lg transition-colors ${
              viewMode === 'by-firm'
                ? 'border border-[#D0D5DD] bg-white text-[#181D27] shadow-sm'
                : 'text-[#717680] hover:text-[#414651]'
            }`}>
            By Firm
          </button>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <button onClick={() => openAddProject('todo')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#D0D5DD] bg-white text-[13px] font-semibold text-[#344054] hover:bg-[#F9FAFB] transition-colors">
            <Plus width={14} height={14} aria-hidden="true" />
            Add Project
          </button>
          <button onClick={openFilter}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[13px] font-semibold transition-colors ${
              activeFilterCount > 0
                ? 'border-[#7F56D9] bg-[#F4F3FF] text-[#7F56D9]'
                : 'border-[#D0D5DD] bg-white text-[#344054] hover:bg-[#F9FAFB]'
            }`}>
            <FilterLines width={14} height={14} aria-hidden="true" />
            Filter
            {activeFilterCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-[#7F56D9] text-white text-[10px] font-bold leading-none flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ── Body ───────────────────────────────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* By Firm sidebar */}
        {viewMode === 'by-firm' && (
          <aside className="w-56 shrink-0 border-r border-[#E9EAEB] overflow-y-auto">
            <div className="px-3 py-3">
              <p className="text-[11px] font-semibold text-[#A4A7AE] uppercase tracking-wider px-2 mb-2">Firms</p>
              <button type="button" onClick={() => setSelectedFirmId(null)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-[13px] font-medium transition-colors ${
                  selectedFirmId === null
                    ? 'bg-[#F4F3FF] text-[#6941C6]'
                    : 'text-[#344054] hover:bg-[#F9FAFB]'
                }`}>
                <span>All Firms</span>
                <span className="text-[12px] text-[#717680]">{allProjects.length}</span>
              </button>
              {firms.map((firm) => (
                <button key={firm.id} type="button" onClick={() => setSelectedFirmId(firm.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-[13px] font-medium transition-colors ${
                    selectedFirmId === firm.id
                      ? 'bg-[#F4F3FF] text-[#6941C6]'
                      : 'text-[#344054] hover:bg-[#F9FAFB]'
                  }`}>
                  <span className="truncate">{firm.name}</span>
                  <span className="text-[12px] text-[#717680] shrink-0 ml-1">
                    {projectCountByFirm.get(firm.id) ?? 0}
                  </span>
                </button>
              ))}
            </div>
          </aside>
        )}

        {/* Main content */}
        <div className="flex-1 overflow-y-auto overflow-x-auto min-w-0">
          {isLoading ? (
            <LoadingSpinner message="Loading projects…" />
          ) : allProjects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#F4F3FF] flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M3 7C3 5.89543 3.89543 5 5 5H9.58579C9.851 5 10.1054 5.10536 10.2929 5.29289L11.7071 6.70711C11.8946 6.89464 12.149 7 12.4142 7H19C20.1046 7 21 7.89543 21 9V17C21 18.1046 20.1046 19 19 19H5C3.89543 19 3 18.1046 3 17V7Z" stroke="#7F56D9" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M12 11V15M10 13H14" stroke="#7F56D9" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div className="flex flex-col items-center gap-1">
                <p className="text-[15px] font-semibold text-[#181D27]">No projects yet</p>
                <p className="text-[13px] text-[#717680]">Create your first project to get started</p>
              </div>
              <button onClick={() => openAddProject('todo')}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-[#7F56D9] hover:bg-[#6941C6] text-white text-[13px] font-semibold transition-colors">
                <Plus width={14} height={14} aria-hidden="true" />
                Add Project
              </button>
            </div>
          ) : (
            <div className="min-w-[700px] pb-10">
            {STATUS_GROUPS.map((g) => (
              <ProjectStatusSection
                key={g.id}
                label={g.label}
                groupId={g.id}
                projects={projectsByGroup.get(g.id) ?? []}
                showFirmBadge={!(viewMode === 'by-firm' && selectedFirmId)}
                onProjectClick={openDetailPanel}
                onDeleteProject={(p) => setProjectToDelete(p)}
                onNavigate={(p) => navigate(`/firms/${p.firm_id}/projects/${p.id}`)}
                onAddProject={openAddProject}
              />
            ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Modals & panels ─────────────────────────────────────────────────────── */}

      <ProjectFilterPanel
        open={filterOpen}
        firms={firms}
        pendingStatuses={pendingStatuses}
        pendingFirmIds={pendingFirmIds}
        onToggleStatus={(s) => setPendingStatuses((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s])}
        onToggleFirm={(id) => setPendingFirmIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])}
        onApply={applyFilters}
        onClear={() => {
          setPendingStatuses([]);
          setPendingFirmIds([]);
          setFilterStatuses([]);
          setFilterFirmIds([]);
          setFilterOpen(false);
        }}
        onClose={() => setFilterOpen(false)}
      />

      <FirmPickerModal
        open={showFirmPicker}
        firms={firms}
        onSelect={handleFirmPickerSelect}
        onClose={() => setShowFirmPicker(false)}
      />

      <AddProjectModal
        open={showAddProject}
        onClose={() => { setShowAddProject(false); setAddProjectFirmId(''); }}
        firmName={firmForAddModal?.name}
        users={users}
        defaultWorkflowStatus={addProjectWorkflowStatus}
        existingProjectNames={[]}
        onCreate={async (data) => {
          await handleCreateProject(data);
          setShowAddProject(false);
          setAddProjectFirmId('');
        }}
      />

      {/* View panel — Figma-style summary */}
      <ProjectSummaryPanel
        open={!!selectedProject && !editProject}
        onClose={() => setSelectedProject(null)}
        project={selectedProject}
        users={users}
        onEdit={(p) => { setEditProject(p); setSelectedProject(null); }}
        onArchive={(id) => {
          const proj = allProjects.find((p) => p.id === id);
          if (proj) updateProject.mutate({ id, payload: { status: proj.status === 'archived' ? 'active' : 'archived' } });
          setSelectedProject(null);
        }}
        onDelete={(p) => { setProjectToDelete(allProjects.find((ap) => ap.id === p.id) ?? null); setSelectedProject(null); }}
      />

      {/* Edit panel — same TaskDetailPanel style as FirmDetailPage */}
      <ProjectDetailPanel
        open={!!editProject}
        onClose={() => setEditProject(null)}
        project={editProject}
        users={users}
        onSave={async (updated) => {
          await handleSaveProject(updated);
          setEditProject(null);
        }}
        onViewTask={(projectId) => {
          const proj = allProjects.find((p) => p.id === projectId);
          if (proj) navigate(`/firms/${proj.firm_id}/projects/${projectId}`);
          setEditProject(null);
        }}
      />

      <DeleteProjectModal
        open={!!projectToDelete}
        projectId={projectToDelete?.id ?? ''}
        projectName={projectToDelete?.name ?? ''}
        isDeleting={deleteProject.isPending}
        onClose={() => setProjectToDelete(null)}
        onConfirm={async (taskIds) => {
          if (!projectToDelete) return;
          await deleteProject.mutateAsync({ id: projectToDelete.id, taskIds });
          setProjectToDelete(null);
        }}
      />
    </div>
  );
}
