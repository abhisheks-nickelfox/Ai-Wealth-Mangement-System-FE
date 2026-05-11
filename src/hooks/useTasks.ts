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

export function useTasks(params?: { firm_id?: string; session_id?: string; status?: string; project_id?: string }) {
  return useQuery({
    queryKey:  [...queryKeys.tasks.all, params],
    queryFn:   () => tasksApi.list(params),
    staleTime: 15_000,
  });
}

export function useMyTasks(assigneeId: string | undefined) {
  return useQuery({
    queryKey:  [...queryKeys.tasks.all, { assignee_id: assigneeId }],
    queryFn:   () => tasksApi.list({ assignee_id: assigneeId }),
    enabled:   !!assigneeId,
    staleTime: 15_000,
  });
}

export function useTasksByFirm(firmId: string) {
  return useQuery({
    queryKey:  queryKeys.tasks.byFirm(firmId),
    queryFn:   () => tasksApi.list({ firm_id: firmId }),
    enabled:   !!firmId,
    staleTime: 15_000,
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
        firm_id?:      string;
        status?:       string;
      };
    }) => tasksApi.update(id, payload),
    onSuccess: (data, { payload }) => {
      // Prefer firm_id from response data, fall back to what was in the payload
      const firmId = data.firm_id ?? payload.firm_id;
      if (firmId) {
        qc.invalidateQueries({ queryKey: queryKeys.tasks.byFirm(firmId) });
      } else {
        qc.invalidateQueries({ queryKey: queryKeys.tasks.all });
      }
    },
  });
}

export function useDiscardTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tasksApi.discard(id),
    onSuccess: (data) => {
      if (data.firm_id) {
        qc.invalidateQueries({ queryKey: queryKeys.tasks.byFirm(data.firm_id) });
      } else {
        qc.invalidateQueries({ queryKey: queryKeys.tasks.all });
      }
    },
  });
}

export function useResolveTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tasksApi.resolve(id),
    onSuccess: (data) => {
      if (data.firm_id) {
        qc.invalidateQueries({ queryKey: queryKeys.tasks.byFirm(data.firm_id) });
      } else {
        qc.invalidateQueries({ queryKey: queryKeys.tasks.all });
      }
    },
  });
}

export function useArchiveTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, archived }: { id: string; archived: boolean }) =>
      tasksApi.archive(id, archived),
    onSuccess: (data) => {
      if (data.firm_id) {
        qc.invalidateQueries({ queryKey: queryKeys.tasks.byFirm(data.firm_id) });
      } else {
        qc.invalidateQueries({ queryKey: queryKeys.tasks.all });
      }
    },
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tasksApi.delete(id),
    // delete returns { message } with no firm_id — full invalidation is the only option
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.tasks.all }),
  });
}

export function useAssignApproveTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Parameters<typeof tasksApi.assignApprove>[1] }) =>
      tasksApi.assignApprove(id, payload),
    onSuccess: (data) => {
      if (data.firm_id) {
        qc.invalidateQueries({ queryKey: queryKeys.tasks.byFirm(data.firm_id) });
      } else {
        qc.invalidateQueries({ queryKey: queryKeys.tasks.all });
      }
    },
  });
}

export function useTransitionTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, change_note }: { id: string; status: string; change_note?: string }) =>
      tasksApi.transition(id, status as Parameters<typeof tasksApi.transition>[1], change_note),
    onSuccess: (data) => {
      if (data.firm_id) {
        qc.invalidateQueries({ queryKey: queryKeys.tasks.byFirm(data.firm_id) });
      } else {
        qc.invalidateQueries({ queryKey: queryKeys.tasks.all });
      }
      qc.invalidateQueries({ queryKey: queryKeys.projects.all });
    },
  });
}
