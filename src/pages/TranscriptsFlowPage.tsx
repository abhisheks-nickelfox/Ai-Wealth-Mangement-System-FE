import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  SearchLg,
  FilterLines,
  Calendar,
  RefreshCw01,
  Plus,
  Archive,
  UploadCloud01,
} from '@untitled-ui/icons-react';
import {
  transcriptsApi,
  firmsApi,
  promptsApi,
} from '../lib/api';
import type { Transcript, Firm, Prompt, Task } from '../lib/api';
import { formatDate, formatDurationSec, timeAgo } from '../lib/transcriptUtils';
import TranscriptStatusBadge from '../components/transcripts/TranscriptStatusBadge';
import FilterPanel from '../components/transcripts/FilterPanel';
import AddTranscriptModal from '../components/transcripts/AddTranscriptModal';
import ProcessingPanel from '../components/transcripts/ProcessingPanel';

type TimeFilter = 'all' | 'custom' | '30d' | '7d' | '24h';
type StatusTab = 'all' | 'to-process' | 'archived' | 'completed';

// ── Transcript row ─────────────────────────────────────────────────────────────

interface TranscriptRowProps {
  transcript: Transcript;
  firms: Firm[];
  onClick: () => void;
  onArchive: () => void;
  archiving: boolean;
}

