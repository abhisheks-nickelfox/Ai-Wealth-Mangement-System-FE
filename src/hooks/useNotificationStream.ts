import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';

/**
 * Opens a persistent SSE connection to /api/notifications/stream for the
 * logged-in user. When the server broadcasts a notification_update event
 * (after any inbox write — @mention, reply, assignment, etc.) this hook
 * invalidates the notifications query so the inbox and unread badge refresh
 * instantly without polling.
 *
 * Mount once in AppLayout so the connection stays alive for the whole session.
 */
export function useNotificationStream() {
  const qc    = useQueryClient();
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    const entry = document.cookie.split('; ').find((r) => r.startsWith('mw_token='));
    const token = entry ? decodeURIComponent(entry.split('=')[1]) : null;
    if (!token) return;

    const url = `${API_URL}/notifications/stream?token=${encodeURIComponent(token)}`;
    const es  = new EventSource(url);
    esRef.current = es;

    es.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data) as { type: string };
        if (parsed.type === 'notification_update') {
          // refetchQueries fires immediately; invalidateQueries only marks stale
          // and waits for the next render cycle — noticeably slower.
          void qc.refetchQueries({ queryKey: ['notifications'] });
        }
      } catch {
        // heartbeat comments or malformed — ignore
      }
    };

    es.onerror = () => {
      // EventSource reconnects automatically — no manual retry needed
    };

    return () => {
      es.close();
      esRef.current = null;
    };
  }, [qc]);
}
