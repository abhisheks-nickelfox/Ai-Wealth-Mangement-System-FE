import { useRef, useState } from 'react';
import {
  useProjectAttachments,
  useUploadProjectAttachment,
  useDeleteProjectAttachment,
} from '../../hooks/useProjectAttachments';
import type { ProjectAttachment } from '../../lib/api';

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function FileTypeIcon({ type, name }: { type: string; name: string }) {
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  if (type.startsWith('image/')) {
    return (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <rect width="20" height="20" rx="4" fill="#ECFDF3"/>
        <path d="M4 14l4-4 2.5 2.5L14 8l2 2v4H4z" fill="#17B26A" opacity=".3"/>
        <circle cx="7" cy="7.5" r="1.5" fill="#17B26A"/>
        <rect x="3" y="3" width="14" height="14" rx="2" stroke="#17B26A" strokeWidth="1.2" fill="none"/>
      </svg>
    );
  }
  if (type === 'application/pdf' || ext === 'pdf') {
    return (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <rect width="20" height="20" rx="4" fill="#FEF3F2"/>
        <path d="M5 3h7l4 4v10a1 1 0 01-1 1H5a1 1 0 01-1-1V4a1 1 0 011-1z" fill="#FEE4E2" stroke="#F04438" strokeWidth="1.2"/>
        <path d="M12 3v4h4" stroke="#F04438" strokeWidth="1.2"/>
        <path d="M7 11h6M7 13.5h4" stroke="#F04438" strokeWidth="1.2" strokeLinecap="round"/>
      </svg>
    );
  }
  if (['doc','docx','odt','rtf','txt'].includes(ext)) {
    return (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <rect width="20" height="20" rx="4" fill="#EFF8FF"/>
        <path d="M5 3h7l4 4v10a1 1 0 01-1 1H5a1 1 0 01-1-1V4a1 1 0 011-1z" fill="#D1E9FF" stroke="#2E90FA" strokeWidth="1.2"/>
        <path d="M12 3v4h4" stroke="#2E90FA" strokeWidth="1.2"/>
        <path d="M7 11h6M7 13.5h4" stroke="#2E90FA" strokeWidth="1.2" strokeLinecap="round"/>
      </svg>
    );
  }
  if (['xls','xlsx','csv'].includes(ext)) {
    return (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <rect width="20" height="20" rx="4" fill="#F0FDF4"/>
        <path d="M5 3h7l4 4v10a1 1 0 01-1 1H5a1 1 0 01-1-1V4a1 1 0 011-1z" fill="#DCFCE7" stroke="#16A34A" strokeWidth="1.2"/>
        <path d="M12 3v4h4" stroke="#16A34A" strokeWidth="1.2"/>
        <path d="M7 10h6v5H7z" stroke="#16A34A" strokeWidth="1.2"/>
        <path d="M10 10v5M7 12.5h6" stroke="#16A34A" strokeWidth="1.2" strokeLinecap="round"/>
      </svg>
    );
  }
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <rect width="20" height="20" rx="4" fill="#F4F3FF"/>
      <path d="M5 3h7l4 4v10a1 1 0 01-1 1H5a1 1 0 01-1-1V4a1 1 0 011-1z" fill="#EDE9FE" stroke="#7F56D9" strokeWidth="1.2"/>
      <path d="M12 3v4h4" stroke="#7F56D9" strokeWidth="1.2"/>
      <path d="M7 11h6M7 13.5h4" stroke="#7F56D9" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  );
}

// ── Single attachment row ──────────────────────────────────────────────────────

