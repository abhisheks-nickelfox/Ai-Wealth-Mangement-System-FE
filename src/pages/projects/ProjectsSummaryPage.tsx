import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProjectFullPanel } from './ProjectFullPage';
import { Plus, ChevronRight, Folder } from '@untitled-ui/icons-react';
import { useProjects, useFirms, useDeleteProject, useCreateProject } from '../../hooks/useFirms';
import { useActiveUsers } from '../../hooks/useUsers';
import { useTasks } from '../../hooks/useTasks';
import { useUpdateProject } from '../../hooks/useFirms';
import { usePendingFilter } from '../../hooks/usePendingFilter';
import { useProjectGrouping } from '../../hooks/useProjectGrouping';
import FilterTriggerButton from '../../components/ui/FilterTriggerButton';
import TabToggle from '../../components/ui/TabToggle';
import SearchPickerModal from '../../components/ui/SearchPickerModal';
import SlideOver from '../../components/ui/SlideOver';
import { FilterCheckbox } from '../../components/tasks/TaskFilterPanel';
import SearchInput from '../../components/ui/SearchInput';
import AddProjectModal, { type ProjectFormData } from '../../components/projects/AddProjectModal';
import DeleteProjectModal from '../../components/projects/DeleteProjectModal';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import { SummaryProjectStatusSection } from '../../components/projects/SummaryProjectStatusSection';
import type { Project } from '../../lib/api';
import { projectAttachmentsApi } from '../../lib/api';

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

