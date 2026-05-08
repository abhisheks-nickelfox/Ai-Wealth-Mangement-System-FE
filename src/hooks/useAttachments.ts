import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { attachmentsApi } from '../lib/api';
import { queryKeys } from '../lib/queryKeys';

export function useAttachments(taskId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.attachments.byTask(taskId ?? ''),
    queryFn:  () => attachmentsApi.list(taskId!),
    enabled:  !!taskId,
    staleTime: 30_000,
  });
}

export function useUploadAttachment(taskId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => attachmentsApi.upload(taskId, file),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.attachments.byTask(taskId) });
    },
  });
}

export function useDeleteAttachment(taskId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (attId: string) => attachmentsApi.delete(taskId, attId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.attachments.byTask(taskId) });
    },
  });
}