function AttachmentItem({
  att,
  onRemove,
}: {
  att: ProjectAttachment;
  onRemove: () => void;
}) {
  return (
    <div className="group flex items-center gap-2.5 px-3 py-2 rounded-lg border border-[#E9EAEB] bg-white hover:bg-[#F9FAFB] transition-colors">
      <div className="shrink-0 w-8 h-8 rounded-md overflow-hidden border border-[#E9EAEB] flex items-center justify-center bg-[#F9FAFB]">
        {att.file_type?.startsWith('image/') ? (
          <img src={att.file_url} alt={att.file_name} className="w-full h-full object-cover" />
        ) : (
          <FileTypeIcon type={att.file_type ?? ''} name={att.file_name} />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-medium text-[#181D27] truncate">{att.file_name}</p>
        <div className="flex items-center gap-1.5">
          <p className="text-[11px] text-[#A4A7AE]">{formatFileSize(att.file_size)}</p>
          {att.uploader_name && (
            <>
              <span className="text-[10px] text-[#D0D5DD]">·</span>
              <p className="text-[11px] text-[#A4A7AE] truncate max-w-[100px]">{att.uploader_name}</p>
            </>
          )}
        </div>
      </div>

      <div className="shrink-0 flex items-center gap-1.5">
        <a
          href={att.file_url}
          download={att.file_name}
          target="_blank"
          rel="noreferrer"
          className="text-[11px] text-[#7F56D9] hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          Download
        </a>
        <button
          type="button"
          onClick={onRemove}
          className="opacity-0 group-hover:opacity-100 w-5 h-5 rounded flex items-center justify-center text-[#A4A7AE] hover:text-red-500 hover:bg-red-50 transition-all"
          aria-label={`Remove ${att.file_name}`}
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M1 1l8 8M9 1l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>
      </div>
    </div>
  );
}

// ── AttachmentsSection ─────────────────────────────────────────────────────────
// projectId is the source of truth. Pass task.project_id from task views.

interface Props {
  projectId:  string | null | undefined;
  className?: string;
}

export default function AttachmentsSection({ projectId, className = '' }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const { data: attachments = [] } = useProjectAttachments(projectId);
  const upload  = useUploadProjectAttachment(projectId ?? '');
  const destroy = useDeleteProjectAttachment(projectId ?? '');

  async function handleFiles(files: FileList | null) {
    if (!files || !projectId) return;
    await Promise.allSettled(Array.from(files).map((f) => upload.mutateAsync(f)));
  }

  // No project linked — show a quiet placeholder
  if (!projectId) {
    return (
      <div className={className}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[13px] font-semibold text-[#181D27]">Attachments</span>
        </div>
        <p className="text-[12px] text-[#A4A7AE] italic">
          Assign this task to a project to enable attachments.
        </p>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-semibold text-[#181D27]">Attachments</span>
          {attachments.length > 0 && (
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#F4F3FF] text-[10px] font-bold text-[#7F56D9]">
              {attachments.length}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="text-[12px] font-semibold text-[#7F56D9] hover:text-[#6941C6] transition-colors"
        >
          {attachments.length === 0 ? 'Upload' : 'Add more'}
        </button>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.rtf,.odt,.pptx,.zip,.rar"
        onChange={(e) => handleFiles(e.target.files)}
        onClick={(e) => { (e.target as HTMLInputElement).value = ''; }}
      />

      {/* Empty state — compact horizontal card */}
      {attachments.length === 0 && !upload.isPending && (
        <div
          role="button"
          tabIndex={0}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-colors cursor-pointer ${
            dragOver
              ? 'border-[#7F56D9] bg-[#F4F3FF] border-solid'
              : 'border-dashed border-[#D0D5DD] bg-[#FAFAFA] hover:border-[#B0A0E8] hover:bg-[#F8F7FF]'
          }`}
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
        >
          <div className="shrink-0 w-9 h-9 rounded-lg bg-[#FEF3F2] flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <path d="M5 3h7l4 4v10a1 1 0 01-1 1H5a1 1 0 01-1-1V4a1 1 0 011-1z" fill="#FEE4E2" stroke="#F04438" strokeWidth="1.2"/>
              <path d="M12 3v4h4" stroke="#F04438" strokeWidth="1.2"/>
              <path d="M7 11h6M7 13.5h4" stroke="#F04438" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
          </div>
          <div>
            <p className="text-[12px] font-medium text-[#344054]">No attachments yet</p>
            <p className="text-[11px] text-[#A4A7AE]">Drop files here to attach</p>
          </div>
        </div>
      )}

      {/* Upload spinner */}
      {upload.isPending && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[#E9EAEB] bg-[#F9FAFB]">
          <div className="w-4 h-4 border-2 border-[#7F56D9] border-t-transparent rounded-full animate-spin shrink-0" />
          <span className="text-[12px] text-[#717680]">Uploading…</span>
        </div>
      )}

      {/* File list with drag-to-add */}
      {attachments.length > 0 && (
        <div
          className={`flex flex-col gap-1.5 rounded-lg transition-colors ${
            dragOver ? 'ring-2 ring-[#7F56D9] ring-offset-1 bg-[#F4F3FF]' : ''
          }`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
        >
          {attachments.map((att) => (
            <AttachmentItem
              key={att.id}
              att={att}
              onRemove={() => destroy.mutate(att.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
