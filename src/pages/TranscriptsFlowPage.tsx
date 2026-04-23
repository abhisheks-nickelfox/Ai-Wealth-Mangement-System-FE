import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FilterLines,
  RefreshCw01,
  Plus,
  Archive,
  UploadCloud01,
} from '@untitled-ui/icons-react';
import type { Transcript, Firm, Task } from '../lib/api';
import { useTranscripts, useArchiveTranscript, useSyncTranscripts } from '../hooks/useTranscripts';
import { useFirms } from '../hooks/useFirms';
import { usePrompts } from '../hooks/usePrompts';
import { formatDate, formatDurationSec, timeAgo } from '../lib/transcriptUtils';
import TranscriptStatusBadge from '../components/transcripts/TranscriptStatusBadge';
import FilterPanel from '../components/transcripts/FilterPanel';
import AddTranscriptModal from '../components/transcripts/AddTranscriptModal';
import ProcessingPanel from '../components/transcripts/ProcessingPanel';
import TabBar from '../components/ui/TabBar';
import TimeFilterBar from '../components/ui/TimeFilterBar';
import type { TimeFilter } from '../components/ui/TimeFilterBar';
import SearchInput from '../components/ui/SearchInput';

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

  const { data: transcripts = [], isLoading: loading, error: errorObj } = useTranscripts();
  const { data: firms = [] } = useFirms();
  const { data: prompts = [] } = usePrompts();
  const archiveTranscript = useArchiveTranscript();
  const syncTranscripts   = useSyncTranscripts();

  const error = errorObj ? (errorObj as Error).message : '';

  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [statusTab, setStatusTab] = useState<StatusTab>('all');
  const [search, setSearch] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedFirmIds, setSelectedFirmIds] = useState<string[]>([]);

  const [processingOpen, setProcessingOpen] = useState(false);
  const [activeTranscript, setActiveTranscript] = useState<Transcript | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  async function handleSync() {
    try {
      await syncTranscripts.mutateAsync();
    } catch {
      // silently ignore sync errors on the list page
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

  function handleCreated(_t: Transcript) {
    setAddOpen(false);
    // query invalidation via useCreateTranscript handles the refetch
  }

  async function handleArchiveTranscript(transcript: Transcript) {
    try {
      await archiveTranscript.mutateAsync(transcript.id);
    } catch {
      // silently ignore
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
    }

    if (selectedFirmIds.length > 0) {
      list = list.filter((t) => t.firm_id && selectedFirmIds.includes(t.firm_id));
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((t) => t.title.toLowerCase().includes(q));
    }

    return list;
  }, [transcripts, statusTab, timeFilter, selectedFirmIds, search]);

  const counts = useMemo(() => ({
    all: transcripts.length,
    toProcess: transcripts.filter((t) => !t.archived).length,
    archived: transcripts.filter((t) => t.archived).length,
    completed: 0,
  }), [transcripts]);

  const STATUS_TABS = [
    { id: 'all',        label: 'All',        count: counts.all       },
    { id: 'to-process', label: 'To process', count: counts.toProcess },
    { id: 'archived',   label: 'Archived',   count: counts.archived  },
    { id: 'completed',  label: 'Completed',  count: counts.completed },
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
            disabled={syncTranscripts.isPending}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-semibold text-[#414651] bg-white border border-[#D5D7DA] rounded-lg shadow-sm hover:bg-gray-50 disabled:opacity-60 transition-colors"
          >
            <RefreshCw01 width={16} height={16} className={`text-[#535862] ${syncTranscripts.isPending ? 'animate-spin' : ''}`} />
            {syncTranscripts.isPending ? 'Syncing…' : 'Sync Now'}
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
      <div className="flex items-center px-6 py-3 border-b border-[#E9EAEB]">
        <TimeFilterBar value={timeFilter} onChange={setTimeFilter} />
      </div>

      {/* Sub-tabs + search/filter */}
      <div className="flex items-center justify-between px-6 py-2 border-b border-[#E9EAEB]">
        <TabBar
          tabs={STATUS_TABS}
          activeId={statusTab}
          onChange={(id) => setStatusTab(id as StatusTab)}
        />
        <div className="flex items-center gap-2">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search transcripts…"
            className="w-64"
          />
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
              archiving={archiveTranscript.isPending && archiveTranscript.variables === t.id}
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
