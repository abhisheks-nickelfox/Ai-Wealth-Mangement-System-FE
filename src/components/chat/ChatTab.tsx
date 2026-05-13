import { useState, useRef, useEffect, useCallback } from 'react';
import { Send01, Trash01 } from '@untitled-ui/icons-react';
import Avatar from '../ui/Avatar';
import {
  useMessages,
  useSendMessage,
  useDeleteMessage,
  useMarkRead,
  useAddReaction,
  useRemoveReaction,
} from '../../hooks/useMessages';
import { useMessageStream } from '../../hooks/useMessageStream';
import { useAuth } from '../../context/AuthContext';
import type { Message, MessageReaction } from '../../lib/api';

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDateLabel(iso: string): string {
  const d         = new Date(iso);
  const today     = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString())     return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
}

function groupByDate(messages: Message[]) {
  const groups: { label: string; messages: Message[] }[] = [];
  let current: { label: string; messages: Message[] } | null = null;
  for (const msg of messages) {
    const label = formatDateLabel(msg.created_at);
    if (!current || current.label !== label) { current = { label, messages: [] }; groups.push(current); }
    current.messages.push(msg);
  }
  return groups;
}

// ── Quick-reaction emojis ─────────────────────────────────────────────────────

const QUICK_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏', '🔥', '✅'];

// ── Double / Blue tick SVG ────────────────────────────────────────────────────

