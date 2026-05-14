import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { messagesApi } from '../lib/api';
import { queryKeys } from '../lib/queryKeys';
import type { Message } from '../lib/api';
import { useAuth } from '../context/AuthContext';

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
  const { user } = useAuth();
  return useMutation({
    mutationFn: (payload: { scope: string; scope_id: string; body: string; parent_id?: string }) =>
      messagesApi.create(payload),
    onMutate: async ({ scope, scope_id, body, parent_id }) => {
      await qc.cancelQueries({ queryKey: queryKeys.messages.byScope(scope, scope_id) });
      const previous = qc.getQueryData<Message[]>(queryKeys.messages.byScope(scope, scope_id));
      const tempId = `optimistic-${Date.now()}`;
      const optimistic: Message = {
        id:         tempId,
        scope,
        scope_id,
        user_id:    user?.id ?? '',
        parent_id:  parent_id ?? null,
        body,
        is_system:  false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        author:     { id: user?.id ?? '', name: user?.name ?? '', avatar_url: null },
        reactions:  [],
        read_by:    [],
      };
      qc.setQueryData<Message[]>(
        queryKeys.messages.byScope(scope, scope_id),
        (old = []) => [...old, optimistic],
      );
      return { previous, tempId, scope, scope_id };
    },
    onSuccess: (newMessage, { scope, scope_id }, context) => {
      qc.setQueryData<Message[]>(
        queryKeys.messages.byScope(scope, scope_id),
        (old = []) => old
          .filter((m) => m.id !== context?.tempId && m.id !== newMessage.id)
          .concat(newMessage),
      );
    },
    onError: (_err, { scope, scope_id }, context) => {
      if (context?.previous) {
        qc.setQueryData(queryKeys.messages.byScope(scope, scope_id), context.previous);
      }
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
