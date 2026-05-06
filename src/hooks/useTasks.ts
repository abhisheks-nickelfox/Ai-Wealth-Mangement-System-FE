import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tasksApi } from '../lib/api';
import type { Task, CreateTaskPayload } from '../lib/api';
import { queryKeys } from '../lib/queryKeys';

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateTaskPayload) => tasksApi.create(payload),
    onSuccess: (_data, { firm_id }) => {
      qc.invalidateQueries({ queryKey: queryKeys.tasks.all });
      qc.invalidateQueries({ queryKey: queryKeys.tasks.byFirm(firm_id) });
    },
  });
}

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
    mutationFn: ({ id, payload }: {
      id: string;
      payload: Partial<Pick<Task, 'title' | 'description' | 'priority' | 'deadline'>> & {
        assignee_id?:  string | null;
        assignee_ids?: string[];
        project_id?:   string | null;
      };
    }) => tasksApi.update(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.tasks.all }),
  });
}

export function useDiscardTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tasksApi.transition(id, 'to_do'),
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

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tasksApi.delete(id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: queryKeys.tasks.all }),
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
