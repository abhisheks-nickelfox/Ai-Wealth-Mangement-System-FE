import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi, type AppNotification } from '../lib/api';
import { queryKeys } from '../lib/queryKeys';

export function useNotifications() {
  return useQuery({
    queryKey: queryKeys.notifications.all,
    queryFn: notificationsApi.list,
    // SSE in AppLayout (useNotificationStream) pushes instant cache invalidations.
    // Keep a 30s fallback poll as a safety net for missed events.
    refetchInterval: 30_000,
    staleTime: 0,
  });
}

export function useUnreadNotificationCount(): number {
  const { data } = useNotifications();
  if (!data) return 0;
  return data.filter((n) => !n.read).length;
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.notifications.all }),
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: notificationsApi.markAllRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.notifications.all }),
  });
}

export function useClearNotification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationsApi.clearOne(id),
    // Optimistic: remove from cache immediately so the row doesn't reappear
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: queryKeys.notifications.all });
      const prev = qc.getQueryData<AppNotification[]>(queryKeys.notifications.all);
      qc.setQueryData<AppNotification[]>(queryKeys.notifications.all, (old) =>
        old?.filter((n) => n.id !== id) ?? [],
      );
      return { prev };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(queryKeys.notifications.all, ctx.prev);
    },
  });
}

export function useClearAllNotifications() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: notificationsApi.clearAll,
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: queryKeys.notifications.all });
      const prev = qc.getQueryData<AppNotification[]>(queryKeys.notifications.all);
      qc.setQueryData<AppNotification[]>(queryKeys.notifications.all, []);
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(queryKeys.notifications.all, ctx.prev);
    },
  });
}
