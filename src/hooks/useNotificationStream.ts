import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getCookie } from '../lib/cookies';
import { queryKeys } from '../lib/queryKeys';
import type { AppNotification } from '../lib/api';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';

export function useNotificationStream() {
  const qc    = useQueryClient();
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    const token = getCookie('mw_token');
    if (!token) return;

    const url = `${API_URL}/notifications/stream?token=${encodeURIComponent(token)}`;
    const es  = new EventSource(url);
    esRef.current = es;

    es.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data) as {
          type: string;
          notification?: AppNotification;
        };

        if (parsed.type === 'notification_update') {
          if (parsed.notification) {
            // Instant cache update — notification appears immediately.
            // A background invalidate follows to fill in joined fields
            // (firm_name, project_name, actor avatar, etc.).
            qc.setQueryData<AppNotification[]>(
              queryKeys.notifications.all,
              (old = []) =>
                old.some((n) => n.id === parsed.notification!.id)
                  ? old
                  : [parsed.notification!, ...old],
            );
          }
          // Always background-refetch so joined fields (actor, firm_name …)
          // arrive shortly after the instant optimistic update.
          void qc.invalidateQueries({ queryKey: queryKeys.notifications.all });
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
