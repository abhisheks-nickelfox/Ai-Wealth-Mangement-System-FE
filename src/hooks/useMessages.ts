import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { messagesApi } from '../lib/api';
import { queryKeys } from '../lib/queryKeys';

export function useMessages(scope: string, scopeId: string) {
  return useQuery({
    queryKey: queryKeys.messages.byScope(scope, scopeId),
    queryFn:  () => messagesApi.list(scope, scopeId),
    enabled:  !!scope && !!scopeId,
  });
}

export function useSendMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { scope: string; scope_id: string; body: string; parent_id?: string }) =>
      messagesApi.create(payload),
    onSuccess: (_data, { scope, scope_id }) => {
      qc.invalidateQueries({ queryKey: queryKeys.messages.byScope(scope, scope_id) });
    },
  });
}

export function useDeleteMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ messageId }: { messageId: string; scope: string; scopeId: string }) =>
      messagesApi.delete(messageId),
    onSuccess: (_data, { scope, scopeId }) => {
      qc.invalidateQueries({ queryKey: queryKeys.messages.byScope(scope, scopeId) });
    },
  });
}
