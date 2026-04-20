import { useState, useMemo } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Calendar, Clock, CheckCircle, ArrowLeft } from '@untitled-ui/icons-react';
import type { Task, Transcript } from '../lib/api';
import { useTasks } from '../hooks/useTasks';
import { useUsers } from '../hooks/useUsers';
import { formatDate, formatDurationSec } from '../lib/transcriptUtils';
import TaskCard from '../components/tasks/TaskCard';
import TaskDetailPanel from '../components/tasks/TaskDetailPanel';

// ── Tab helpers ───────────────────────────────────────────────────────────────

type TaskTab = 'all' | 'pending' | 'approved' | 'needs-review' | 'ignored' | 'archived';

function getTaskTab(task: Task): TaskTab {
  if (task.archived) return 'archived';
  if (task.status === 'draft') return 'needs-review';
  if (task.status === 'discarded') return 'ignored';
  if (['approved', 'closed'].includes(task.status)) return 'approved';
  return 'pending';
}

// ── Page state type ───────────────────────────────────────────────────────────

interface PageState {
  sessionId: string;
  firmId: string;
  tasks: Task[];
  transcript: Transcript;
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function TranscriptTasksPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state ?? {}) as Partial<PageState>;

  const sessionId = state.sessionId ?? new URLSearchParams(location.search).get('session_id') ?? '';

  const { data: fetchedTasks = [], isLoading: tasksLoading } = useTasks(
    sessionId ? { session_id: sessionId } : undefined
  );
  const { data: users = [] } = useUsers();

  // Prefer tasks passed via navigation state (immediate display), fall back to fetched
  const tasks = state.tasks ?? fetchedTasks;
  const loading = !state.tasks && tasksLoading;

  const [activeTab, setActiveTab] = useState<TaskTab>('all');
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);

  const transcript = state.transcript;
  const firmName = tasks[0]?.firms?.name ?? '';

  const tabCounts = useMemo(() => {
    const counts: Record<TaskTab, number> = { all: 0, pending: 0, approved: 0, 'needs-review': 0, ignored: 0, archived: 0 };
    tasks.forEach((t) => {
      const tab = getTaskTab(t);
      counts[tab]++;
      if (tab !== 'archived') counts.all++;
    });
    return counts;
  }, [tasks]);

  const filtered = useMemo(
    () => activeTab === 'all'
      ? tasks.filter((t) => !t.archived)
      : tasks.filter((t) => getTaskTab(t) === activeTab),
    [tasks, activeTab],
  );

  function handleTaskClick(task: Task) { setActiveTask(task); setPanelOpen(true); }
  function closePanel() { setPanelOpen(false); setActiveTask(null); }
  function handleSaved(_updated: Task) { closePanel(); }
  function handleIgnored(_taskId: string) { closePanel(); }
  function handleApproved(_updated: Task) { closePanel(); }
  function handleArchived(_updated: Task) { closePanel(); }

  const TABS: { key: TaskTab; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'pending', label: 'Pending' },
    { key: 'approved', label: 'Approved' },
    { key: 'needs-review', label: 'Needs Review' },
    { key: 'ignored', label: 'Ignored' },
    { key: 'archived', label: 'Archived' },
  ];

  // Suppress unused-variable warning for id (kept for potential future use)
  void id;

  return (
    <main className="flex-1 min-w-0 overflow-y-auto bg-white relative">

      {/* Header */}
      <div className="px-6 pt-8 pb-5 border-b border-[#E9EAEB]">
        <button
          onClick={() => navigate('/transcripts')}
          className="flex items-center gap-1.5 text-xs text-[#7F56D9] hover:text-[#6941C6] mb-3 transition-colors"
        >
          <ArrowLeft width={14} height={14} />
          Transcripts Flow
        </button>
        <h1 className="text-2xl font-semibold text-[#181D27]">{transcript?.title ?? 'Extracted Tasks'}</h1>
        {firmName && <p className="text-sm text-[#535862] mt-0.5">{firmName}</p>}
        {transcript && (
          <div className="flex items-center gap-4 mt-3 text-sm text-[#717680]">
            <span className="flex items-center gap-1.5">
              <Calendar width={14} height={14} />
              Transcript recorded {formatDate(transcript.call_date)}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock width={14} height={14} />
              Duration {formatDurationSec(transcript.duration_sec)}
            </span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-6 px-6 border-b border-[#E9EAEB]">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-1.5 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${activeTab === key ? 'border-[#7F56D9] text-[#7F56D9]' : 'border-transparent text-[#717680] hover:text-[#414651]'}`}
          >
            {label}
            <span className={`px-1.5 py-0.5 rounded text-xs font-semibold ${activeTab === key ? 'bg-[#F4EBFF] text-[#6941C6]' : 'bg-[#F2F4F7] text-[#717680]'}`}>
              {tabCounts[key]}
            </span>
          </button>
        ))}
      </div>

      {/* Task list */}
      {loading ? (
        <div className="py-16 text-center text-sm text-[#A4A7AE]">Loading tasks…</div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <CheckCircle width={40} height={40} className="text-[#D5D7DA]" />
          <p className="text-sm font-medium text-[#535862]">No tasks in this category</p>
        </div>
      ) : (
        <div className="px-6 py-5">
          {filtered.map((task) => (
            <TaskCard key={task.id} task={task} users={users} onClick={() => handleTaskClick(task)} />
          ))}
        </div>
      )}

      {/* Task detail panel */}
      <TaskDetailPanel
        task={activeTask}
        open={panelOpen}
        onClose={closePanel}
        users={users}
        onSaved={handleSaved}
        onIgnored={handleIgnored}
        onApproved={handleApproved}
        onArchived={handleArchived}
      />
    </main>
  );
}
