import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../lib/queryKeys';
import type { Message, MessageReaction } from '../lib/api';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';

// ── useMessageStream ──────────────────────────────────────────────────────────
//
// Opens a persistent SSE connection to the backend for a given scope+scopeId.
// When the server pushes a "new_message" event, this hook appends the message
// directly into the TanStack Query cache — no refetch needed, no polling.
//
// How SSE works here:
//   1. Browser opens GET /api/messages/stream?scope=X&scope_id=Y&token=Z
//   2. Connection stays open — server holds it
//   3. When someone POSTs a message, the backend broadcasts to all open
//      connections for that channel
//   4. The browser receives "data: {...}\n\n" and we append it to the cache
//   5. React re-renders instantly — no round trip
//
// The EventSource will auto-reconnect if the connection drops (built-in browser
// behaviour). We close it explicitly when the component unmounts.

export function useMessageStream(scope: string, scopeId: string) {
  const qc       = useQueryClient();
  // Keep a ref to the current EventSource so we can close it on cleanup
  const esRef    = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!scope || !scopeId) return;

    const token = localStorage.getItem('mw_token');
    if (!token) return;

    const url = `${API_URL}/messages/stream?scope=${encodeURIComponent(scope)}&scope_id=${encodeURIComponent(scopeId)}&token=${encodeURIComponent(token)}`;

    const es = new EventSource(url);
    esRef.current = es;

    es.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data) as {
          type:         string;
          payload?:     Message;
          reader_id?:   string;
          message_ids?: string[];
          message_id?:  string;
          reactions?:   MessageReaction[];
        };

        const key = queryKeys.messages.byScope(scope, scopeId);

        if (parsed.type === 'message_deleted' && parsed.message_id) {
          qc.setQueryData<Message[]>(key, (old = []) =>
            old.filter((m) => m.id !== parsed.message_id),
          );
        }

        if (parsed.type === 'new_message' && parsed.payload) {
          const incoming = parsed.payload;
          qc.setQueryData<Message[]>(key, (old = []) =>
            old.some((m) => m.id === incoming.id) ? old : [...old, incoming],
          );
        }

        if (parsed.type === 'messages_read' && parsed.reader_id && parsed.message_ids) {
          const { reader_id, message_ids } = parsed;
          const readSet = new Set(message_ids);
          qc.setQueryData<Message[]>(key, (old = []) =>
            old.map((m) =>
              readSet.has(m.id) && !m.read_by.includes(reader_id)
                ? { ...m, read_by: [...m.read_by, reader_id] }
                : m,
            ),
          );
        }

        if (parsed.type === 'reaction_updated' && parsed.message_id && parsed.reactions) {
          const { message_id, reactions } = parsed;
          qc.setQueryData<Message[]>(key, (old = []) =>
            old.map((m) => m.id === message_id ? { ...m, reactions } : m),
          );
        }
      } catch {
        // Ignore malformed events (heartbeat comments arrive as empty data)
      }
    };

    es.onerror = () => {
      // EventSource handles reconnection automatically — no manual retry needed
      // This callback fires on each failed attempt; we just let the browser retry
    };

    return () => {
      es.close();
      esRef.current = null;
    };
  }, [scope, scopeId, qc]);
}
