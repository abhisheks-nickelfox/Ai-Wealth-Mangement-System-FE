import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tasksApi } from '../lib/api';
import type { Task, CreateTaskPayload, User } from '../lib/api';
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

export function useTask(id: string | null) {
  return useQuery({
    queryKey:  queryKeys.tasks.detail(id ?? ''),
    queryFn:   () => tasksApi.get(id!),
    enabled:   !!id,
    staleTime: 60_000,
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
        start_date?:   string;
      };
    }) => tasksApi.update(id, payload),
    onMutate: async ({ id, payload }) => {
      await qc.cancelQueries({ queryKey: queryKeys.tasks.detail(id) });
      await qc.cancelQueries({ queryKey: queryKeys.tasks.all });
      const previous = qc.getQueryData<Task>(queryKeys.tasks.detail(id));

      // Build resolved assignees from cache when assignee_ids is changing.
      // Only consider Active users — same filter useActiveUsers applies.
      const resolveAssignees = (ids: string[], existing: Task['assignees']) => {
        const usersCache = (qc.getQueryData<User[]>(queryKeys.users.all) ?? [])
          .filter((u) => u.status === 'Active');
        return ids.map((uid) => {
          const found = existing?.find((a) => a.id === uid);
          if (found) return found;
          const u = usersCache.find((u) => u.id === uid);
          return u
            ? { id: uid, name: u.name, email: u.email, avatar_url: u.avatar_url ?? null }
            : { id: uid, name: uid, email: '', avatar_url: null };
        });
      };

      if (previous) {
        qc.setQueryData<Task>(queryKeys.tasks.detail(id), {
          ...previous,
          ...(payload.status      !== undefined && { status:      payload.status as Task['status'] }),
          ...(payload.priority    !== undefined && { priority:    payload.priority }),
          ...(payload.title       !== undefined && { title:       payload.title }),
          ...(payload.description !== undefined && { description: payload.description }),
          ...(payload.deadline    !== undefined && { deadline:    payload.deadline }),
          ...(payload.project_id  !== undefined && { project_id:  payload.project_id }),
          ...(payload.assignee_ids !== undefined && {
            assignees: resolveAssignees(payload.assignee_ids, previous.assignees),
          }),
        });
      }

      // Optimistically patch every task list (useMyTasks, useTasks, etc.)
      qc.setQueriesData<Task[]>({ queryKey: queryKeys.tasks.all }, (old) => {
        if (!old || !Array.isArray(old)) return old;
        return old.map((t) => {
          if (t.id !== id) return t;
          return {
            ...t,
            ...(payload.status      !== undefined && { status:      payload.status as Task['status'] }),
            ...(payload.priority    !== undefined && { priority:    payload.priority }),
            ...(payload.deadline    !== undefined && { deadline:    payload.deadline }),
            ...(payload.project_id  !== undefined && { project_id:  payload.project_id }),
            ...(payload.assignee_ids !== undefined && {
              assignees: resolveAssignees(payload.assignee_ids, t.assignees),
            }),
          };
        });
      });

      // Optimistically patch the parent task's embedded subtask entry so assignee
      // changes in SubTaskRow feel instant without waiting for the API response.
      if (previous?.parent_task_id && payload.assignee_ids !== undefined) {
        const parentKey  = queryKeys.tasks.detail(previous.parent_task_id);
        const parentData = qc.getQueryData<Task>(parentKey);
        if (parentData?.subtasks) {
          qc.setQueryData<Task>(parentKey, {
            ...parentData,
            subtasks: parentData.subtasks.map((s) => {
              if (s.id !== id) return s;
              // Build a minimal assignees list from existing data for instant feedback
              const existingAssignees = s.assignees ?? [];
              const nextAssignees = payload.assignee_ids!.map((uid) => {
                const found = existingAssignees.find((a) => a.id === uid);
                return found ?? { id: uid, name: uid, email: '', avatar_url: null };
              });
              return { ...s, assignees: nextAssignees };
            }),
          });
        }
      }

      return { previous, id };
    },
    onSuccess: (data, { payload }) => {
      // Preserve subtasks: the update endpoint returns the task without subtasks.
      // Merging prevents the parent task's subtask list from vanishing after any update.
      const existing = qc.getQueryData<Task>(queryKeys.tasks.detail(data.id));
      qc.setQueryData<Task>(queryKeys.tasks.detail(data.id), {
        ...data,
        subtasks: data.subtasks ?? existing?.subtasks ?? [],
      });

      // If this is a subtask, patch the parent task's embedded subtask entry so that
      // changes (e.g. new assignees) are reflected in the parent task detail page
      // without a full refetch.
      if (data.parent_task_id) {
        const parentKey  = queryKeys.tasks.detail(data.parent_task_id);
        const parentData = qc.getQueryData<Task>(parentKey);
        if (parentData?.subtasks) {
          qc.setQueryData<Task>(parentKey, {
            ...parentData,
            subtasks: parentData.subtasks.map((s) =>
              s.id === data.id ? { ...s, ...data } : s
            ),
          });
        }
      }

      const firmId = data.firm_id ?? payload.firm_id;
      if (firmId) {
        qc.invalidateQueries({ queryKey: queryKeys.tasks.byFirm(firmId) });
      } else {
        qc.invalidateQueries({ queryKey: queryKeys.tasks.all });
      }
      // Refresh chat if assignees changed so activity log entries appear immediately
      if (payload.assignee_ids !== undefined) {
        qc.invalidateQueries({ queryKey: queryKeys.messages.byScope('task', data.id) });
      }
    },
    onError: (_err, { id }, context) => {
      if (context?.previous) {
        qc.setQueryData(queryKeys.tasks.detail(id), context.previous);
        // Restore parent task's subtask entry too
        if (context.previous.parent_task_id) {
          const parentKey  = queryKeys.tasks.detail(context.previous.parent_task_id);
          const parentData = qc.getQueryData<Task>(parentKey);
          if (parentData?.subtasks) {
            qc.setQueryData<Task>(parentKey, {
              ...parentData,
              subtasks: parentData.subtasks.map((s) =>
                s.id === id ? context.previous! : s
              ),
            });
          }
        }
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
