import { useState } from 'react';
import { CornerDownLeft } from '@untitled-ui/icons-react';
import type { Message } from '../../lib/api';
import { useAddReaction, useRemoveReaction } from '../../hooks/useMessages';
import Avatar from '../ui/Avatar';
import { formatMessageTime, highlightMentions } from '../../lib/inboxUtils';

interface MessageItemProps {
  msg: Message;
  notificationId: string;
  scope: string;
  scopeId: string;
  userId: string;
  onMarkRead: (id: string) => void;
  onClearMessage: (msgId: string) => void;
  onReply: (msg: Message) => void;
}

export default function MessageItem({
  msg,
  notificationId: _notificationId,
  scope,
  scopeId,
  userId,
  onMarkRead: _onMarkRead,
  onClearMessage,
  onReply,
}: MessageItemProps) {
  const [clearing, setClearing] = useState(false);
  const addReaction    = useAddReaction();
  const removeReaction = useRemoveReaction();

  function handleClear() {
    setClearing(true);
    setTimeout(() => onClearMessage(msg.id), 620);
  }

  function toggleReaction(emoji: string) {
    const existing = msg.reactions.find((r) => r.emoji === emoji);
    const hasReacted = existing?.users.includes(userId) ?? false;
    if (hasReacted) {
      removeReaction.mutate({ messageId: msg.id, emoji, scope, scopeId });
    } else {
      addReaction.mutate({ messageId: msg.id, emoji, scope, scopeId });
    }
  }

  const thumbsUp = msg.reactions.find((r) => r.emoji === '👍');
  const smile    = msg.reactions.find((r) => r.emoji === '😊');

  return (
    // Outer: collapses height after the slide finishes
    <div
      style={{
        maxHeight:  clearing ? '0px' : '500px',
        opacity:    clearing ? 0 : 1,
        overflow:   'hidden',
        transition: clearing
          ? 'max-height 0.28s ease 220ms, opacity 0.15s ease 320ms, margin-bottom 0.28s ease 220ms'
          : 'none',
        marginBottom: clearing ? '0' : undefined,
      }}
    >
      {/* Inner: slides to the right */}
      <div
        style={{
          transform:  clearing ? 'translateX(110%)' : 'translateX(0)',
          transition: clearing ? 'transform 0.32s cubic-bezier(0.4,0,1,1)' : 'none',
        }}
      >
        <div className="rounded-xl border border-[#E4E7EC] bg-white mb-3 shadow-sm">
          <div className="px-4 pt-4 pb-4">
            <div className="flex items-center gap-2.5 mb-3">
              <Avatar
                name={msg.author.name}
                src={msg.author.avatar_url ?? undefined}
                size="sm"
              />
              <span className="text-[13px] font-semibold text-[#101828]">{msg.author.name}</span>
              <span className="text-[12px] text-[#98A2B3] ml-1">{formatMessageTime(msg.created_at)}</span>
            </div>
            <p className="text-[13px] text-[#344054] leading-[1.6] pl-[38px]">
              {highlightMentions(msg.body)}
            </p>
          </div>
          <div className="h-px bg-[#F2F4F7]" />
          <div className="flex items-center px-4 py-2.5 gap-1">
            <button
              onClick={() => toggleReaction('👍')}
              className={`flex items-center gap-1 text-[14px] px-2 py-0.5 rounded-full border transition-all ${
                thumbsUp?.users.includes(userId)
                  ? 'bg-[#EDE9FE] border-[#7F56D9] text-[#6941C6]'
                  : 'border-transparent hover:bg-[#F2F4F7] text-[#667085]'
              }`}
            >
              👍{thumbsUp && thumbsUp.count > 0 && <span className="text-[11px] font-medium">{thumbsUp.count}</span>}
            </button>
            <button
              onClick={() => toggleReaction('😊')}
              className={`flex items-center gap-1 text-[14px] px-2 py-0.5 rounded-full border transition-all ${
                smile?.users.includes(userId)
                  ? 'bg-[#EDE9FE] border-[#7F56D9] text-[#6941C6]'
                  : 'border-transparent hover:bg-[#F2F4F7] text-[#667085]'
              }`}
            >
              😊{smile && smile.count > 0 && <span className="text-[11px] font-medium">{smile.count}</span>}
            </button>
            <div className="flex-1" />
            <button
              onClick={handleClear}
              className="text-[13px] font-medium text-[#6941C6] hover:text-[#53389E] transition-colors mr-4"
            >
              Clear
            </button>
            <button
              onClick={() => onReply(msg)}
              className="flex items-center gap-1.5 text-[13px] font-medium text-[#344054] hover:text-[#101828] transition-colors"
            >
              <CornerDownLeft width={14} height={14} />
              Reply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
