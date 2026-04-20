import { useState } from 'react';
import { X } from '@untitled-ui/icons-react';

// ── InlineAddPanel ────────────────────────────────────────────────────────────
// Compact form panel used to add new catalog items (roles, skills, etc.)
// inline without navigating away from the current form.

export interface InlineAddField {
  key: string;
  placeholder: string;
  required?: boolean;
}

interface InlineAddPanelProps {
  title: string;
  fields: InlineAddField[];
  error: string;
  saving: boolean;
  onSave: (values: Record<string, string>) => Promise<void>;
  onCancel: () => void;
}

export default function InlineAddPanel({
  title,
  fields,
  error,
  saving,
  onSave,
  onCancel,
}: InlineAddPanelProps) {
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(fields.map((f) => [f.key, '']))
  );

  return (
    <div className="mt-2 bg-[#F9FAFB] border border-[#E9EAEB] rounded-lg p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-[#414651]">{title}</span>
        <button type="button" onClick={onCancel} className="text-[#717680] hover:text-[#414651]">
          <X width={15} height={15} />
        </button>
      </div>

      <div className="flex gap-2">
        {fields.map((f) => (
          <input
            key={f.key}
            type="text"
            value={values[f.key]}
            onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
            placeholder={f.placeholder}
            className="flex-1 bg-white border border-[#D5D7DA] rounded-lg px-3 py-2 text-sm text-[#181D27] placeholder-[#717680] focus:outline-none focus:ring-2 focus:ring-[#9E77ED] focus:border-transparent"
          />
        ))}
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}

      <button
        type="button"
        onClick={() => onSave(values)}
        disabled={saving}
        className="self-start inline-flex items-center gap-1.5 bg-[#7F56D9] hover:bg-[#6941C6] disabled:opacity-50 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
      >
        {saving ? 'Adding…' : 'Add'}
      </button>
    </div>
  );
}
