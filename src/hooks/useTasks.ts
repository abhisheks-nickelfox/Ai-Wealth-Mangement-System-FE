import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tasksApi } from '../lib/api';
import type { Task } from '../lib/api';
import { queryKeys } from '../lib/queryKeys';

export function useTasks(params?: { session_id?: string; status?: string }) {
  return useQuery({
    queryKey: [...queryKeys.tasks.all, params],
    queryFn:  () => tasksApi.list(params),
  });
}

export function useTasksByFirm(firmId: string) {
  return useQuery({
    queryKey: queryKeys.tasks.byFirm(firmId),
    queryFn:  () => tasksApi.list({ firm_id: firmId }),
    enabled:  !!firmId,
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<Pick<Task, 'title' | 'description' | 'priority' | 'deadline'>> }) =>
      tasksApi.update(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.tasks.all }),
  });
}

export function useDiscardTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tasksApi.discard(id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: queryKeys.tasks.all }),
  });
}

export function useArchiveTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, archived }: { id: string; archived: boolean }) =>
      tasksApi.archive(id, archived),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.tasks.all }),
  });
}

export function useAssignApproveTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Parameters<typeof tasksApi.assignApprove>[1] }) =>
      tasksApi.assignApprove(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.tasks.all }),
  });
}
