import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { UploadCloud01, Trash01, File05 } from '@untitled-ui/icons-react';
import LoadingSpinner from '../ui/LoadingSpinner';
import EmptyState from '../ui/EmptyState';
import { projectAttachmentsApi } from '../../lib/api';
import { queryKeys } from '../../lib/queryKeys';
import { formatFileSize, formatRelativeDate } from '../../lib/formatUtils';
import type { ProjectAttachment } from '../../lib/api';

interface ActivityFilesTabProps {
  projectId: string | null;
}

export default function ActivityFilesTab({ projectId }: ActivityFilesTabProps) {
  const qc = useQueryClient();
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleting,        setDeleting]        = useState(false);

  const { data: attachments = [], isLoading } = useQuery<ProjectAttachment[]>({
    queryKey: queryKeys.projectAttachments.byProject(projectId ?? ''),
    queryFn:  () => projectAttachmentsApi.list(projectId!),
    enabled:  !!projectId,
  });

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

  if (!projectId) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <EmptyState title="No project" description="Attach this task to a project to share files." />
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="px-5 pt-4 pb-3 shrink-0">
        <label className="flex items-center justify-center gap-2 w-full px-3 py-2 rounded-lg border border-dashed border-[#D5D7DA] hover:border-[#7F56D9] cursor-pointer transition-colors text-[13px] text-[#717680] hover:text-[#6941C6]">
          <UploadCloud01 width={15} height={15} />
          Upload file
          <input type="file" className="hidden" onChange={handleUpload} />
        </label>
      </div>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center"><LoadingSpinner /></div>
      ) : attachments.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <EmptyState title="No files yet" description="Upload files to share with your team." />
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          {attachments.map((att) => (
            <div key={att.id} className="border-b border-[#F2F4F7]">
              {deleteConfirmId === att.id ? (
                <div className="flex items-center gap-3 px-5 py-3 bg-red-50">
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-[#181D27] truncate">{att.file_name}</p>
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
                      {att.file_name}
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
        </div>
      )}
    </div>
  );
}
