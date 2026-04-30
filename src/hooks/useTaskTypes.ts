import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { taskTypesApi } from '../lib/api';
import type { CreateTaskTypePayload, UpdateTaskTypePayload } from '../lib/api';

const KEY = ['task-types'];

export function useTaskTypes() {
  return useQuery({
    queryKey: KEY,
    queryFn: taskTypesApi.list,
  });
}

export function useCreateTaskType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateTaskTypePayload) => taskTypesApi.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateTaskType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateTaskTypePayload }) =>
      taskTypesApi.update(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteTaskType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => taskTypesApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
