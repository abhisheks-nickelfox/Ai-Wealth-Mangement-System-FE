import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectAttachmentsApi } from '../lib/api';
import { queryKeys } from '../lib/queryKeys';

export function useProjectAttachments(projectId: string | null | undefined) {
  return useQuery({
    queryKey: queryKeys.projectAttachments.byProject(projectId ?? ''),
    queryFn:  () => projectAttachmentsApi.list(projectId!),
    enabled:  !!projectId,
    staleTime: 30_000,
  });
}

export function useUploadProjectAttachment(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => projectAttachmentsApi.upload(projectId, file),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.projectAttachments.byProject(projectId) });
    },
  });
}

export function useDeleteProjectAttachment(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (attId: string) => projectAttachmentsApi.delete(projectId, attId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.projectAttachments.byProject(projectId) });
    },
  });
}
