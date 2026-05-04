import { useState } from 'react';
import { HelpCircle, XClose } from '@untitled-ui/icons-react';
import Button from '../ui/Button';
import type { Skill } from '../../lib/api';

export interface LocalSkill {
  id: string;
  name: string;
  experience: string | null;
}

interface SkillRowEntry {
  rowId: string;
  skillId: string;
  experience: string;
}

interface AddSkillsModalProps {
  skillCatalog: Skill[];
  initialSkills: LocalSkill[];
  onClose: () => void;
  onSave: (skills: LocalSkill[]) => void;
}

export default function AddSkillsModal({
  skillCatalog,
  initialSkills,
  onClose,
  onSave,
}: AddSkillsModalProps) {
  const [rows, setRows] = useState<SkillRowEntry[]>(
    initialSkills.length > 0
      ? initialSkills.map((s) => ({
          rowId: s.id,
          skillId: s.id.startsWith('temp-') ? '' : s.id,
          experience: s.experience ?? '',
        }))
      : [{ rowId: 'row-0', skillId: '', experience: '' }],
  );
  const [errorRowIds, setErrorRowIds] = useState<Set<string>>(new Set());
  const [errorMsg, setErrorMsg] = useState('');

  function updateRow(rowId: string, field: 'skillId' | 'experience', value: string) {
    const capped = field === 'experience' ? value.slice(0, 70) : value;
    setRows((prev) => prev.map((r) => (r.rowId === rowId ? { ...r, [field]: capped } : r)));
    if (field === 'experience' && capped) {
      setErrorRowIds((prev) => { const n = new Set(prev); n.delete(rowId); return n; });
    }
  }

  function removeRow(rowId: string) {
    setRows((prev) => (prev.length > 1 ? prev.filter((r) => r.rowId !== rowId) : prev));
    setErrorRowIds((prev) => { const n = new Set(prev); n.delete(rowId); return n; });
  }

  function addRow() {
    setRows((prev) => [...prev, { rowId: `row-${Date.now()}`, skillId: '', experience: '' }]);
  }

  function handleSave() {
    const activeRows = rows.filter((r) => r.skillId);
    const missing = new Set(activeRows.filter((r) => !r.experience).map((r) => r.rowId));
    if (missing.size > 0) {
      setErrorRowIds(missing);
      setErrorMsg('Please enter an experience level for every skill.');
      return;
    }
    const tooLong = new Set(
      activeRows.filter((r) => r.experience.trim().length > 70).map((r) => r.rowId),
    );
    if (tooLong.size > 0) {
      setErrorRowIds(tooLong);
      setErrorMsg('Experience must be 70 characters or fewer.');
      return;
    }
    setErrorRowIds(new Set());
    setErrorMsg('');
    const skills: LocalSkill[] = activeRows.map((r) => {
      const catalog = skillCatalog.find((s) => s.id === r.skillId);
      return { id: r.skillId, name: catalog?.name ?? r.skillId, experience: r.experience || null };
    });
    onSave(skills);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      <div className="relative bg-white shadow-2xl w-[660px] max-w-[95vw] px-10 py-10">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 flex items-center justify-center w-8 h-8 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
        >
          <XClose width={18} height={18} />
        </button>

        <h2 className="text-3xl font-bold text-[#181D27] mb-8">Add More Skills</h2>

        {/* Column headers */}
        <div className="grid mb-3" style={{ gridTemplateColumns: '1fr 1fr 40px', gap: '16px' }}>
          <div className="flex items-center gap-1.5 text-sm font-medium text-gray-600">
            Skills <span className="text-gray-400">*</span>
            <HelpCircle width={15} height={15} className="text-[#7F56D9] ml-0.5" />
          </div>
          <div className="flex items-center gap-1.5 text-sm font-medium text-gray-600">
            Experience <span className="text-gray-400">*</span>
            <HelpCircle width={15} height={15} className="text-[#7F56D9] ml-0.5" />
          </div>
          <div />
        </div>

        {/* Skill rows */}
        <div className="overflow-y-auto flex flex-col gap-4" style={{ maxHeight: '228px' }}>
          {rows.map((row) => {
            const hasError = errorRowIds.has(row.rowId) && !!row.skillId;
            return (
              <div
                key={row.rowId}
                className="grid items-center shrink-0"
                style={{ gridTemplateColumns: '1fr 1fr 40px', gap: '16px' }}
              >
                <div className="relative">
                  <select
                    value={row.skillId}
                    onChange={(e) => updateRow(row.rowId, 'skillId', e.target.value)}
                    className="border border-[#D5D7DA] rounded-lg px-4 py-3 text-sm text-gray-500 bg-white focus:outline-none focus:ring-2 focus:ring-[#9E77ED] w-full appearance-none pr-9"
                  >
                    <option value="">Select skill…</option>
                    {skillCatalog.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">▾</span>
                </div>

                <div className="flex flex-col gap-0.5">
                  <input
                    type="text"
                    value={row.experience}
                    onChange={(e) => updateRow(row.rowId, 'experience', e.target.value)}
                    placeholder="e.g. 2-5 years"
                    maxLength={70}
                    className={`rounded-lg px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 w-full border transition-colors ${
                      hasError || row.experience.length >= 70
                        ? 'border-red-400 text-red-600 focus:ring-red-300'
                        : 'border-[#D5D7DA] text-gray-500 focus:ring-[#9E77ED]'
                    }`}
                  />
                  {row.experience.length > 0 && (
                    <p className={`text-[10px] text-right ${row.experience.length >= 70 ? 'text-red-500' : 'text-gray-400'}`}>
                      {row.experience.length}/70
                    </p>
                  )}
                </div>

                <button
                  onClick={() => removeRow(row.rowId)}
                  className="flex items-center justify-center w-9 h-9 rounded-full border border-gray-300 text-gray-400 hover:border-gray-400 hover:text-gray-600 transition-colors shrink-0"
                >
                  <XClose width={15} height={15} />
                </button>
              </div>
            );
          })}
        </div>

        {errorMsg && <p className="mt-3 text-sm text-red-600">{errorMsg}</p>}

        <button
          onClick={addRow}
          className="mt-4 text-sm font-medium text-[#7F56D9] hover:text-[#6941C6] transition-colors block"
        >
          + Add another
        </button>

        <div className="flex justify-center mt-6">
          <Button variant="primary" onClick={handleSave} className="w-[60%] justify-center">
            Update &amp; Continue
          </Button>
        </div>
      </div>
    </div>
  );
}
