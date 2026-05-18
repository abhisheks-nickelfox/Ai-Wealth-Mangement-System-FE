import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../lib/queryKeys';
import type { Message, MessageReaction } from '../lib/api';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';

export interface TypingUser {
  id:         string;
  name:       string;
  avatar_url: string | null;
}

// ── useMessageStream ──────────────────────────────────────────────────────────
//
// Opens a persistent SSE connection to the backend for a given scope+scopeId.
// Handles 6 event types pushed from the server:
//   new_message      — appends to TanStack Query cache
//   message_deleted  — removes from cache
//   messages_read    — updates read_by arrays
//   reaction_updated — replaces reactions array on a message
//   typing_start     — adds user to typingUsers state
//   typing_stop      — removes user from typingUsers state
//
// Returns { typingUsers } — the list of users currently typing (excluding self).
// The server auto-broadcasts typing_stop after 4 s of silence, so the list
// clears itself even if the other client never sends an explicit stop.

export function useMessageStream(
  scope: string,
  scopeId: string,
  currentUserId?: string,
): { typingUsers: TypingUser[] } {
  const qc                                  = useQueryClient();
  const esRef                               = useRef<EventSource | null>(null);
  const [typingUsers, setTypingUsers]       = useState<TypingUser[]>([]);

  useEffect(() => {
    if (!scope || !scopeId) return;

    const entry = document.cookie.split('; ').find((r) => r.startsWith('mw_token='));
    const token = entry ? decodeURIComponent(entry.split('=')[1]) : null;
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
          user?:        TypingUser;
          user_id?:     string;
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

        // typing_start — add to list, skip own events
        if (parsed.type === 'typing_start' && parsed.user) {
          const u = parsed.user;
          if (u.id === currentUserId) return;
          setTypingUsers((prev) =>
            prev.some((p) => p.id === u.id) ? prev : [...prev, u],
          );
        }

        // typing_stop — remove from list
        if (parsed.type === 'typing_stop' && parsed.user_id) {
          const uid = parsed.user_id;
          setTypingUsers((prev) => prev.filter((p) => p.id !== uid));
        }
      } catch {
        // Ignore malformed events (heartbeat comments arrive as empty data)
      }
    };

    es.onerror = () => {
      // EventSource handles reconnection automatically — no manual retry needed
    };

    return () => {
      es.close();
      esRef.current = null;
      setTypingUsers([]);
    };
  }, [scope, scopeId, currentUserId, qc]);

  return { typingUsers };
}
