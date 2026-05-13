import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { messagesApi } from '../lib/api';
import { queryKeys } from '../lib/queryKeys';
import type { Message } from '../lib/api';

export function useMessages(scope: string, scopeId: string) {
  return useQuery({
    queryKey: queryKeys.messages.byScope(scope, scopeId),
    queryFn:  () => messagesApi.list(scope, scopeId),
    enabled:  !!scope && !!scopeId,
    // No refetchInterval — real-time updates come via SSE (useMessageStream)
  });
}

export function useSendMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { scope: string; scope_id: string; body: string; parent_id?: string }) =>
      messagesApi.create(payload),
    onSuccess: (newMessage, { scope, scope_id }) => {
      qc.setQueryData<Message[]>(
        queryKeys.messages.byScope(scope, scope_id),
        (old = []) => old.some((m) => m.id === newMessage.id) ? old : [...old, newMessage],
      );
    },
  });
}

export function useMarkRead() {
  return useMutation({
    mutationFn: ({ scope, scopeId }: { scope: string; scopeId: string }) =>
      messagesApi.markRead(scope, scopeId),
  });
}

export function useAddReaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ messageId, emoji }: { messageId: string; emoji: string; scope: string; scopeId: string }) =>
      messagesApi.addReaction(messageId, emoji),
    onSuccess: (reactions, { messageId, scope, scopeId }) => {
      // Patch the single message's reactions in cache immediately
      qc.setQueryData<Message[]>(
        queryKeys.messages.byScope(scope, scopeId),
        (old = []) => old.map((m) => m.id === messageId ? { ...m, reactions } : m),
      );
    },
  });
}

export function useRemoveReaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ messageId, emoji }: { messageId: string; emoji: string; scope: string; scopeId: string }) =>
      messagesApi.removeReaction(messageId, emoji),
    onSuccess: (reactions, { messageId, scope, scopeId }) => {
      qc.setQueryData<Message[]>(
        queryKeys.messages.byScope(scope, scopeId),
        (old = []) => old.map((m) => m.id === messageId ? { ...m, reactions } : m),
      );
    },
  });
}

export function useDeleteMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ messageId }: { messageId: string; scope: string; scopeId: string }) =>
      messagesApi.delete(messageId),
    onSuccess: (_data, { messageId, scope, scopeId }) => {
      qc.setQueryData<Message[]>(
        queryKeys.messages.byScope(scope, scopeId),
        (old = []) => old.filter((m) => m.id !== messageId),
      );
    },
  });
}
