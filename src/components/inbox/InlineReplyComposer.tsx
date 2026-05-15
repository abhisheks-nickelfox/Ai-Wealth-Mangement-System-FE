import { useState, useRef, useEffect, useCallback } from 'react';
import { CornerDownLeft, XClose, FaceHappy, Send01 } from '@untitled-ui/icons-react';
import type { Message, MentionUser } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { QUICK_EMOJIS } from '../../lib/constants';
import Avatar from '../ui/Avatar';

interface InlineReplyComposerProps {
  parentMsg:    Message;
  mentionUsers: MentionUser[];
  onSend:  (body: string) => void;
  onClose: () => void;
}

export default function InlineReplyComposer({
  parentMsg,
  mentionUsers,
  onSend,
  onClose,
}: InlineReplyComposerProps) {
  const { user } = useAuth();
  const myId = user?.id;

  const [draft,        setDraft]        = useState('');
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionIdx,   setMentionIdx]   = useState(0);
  const [showEmoji,    setShowEmoji]    = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const emojiRef    = useRef<HTMLDivElement>(null);

  // Pre-fill the right @tag on mount:
  //   - Replying to someone else's message → tag that person
  //   - Replying to own message → extract the first @mention from the parent body
  //     (e.g. own msg is "@abhishek hi bro" → pre-fill "@abhishek ")
  //   - Own message with no @mention → leave empty
  useEffect(() => {
    let prefill = '';
    if (myId) {
      if (parentMsg.author.id !== myId) {
        const firstName = (parentMsg.author as unknown as { first_name?: string }).first_name
          ?? parentMsg.author.name.split(' ')[0];
        prefill = `@${firstName} `;
      } else {
        // Replying to own message — re-use the @mention already in it
        const match = parentMsg.body.match(/@(\w+)/);
        if (match) prefill = `@${match[1]} `;
      }
    }
    if (prefill) setDraft(prefill);
    requestAnimationFrame(() => {
      const ta = textareaRef.current;
      if (!ta) return;
      ta.focus();
      ta.setSelectionRange(ta.value.length, ta.value.length);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Close emoji picker on outside click
  useEffect(() => {
    if (!showEmoji) return;
    function handler(e: MouseEvent) {
      if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) setShowEmoji(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showEmoji]);

  const mentionMatches: MentionUser[] = mentionQuery !== null
    ? mentionUsers.filter((u) => {
        const first = (u.first_name ?? u.name.split(' ')[0]).toLowerCase();
        return first.startsWith(mentionQuery.toLowerCase()) && u.id !== myId;
      }).slice(0, 6)
    : [];

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const val = e.target.value;
    setDraft(val);
    const ta = textareaRef.current;
    if (ta) { ta.style.height = '22px'; ta.style.height = `${Math.min(ta.scrollHeight, 112)}px`; }
    const cursor = e.target.selectionStart ?? val.length;
    const match  = val.slice(0, cursor).match(/@(\w*)$/);
    if (match) { setMentionQuery(match[1]); setMentionIdx(0); }
    else setMentionQuery(null);
  }

  const selectMention = useCallback((u: MentionUser) => {
    const ta     = textareaRef.current;
    const cursor = ta?.selectionStart ?? draft.length;
    const before = draft.slice(0, cursor);
    const match  = before.match(/@(\w*)$/);
    if (!match) return;
    const firstName = u.first_name ?? u.name.split(' ')[0];
    const newDraft  = `${draft.slice(0, cursor - match[0].length)}@${firstName} ${draft.slice(cursor)}`;
    setDraft(newDraft);
    setMentionQuery(null);
    requestAnimationFrame(() => {
      ta?.focus();
      const pos = cursor - match[0].length + firstName.length + 2;
      ta?.setSelectionRange(pos, pos);
    });
  }, [draft]);

  function insertEmoji(emoji: string) {
    const ta     = textareaRef.current;
    const cursor = ta?.selectionStart ?? draft.length;
    const newDraft = draft.slice(0, cursor) + emoji + draft.slice(cursor);
    setDraft(newDraft);
    setShowEmoji(false);
    requestAnimationFrame(() => { ta?.focus(); const pos = cursor + emoji.length; ta?.setSelectionRange(pos, pos); });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (mentionQuery !== null && mentionMatches.length > 0) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setMentionIdx((i) => Math.min(i + 1, mentionMatches.length - 1)); return; }
      if (e.key === 'ArrowUp')   { e.preventDefault(); setMentionIdx((i) => Math.max(i - 1, 0)); return; }
      if (e.key === 'Tab' || e.key === 'Enter') { e.preventDefault(); selectMention(mentionMatches[mentionIdx]); return; }
      if (e.key === 'Escape') { setMentionQuery(null); return; }
    }
    if (e.key === 'Escape') { onClose(); return; }
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); const b = draft.trim(); if (b) onSend(b); }
  }

  return (
    <div className="rounded-xl border border-[#7F56D9]/30 bg-[#FAFBFF] p-3 mb-3 mt-1 relative">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-medium text-[#6941C6] flex items-center gap-1">
          <CornerDownLeft width={12} height={12} />
          Replying to <span className="font-semibold ml-1">{parentMsg.author.name}</span>
        </span>
        <button onClick={onClose} aria-label="Cancel reply" className="text-[#98A2B3] hover:text-[#667085] transition-colors">
          <XClose width={13} height={13} />
        </button>
      </div>

      {mentionQuery !== null && mentionMatches.length > 0 && (
        <div className="absolute bottom-full left-0 right-0 mb-1 bg-white border border-[#E9EAEB] rounded-xl shadow-lg overflow-hidden z-50">
          {mentionMatches.map((u, i) => (
            <button
              key={u.id}
              onMouseDown={(e) => { e.preventDefault(); selectMention(u); }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors ${i === mentionIdx ? 'bg-[#F9F5FF]' : 'hover:bg-[#F9FAFB]'}`}
            >
              <Avatar name={u.name} src={u.avatar_url ?? undefined} size="xs" />
              <span className="text-[13px] font-medium text-[#101828]">{u.first_name ?? u.name.split(' ')[0]}</span>
              <span className="text-[12px] text-[#98A2B3]">{u.name}</span>
            </button>
          ))}
        </div>
      )}

      {showEmoji && (
        <div ref={emojiRef} className="absolute bottom-full right-0 mb-1 bg-white border border-[#E9EAEB] rounded-xl shadow-lg p-2 z-50">
          <div className="grid grid-cols-6 gap-0.5">
            {QUICK_EMOJIS.map((e) => (
              <button key={e} onMouseDown={(ev) => { ev.preventDefault(); insertEmoji(e); }} className="text-[18px] hover:bg-[#F2F4F7] rounded-lg p-1 w-9 h-9 flex items-center justify-center transition-colors">{e}</button>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-end gap-2 bg-white rounded-xl border border-[#E9EAEB] px-3 py-2 focus-within:border-[#7F56D9] focus-within:ring-2 focus-within:ring-[#7F56D9]/10 transition-all">
        <textarea
          ref={textareaRef}
          value={draft}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Write a reply…"
          rows={1}
          className="flex-1 resize-none text-[13px] text-[#181D27] placeholder-[#A4A7AE] outline-none leading-[1.55] max-h-28 overflow-y-auto bg-transparent"
          style={{ minHeight: '22px' }}
        />
        <button onClick={() => setShowEmoji((v) => !v)} aria-label="Emoji" className="w-7 h-7 flex items-center justify-center rounded-lg text-[#98A2B3] hover:text-[#667085] hover:bg-[#F2F4F7] transition-colors shrink-0">
          <FaceHappy width={15} height={15} />
        </button>
        <button onClick={() => { const b = draft.trim(); if (b) onSend(b); }} disabled={!draft.trim()} aria-label="Send reply" className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#7F56D9] hover:bg-[#6941C6] text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0">
          <Send01 width={14} height={14} />
        </button>
      </div>
    </div>
  );
}
