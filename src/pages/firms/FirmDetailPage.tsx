import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronRight } from '@untitled-ui/icons-react';
import Toast from '../../components/ui/Toast';
import ConfirmDeleteModal from '../../components/ui/ConfirmDeleteModal';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import TabBar from '../../components/ui/TabBar';
import { useDeleteFirm } from '../../hooks/useFirms';
import { useToast } from '../../hooks/useToast';
import { useFirmDetail } from '../../hooks/useFirms';
import { useTasksByFirm } from '../../hooks/useTasks';
import { useActiveUsers } from '../../hooks/useUsers';
import { ProjectsTab } from '../../components/projects/ProjectsTab';
import { OverviewTab, ComingSoon } from '../../components/firms/FirmOverviewTab';
// ── Types ─────────────────────────────────────────────────────────────────────

type TabId =
  | 'overview'
  | 'client-requests'
  | 'projects'
  | 'time-reports'
  | 'firm-details';

interface TabDef {
  id: TabId;
  label: string;
}

const TABS: TabDef[] = [
  { id: 'overview',        label: 'Overview' },
  { id: 'client-requests', label: 'Client Requests' },
  { id: 'projects',        label: 'Projects' },
  { id: 'time-reports',    label: 'Time Reports' },
  { id: 'firm-details',    label: 'Firm Details' },
];

// ── FirmDetailPage ────────────────────────────────────────────────────────────

export default function FirmDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [activeTab, setActiveTab]       = useState<TabId>('projects');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const { toast: firmToast, notify: notifyFirm, dismiss: dismissFirmToast } = useToast();

  const deleteFirm = useDeleteFirm();

  const { data: firm = null, isLoading: firmLoading, error: firmError } = useFirmDetail(id!);
  const { data: tasks = [],  isLoading: tasksLoading }                  = useTasksByFirm(id!);
  const { data: users = [] }                                             = useActiveUsers();

  const loading = firmLoading || tasksLoading;
  const error   = firmError ? (firmError as Error).message : null;

  async function handleDeleteConfirm() {
    try {
      await deleteFirm.mutateAsync(id!);
      setShowDeleteModal(false);
      notifyFirm('Firm deleted successfully');
      setTimeout(() => navigate('/firms'), 1500);
    } catch (err) {
      setShowDeleteModal(false);
      notifyFirm((err as Error).message || 'Failed to delete firm', 'error');
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
      {firmToast && (
        <Toast
          message={firmToast.message}
          type={firmToast.type}
          onClose={dismissFirmToast}
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

        {/* Breadcrumb — 3 levels when on Projects tab */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 mb-2">
          <button
            onClick={() => navigate('/firms')}
            className="text-[13px] text-[#717680] hover:text-[#414651] transition-colors"
          >
            Firms
          </button>
          <ChevronRight width={14} height={14} className="text-[#A4A7AE]" aria-hidden="true" />
          {activeTab === 'projects' ? (
            <>
              <button
                onClick={() => setActiveTab('overview')}
                className="text-[13px] text-[#717680] hover:text-[#414651] transition-colors"
              >
                {firm?.name ?? '…'}
              </button>
              <ChevronRight width={14} height={14} className="text-[#A4A7AE]" aria-hidden="true" />
              <span className="text-[13px] text-[#7F56D9] font-medium" aria-current="page">
                Projects
              </span>
            </>
          ) : (
            <span className="text-[13px] text-[#7F56D9] font-medium" aria-current="page">
              {firm?.name ?? '…'}
            </span>
          )}
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
        {activeTab === 'overview' || activeTab === 'firm-details' ? (
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
