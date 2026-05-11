import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
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

// ── Saved attachment row ───────────────────────────────────────────────────────

function SavedAttachmentItem({
  att,
  markedForDelete,
  onToggleDelete,
}: {
  att: ProjectAttachment;
  markedForDelete: boolean;
  onToggleDelete: () => void;
}) {
  return (
    <div className={`group flex items-center gap-2.5 px-3 py-2 rounded-lg border transition-colors ${
      markedForDelete
        ? 'border-red-200 bg-red-50 opacity-60'
        : 'border-[#E9EAEB] bg-white hover:bg-[#F9FAFB]'
    }`}>
      <div className="shrink-0 w-8 h-8 rounded-md overflow-hidden border border-[#E9EAEB] flex items-center justify-center bg-[#F9FAFB]">
        {att.file_type?.startsWith('image/') ? (
          <img src={att.file_url} alt={att.file_name} className="w-full h-full object-cover" />
        ) : (
          <FileTypeIcon type={att.file_type ?? ''} name={att.file_name} />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className={`text-[12px] font-medium truncate ${markedForDelete ? 'line-through text-red-400' : 'text-[#181D27]'}`}>
          {att.file_name}
        </p>
        <div className="flex items-center gap-1.5">
          <p className="text-[11px] text-[#A4A7AE]">{formatFileSize(att.file_size)}</p>
          {markedForDelete && (
            <span className="text-[10px] font-semibold text-red-500 uppercase tracking-wide">Will be removed</span>
          )}
          {!markedForDelete && att.uploader_name && (
            <>
              <span className="text-[10px] text-[#D0D5DD]">·</span>
              <p className="text-[11px] text-[#A4A7AE] truncate max-w-[100px]">{att.uploader_name}</p>
            </>
          )}
        </div>
      </div>

      <div className="shrink-0 flex items-center gap-1.5">
        {markedForDelete ? (
          <button
            type="button"
            onClick={onToggleDelete}
            className="text-[11px] text-[#7F56D9] hover:underline"
          >
            Undo
          </button>
        ) : (
          <>
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
              onClick={onToggleDelete}
              className="opacity-0 group-hover:opacity-100 w-5 h-5 rounded flex items-center justify-center text-[#A4A7AE] hover:text-red-500 hover:bg-red-50 transition-all"
              aria-label={`Remove ${att.file_name}`}
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M1 1l8 8M9 1l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ── Pending (not-yet-uploaded) attachment row ─────────────────────────────────

function PendingAttachmentItem({
  file,
  onRemove,
}: {
  file: File;
  onRemove: () => void;
}) {
  return (
    <div className="group flex items-center gap-2.5 px-3 py-2 rounded-lg border border-dashed border-[#B0A0E8] bg-[#F8F7FF] transition-colors">
      <div className="shrink-0 w-8 h-8 rounded-md overflow-hidden border border-[#E9EAEB] flex items-center justify-center bg-[#F9FAFB]">
        <FileTypeIcon type={file.type} name={file.name} />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-medium text-[#181D27] truncate">{file.name}</p>
        <div className="flex items-center gap-1.5">
          <p className="text-[11px] text-[#A4A7AE]">{formatFileSize(file.size)}</p>
          <span className="text-[10px] font-semibold text-[#7F56D9] uppercase tracking-wide">Pending save</span>
        </div>
      </div>

      <button
        type="button"
        onClick={onRemove}
        className="shrink-0 w-5 h-5 rounded flex items-center justify-center text-[#A4A7AE] hover:text-red-500 hover:bg-red-50 transition-all"
        aria-label={`Remove ${file.name}`}
      >
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <path d="M1 1l8 8M9 1l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </button>
    </div>
  );
}

// ── Public handle type ────────────────────────────────────────────────────────

export interface AttachmentsSectionHandle {
  /** Upload pending files + delete marked files. Call from parent's save handler. */
  commit: () => Promise<void>;
  /** True when there are pending uploads or pending deletes. */
  hasPendingChanges: boolean;
}

// ── AttachmentsSection ────────────────────────────────────────────────────────

interface Props {
  projectId:  string | null | undefined;
  className?: string;
  /** When true, uploads and deletes fire immediately (no Save button needed). Default: false (deferred). */
  immediate?: boolean;
}

const AttachmentsSection = forwardRef<AttachmentsSectionHandle, Props>(
  function AttachmentsSection({ projectId, className = '', immediate = false }, ref) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [dragOver,       setDragOver]       = useState(false);
    const [pendingFiles,   setPendingFiles]   = useState<File[]>([]);
    const [deleteIds,      setDeleteIds]      = useState<Set<string>>(new Set());
    const [commitError,    setCommitError]    = useState('');

    const { data: savedAttachments = [] } = useProjectAttachments(projectId);
    const upload  = useUploadProjectAttachment(projectId ?? '');
    const destroy = useDeleteProjectAttachment(projectId ?? '');

    // Expose commit() and hasPendingChanges to parent via ref
    useImperativeHandle(ref, () => ({
      hasPendingChanges: pendingFiles.length > 0 || deleteIds.size > 0,
      async commit() {
        if (!projectId) return;
        setCommitError('');
        const results = await Promise.allSettled([
          // Upload all pending files
          ...pendingFiles.map((f) => upload.mutateAsync(f)),
          // Delete all marked-for-delete
          ...[...deleteIds].map((id) => destroy.mutateAsync(id)),
        ]);
        const failures = results.filter((r) => r.status === 'rejected');
        if (failures.length > 0) {
          setCommitError(`${failures.length} attachment(s) failed. Please try again.`);
          // Don't throw — parent save should still succeed for other fields
        }
        setPendingFiles([]);
        setDeleteIds(new Set());
      },
    }), [pendingFiles, deleteIds, projectId, upload, destroy]);

    async function addFiles(files: FileList | null) {
      if (!files || !projectId) return;
      const MAX_MB = 10;
      const toAdd: File[] = [];
      const oversized: string[] = [];
      Array.from(files).forEach((f) => {
        if (f.size > MAX_MB * 1024 * 1024) oversized.push(`${f.name} (${(f.size / 1024 / 1024).toFixed(1)} MB)`);
        else toAdd.push(f);
      });
      if (oversized.length) { setCommitError(`Too large (max ${MAX_MB} MB): ${oversized.join(', ')}`); return; }
      setCommitError('');
      if (immediate) {
        await Promise.allSettled(toAdd.map((f) => upload.mutateAsync(f)));
      } else {
        setPendingFiles((p) => [...p, ...toAdd]);
      }
    }

    async function toggleDelete(id: string) {
      if (immediate) {
        await destroy.mutateAsync(id);
      } else {
        setDeleteIds((prev) => {
          const next = new Set(prev);
          next.has(id) ? next.delete(id) : next.add(id);
          return next;
        });
      }
    }

    const totalCount = savedAttachments.length - deleteIds.size + pendingFiles.length;

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

    const isEmpty = savedAttachments.length === 0 && pendingFiles.length === 0;

    return (
      <div className={className}>
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-semibold text-[#181D27]">Attachments</span>
            {totalCount > 0 && (
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#F4F3FF] text-[10px] font-bold text-[#7F56D9]">
                {totalCount}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="text-[12px] font-semibold text-[#7F56D9] hover:text-[#6941C6] transition-colors"
          >
            {isEmpty ? 'Upload' : 'Add more'}
          </button>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.rtf,.odt,.pptx,.zip,.rar"
          onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }}
        />

        {/* Validation error */}
        {commitError && (
          <p className="text-[11px] text-red-500 mb-2">{commitError}</p>
        )}

        {/* Empty drop zone */}
        {isEmpty && (
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
            onDrop={(e) => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); }}
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
              <p className="text-[11px] text-[#A4A7AE]">Drop files here to attach (max 10 MB each)</p>
            </div>
          </div>
        )}

        {/* File list */}
        {!isEmpty && (
          <div
            className={`flex flex-col gap-1.5 rounded-lg transition-colors ${
              dragOver ? 'ring-2 ring-[#7F56D9] ring-offset-1 bg-[#F4F3FF]' : ''
            }`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); }}
          >
            {/* Saved attachments */}
            {savedAttachments.map((att) => (
              <SavedAttachmentItem
                key={att.id}
                att={att}
                markedForDelete={deleteIds.has(att.id)}
                onToggleDelete={() => toggleDelete(att.id)}
              />
            ))}

            {/* Pending (not yet uploaded) files */}
            {pendingFiles.map((file, i) => (
              <PendingAttachmentItem
                key={`${file.name}-${i}`}
                file={file}
                onRemove={() => setPendingFiles((p) => p.filter((_, idx) => idx !== i))}
              />
            ))}
          </div>
        )}

        {/* Pending changes hint — only shown in deferred mode */}
        {!immediate && (pendingFiles.length > 0 || deleteIds.size > 0) && (
          <p className="text-[11px] text-[#A4A7AE] mt-1.5">
            {[
              pendingFiles.length > 0 && `${pendingFiles.length} file${pendingFiles.length > 1 ? 's' : ''} queued`,
              deleteIds.size > 0 && `${deleteIds.size} marked for removal`,
            ].filter(Boolean).join(' · ')}{' '}
            — changes apply on Save.
          </p>
        )}
      </div>
    );
  },
);

export default AttachmentsSection;
