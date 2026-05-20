import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { UploadCloud01, Trash01, File05, Link01 } from '@untitled-ui/icons-react';
import LoadingSpinner from '../ui/LoadingSpinner';
import EmptyState from '../ui/EmptyState';
import { projectAttachmentsApi } from '../../lib/api';
import { queryKeys } from '../../lib/queryKeys';
import { formatFileSize, formatRelativeDate } from '../../lib/formatUtils';

function cleanFileName(name: string): string {
  return name.replace(/^[0-9a-f]{8}-[0-9a-f-]{27}_/i, '');
}
import { useMessages } from '../../hooks/useMessages';
import type { ProjectAttachment, Message } from '../../lib/api';

const URL_RE = /(https?:\/\/[^\s<>"{}|\\^`[\]]+)/g;

interface ExtractedLink { url: string; author: string; created_at: string }

function extractLinks(messages: Message[]): ExtractedLink[] {
  const seen = new Set<string>();
  const links: ExtractedLink[] = [];
  for (const msg of [...messages].reverse()) {
    if (msg.is_system || msg.body.startsWith('{"__file":true')) continue;
    URL_RE.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = URL_RE.exec(msg.body)) !== null) {
      const url = m[1];
      if (!seen.has(url)) {
        seen.add(url);
        links.push({ url, author: msg.author.name, created_at: msg.created_at });
      }
    }
  }
  return links;
}

function truncateUrl(url: string, max = 48): string {
  try {
    const u = new URL(url);
    const display = u.hostname + u.pathname + u.search;
    return display.length > max ? display.slice(0, max) + '…' : display;
  } catch {
    return url.length > max ? url.slice(0, max) + '…' : url;
  }
}

interface ActivityFilesTabProps {
  projectId: string | null;
  scope:     string;
  scopeId:   string;
}

export default function ActivityFilesTab({ projectId, scope, scopeId }: ActivityFilesTabProps) {
  const qc = useQueryClient();
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleting,        setDeleting]        = useState(false);

  const { data: attachments = [], isLoading } = useQuery<ProjectAttachment[]>({
    queryKey: queryKeys.projectAttachments.byProject(projectId ?? ''),
    queryFn:  () => projectAttachmentsApi.list(projectId!),
    enabled:  !!projectId,
  });

  // Extract links from chat messages — served from the already-warm messages cache
  const { data: messages = [] } = useMessages(scope, scopeId);
  const links = extractLinks(messages);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !projectId) return;
    await projectAttachmentsApi.upload(projectId, file);
    qc.invalidateQueries({ queryKey: queryKeys.projectAttachments.byProject(projectId) });
    e.target.value = '';
  }

  async function confirmDelete() {
    if (!deleteConfirmId || !projectId) return;
    setDeleting(true);
    await projectAttachmentsApi.delete(projectId, deleteConfirmId);
    qc.invalidateQueries({ queryKey: queryKeys.projectAttachments.byProject(projectId) });
    setDeleteConfirmId(null);
    setDeleting(false);
  }

  const hasContent = attachments.length > 0 || links.length > 0;

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Upload button — only when project exists */}
      {projectId && (
        <div className="px-5 pt-4 pb-3 shrink-0">
          <label className="flex items-center justify-center gap-2 w-full px-3 py-2 rounded-lg border border-dashed border-[#D5D7DA] hover:border-[#7F56D9] cursor-pointer transition-colors text-[13px] text-[#717680] hover:text-[#6941C6]">
            <UploadCloud01 width={15} height={15} />
            Upload file
            <input type="file" className="hidden" onChange={handleUpload} />
          </label>
        </div>
      )}

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center"><LoadingSpinner /></div>
      ) : !hasContent ? (
        <div className="flex-1 flex items-center justify-center">
          <EmptyState title="No files or links yet" description="Upload files or share links in chat." />
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">

          {/* ── Files section ── */}
          {attachments.length > 0 && (
            <>
              <p className="px-5 pt-3 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#A4A7AE]">
                Files
              </p>
              {attachments.map((att) => (
                <div key={att.id} className="border-b border-[#F2F4F7]">
                  {deleteConfirmId === att.id ? (
                    <div className="flex items-center gap-3 px-5 py-3 bg-red-50">
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium text-[#181D27] truncate">{cleanFileName(att.file_name)}</p>
                        <p className="text-[12px] text-red-600 mt-0.5">Delete this file? This cannot be undone.</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmId(null)}
                          disabled={deleting}
                          className="px-2.5 py-1 text-[12px] font-semibold text-[#344054] border border-[#D5D7DA] rounded-md hover:bg-white transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={confirmDelete}
                          disabled={deleting}
                          className="px-2.5 py-1 text-[12px] font-semibold text-white bg-red-500 hover:bg-red-600 rounded-md transition-colors disabled:opacity-50"
                        >
                          {deleting ? '…' : 'Delete'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-3 px-5 py-3 hover:bg-[#F9FAFB] group">
                      <div className="w-9 h-9 rounded-lg bg-[#F4F3FF] flex items-center justify-center shrink-0">
                        <File05 width={18} height={18} className="text-[#7F56D9]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <a
                          href={att.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[13px] font-medium text-[#181D27] hover:text-[#6941C6] truncate block transition-colors"
                        >
                          {cleanFileName(att.file_name)}
                        </a>
                        <p className="text-[11px] text-[#A4A7AE] mt-0.5">
                          {formatFileSize(att.file_size)} · {att.uploader_name ?? 'Unknown'} · {formatRelativeDate(att.created_at)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setDeleteConfirmId(att.id)}
                        className="opacity-0 group-hover:opacity-100 mt-1 text-[#A4A7AE] hover:text-red-500 transition-all shrink-0"
                        title="Remove file"
                      >
                        <Trash01 width={14} height={14} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </>
          )}

          {/* ── Links section ── */}
          {links.length > 0 && (
            <>
              <p className="px-5 pt-4 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#A4A7AE]">
                Links from chat
              </p>
              {links.map((link, i) => (
                <div key={i} className="border-b border-[#F2F4F7]">
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-3 px-5 py-3 hover:bg-[#F9FAFB] group transition-colors"
                  >
                    <div className="w-9 h-9 rounded-lg bg-[#EFF8FF] flex items-center justify-center shrink-0">
                      <Link01 width={16} height={16} className="text-[#0ea5e9]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-[#181D27] group-hover:text-[#0ea5e9] truncate transition-colors">
                        {truncateUrl(link.url)}
                      </p>
                      <p className="text-[11px] text-[#A4A7AE] mt-0.5">
                        {link.author} · {formatRelativeDate(link.created_at)}
                      </p>
                    </div>
                  </a>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
