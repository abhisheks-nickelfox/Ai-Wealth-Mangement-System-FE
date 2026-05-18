import { useState, useRef, useEffect, useCallback } from 'react';
import { Send01, Trash01, Attachment01, Download01, X } from '@untitled-ui/icons-react';
import { useQueryClient } from '@tanstack/react-query';
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
import { useMentionableUsers } from '../../hooks/useMentionableUsers';
import { messagesApi, projectAttachmentsApi, attachmentsApi } from '../../lib/api';
import type { Message, MessageReaction, MentionUser } from '../../lib/api';
import { queryKeys } from '../../lib/queryKeys';
import { formatFileSize } from '../../lib/formatUtils';

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

// ── @mention helpers ──────────────────────────────────────────────────────────

interface FilePayload { __file: true; name: string; url: string; size: number; type: string }

function getFileEmoji(type: string, name: string): string {
  if (type.startsWith('image/'))                                  return '🖼️';
  if (type === 'application/pdf')                                 return '📄';
  if (type.includes('spreadsheet') || type.includes('excel') || /\.(xlsx?|csv)$/i.test(name)) return '📊';
  if (type.includes('word') || type.includes('document') || /\.docx?$/i.test(name))           return '📝';
  if (type.includes('zip') || type.includes('rar') || type.includes('tar'))                   return '🗜️';
  if (type.startsWith('video/'))                                  return '🎬';
  if (type.startsWith('audio/'))                                  return '🎵';
  return '📎';
}

function FileCard({ file, isSelf }: { file: FilePayload; isSelf: boolean }) {
  const bg      = isSelf ? 'bg-white/15' : 'bg-[#E9EAEB]';
  const nameCol = isSelf ? 'text-white'  : 'text-[#181D27]';
  const metaCol = isSelf ? 'text-white/70' : 'text-[#717680]';
  const dlCol   = isSelf ? 'text-white/80 hover:text-white' : 'text-[#7F56D9] hover:text-[#6941C6]';
  return (
    <a
      href={file.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition-opacity hover:opacity-90 w-full ${bg}`}
      title="Download file"
    >
      <span className="text-2xl leading-none shrink-0">{getFileEmoji(file.type, file.name)}</span>
      <div className="flex-1 min-w-0">
        <p className={`text-[13px] font-medium truncate ${nameCol}`}>{file.name}</p>
        <p className={`text-[11px] ${metaCol}`}>{formatFileSize(file.size)}</p>
      </div>
      <Download01 width={16} height={16} className={`shrink-0 ${dlCol}`} />
    </a>
  );
}

/** Tokenises a body string into URLs, @mentions, and plain text — then renders each correctly.
 *  File messages (JSON prefix) are rendered as attachment cards. */
function renderBody(body: string, isSelf: boolean): React.ReactNode {
  // File attachment card
  if (body.startsWith('{"__file":true')) {
    try {
      const f = JSON.parse(body) as FilePayload;
      return <FileCard file={f} isSelf={isSelf} />;
    } catch {}
  }

  const mentionClass = isSelf
    ? 'text-white font-semibold underline underline-offset-2 decoration-white/60'
    : 'text-[#7F56D9] font-semibold';
  const urlClass = isSelf
    ? 'underline break-all text-white/90 hover:text-white transition-colors'
    : 'underline break-all text-[#7F56D9] hover:text-[#6941C6] transition-colors';

  // Split on URLs first, then split non-URL segments on @mentions
  const nodes: React.ReactNode[] = [];
  const urlSegments = body.split(/(https?:\/\/[^\s<>"{}|\\^`[\]]+)/g);
  urlSegments.forEach((seg, i) => {
    if (/^https?:\/\//.test(seg)) {
      nodes.push(
        <a key={`url-${i}`} href={seg} target="_blank" rel="noopener noreferrer" className={urlClass}>
          {seg}
        </a>,
      );
      return;
    }
    seg.split(/(@\w+)/g).forEach((part, j) => {
      if (/^@\w+$/.test(part)) {
        nodes.push(<span key={`m-${i}-${j}`} className={mentionClass}>{part}</span>);
      } else {
        nodes.push(<span key={`t-${i}-${j}`}>{part}</span>);
      }
    });
  });
  return nodes;
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

// ── MentionPicker ─────────────────────────────────────────────────────────────

