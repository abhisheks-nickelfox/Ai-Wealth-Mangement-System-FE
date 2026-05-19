import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { firmsApi, projectsApi } from '../lib/api';
import type { Firm, CreateProjectPayload, UpdateProjectPayload } from '../lib/api';
import { queryKeys } from '../lib/queryKeys';

export function useFirms() {
  return useQuery({
    queryKey:  queryKeys.firms.all,
    queryFn:   () => firmsApi.list(),
    staleTime: 120_000,
  });
}

export function useFirmDetail(id: string) {
  return useQuery({
    queryKey:  queryKeys.firms.detail(id),
    queryFn:   () => firmsApi.get(id),
    enabled:   !!id,
    staleTime: 120_000,
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

export function useProjects(firmId?: string) {
  return useQuery({
    queryKey:  firmId ? queryKeys.projects.byFirm(firmId) : queryKeys.projects.all,
    queryFn:   () => projectsApi.list(firmId),
    staleTime: 120_000,
  });
}

export function useProjectDetail(id: string | null) {
  return useQuery({
    queryKey:  queryKeys.projects.detail(id ?? ''),
    queryFn:   () => projectsApi.get(id!),
    enabled:   !!id,
    staleTime: 120_000,
  });
}

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateProjectPayload) => projectsApi.create(payload),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: queryKeys.projects.byFirm(variables.firm_id) });
      qc.invalidateQueries({ queryKey: queryKeys.projects.all });
      qc.invalidateQueries({ queryKey: queryKeys.firms.detail(variables.firm_id) });
    },
  });
}

export function useUpdateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateProjectPayload }) =>
      projectsApi.update(id, payload),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: queryKeys.projects.all });
      qc.invalidateQueries({ queryKey: queryKeys.projects.detail(id) });
    },
  });
}

export function useDeleteProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, taskIds = [] }: { id: string; taskIds?: string[] }) =>
      projectsApi.delete(id, taskIds),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.projects.all });
      qc.invalidateQueries({ queryKey: queryKeys.tasks.all });
    },
  });
}