// Three states:
//   sent    — single grey tick   (message saved to server, no one opened chat yet)
//   delivered — double grey tick (message was delivered / default after send)
//   seen    — double blue tick   (at least one other user opened the chat)
function Ticks({ readBy, myId }: { readBy: string[]; myId: string }) {
  const others = readBy.filter((id) => id !== myId);
  const seen   = others.length > 0;

  if (seen) {
    // Double blue tick
    return (
      <svg width="18" height="10" viewBox="0 0 18 10" fill="none" aria-label="Seen">
        <path d="M1 5L4.5 8.5L10 2"  stroke="#3B82F6" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M7 5L10.5 8.5L16 2" stroke="#3B82F6" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    );
  }

  // Double grey tick (sent/delivered)
  return (
    <svg width="18" height="10" viewBox="0 0 18 10" fill="none" aria-label="Sent">
      <path d="M1 5L4.5 8.5L10 2"  stroke="#9CA3AF" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M7 5L10.5 8.5L16 2" stroke="#9CA3AF" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

// ── Reaction pills ────────────────────────────────────────────────────────────

function ReactionPills({
  reactions,
  myId,
  onToggle,
}: {
  reactions:  MessageReaction[];
  myId:       string;
  onToggle:   (emoji: string, hasReacted: boolean) => void;
}) {
  if (reactions.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {reactions.map((r) => {
        const hasReacted = r.users.includes(myId);
        return (
          <button
            key={r.emoji}
            onClick={() => onToggle(r.emoji, hasReacted)}
            className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[11px] font-medium border transition-all
              ${hasReacted
                ? 'bg-[#EDE9FE] border-[#7F56D9] text-[#6941C6]'
                : 'bg-[#F3F4F6] border-[#E5E7EB] text-[#374151] hover:border-[#D1D5DB]'
              }`}
            title={`${r.count} ${r.count === 1 ? 'person' : 'people'}`}
          >
            <span>{r.emoji}</span>
            <span>{r.count}</span>
          </button>
        );
      })}
    </div>
  );
}

// ── Emoji picker popover ──────────────────────────────────────────────────────

function EmojiPicker({ onPick, onClose }: { onPick: (e: string) => void; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute bottom-full mb-1.5 left-0 bg-white border border-[#E5E7EB] rounded-xl shadow-lg p-2 flex gap-1 z-50"
    >
      {QUICK_EMOJIS.map((e) => (
        <button
          key={e}
          onClick={() => { onPick(e); onClose(); }}
          className="w-8 h-8 flex items-center justify-center text-[18px] hover:bg-[#F3F4F6] rounded-lg transition-colors"
        >
          {e}
        </button>
      ))}
    </div>
  );
}

// ── MessageBubble ─────────────────────────────────────────────────────────────

interface BubbleProps {
  message:      Message;
  isSelf:       boolean;
  myId:         string;
  scope:        string;
  scopeId:      string;
  onDelete:     (id: string) => void;
}

function MessageBubble({ message, isSelf, myId, scope, scopeId, onDelete }: BubbleProps) {
  const [hover,       setHover]      = useState(false);
  const [pickerOpen,  setPickerOpen] = useState(false);

  const addReaction    = useAddReaction();
  const removeReaction = useRemoveReaction();

  function handleToggleReaction(emoji: string, hasReacted: boolean) {
    if (hasReacted) {
      removeReaction.mutate({ messageId: message.id, emoji, scope, scopeId });
    } else {
      addReaction.mutate({ messageId: message.id, emoji, scope, scopeId });
    }
  }

  return (
    <div
      className={`flex gap-2.5 ${isSelf ? 'flex-row-reverse' : 'flex-row'} group`}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => { setHover(false); setPickerOpen(false); }}
    >
      {!isSelf && (
        <Avatar name={message.author.name} src={message.author.avatar_url ?? undefined} size="sm" className="shrink-0 mt-0.5" />
      )}

      <div className={`flex flex-col max-w-[65%] ${isSelf ? 'items-end' : 'items-start'}`}>
        {!isSelf && (
          <span className="text-[11px] text-[#6B7280] mb-1 ml-0.5">{message.author.name}</span>
        )}

        <div className="flex items-end gap-1.5 relative">
          {/* Action bar — visible on hover */}
          {hover && (
            <div className={`flex items-center gap-0.5 ${isSelf ? 'order-first' : 'order-last'} relative`}>
              {/* React button */}
              <div className="relative">
                <button
                  onClick={() => setPickerOpen((v) => !v)}
                  className="w-6 h-6 flex items-center justify-center text-[14px] text-[#9CA3AF] hover:text-[#374151] hover:bg-[#F3F4F6] rounded-md transition-colors"
                  title="React"
                >
                  😊
                </button>
                {pickerOpen && <EmojiPicker onPick={(e) => handleToggleReaction(e, false)} onClose={() => setPickerOpen(false)} />}
              </div>

              {/* Delete — own messages only */}
              {isSelf && (
                <button
                  onClick={() => onDelete(message.id)}
                  className="w-6 h-6 flex items-center justify-center text-[#9CA3AF] hover:text-red-500 hover:bg-[#FEF2F2] rounded-md transition-colors"
                  title="Delete"
                >
                  <Trash01 width={12} height={12} />
                </button>
              )}
            </div>
          )}

          {/* Bubble */}
          <div
            className={`px-3.5 py-2.5 rounded-2xl text-[13px] leading-[1.55] whitespace-pre-wrap break-words
              ${isSelf
                ? 'bg-[#7F56D9] text-white rounded-br-sm'
                : 'bg-[#F3F4F6] text-[#111827] rounded-bl-sm'
              }`}
          >
            {message.body}
          </div>
        </div>

        {/* Reactions */}
        <ReactionPills
          reactions={message.reactions}
          myId={myId}
          onToggle={(emoji, hasReacted) => handleToggleReaction(emoji, hasReacted)}
        />

        {/* Timestamp + ticks (own messages only) */}
        <div className={`flex items-center gap-1 mt-1 mx-0.5 ${isSelf ? 'flex-row-reverse' : 'flex-row'}`}>
          <span className="text-[10px] text-[#9CA3AF]">{formatTime(message.created_at)}</span>
          {isSelf && <Ticks readBy={message.read_by ?? []} myId={myId} />}
        </div>
      </div>
    </div>
  );
}

// ── DateDivider ───────────────────────────────────────────────────────────────

function DateDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 my-4">
      <div className="flex-1 h-px bg-[#E5E7EB]" />
      <span className="text-[11px] text-[#9CA3AF] font-medium shrink-0">{label}</span>
      <div className="flex-1 h-px bg-[#E5E7EB]" />
    </div>
  );
}

// ── ChatTab ───────────────────────────────────────────────────────────────────

export function ChatTab({ scope, scopeId }: { scope: string; scopeId: string }) {
  const { user }     = useAuth();
  const [draft, setDraft] = useState('');
  const bottomRef    = useRef<HTMLDivElement>(null);
  const textareaRef  = useRef<HTMLTextAreaElement>(null);

  const { data: messages = [], isLoading } = useMessages(scope, scopeId);
  useMessageStream(scope, scopeId);

  const sendMessage   = useSendMessage();
  const deleteMessage = useDeleteMessage();
  const markRead      = useMarkRead();

  // Mark messages as read when the tab is opened or new messages arrive
  useEffect(() => {
    if (messages.length > 0 && user) {
      markRead.mutate({ scope, scopeId });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope, scopeId, messages.length]);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleSend = useCallback(() => {
    const body = draft.trim();
    if (!body || sendMessage.isPending) return;
    setDraft('');
    sendMessage.mutate({ scope, scope_id: scopeId, body });
    textareaRef.current?.focus();
  }, [draft, scope, scopeId, sendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleDelete = (messageId: string) => {
    deleteMessage.mutate({ messageId, scope, scopeId });
  };

  const groups = groupByDate(messages);
  const myId   = user?.id ?? '';

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-white">

      {/* Message list */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        {isLoading && (
          <div className="flex items-center justify-center h-full">
            <p className="text-[13px] text-[#9CA3AF]">Loading…</p>
          </div>
        )}
        {!isLoading && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-2">
            <p className="text-[13px] font-medium text-[#374151]">No messages yet</p>
            <p className="text-[12px] text-[#9CA3AF]">Start the conversation.</p>
          </div>
        )}
        {!isLoading && groups.map((group) => (
          <div key={group.label}>
            <DateDivider label={group.label} />
            <div className="flex flex-col gap-3">
              {group.messages.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  isSelf={msg.user_id === myId}
                  myId={myId}
                  scope={scope}
                  scopeId={scopeId}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Composer */}
      <div className="shrink-0 border-t border-[#E5E7EB] px-4 py-3">
        <div className="flex items-end gap-2 bg-[#F9FAFB] rounded-xl border border-[#E5E7EB] px-3.5 py-2.5 focus-within:border-[#7F56D9] focus-within:ring-2 focus-within:ring-[#7F56D9]/10 transition-all">
          <textarea
            ref={textareaRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message…"
            rows={1}
            className="flex-1 resize-none bg-transparent text-[13px] text-[#111827] placeholder-[#9CA3AF] outline-none leading-[1.55] max-h-32 overflow-y-auto"
            style={{ minHeight: '22px' }}
          />
          <button
            onClick={handleSend}
            disabled={!draft.trim() || sendMessage.isPending}
            className="shrink-0 w-8 h-8 rounded-lg bg-[#7F56D9] flex items-center justify-center text-white transition-opacity disabled:opacity-40 hover:bg-[#6941C6]"
            aria-label="Send"
          >
            <Send01 width={15} height={15} />
          </button>
        </div>
        <p className="text-[10px] text-[#D1D5DB] mt-1.5 ml-1">Enter to send · Shift+Enter for new line</p>
      </div>
    </div>
  );
}