function TranscriptRow({ transcript, firms, onClick, onArchive, archiving }: TranscriptRowProps) {
  const firm = firms.find((f) => f.id === transcript.firm_id);
  const isArchived = transcript.archived;

  return (
    <div
      onClick={onClick}
      className={`group flex items-center gap-4 px-6 py-4 border-b border-[#F2F4F7] hover:bg-[#FAFAFA] transition-colors cursor-pointer ${isArchived ? 'opacity-60' : ''}`}
    >
      <div className="flex-1 min-w-0">
        {/* Title row */}
        <div className="flex items-baseline gap-2 mb-0.5">
          <span className="text-sm font-semibold text-[#181D27] truncate">{transcript.title}</span>
          <span className="text-xs text-[#A4A7AE] shrink-0">{timeAgo(transcript.created_at)}</span>
        </div>
        {/* Firm + description */}
        <p className="text-sm text-[#535862] truncate mb-2">
          {firm ? (
            <>
              <span className="font-medium text-[#414651]">{firm.name}</span>
              <span className="mx-1 text-[#D5D7DA]">·</span>
            </>
          ) : null}
          {transcript.call_date ? formatDate(transcript.call_date) : ''}
          {transcript.duration_sec ? ` · ${formatDurationSec(transcript.duration_sec)}` : ''}
        </p>
        {/* Badge */}
        <TranscriptStatusBadge transcript={transcript} />
      </div>
      {/* Right-side actions */}
      <div className="shrink-0 flex items-center gap-3">
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onArchive(); }}
          disabled={archiving}
          title={isArchived ? 'Unarchive transcript' : 'Archive transcript'}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium opacity-0 group-hover:opacity-100 transition-all disabled:opacity-50 ${
            isArchived
              ? 'text-[#7F56D9] bg-[#F4EBFF] hover:bg-[#EDE9FE]'
              : 'text-[#717680] bg-[#F2F4F7] hover:bg-[#E9EAEB]'
          }`}
        >
          <Archive width={13} height={13} />
          {archiving ? '…' : isArchived ? 'Unarchive' : 'Archive'}
        </button>
        <span className={`w-2 h-2 rounded-full inline-block ${isArchived ? 'bg-[#D5D7DA]' : 'bg-green-500'}`} aria-label={isArchived ? 'Archived' : 'Synced'} />
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function TranscriptsFlowPage() {
  const navigate = useNavigate();

  const [transcripts, setTranscripts] = useState<Transcript[]>([]);
  const [firms, setFirms] = useState<Firm[]>([]);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [syncing, setSyncing] = useState(false);

  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [statusTab, setStatusTab] = useState<StatusTab>('all');
  const [search, setSearch] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedFirmIds, setSelectedFirmIds] = useState<string[]>([]);

  const [processingOpen, setProcessingOpen] = useState(false);
  const [activeTranscript, setActiveTranscript] = useState<Transcript | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [archivingId, setArchivingId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError('');
      try {
        const [tData, fData, pData] = await Promise.all([
          transcriptsApi.list('all'),
          firmsApi.list(),
          promptsApi.list(),
        ]);
        setTranscripts(tData);
        setFirms(fData);
        setPrompts(pData);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load transcripts.');
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  async function handleSync() {
    setSyncing(true);
    try {
      await transcriptsApi.sync();
      const fresh = await transcriptsApi.list('all');
      setTranscripts(fresh);
    } catch {
      // silently ignore sync errors on the list page
    } finally {
      setSyncing(false);
    }
  }

  function handleTranscriptClick(transcript: Transcript) {
    setActiveTranscript(transcript);
    setProcessingOpen(true);
  }

  function handleProcessed(sessionId: string, firmId: string, tickets: Task[]) {
    setProcessingOpen(false);
    if (activeTranscript) {
      navigate(`/transcripts/${activeTranscript.id}/tasks`, {
        state: {
          sessionId,
          firmId,
          tickets,
          transcript: activeTranscript,
        },
      });
    }
  }

  function handleCreated(t: Transcript) {
    setTranscripts((prev) => [t, ...prev]);
    setAddOpen(false);
  }

  async function handleArchiveTranscript(transcript: Transcript) {
    setArchivingId(transcript.id);
    try {
      const updated = await transcriptsApi.toggleArchive(transcript.id);
      setTranscripts((prev) => prev.map((t) => t.id === updated.id ? updated : t));
    } catch {
      // silently ignore
    } finally {
      setArchivingId(null);
    }
  }

  function toggleFirmFilter(id: string) {
    setSelectedFirmIds((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id],
    );
  }

  // ── Client-side filtering ──────────────────────────────────────────────────

  const filtered = useMemo(() => {
    let list = transcripts;

    if (statusTab === 'archived') {
      list = list.filter((t) => t.archived);
    } else if (statusTab === 'to-process') {
      list = list.filter((t) => !t.archived);
    } else if (statusTab === 'completed') {
      list = [];
    }

    const now = Date.now();
    if (timeFilter === '24h') {
      list = list.filter((t) => now - new Date(t.created_at).getTime() < 86400000);
    } else if (timeFilter === '7d') {
      list = list.filter((t) => now - new Date(t.created_at).getTime() < 7 * 86400000);
    } else if (timeFilter === '30d') {
      list = list.filter((t) => now - new Date(t.created_at).getTime() < 30 * 86400000);
    } else if (timeFilter === 'custom' && dateFrom && dateTo) {
      const from = new Date(dateFrom).getTime();
      const to = new Date(dateTo).getTime() + 86400000;
      list = list.filter((t) => {
        const ts = new Date(t.created_at).getTime();
        return ts >= from && ts <= to;
      });
    }

    if (selectedFirmIds.length > 0) {
      list = list.filter((t) => t.firm_id && selectedFirmIds.includes(t.firm_id));
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((t) => t.title.toLowerCase().includes(q));
    }

    return list;
  }, [transcripts, statusTab, timeFilter, dateFrom, dateTo, selectedFirmIds, search]);

  const counts = useMemo(() => ({
    all: transcripts.length,
    toProcess: transcripts.filter((t) => !t.archived).length,
    archived: transcripts.filter((t) => t.archived).length,
    completed: 0,
  }), [transcripts]);

  const TIME_FILTERS: { key: TimeFilter; label: string }[] = [
    { key: 'all', label: 'All time' },
    { key: 'custom', label: 'Custom' },
    { key: '30d', label: '30 days' },
    { key: '7d', label: '7 days' },
    { key: '24h', label: '24 hours' },
  ];

  const STATUS_TABS: { key: StatusTab; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: counts.all },
    { key: 'to-process', label: 'To process', count: counts.toProcess },
    { key: 'archived', label: 'Archived', count: counts.archived },
    { key: 'completed', label: 'Completed', count: counts.completed },
  ];

  return (
    <main className="flex-1 min-w-0 overflow-y-auto bg-white relative">
      {/* Page header */}
      <div className="flex items-start justify-between px-6 pt-8 pb-5 border-b border-[#E9EAEB]">
        <div>
          <h1 className="text-2xl font-semibold text-[#181D27]">Transcripts Flow</h1>
          <p className="text-sm text-[#535862] mt-1">
            Manage your team members, roles, and access across projects.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSync}
            disabled={syncing}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-semibold text-[#414651] bg-white border border-[#D5D7DA] rounded-lg shadow-sm hover:bg-gray-50 disabled:opacity-60 transition-colors"
          >
            <RefreshCw01 width={16} height={16} className={`text-[#535862] ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing…' : 'Sync Now'}
          </button>
          <button
            onClick={() => setAddOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-semibold text-white bg-[#7F56D9] hover:bg-[#6941C6] rounded-lg shadow-sm transition-colors"
          >
            <Plus width={16} height={16} />
            Add Transcript
          </button>
        </div>
      </div>

      {/* Time filter tabs */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-[#E9EAEB]">
        <div className="flex items-center gap-1">
          {TIME_FILTERS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTimeFilter(key)}
              className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
                timeFilter === key
                  ? 'bg-white border border-[#D5D7DA] font-semibold text-[#181D27] shadow-sm'
                  : 'text-[#535862] hover:text-[#181D27] hover:bg-gray-50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        {timeFilter === 'custom' && (
          <div className="flex items-center gap-1 border border-[#D5D7DA] rounded-full px-3 py-1.5 bg-white">
            <Calendar width={14} height={14} className="text-[#A4A7AE] shrink-0" />
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="text-sm text-[#181D27] bg-transparent outline-none w-32"
            />
            <span className="text-[#A4A7AE] text-sm">–</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="text-sm text-[#181D27] bg-transparent outline-none w-32"
            />
          </div>
        )}
      </div>

      {/* Sub-tabs + search/filter */}
      <div className="flex items-center justify-between px-6 py-2 border-b border-[#E9EAEB]">
        <div className="flex items-center gap-0">
          {STATUS_TABS.map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setStatusTab(key)}
              className={`px-4 py-3 text-sm transition-colors border-b-2 -mb-px ${
                statusTab === key
                  ? 'border-[#7F56D9] text-[#7F56D9] font-semibold'
                  : 'border-transparent text-[#717680] hover:text-[#414651]'
              }`}
            >
              {label}{' '}
              <span className={`text-xs ${statusTab === key ? 'text-[#7F56D9]' : 'text-[#A4A7AE]'}`}>
                {count}
              </span>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 border border-[#D5D7DA] rounded-lg px-3 py-2 bg-white">
            <SearchLg width={14} height={14} className="text-[#A4A7AE] shrink-0" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search transcripts…"
              className="text-sm text-[#181D27] placeholder-[#A4A7AE] bg-transparent outline-none w-48"
            />
          </div>
          <button
            onClick={() => setFilterOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-semibold text-[#414651] bg-white border border-[#D5D7DA] rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
          >
            <FilterLines width={16} height={16} className="text-[#535862]" />
            Filter
            {selectedFirmIds.length > 0 && (
              <span className="ml-1 w-5 h-5 flex items-center justify-center text-[10px] font-bold bg-[#7F56D9] text-white rounded-full">
                {selectedFirmIds.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-24 text-sm text-[#A4A7AE]">
          Loading transcripts…
        </div>
      ) : error ? (
        <div className="flex items-center justify-center py-24">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <UploadCloud01 width={40} height={40} className="text-[#D5D7DA]" />
          <p className="text-sm font-medium text-[#535862]">No transcripts found</p>
          <p className="text-xs text-[#A4A7AE]">
            {search ? 'Try a different search term.' : 'Add a transcript or sync from Fireflies.'}
          </p>
        </div>
      ) : (
        <div>
          {filtered.map((t) => (
            <TranscriptRow
              key={t.id}
              transcript={t}
              firms={firms}
              onClick={() => handleTranscriptClick(t)}
              onArchive={() => handleArchiveTranscript(t)}
              archiving={archivingId === t.id}
            />
          ))}
        </div>
      )}

      {/* Filter slide-over */}
      <FilterPanel
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        firms={firms}
        selectedFirmIds={selectedFirmIds}
        onFirmToggle={toggleFirmFilter}
        onClear={() => setSelectedFirmIds([])}
      />

      {/* Processing panel */}
      <ProcessingPanel
        transcript={activeTranscript}
        open={processingOpen}
        onClose={() => setProcessingOpen(false)}
        firms={firms}
        prompts={prompts}
        onProcessed={handleProcessed}
      />

      {/* Add transcript modal */}
      <AddTranscriptModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        firms={firms}
        onCreated={handleCreated}
      />
    </main>
  );
}
