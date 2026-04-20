import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { transcriptsApi } from '../lib/api';
import { queryKeys } from '../lib/queryKeys';

export function useTranscripts() {
  return useQuery({
    queryKey: queryKeys.transcripts.all,
    queryFn:  () => transcriptsApi.list('all'),
  });
}

export function useCreateTranscript() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: transcriptsApi.create,
    onSuccess:  () => qc.invalidateQueries({ queryKey: queryKeys.transcripts.all }),
  });
}

export function useArchiveTranscript() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => transcriptsApi.toggleArchive(id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: queryKeys.transcripts.all }),
  });
}

export function useSyncTranscripts() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => transcriptsApi.sync(),
    onSuccess:  () => qc.invalidateQueries({ queryKey: queryKeys.transcripts.all }),
  });
}

export function useProcessTranscript() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Parameters<typeof transcriptsApi.process>[1] }) =>
      transcriptsApi.process(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.transcripts.all });
      qc.invalidateQueries({ queryKey: queryKeys.tasks.all });
    },
  });
}
