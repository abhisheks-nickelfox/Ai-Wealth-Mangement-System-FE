import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { projectsApi, type SharedProjectView } from '../lib/api';
import Avatar from '../components/ui/Avatar';

const WORKFLOW_LABELS: Record<string, string> = {
  todo:        'To Do',
  in_progress: 'In Progress',
  in_review:   'In Review',
  approved:    'Approved',
  completed:   'Completed',
};

const WORKFLOW_COLORS: Record<string, string> = {
  todo:        'bg-gray-100 text-gray-600',
  in_progress: 'bg-blue-50 text-blue-700',
  in_review:   'bg-yellow-50 text-yellow-700',
  approved:    'bg-purple-50 text-purple-700',
  completed:   'bg-green-50 text-green-700',
};

interface StatCardProps { label: string; count: number; color: string }

function StatCard({ label, count, color }: StatCardProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-[#E9EAEB] p-4 gap-1">
      <span className={`text-2xl font-bold ${color}`}>{count}</span>
      <span className="text-xs text-[#717680]">{label}</span>
    </div>
  );
}

export default function SharedProjectPage() {
  const { token } = useParams<{ token: string }>();
  const [project, setProject] = useState<SharedProjectView | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!token) { setNotFound(true); setLoading(false); return; }
    projectsApi.getSharedProject(token)
      .then(setProject)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB]">
        <p className="text-sm text-[#717680]">Loading project…</p>
      </div>
    );
  }

  if (notFound || !project) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F9FAFB] gap-3">
        <p className="text-lg font-semibold text-[#181D27]">Project not found</p>
        <p className="text-sm text-[#717680]">This link may have expired or the project was removed.</p>
      </div>
    );
  }

  const workflowLabel = WORKFLOW_LABELS[project.workflow_status] ?? project.workflow_status;
  const workflowColor = WORKFLOW_COLORS[project.workflow_status] ?? 'bg-gray-100 text-gray-600';

  return (
    <div className="min-h-screen bg-[#F9FAFB] py-12 px-4">
      <div className="max-w-2xl mx-auto flex flex-col gap-6">

        {/* Header */}
        <div className="bg-white rounded-2xl border border-[#E9EAEB] p-6 flex flex-col gap-3">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-medium text-[#717680] uppercase tracking-wider mb-1">
                {project.firm_name ?? 'Project'}
              </p>
              <h1 className="text-xl font-bold text-[#181D27] leading-tight">{project.name}</h1>
            </div>
            <span className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold ${workflowColor}`}>
              {workflowLabel}
            </span>
          </div>
          {project.description && (
            <p className="text-sm text-[#535862] leading-relaxed">{project.description}</p>
          )}
        </div>

        {/* Task summary */}
        <div className="bg-white rounded-2xl border border-[#E9EAEB] p-6">
          <p className="text-sm font-semibold text-[#181D27] mb-4">Tasks</p>
          <div className="grid grid-cols-5 gap-3">
            <StatCard label="Total"       count={project.task_totals.total}       color="text-[#181D27]" />
            <StatCard label="To Do"       count={project.task_totals.todo}        color="text-[#717680]" />
            <StatCard label="In Progress" count={project.task_totals.in_progress} color="text-blue-600"  />
            <StatCard label="In Review"   count={project.task_totals.in_review}   color="text-yellow-600" />
            <StatCard label="Completed"   count={project.task_totals.completed}   color="text-green-600" />
          </div>
        </div>

        {/* Team members */}
        {project.members.length > 0 && (
          <div className="bg-white rounded-2xl border border-[#E9EAEB] p-6">
            <p className="text-sm font-semibold text-[#181D27] mb-4">
              Team members <span className="font-normal text-[#717680]">({project.members.length})</span>
            </p>
            <div className="flex flex-col gap-3">
              {project.members.map((member) => (
                <div key={member.id} className="flex items-center gap-3">
                  <Avatar name={member.name} src={member.avatar_url ?? undefined} size="sm" className="shrink-0" />
                  <span className="text-sm font-medium text-[#344054]">{member.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-xs text-[#A4A7AE]">Shared via MarketingWiz</p>
      </div>
    </div>
  );
}
