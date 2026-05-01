import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { firmsApi } from '../lib/api';
import type { Firm } from '../lib/api';
import { queryKeys } from '../lib/queryKeys';

export function useFirms() {
  return useQuery({
    queryKey: queryKeys.firms.all,
    queryFn:  () => firmsApi.list(),
  });
}

export function useFirmDetail(id: string) {
  return useQuery({
    queryKey: queryKeys.firms.detail(id),
    queryFn:  () => firmsApi.get(id),
    enabled:  !!id,
  });
}

export function useCreateFirm() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Parameters<typeof firmsApi.create>[0]) => firmsApi.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.firms.all }),
  });
}

export function useUpdateFirm() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<Firm> }) =>
      firmsApi.update(id, payload),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: queryKeys.firms.all });
      qc.invalidateQueries({ queryKey: queryKeys.firms.detail(id) });
    },
  });
}

export function useDeleteFirm() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => firmsApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.firms.all }),
  });
}
