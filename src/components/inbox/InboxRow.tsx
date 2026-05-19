import { Mail01, X } from '@untitled-ui/icons-react';
import { useQueryClient } from '@tanstack/react-query';
import type { AppNotification } from '../../lib/api';
import { messagesApi, timeLogsApi } from '../../lib/api';
import { queryKeys } from '../../lib/queryKeys';
import { formatDateShort, highlightMentions } from '../../lib/inboxUtils';
import StatusCircle from './StatusCircle';
import { FileIcon, ScopeIcon } from './icons';
import Avatar from '../ui/Avatar';

interface InboxRowProps {
  item:       AppNotification;
  isSelected: boolean;
  clearing:   boolean;
  clearDelay: number;            // ms — stagger offset for "Clear all" cascade
  onSelect:   (item: AppNotification) => void;
  onMarkRead: (id: string) => void;
  onClear:    (id: string) => void;
}

function NotificationBreadcrumb({ item }: { item: AppNotification }) {
  const parts: string[] = [];

  if (item.scope === 'task') {
    if (item.is_sub_task)         parts.push('Sub-task');
    if (item.parent_task_title)   parts.push(item.parent_task_title);
    if (item.project_name)        parts.push(item.project_name);
    if (item.firm_name)           parts.push(item.firm_name);
  } else if (item.scope === 'project') {
    if (item.firm_name)           parts.push(item.firm_name);
  }

  if (parts.length === 0) return null;

  return (
    <div className="flex items-center gap-1 mt-0.5">
      <FileIcon className="text-[#C0C4CC] shrink-0" />
      <span className="text-[11px] text-[#A4A7AE] truncate">
        {parts.join(' · ')}
      </span>
    </div>
  );
}

export default function InboxRow({
  item, isSelected, clearing, clearDelay, onSelect, onMarkRead, onClear,
}: InboxRowProps) {
  const qc      = useQueryClient();
  const scope   = item.scope   ?? 'task';
  const scopeId = item.scope_id ?? item.ticket_id ?? '';

  function handleMouseEnter() {
    if (!scopeId) return;
    qc.prefetchQuery({
      queryKey:  queryKeys.messages.byScope(scope, scopeId),
      queryFn:   () => messagesApi.list(scope, scopeId),
      staleTime: 60_000,
    });
    if (scope === 'task') {
      qc.prefetchQuery({
        queryKey:  queryKeys.timeLogs.byTask(scopeId),
        queryFn:   () => timeLogsApi.list(scopeId),
        staleTime: 60_000,
      });
    }
  }

  return (
    /* Outer wrapper collapses height after the slide finishes */
    <div
      style={{
        maxHeight:      clearing ? '0px'  : '80px',
        opacity:        clearing ? 0      : 1,
        overflow:       'hidden',
        transition:     clearing
          ? `max-height 0.28s ease ${clearDelay + 220}ms, opacity 0.15s ease ${clearDelay + 320}ms`
          : 'none',
      }}
    >
      {/* Inner content slides to the right */}
      <div
        style={{
          transform:  clearing ? 'translateX(110%)' : 'translateX(0)',
          transition: clearing
            ? `transform 0.32s cubic-bezier(0.4,0,1,1) ${clearDelay}ms`
            : 'none',
        }}
      >
        <div
          role="button"
          tabIndex={0}
          onClick={() => onSelect(item)}
          onKeyDown={(e) => e.key === 'Enter' && onSelect(item)}
          onMouseEnter={handleMouseEnter}
          className={`flex items-center px-6 py-3.5 gap-4 border-b border-[#F2F4F7] cursor-pointer relative group transition-colors ${
            isSelected ? 'bg-[#F9F5FF]' : 'hover:bg-[#FAFAFA]'
          }`}
        >
          {/* Left — status dot + scope icon + actor avatar */}
          <div className="flex items-center gap-2 shrink-0">
            <StatusCircle read={item.read} />
            <span className="text-[#98A2B3]">
              <ScopeIcon scope={item.scope} className="text-[#98A2B3]" />
            </span>
            {item.actor && (
              <Avatar
                name={item.actor.name}
                src={item.actor.avatar_url ?? undefined}
                size="sm"
              />
            )}
          </div>

          {/* Middle — title + timestamp + preview + breadcrumb */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span
                className={`text-[13px] font-semibold truncate ${
                  !item.read ? 'text-[#181D27]' : 'text-[#667085]'
                }`}
              >
                {item.title}
              </span>
              <span className="text-[12px] text-[#A4A7AE] shrink-0">
                {formatDateShort(item.updated_at ?? item.created_at)}
              </span>
            </div>
            <p className="text-[12px] text-[#667085] truncate leading-snug mt-0.5">
              {highlightMentions(item.message)}
            </p>
            <NotificationBreadcrumb item={item} />
          </div>

          {/* Right — hover actions */}
          <div className="hidden group-hover:flex items-center gap-2 shrink-0">
            <button
              aria-label="Mark as read"
              onClick={(e) => { e.stopPropagation(); onMarkRead(item.id); }}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#F2F4F7] text-[#98A2B3] transition-colors"
            >
              <Mail01 width={16} height={16} />
            </button>
            <button
              aria-label="Clear notification"
              onClick={(e) => { e.stopPropagation(); onClear(item.id); }}
              className="px-3 py-1.5 text-[12px] font-semibold text-[#414651] border border-[#D5D7DA] rounded-lg bg-white hover:bg-[#F9FAFB] transition-colors flex items-center gap-1"
            >
              <X width={12} height={12} />
              Clear
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
