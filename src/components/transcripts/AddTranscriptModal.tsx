import { useState } from 'react';
import { X, ChevronDown } from '@untitled-ui/icons-react';
import Input from '../ui/Input';
import type { Transcript, Firm } from '../../lib/api';
import { useCreateTranscript } from '../../hooks/useTranscripts';

export interface AddTranscriptModalProps {
  open: boolean;
  onClose: () => void;
  firms: Firm[];
  onCreated: (t: Transcript) => void;
}

export default function AddTranscriptModal({ open, onClose, firms, onCreated }: AddTranscriptModalProps) {
  const [title, setTitle] = useState('');
  const [callDate, setCallDate] = useState('');
  const [durationMins, setDurationMins] = useState('');
  const [rawTranscript, setRawTranscript] = useState('');
  const [firmId, setFirmId] = useState('');
  const [error, setError] = useState('');
  const createTranscript = useCreateTranscript();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !callDate || !rawTranscript.trim()) {
      setError('Title, call date, and transcript text are required.');
      return;
    }
    setError('');
    try {
      const created = await createTranscript.mutateAsync({
        title: title.trim(),
        call_date: callDate,
        duration_sec: durationMins ? parseInt(durationMins, 10) * 60 : 0,
        raw_transcript: rawTranscript.trim(),
        firm_id: firmId || undefined,
      });
      onCreated(created);
      setTitle(''); setCallDate(''); setDurationMins(''); setRawTranscript(''); setFirmId('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create transcript.');
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E9EAEB]">
          <h2 className="text-lg font-semibold text-[#181D27]">Add Transcript</h2>
          <button onClick={onClose} className="p-1 rounded text-[#717680] hover:bg-gray-100 transition-colors">
            <X width={20} height={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4">
          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
          <Input
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Q1 Strategy Call"
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Call Date"
              type="date"
              value={callDate}
              onChange={(e) => setCallDate(e.target.value)}
              required
            />
            <Input
              label="Duration (minutes)"
              type="number"
              min={0}
              value={durationMins}
              onChange={(e) => setDurationMins(e.target.value)}
              placeholder="e.g. 55"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#414651] mb-1.5">Firm</label>
            <div className="relative">
              <select
                value={firmId}
                onChange={(e) => setFirmId(e.target.value)}
                className="w-full appearance-none border border-[#D5D7DA] rounded-lg px-3 py-2.5 text-sm text-[#181D27] outline-none focus:ring-2 focus:ring-[#7F56D9] focus:border-transparent bg-white"
              >
                <option value="">Select firm (optional)</option>
                {firms.map((f) => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
              <ChevronDown width={16} height={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A4A7AE] pointer-events-none" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#414651] mb-1.5">
              Transcript Text <span className="text-red-500">*</span>
            </label>
            <textarea
              value={rawTranscript}
              onChange={(e) => setRawTranscript(e.target.value)}
              placeholder="Paste the full meeting transcript here..."
              rows={8}
              className="w-full border border-[#D5D7DA] rounded-lg px-3 py-2.5 text-sm text-[#181D27] placeholder-[#A4A7AE] outline-none focus:ring-2 focus:ring-[#7F56D9] focus:border-transparent resize-none"
            />
          </div>
        </form>
        <div className="flex items-center gap-3 px-6 py-4 border-t border-[#E9EAEB]">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 text-sm font-semibold text-[#414651] border border-[#D5D7DA] rounded-lg bg-white hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={createTranscript.isPending}
            className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-[#7F56D9] hover:bg-[#6941C6] disabled:opacity-60 rounded-lg transition-colors"
          >
            {createTranscript.isPending ? 'Creating…' : 'Create Transcript'}
          </button>
        </div>
      </div>
    </div>
  );
}
