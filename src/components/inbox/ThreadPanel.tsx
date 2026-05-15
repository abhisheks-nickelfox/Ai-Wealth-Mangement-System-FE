import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { XClose, Building02 } from '@untitled-ui/icons-react';
import type { AppNotification, Message, TimeLog } from '../../lib/api';
import { timeLogsApi } from '../../lib/api';
import { useMessages, useSendMessage } from '../../hooks/useMessages';
import { useMessageStream } from '../../hooks/useMessageStream';
import { useMentionableUsers } from '../../hooks/useMentionableUsers';
import { useAuth } from '../../context/AuthContext';
import { highlightMentions } from '../../lib/inboxUtils';
import { FileIcon } from './icons';
import TaskIcon from '../icons/TaskIcon';
import ProjectIcon from '../icons/ProjectIcon';
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

function ScopeIcon({ scope, className }: { scope: string; className?: string }) {
  if (scope === 'firm')    return <Building02 width={16} height={16} className={className} />;
  if (scope === 'project') return <ProjectIcon width={16} height={16} className={className} />;
  return <TaskIcon width={14} height={16} className={className} />;
}

export default function ThreadPanel({ notification, onClose, onMarkRead, onClear }: ThreadPanelProps) {
  const { user } = useAuth();
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scope   = notification.scope   ?? 'task';
  const scopeId = notification.scope_id ?? notification.ticket_id ?? '';
  const { data: messages, isLoading: messagesLoading } = useMessages(scope, scopeId);
  useMessageStream(scope, scopeId);
  const sendMessage = useSendMessage();
  const { data: mentionUsers } = useMentionableUsers();

  // Fetch time logs for activity feed — only for task scope
  const { data: timeLogs } = useQuery<TimeLog[]>({
    queryKey: ['timeLogs', scopeId],
    queryFn: () => timeLogsApi.list(scopeId),
    enabled: !!scopeId && scope === 'task',
  });

  // Build breadcrumb parts from enriched notification data (no extra API calls needed)
  const breadcrumbParts: string[] = [];
  if (scope === 'task') {
    if (notification.is_sub_task)        breadcrumbParts.push('Sub-task');
    if (notification.parent_task_title)  breadcrumbParts.push(notification.parent_task_title);
    if (notification.project_name)       breadcrumbParts.push(notification.project_name);
    if (notification.firm_name)          breadcrumbParts.push(notification.firm_name);
  } else if (scope === 'project') {
    if (notification.firm_name)          breadcrumbParts.push(notification.firm_name);
  }

  // Build combined chronological feed
  const activityLogs: ActivityLog[] = (timeLogs ?? [])
    .filter((l) => l.log_type === 'transition' || l.log_type === 'revision')
    .map((l) => ({
      id:         l.id,
      user_id:    l.user_id,
      log_type:   l.log_type,
      comment:    l.comment,
      created_at: l.created_at,
      users:      l.users,
    }));

  // Only show messages that contain an @mention — inbox is mention-driven.
  const mentionedMessages = (messages ?? []).filter((m) => /@\w+/.test(m.body));

  const feed: FeedItem[] = [
    ...mentionedMessages.map((m): FeedItem => ({ kind: 'message', data: m, ts: m.created_at })),
    ...activityLogs.map((a): FeedItem => ({ kind: 'activity', data: a, ts: a.created_at })),
  ].sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime());

  // Auto-scroll to bottom when feed changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [feed.length]);

  return (
    <div className="flex flex-col flex-1 border-l border-[#E9EAEB] bg-white h-full overflow-hidden">
      {/* Thread header */}
      <div className="flex items-start justify-between px-5 py-4 border-b border-[#E9EAEB] shrink-0">
        <div className="min-w-0 flex-1 mr-3">
          <div className="flex items-center gap-2">
            <ScopeIcon scope={notification.scope} className="text-[#98A2B3] shrink-0" />
            {notification.actor && (
              <Avatar
                name={notification.actor.name}
                src={notification.actor.avatar_url ?? undefined}
                size="xs"
              />
            )}
            <span className="text-[15px] font-semibold text-[#181D27] truncate">
              {notification.title}
            </span>
          </div>
          {breadcrumbParts.length > 0 && (
            <div className="flex items-center gap-1.5 mt-1 text-[12px] text-[#667085]">
              <FileIcon className="text-[#98A2B3] shrink-0" />
              <span>{breadcrumbParts.join(' · ')}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => onClear(notification.id)}
            className="flex items-center gap-1 px-2 py-1 text-[12px] font-semibold text-[#6941C6] hover:text-[#53389E] transition-colors rounded-lg hover:bg-[#F9F5FF]"
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
                onReply={(m) => setActiveReplyId(activeReplyId === m.id ? null : m.id)}
              />
              {activeReplyId === msg.id && (
                <InlineReplyComposer
                  parentMsg={msg}
                  mentionUsers={mentionUsers ?? []}
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
