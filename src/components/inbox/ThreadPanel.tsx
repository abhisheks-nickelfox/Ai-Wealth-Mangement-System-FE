import { useState, useRef, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { XClose } from '@untitled-ui/icons-react';
import type { AppNotification, Message, TimeLog } from '../../lib/api';
import { timeLogsApi } from '../../lib/api';
import { useMessages, useSendMessage } from '../../hooks/useMessages';
import { useMessageStream } from '../../hooks/useMessageStream';
import { useTask } from '../../hooks/useTasks';
import { useProjectDetail } from '../../hooks/useFirms';
import { useAuth } from '../../context/AuthContext';
import { queryKeys } from '../../lib/queryKeys';
import { highlightMentions } from '../../lib/inboxUtils';
import { FileIcon, ScopeIcon } from './icons';
import Avatar from '../ui/Avatar';
import LoadingSpinner from '../ui/LoadingSpinner';
import { ActivityItem, type ActivityLog, type FeedItem } from './ActivityItem';
import MessageItem from './MessageItem';
import InlineReplyComposer from './InlineReplyComposer';

interface ThreadPanelProps {
  notification: AppNotification;
  onClose:    () => void;
  onMarkRead: (id: string) => void;
  onClear:    (id: string) => void;
}

export default function ThreadPanel({ notification, onClose, onMarkRead, onClear }: ThreadPanelProps) {
  const { user } = useAuth();
  const [activeReplyId,    setActiveReplyId]    = useState<string | null>(null);
  const [clearedMsgIds,    setClearedMsgIds]    = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  function handleClearMessage(msgId: string) {
    setClearedMsgIds((prev) => new Set([...prev, msgId]));
    setActiveReplyId((prev) => (prev === msgId ? null : prev));
  }

  const scope   = notification.scope   ?? 'task';
  const scopeId = notification.scope_id ?? notification.ticket_id ?? '';
  const { data: messages, isLoading: messagesLoading } = useMessages(scope, scopeId);
  useMessageStream(scope, scopeId);
  const sendMessage = useSendMessage();

  // Fetch time logs for activity feed — only for task scope
  const { data: timeLogs } = useQuery<TimeLog[]>({
    queryKey:  queryKeys.timeLogs.byTask(scopeId),
    queryFn:   () => timeLogsApi.list(scopeId),
    enabled:   !!scopeId && scope === 'task',
    staleTime: 0,
  });

  // Fetch task OR project to get firm_id / project_id / parent_task_id for navigation
  const { data: task    } = useTask(scope === 'task' ? scopeId : null);
  const { data: project } = useProjectDetail(scope === 'project' ? scopeId : null);

  const firmId    = (task?.firm_id ?? project?.firm_id) ?? null;
  const projectId = task?.project_id    ?? null;
  const parentId  = task?.parent_task_id ?? null;

  // Build structured breadcrumb — each part carries a label + optional href
  const breadcrumb: { label: string; href?: string }[] = [];
  if (scope === 'task' && firmId) {
    if (notification.is_sub_task) {
      breadcrumb.push({ label: 'Sub-task', href: `/firms/${firmId}/tasks/${scopeId}` });
    }
    if (notification.parent_task_title && parentId) {
      breadcrumb.push({ label: notification.parent_task_title, href: `/firms/${firmId}/tasks/${parentId}` });
    }
    if (notification.project_name && projectId) {
      breadcrumb.push({ label: notification.project_name, href: `/firms/${firmId}/projects/${projectId}` });
    }
    if (notification.firm_name) {
      breadcrumb.push({ label: notification.firm_name, href: `/firms/${firmId}` });
    }
  } else if (scope === 'project' && firmId) {
    if (notification.firm_name) {
      breadcrumb.push({ label: notification.firm_name, href: `/firms/${firmId}` });
    }
  }

  // Title navigation URL
  const titleHref =
    scope === 'task'    && firmId ? `/firms/${firmId}/tasks/${scopeId}` :
    scope === 'project' && firmId ? `/firms/${firmId}/projects/${scopeId}` :
    null;

  // Build combined chronological feed
  const activityLogs = useMemo<ActivityLog[]>(() => [
    // Time log activity: status transitions, revisions, timer sessions, estimates
    ...(timeLogs ?? [])
      .filter((l) => ['transition', 'revision', 'partial', 'estimate'].includes(l.log_type))
      .map((l): ActivityLog => ({
        id:         l.id,
        user_id:    l.user_id,
        log_type:   l.log_type,
        comment:    l.comment,
        hours:      l.hours,
        created_at: l.created_at,
        users:      l.users,
      })),
    // System messages: assignee added/removed (from messages API)
    ...(messages ?? [])
      .filter((m) => m.is_system)
      .map((m): ActivityLog => ({
        id:         m.id,
        user_id:    m.user_id,
        log_type:   'system',
        comment:    m.body,
        created_at: m.created_at,
        users:      m.author
          ? { name: m.author.name, email: '', avatar_url: m.author.avatar_url ?? null }
          : null,
      })),
  ], [timeLogs, messages]);

  const mentionedMessages = useMemo(
    () => (messages ?? []).filter(
      (m) => !m.is_system && /@\w+/.test(m.body) && !clearedMsgIds.has(m.id),
    ),
    [messages, clearedMsgIds],
  );

  const feed = useMemo<FeedItem[]>(() => [
    ...mentionedMessages.map((m): FeedItem => ({ kind: 'message', data: m, ts: m.created_at })),
    ...activityLogs.map((a): FeedItem => ({ kind: 'activity', data: a, ts: a.created_at })),
  ].sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime()),
  [mentionedMessages, activityLogs]);

  // Auto-scroll to bottom when feed changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [feed.length]);

  return (
    <div className="flex flex-col flex-1 border-l border-[#E9EAEB] bg-white h-full overflow-hidden">
      {/* Thread header */}
      <div className="flex flex-col border-b border-[#E9EAEB] shrink-0">

        {/* Row 1: icon + title (clickable, truncates) | clear + close (fixed right) */}
        <div className="flex items-center gap-2 px-5 pt-4 pb-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <ScopeIcon scope={notification.scope} className="text-[#98A2B3] shrink-0" />
            {notification.actor && (
              <Avatar
                name={notification.actor.name}
                src={notification.actor.avatar_url ?? undefined}
                size="xs"
              />
            )}
            {titleHref ? (
              <Link
                to={titleHref}
                className="text-[15px] font-semibold text-[#181D27] truncate hover:text-[#6941C6] hover:underline transition-colors"
              >
                {notification.title}
              </Link>
            ) : (
              <span className="text-[15px] font-semibold text-[#181D27] truncate">
                {notification.title}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => onClear(notification.id)}
              className="flex items-center gap-1 px-2 py-1 text-[12px] font-semibold text-[#6941C6] hover:text-[#53389E] transition-colors rounded-lg hover:bg-[#F9F5FF] whitespace-nowrap"
              aria-label="Clear this notification"
            >
              <span className="text-[#98A2B3] font-normal">/</span>
              <span>Clear</span>
            </button>
            <button
              onClick={onClose}
              aria-label="Close thread"
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#F2F4F7] text-[#667085] transition-colors"
            >
              <XClose width={16} height={16} />
            </button>
          </div>
        </div>

        {/* Row 2: breadcrumb — each part is a clickable link */}
        {breadcrumb.length > 0 && (
          <div className="flex items-center gap-1 px-5 pb-3 text-[12px] text-[#667085] flex-wrap">
            <FileIcon className="text-[#98A2B3] shrink-0 mr-0.5" />
            {breadcrumb.map((part, i) => (
              <span key={i} className="flex items-center gap-1">
                {i > 0 && <span className="text-[#D0D5DD]">·</span>}
                {part.href ? (
                  <Link
                    to={part.href}
                    className="hover:text-[#6941C6] hover:underline transition-colors"
                  >
                    {part.label}
                  </Link>
                ) : (
                  <span>{part.label}</span>
                )}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Feed area — messages + activity mixed chronologically */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col bg-[#F9FAFB]">
        {messagesLoading && (
          <div className="flex justify-center py-4">
            <LoadingSpinner />
          </div>
        )}

        {!messagesLoading && feed.length === 0 && scopeId && (
          <p className="text-[12px] text-[#A4A7AE] text-center py-4">
            No messages where you were mentioned.
          </p>
        )}

        {!scopeId && (
          <div className="text-[13px] text-[#414651] leading-relaxed py-2">
            {highlightMentions(notification.message)}
          </div>
        )}

        {feed.map((item) => {
          if (item.kind === 'activity') {
            return <ActivityItem key={`activity-${item.data.id}`} log={item.data} />;
          }
          const msg = item.data as Message;
          return (
            <div key={`message-${msg.id}`}>
              <MessageItem
                msg={msg}
                notificationId={notification.id}
                scope={scope}
                scopeId={scopeId}
                userId={user?.id ?? ''}
                onMarkRead={onMarkRead}
                onClearMessage={handleClearMessage}
                onReply={(m) => setActiveReplyId(activeReplyId === m.id ? null : m.id)}
              />
              {activeReplyId === msg.id && (
                <InlineReplyComposer
                  parentMsg={msg}
                  onSend={(body) => {
                    sendMessage.mutate({ scope, scope_id: scopeId, body, parent_id: msg.id });
                    setActiveReplyId(null);
                  }}
                  onClose={() => setActiveReplyId(null)}
                />
              )}
            </div>
          );
        })}

        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