function MentionPicker({
  users,
  activeIndex,
  onSelect,
}: {
  users:       MentionUser[];
  activeIndex: number;
  onSelect:    (user: MentionUser) => void;
}) {
  const activeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  if (users.length === 0) return null;
  return (
    <div className="absolute bottom-full mb-2 left-0 right-0 bg-white border border-[#E5E7EB] rounded-xl shadow-lg overflow-hidden z-50 max-h-52 overflow-y-auto">
      {users.map((u, i) => {
        const displayName = u.first_name ? `${u.first_name}${u.last_name ? ' ' + u.last_name : ''}` : u.name;
        const isActive    = i === activeIndex;
        return (
          <button
            key={u.id}
            ref={isActive ? activeRef : undefined}
            onMouseDown={(e) => { e.preventDefault(); onSelect(u); }}
            className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors ${
              isActive ? 'bg-[#F3F4F6]' : 'hover:bg-[#F9FAFB]'
            }`}
          >
            <Avatar name={displayName} src={u.avatar_url ?? undefined} size="xs" />
            <div className="flex flex-col min-w-0">
              <span className="text-[13px] font-medium text-[#111827] truncate">{displayName}</span>
              {u.first_name && <span className="text-[11px] text-[#9CA3AF] truncate">@{u.first_name}</span>}
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ── SystemMessage ─────────────────────────────────────────────────────────────

function SystemMessage({ message }: { message: Message }) {
  return (
    <div className="flex items-center gap-3 my-2">
      <div className="flex-1 h-px bg-[#E5E7EB]" />
      <span className="text-[11px] text-[#9CA3AF] font-medium text-center shrink-0 max-w-[70%]">
        {message.body}
      </span>
      <div className="flex-1 h-px bg-[#E5E7EB]" />
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

      <div className={`flex flex-col max-w-[65%] min-w-0 ${isSelf ? 'items-end' : 'items-start'}`}>
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
            className={`px-3.5 py-2.5 rounded-2xl text-[13px] leading-[1.55] whitespace-pre-wrap break-words overflow-hidden w-full
              ${isSelf
                ? 'bg-[#7F56D9] text-white rounded-br-sm'
                : 'bg-[#F3F4F6] text-[#111827] rounded-bl-sm'
              }`}
          >
            {renderBody(message.body, isSelf)}
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

export function ChatTab({ scope, scopeId, projectId }: { scope: string; scopeId: string; projectId?: string | null }) {
  const { user }     = useAuth();
  const queryClient  = useQueryClient();
  const [draft, setDraft]               = useState('');
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [activeIndex, setActiveIndex]   = useState(0);
  const [pendingFile,  setPendingFile]  = useState<File | null>(null);
  const [isUploading,  setIsUploading]  = useState(false);
  const [uploadError,  setUploadError]  = useState<string | null>(null);
  const bottomRef    = useRef<HTMLDivElement>(null);
  const textareaRef  = useRef<HTMLTextAreaElement>(null);
  const composerRef  = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: messages = [], isLoading } = useMessages(scope, scopeId);
  const { typingUsers } = useMessageStream(scope, scopeId, user?.id);

  const { data: mentionableUsers = [] } = useMentionableUsers();

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

  // Reset active index whenever the suggestion list changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { setActiveIndex(0); }, [mentionQuery]);

  // Filtered mention suggestions based on current @query
  const mentionSuggestions = mentionQuery !== null
    ? mentionableUsers.filter((u) => {
        const q = mentionQuery.toLowerCase();
        if (!q) return true; // show all on bare @
        return (
          (u.first_name?.toLowerCase().includes(q) ?? false) ||
          (u.last_name?.toLowerCase().includes(q)  ?? false) ||
          u.name.toLowerCase().includes(q)
        );
      }).slice(0, 10)
    : [];

  function handleDraftChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const value = e.target.value;
    setDraft(value);
    // Detect @mention at cursor
    const cursor = e.target.selectionStart ?? value.length;
    const before = value.slice(0, cursor);
    const match  = before.match(/@(\w*)$/);
    setMentionQuery(match ? match[1] : null);
    // Send typing signal — debounced so we don't spam on every keystroke
    if (value.trim()) {
      if (typingTimer.current) clearTimeout(typingTimer.current);
      messagesApi.sendTyping(scope, scopeId).catch(() => { /* silent */ });
      typingTimer.current = setTimeout(() => { typingTimer.current = null; }, 3000);
    }
  }

  function handleSelectMention(u: MentionUser) {
    const insert   = u.first_name ?? u.name.split(' ')[0];
    const cursor   = textareaRef.current?.selectionStart ?? draft.length;
    const before   = draft.slice(0, cursor);
    const after    = draft.slice(cursor);
    const atIdx    = before.lastIndexOf('@');
    const newBefore = before.slice(0, atIdx) + `@${insert} `;
    setDraft(newBefore + after);
    setMentionQuery(null);
    setTimeout(() => {
      if (textareaRef.current) {
        const pos = newBefore.length;
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(pos, pos);
      }
    }, 0);
  }

  const handleSend = useCallback(() => {
    const body = draft.trim();
    if (!body || sendMessage.isPending) return;
    setDraft('');
    setMentionQuery(null);
    sendMessage.mutate({ scope, scope_id: scopeId, body });
    textareaRef.current?.focus();
  }, [draft, scope, scopeId, sendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Escape') { setMentionQuery(null); return; }

    if (mentionSuggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex(i => (i + 1) % mentionSuggestions.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex(i => (i - 1 + mentionSuggestions.length) % mentionSuggestions.length);
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        handleSelectMention(mentionSuggestions[activeIndex]);
        return;
      }
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault(); handleSend();
    }
  };

  const handleDelete = (messageId: string) => {
    deleteMessage.mutate({ messageId, scope, scopeId });
  };

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File too large. Maximum size is 10 MB.');
      return;
    }

    setPendingFile(file);
    setIsUploading(true);
    setUploadError(null);

    try {
      let fileUrl: string;

      // Upload to project attachments when possible (universal — visible in Files tab)
      const uploadProjectId = scope === 'project' ? scopeId : (projectId ?? null);
      if (uploadProjectId) {
        const result = await projectAttachmentsApi.upload(uploadProjectId, file);
        fileUrl = result.file_url;
        queryClient.invalidateQueries({ queryKey: queryKeys.projectAttachments.byProject(uploadProjectId) });
      } else {
        const result = await attachmentsApi.upload(scopeId, file);
        fileUrl = result.storage_url;
        queryClient.invalidateQueries({ queryKey: queryKeys.attachments.byTask(scopeId) });
      }

      const body = JSON.stringify({
        __file: true,
        name:   file.name,
        url:    fileUrl,
        size:   file.size,
        type:   file.type || 'application/octet-stream',
      } satisfies FilePayload);

      sendMessage.mutate({ scope, scope_id: scopeId, body });
      setPendingFile(null);
    } catch {
      setUploadError('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  }, [scope, scopeId, projectId, queryClient, sendMessage]);

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
              {group.messages.map((msg) =>
                msg.is_system ? (
                  <SystemMessage key={msg.id} message={msg} />
                ) : (
                  <MessageBubble
                    key={msg.id}
                    message={msg}
                    isSelf={msg.user_id === myId}
                    myId={myId}
                    scope={scope}
                    scopeId={scopeId}
                    onDelete={handleDelete}
                  />
                )
              )}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {typingUsers.length > 0 && (
          <div className="flex items-center gap-2 mt-2 px-1">
            <div className="flex gap-0.5 items-end">
              <span className="w-1.5 h-1.5 rounded-full bg-[#9CA3AF] animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-[#9CA3AF] animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-[#9CA3AF] animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <span className="text-[11px] text-[#9CA3AF]">
              {typingUsers.length === 1
                ? `${typingUsers[0].name} is typing…`
                : `${typingUsers.map((u) => u.name).join(', ')} are typing…`}
            </span>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Composer */}
      <div className="shrink-0 border-t border-[#E5E7EB] px-4 py-3">
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.zip,.rar"
          onChange={handleFileSelect}
        />

        <div ref={composerRef} className="relative">
          {/* @mention picker */}
          {mentionSuggestions.length > 0 && (
            <MentionPicker users={mentionSuggestions} activeIndex={activeIndex} onSelect={handleSelectMention} />
          )}

          {/* Pending file preview */}
          {pendingFile && (
            <div className="mb-2 flex items-center gap-2.5 bg-[#F0EAFF] border border-[#D6BBFB] rounded-lg px-3 py-2">
              <span className="text-[18px] leading-none shrink-0">{getFileEmoji(pendingFile.type, pendingFile.name)}</span>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-medium text-[#6941C6] truncate">{pendingFile.name}</p>
                <p className="text-[10px] text-[#9CA3AF]">{formatFileSize(pendingFile.size)}</p>
              </div>
              {isUploading ? (
                <div className="w-4 h-4 rounded-full border-2 border-[#7F56D9] border-t-transparent animate-spin shrink-0" />
              ) : (
                <button
                  type="button"
                  onClick={() => { setPendingFile(null); setUploadError(null); }}
                  className="shrink-0 text-[#9CA3AF] hover:text-red-500 transition-colors"
                  aria-label="Remove file"
                >
                  <X width={12} height={12} />
                </button>
              )}
            </div>
          )}

          {/* Upload error */}
          {uploadError && (
            <p className="mb-2 text-[11px] text-red-500 flex items-center gap-1">
              <span>⚠</span> {uploadError}
            </p>
          )}

          <div className="flex items-end gap-2 bg-[#F9FAFB] rounded-xl border border-[#E5E7EB] px-3.5 py-2.5 focus-within:border-[#7F56D9] focus-within:ring-2 focus-within:ring-[#7F56D9]/10 transition-all">
            {/* Attachment button */}
            <button
              type="button"
              onClick={() => { setUploadError(null); fileInputRef.current?.click(); }}
              disabled={isUploading}
              className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-[#9CA3AF] hover:text-[#7F56D9] hover:bg-[#F0EAFF] transition-colors disabled:opacity-40"
              aria-label="Attach file"
              title="Attach file"
            >
              <Attachment01 width={15} height={15} />
            </button>

            <textarea
              ref={textareaRef}
              value={draft}
              onChange={handleDraftChange}
              onKeyDown={handleKeyDown}
              placeholder="Type a message… Use @ to mention someone"
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
        </div>
        <p className="text-[10px] text-[#D1D5DB] mt-1.5 ml-1">Enter to send · Shift+Enter for new line · @ to mention · 📎 to attach</p>
      </div>
    </div>
  );
}