const PROJ_PRIORITY_MAP: Record<string, 'urgent' | 'high' | 'normal' | 'low'> = {
  Urgent: 'urgent', High: 'high', Normal: 'normal', Low: 'low',
};

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
  const [firmSearch, setFirmSearch]    = useState('');
  const [showAllFirms, setShowAllFirms] = useState(false);

  const filteredFirms = useMemo(() => {
    if (!firmSearch.trim()) return firms;
    const q = firmSearch.toLowerCase();
    return firms.filter((f) => f.name.toLowerCase().includes(q));
  }, [firms, firmSearch]);

  const visibleFirms = showAllFirms || firmSearch.trim() ? filteredFirms : filteredFirms.slice(0, 8);
  const hiddenCount  = filteredFirms.length - 8;

  return (
    <SlideOver
      open={open}
      onClose={onClose}
      title="Filter"
      width="max-w-[360px]"
      footer={
        <div className="flex items-center gap-3">
          <button type="button" onClick={onClear}
            className="text-[13px] font-semibold text-[#6941C6] hover:text-[#7F56D9] transition-colors mr-auto">
            Clear filter
          </button>
          <button type="button" onClick={onClose}
            className="px-4 py-2.5 rounded-lg border border-[#D5D7DA] bg-white text-[13px] font-semibold text-[#344054] hover:bg-[#F9FAFB] transition-colors">
            Cancel
          </button>
          <button type="button" onClick={onApply}
            className="px-4 py-2.5 rounded-lg bg-[#7F56D9] hover:bg-[#6941C6] text-white text-[13px] font-semibold transition-colors">
            Apply filter
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-7">
        <div>
          <p className="text-[13px] font-semibold text-[#181D27] mb-3">Status</p>
          <div className="flex flex-col gap-2.5">
            {FILTER_STATUS_OPTIONS.map((opt) => (
              <label key={opt.id} className="flex items-center gap-3 cursor-pointer">
                <FilterCheckbox
                  checked={pendingStatuses.includes(opt.id)}
                  onChange={() => onToggleStatus(opt.id)}
                />
                {opt.pill ? (
                  <span className={`px-2.5 py-0.5 rounded-full text-[12px] font-medium cursor-pointer ${opt.pill}`}>
                    {opt.label}
                  </span>
                ) : (
                  <span className="text-[13px] text-[#344054] font-medium cursor-pointer">{opt.label}</span>
                )}
              </label>
            ))}
          </div>
        </div>
        <div>
          <p className="text-[13px] font-semibold text-[#181D27] mb-3">Firms</p>
          <SearchInput value={firmSearch} onChange={setFirmSearch} placeholder="Search" className="mb-3" />
          <div className="flex flex-col gap-2.5">
            {visibleFirms.map((f) => (
              <label key={f.id} className="flex items-center gap-3 cursor-pointer">
                <FilterCheckbox
                  checked={pendingFirmIds.includes(f.id)}
                  onChange={() => onToggleFirm(f.id)}
                />
                <span className="text-[13px] text-[#344054] truncate cursor-pointer">{f.name}</span>
              </label>
            ))}
            {!showAllFirms && !firmSearch.trim() && hiddenCount > 0 && (
              <button type="button" onClick={() => setShowAllFirms(true)}
                className="text-[13px] font-semibold text-[#6941C6] hover:text-[#7F56D9] text-left transition-colors mt-0.5">
                Show {hiddenCount} more
              </button>
            )}
          </div>
        </div>
      </div>
    </SlideOver>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function ProjectsSummaryPage() {
  const navigate = useNavigate();

  const [viewMode, setViewMode] = useState<'by-status' | 'by-firm'>('by-status');
  const [selectedFirmId, setSelectedFirmId] = useState<string | null>(null);
  const search = '';

  const {
    applied:    appliedFilter,
    pending:    pendingFilter,
    open:       filterOpen,
    openFilter,
    applyFilter,
    cancelFilter,
    clearFilter,
    setPending: setPendingFilter,
  } = usePendingFilter({ statuses: [] as string[], firmIds: [] as string[] });

  const [addProjectWorkflowStatus, setAddProjectWorkflowStatus] = useState('todo');
  const [addProjectFirmId, setAddProjectFirmId] = useState<string>('');
  const [showFirmPicker, setShowFirmPicker] = useState(false);
  const [showAddProject, setShowAddProject] = useState(false);

  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

  // Full project panel (slides in from right)
  const [panelProjectId,  setPanelProjectId]  = useState<string | null>(null);
  const [panelFirmId,     setPanelFirmId]      = useState<string | null>(null);

  const { data: allProjects = [], isLoading: projectsLoading } = useProjects();
  const { data: allTasks = [],    isLoading: tasksLoading    } = useTasks();
  const { data: firms = [] } = useFirms();
  const { data: users = [] } = useActiveUsers();
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();
  const createProject = useCreateProject();

  const firmsMap = useMemo(() => new Map(firms.map((f) => [f.id, f])), [firms]);

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
    } else if (appliedFilter.firmIds.length > 0) {
      result = result.filter((p) => appliedFilter.firmIds.includes(p.firm_id));
    }

    return result;
  }, [allProjects, search, appliedFilter.firmIds, viewMode, selectedFirmId]);

  const projectsByGroup = useProjectGrouping(allTasks, filteredProjects, appliedFilter.statuses);

  const activeFilterCount = (appliedFilter.statuses.length > 0 ? 1 : 0) + (appliedFilter.firmIds.length > 0 ? 1 : 0);

  function toggleStatus(s: string) {
    setPendingFilter((prev) => ({
      ...prev,
      statuses: prev.statuses.includes(s) ? prev.statuses.filter((x) => x !== s) : [...prev.statuses, s],
    }));
  }

  function toggleFirm(id: string) {
    setPendingFilter((prev) => ({
      ...prev,
      firmIds: prev.firmIds.includes(id) ? prev.firmIds.filter((x) => x !== id) : [...prev.firmIds, id],
    }));
  }

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
    const newProject = await createProject.mutateAsync({
      firm_id:         addProjectFirmId,
      name:            data.name,
      description:     data.description || undefined,
      member_ids:      data.assigneeIds,
      workflow_status: data.workflowStatus as Project['workflow_status'],
      start_date:      data.startDate || undefined,
      end_date:        data.endDate   || undefined,
      priority:        PROJ_PRIORITY_MAP[data.priority] ?? 'medium',
    });
    if (data.files && data.files.length > 0) {
      await Promise.allSettled(
        data.files.map((f) => projectAttachmentsApi.upload(newProject.id, f)),
      );
    }
  }

  function openDetailPanel(project: Project) {
    setPanelProjectId(project.id);
    setPanelFirmId(project.firm_id);
  }

  const firmForAddModal = addProjectFirmId ? firmsMap.get(addProjectFirmId) : null;
  const isLoading = projectsLoading || tasksLoading;

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-white">

      {/* ── Header ─────────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-[#E9EAEB] bg-white shrink-0 flex-wrap">
        <h1 className="text-[18px] font-bold text-[#181D27] mr-2">Project Summary</h1>

        <TabToggle<'by-status' | 'by-firm'>
          options={[
            { value: 'by-status', label: 'By Status' },
            { value: 'by-firm',   label: 'By Firm'   },
          ]}
          value={viewMode}
          onChange={setViewMode}
        />

        <div className="flex items-center gap-2 ml-auto">
          <button onClick={() => openAddProject('todo')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#D0D5DD] bg-white text-[13px] font-semibold text-[#344054] hover:bg-[#F9FAFB] transition-colors">
            <Plus width={14} height={14} aria-hidden="true" />
            Add Project
          </button>
          <FilterTriggerButton activeCount={activeFilterCount} onClick={openFilter} ariaExpanded={filterOpen} />
        </div>
      </div>

      {/* ── Body ───────────────────────────────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* By Firm sidebar — firm list */}
        {viewMode === 'by-firm' && (
          <aside className="w-[280px] shrink-0 border-r border-[#E9EAEB] overflow-y-auto bg-white">
            {firms.map((firm) => {
              const isSelected = selectedFirmId === firm.id;
              return (
                <button
                  key={firm.id}
                  type="button"
                  onClick={() => setSelectedFirmId(isSelected ? null : firm.id)}
                  className={`w-full flex items-center gap-3 px-5 py-4 border-b border-[#E9EAEB] text-left transition-colors ${
                    isSelected ? 'bg-[#F4F3FF]' : 'hover:bg-[#F9FAFB]'
                  }`}
                >
                  <ChevronRight
                    width={14} height={14}
                    className={`shrink-0 transition-transform duration-200 ${isSelected ? 'rotate-90 text-[#7F56D9]' : 'text-[#A4A7AE]'}`}
                    aria-hidden="true"
                  />
                  <Folder
                    width={18} height={18}
                    className={`shrink-0 ${isSelected ? 'text-[#7F56D9]' : 'text-[#717680]'}`}
                    aria-hidden="true"
                  />
                  <span className={`text-[13px] font-semibold truncate ${isSelected ? 'text-[#6941C6]' : 'text-[#181D27]'}`}>
                    {firm.name}
                  </span>
                </button>
              );
            })}
          </aside>
        )}

        {/* Main content */}
        <div className="flex-1 overflow-y-auto overflow-x-auto min-w-0">
          {isLoading ? (
            <LoadingSpinner message="Loading projects…" />
          ) : allProjects.length === 0 ? (
            <EmptyState
              icon={
                <div className="w-12 h-12 rounded-xl bg-[#F4F3FF] flex items-center justify-center">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M3 7C3 5.89543 3.89543 5 5 5H9.58579C9.851 5 10.1054 5.10536 10.2929 5.29289L11.7071 6.70711C11.8946 6.89464 12.149 7 12.4142 7H19C20.1046 7 21 7.89543 21 9V17C21 18.1046 20.1046 19 19 19H5C3.89543 19 3 18.1046 3 17V7Z" stroke="#7F56D9" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M12 11V15M10 13H14" stroke="#7F56D9" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              }
              title="No projects yet"
              description="Create your first project to get started"
              action={{ label: 'Add Project', onClick: () => openAddProject('todo') }}
              className="py-24"
            />
          ) : (
            <div className="w-full pb-10">
              {STATUS_GROUPS.map((g) => (
                <SummaryProjectStatusSection
                  key={g.id}
                  label={g.label}
                  groupId={g.id}
                  projects={projectsByGroup.get(g.id) ?? []}
                  showFirmBadge={!(viewMode === 'by-firm' && selectedFirmId)}
                  allUsers={users}
                  onProjectClick={openDetailPanel}
                  onDeleteProject={(p: Project) => setProjectToDelete(p)}
                  onNavigate={(p: Project) => navigate(`/firms/${p.firm_id}/projects/${p.id}`)}
                  onAddProject={openAddProject}
                  onMembersChange={(projectId: string, memberIds: string[]) =>
                    updateProject.mutate({ id: projectId, payload: { member_ids: memberIds } })
                  }
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
        pendingStatuses={pendingFilter.statuses}
        pendingFirmIds={pendingFilter.firmIds}
        onToggleStatus={toggleStatus}
        onToggleFirm={toggleFirm}
        onApply={applyFilter}
        onClear={clearFilter}
        onClose={cancelFilter}
      />

      <SearchPickerModal
        open={showFirmPicker}
        title="Select a Firm"
        items={firms}
        getLabel={(f) => f.name}
        onSelect={handleFirmPickerSelect}
        onClose={() => setShowFirmPicker(false)}
        placeholder="Search firms…"
        emptyMessage="No firms found"
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

      {/* Full project panel — slides in from right when a project row is clicked */}
      {panelProjectId && panelFirmId && (
        <ProjectFullPanel
          open={!!(panelProjectId && panelFirmId)}
          firmId={panelFirmId}
          projectId={panelProjectId}
          onClose={() => { setPanelProjectId(null); setPanelFirmId(null); }}
        />
      )}

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
