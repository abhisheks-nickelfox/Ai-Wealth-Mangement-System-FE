import { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  Clock,
  ChevronDown,
  Plus,
  RefreshCw01,
  Lightning01,
} from '@untitled-ui/icons-react';
import { transcriptsApi } from '../../lib/api';
import type { Transcript, Firm, Prompt, Task } from '../../lib/api';
import TranscriptStatusBadge from './TranscriptStatusBadge';
import { formatDate, formatDurationSec } from '../../lib/transcriptUtils';

export interface ProcessingPanelProps {
  transcript: Transcript | null;
  open: boolean;
  onClose: () => void;
  firms: Firm[];
  prompts: Prompt[];
  onProcessed: (sessionId: string, firmId: string, tickets: Task[]) => void;
}

export default function ProcessingPanel({
  transcript,
  open,
  onClose,
  firms,
  prompts,
  onProcessed,
}: ProcessingPanelProps) {
  const [firmId, setFirmId] = useState('');
  const [primaryPromptId, setPrimaryPromptId] = useState('');
  const [secondaryPromptId, setSecondaryPromptId] = useState('');
  const [transcriptTab, setTranscriptTab] = useState<'paste' | 'fireflies'>('paste');
  const [transcriptText, setTranscriptText] = useState('');
  const [notes, setNotes] = useState('');
  const [notesOpen, setNotesOpen] = useState(false);
  const [summaryExpanded, setSummaryExpanded] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (transcript && open) {
      setFirmId(transcript.firm_id ?? '');
      setTranscriptText(transcript.raw_transcript ?? '');
      setError('');
    }
  }, [transcript, open]);

  async function handleRun() {
    if (!firmId || !primaryPromptId) {
      setError('Please select a firm and a primary prompt.');
      return;
    }
    if (!transcript) return;
    setProcessing(true);
    setError('');
    try {
      const result = await transcriptsApi.process(transcript.id, {
        firm_id: firmId,
        prompt_id: primaryPromptId,
        text_notes: notes.trim() || undefined,
      });
      onProcessed(result.session_id, result.firm_id, result.tickets);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Processing failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  }

  async function handleFirefliesSync() {
    setSyncing(true);
    try {
      await transcriptsApi.sync();
    } finally {
      setSyncing(false);
    }
  }

  const summary = transcript?.raw_transcript ?? '';
  const SUMMARY_LIMIT = 260;
  const hasSummaryMore = summary.length > SUMMARY_LIMIT;

  return (
    <>
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/20 transition-opacity duration-200 ${
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />
      <div
        className={`fixed inset-y-0 right-0 z-50 flex flex-col bg-white border-l border-[#E9EAEB] shadow-xl transition-transform duration-300 ease-in-out w-[600px] ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="px-6 pt-5 pb-4 border-b border-[#E9EAEB] shrink-0">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2 flex-wrap min-w-0 pr-3">
              <h2 className="text-base font-semibold text-[#181D27] truncate">
                {transcript?.title ?? 'Processing'}
              </h2>
              {transcript && <TranscriptStatusBadge transcript={transcript} />}
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded text-[#717680] hover:text-[#414651] hover:bg-gray-100 transition-colors shrink-0"
            >
              <X width={18} height={18} />
            </button>
          </div>
          <div className="flex items-center gap-4 text-sm text-[#535862]">
            <span className="flex items-center gap-1.5">
              <Calendar width={14} height={14} className="text-[#A4A7AE]" />
              {transcript?.call_date ? formatDate(transcript.call_date) : '—'}
            </span>
            {transcript?.duration_sec ? (
              <span className="flex items-center gap-1.5">
                <Clock width={14} height={14} className="text-[#A4A7AE]" />
                Duration {formatDurationSec(transcript.duration_sec)}
              </span>
            ) : null}
          </div>
          {/* Firm */}
          <div className="mt-3">
            <label className="block text-xs font-medium text-[#414651] mb-1">
              Firm <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                value={firmId}
                onChange={(e) => setFirmId(e.target.value)}
                className="w-full appearance-none border border-[#D5D7DA] rounded-lg px-3 py-2 text-sm text-[#181D27] outline-none focus:ring-2 focus:ring-[#7F56D9] focus:border-transparent bg-white"
              >
                <option value="">Select a firm…</option>
                {firms.map((f) => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
              <ChevronDown width={16} height={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A4A7AE] pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-6">

          {/* ── Section 1: Transcript Summary ─────────────────────────── */}
          <div className="flex gap-4">
            <div className="shrink-0 w-8 h-8 rounded-full bg-[#F4EBFF] flex items-center justify-center mt-0.5">
              <Lightning01 width={16} height={16} className="text-[#7F56D9]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[#181D27] mb-1">Transcript Summary</p>
              {summary ? (
                <div className="text-sm text-[#535862] leading-relaxed">
                  {summaryExpanded ? summary : summary.slice(0, SUMMARY_LIMIT)}
                  {hasSummaryMore && !summaryExpanded && (
                    <>
                      {'… '}
                      <button
                        onClick={() => setSummaryExpanded(true)}
                        className="text-[#7F56D9] hover:text-[#6941C6] font-medium"
                      >
                        Read more
                      </button>
                    </>
                  )}
                  {summaryExpanded && hasSummaryMore && (
                    <>
                      {' '}
                      <button
                        onClick={() => setSummaryExpanded(false)}
                        className="text-[#7F56D9] hover:text-[#6941C6] font-medium"
                      >
                        Show less
                      </button>
                    </>
                  )}
                </div>
              ) : (
                <p className="text-sm text-[#A4A7AE] italic">No transcript content available.</p>
              )}
            </div>
          </div>

          <div className="border-t border-[#F2F4F7]" />

          {/* ── Section 2: Select Prompt ───────────────────────────────── */}
          <div className="flex gap-4">
            <div className="shrink-0 w-8 h-8 rounded-full bg-[#F4EBFF] flex items-center justify-center mt-0.5">
              <Lightning01 width={16} height={16} className="text-[#7F56D9]" />
            </div>
            <div className="flex-1 min-w-0 flex flex-col gap-3">
              <div>
                <p className="text-sm font-semibold text-[#181D27] mb-0.5">Select Prompt</p>
                <p className="text-xs text-[#717680]">Choose a primary and secondary prompt to define what gets extracted.</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#414651] mb-1">
                  Primary Prompt <span className="text-[#A4A7AE] font-normal">①</span>
                </label>
                <div className="relative">
                  <select
                    value={primaryPromptId}
                    onChange={(e) => setPrimaryPromptId(e.target.value)}
                    className="w-full appearance-none border border-[#D5D7DA] rounded-lg px-3 py-2.5 text-sm text-[#181D27] outline-none focus:ring-2 focus:ring-[#7F56D9] focus:border-transparent bg-white"
                  >
                    <option value="">Project management</option>
                    {prompts.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                  <ChevronDown width={16} height={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A4A7AE] pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#414651] mb-1">
                  Secondary Prompt <span className="text-[#A4A7AE] font-normal">②</span>
                </label>
                <div className="relative">
                  <select
                    value={secondaryPromptId}
                    onChange={(e) => setSecondaryPromptId(e.target.value)}
                    className="w-full appearance-none border border-[#D5D7DA] rounded-lg px-3 py-2.5 text-sm text-[#181D27] outline-none focus:ring-2 focus:ring-[#7F56D9] focus:border-transparent bg-white"
                  >
                    <option value="">Meeting notes</option>
                    {prompts
                      .filter((p) => p.id !== primaryPromptId)
                      .map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                  </select>
                  <ChevronDown width={16} height={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A4A7AE] pointer-events-none" />
                </div>
              </div>
              {/* Prompt description hint */}
              <div className="flex items-start gap-2 bg-[#F9FAFB] border border-[#F2F4F7] rounded-lg px-3 py-2.5">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="text-[#A4A7AE] mt-0.5 shrink-0">
                  <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M8 7v4M8 5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                <p className="text-xs text-[#535862] leading-relaxed">
                  {primaryPromptId && prompts.find((p) => p.id === primaryPromptId)
                    ? `Produces a structured summary of key decisions, follow-ups, and discussion points (${prompts.find((p) => p.id === primaryPromptId)?.type ?? 'general'}).`
                    : 'Produces a structured summary of key decisions, follow-ups, and discussion points.'}
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-[#F2F4F7]" />

          {/* ── Section 3: Transcript Input ────────────────────────────── */}
          <div className="flex gap-4">
            <div className="shrink-0 w-8 h-8 rounded-full bg-[#F4EBFF] flex items-center justify-center mt-0.5">
              <Lightning01 width={16} height={16} className="text-[#7F56D9]" />
            </div>
            <div className="flex-1 min-w-0 flex flex-col gap-3">
              <div>
                <p className="text-sm font-semibold text-[#181D27] mb-0.5">Transcript Input</p>
                <p className="text-xs text-[#717680]">Choose a primary and secondary prompt to define what gets extracted.</p>
              </div>
              {/* Tabs */}
              <div className="flex border-b border-[#E9EAEB]">
                {(['paste', 'fireflies'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setTranscriptTab(tab)}
                    className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                      transcriptTab === tab
                        ? 'border-[#7F56D9] text-[#7F56D9]'
                        : 'border-transparent text-[#717680] hover:text-[#414651]'
                    }`}
                  >
                    {tab === 'paste' ? 'Paste Transcript' : 'Import from Fireflies'}
                  </button>
                ))}
              </div>
              {transcriptTab === 'paste' ? (
                <div>
                  <label className="block text-xs font-medium text-[#414651] mb-1">
                    Transcript Text <span className="text-[#A4A7AE] font-normal">①</span>
                  </label>
                  <textarea
                    value={transcriptText}
                    onChange={(e) => setTranscriptText(e.target.value)}
                    placeholder="Enter a description..."
                    rows={6}
                    className="w-full border border-[#D5D7DA] rounded-lg px-3 py-2.5 text-sm text-[#181D27] placeholder-[#A4A7AE] outline-none focus:ring-2 focus:ring-[#7F56D9] focus:border-transparent resize-none"
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 py-6 border border-dashed border-[#D5D7DA] rounded-lg">
                  <p className="text-sm text-[#535862]">Pull the latest transcripts from Fireflies.ai</p>
                  <button
                    onClick={handleFirefliesSync}
                    disabled={syncing}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#7F56D9] hover:bg-[#6941C6] disabled:opacity-60 rounded-lg transition-colors"
                  >
                    <RefreshCw01 width={16} height={16} className={syncing ? 'animate-spin' : ''} />
                    {syncing ? 'Syncing…' : 'Sync Now'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          <div className="pl-12">
            <button
              onClick={() => setNotesOpen((v) => !v)}
              className="flex items-center gap-2 text-sm font-medium text-[#7F56D9] hover:text-[#6941C6] transition-colors"
            >
              <Plus width={16} height={16} />
              Add Notes if any
              <ChevronDown
                width={14} height={14}
                className={`transition-transform ${notesOpen ? 'rotate-180' : ''}`}
              />
            </button>
            {notesOpen && (
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional notes for the AI processor…"
                rows={4}
                className="mt-2 w-full border border-[#D5D7DA] rounded-lg px-3 py-2.5 text-sm text-[#181D27] placeholder-[#A4A7AE] outline-none focus:ring-2 focus:ring-[#7F56D9] focus:border-transparent resize-none"
              />
            )}
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
        </div>

        {/* Sticky footer */}
        <div className="px-6 py-4 border-t border-[#E9EAEB] shrink-0">
          <button
            onClick={handleRun}
            disabled={processing || !firmId || !primaryPromptId}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-white bg-[#7F56D9] hover:bg-[#6941C6] disabled:opacity-60 rounded-xl transition-colors"
          >
            <Lightning01 width={18} height={18} />
            {processing ? 'Processing…' : 'Run Processing'}
          </button>
        </div>
      </div>
    </>
  );
}
