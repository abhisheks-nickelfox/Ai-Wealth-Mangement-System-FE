import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Avatar from './Avatar';

interface PickerUser {
  id:          string;
  name:        string;
  avatar_url?: string | null;
  member_role?: string | null;
  role?:       string;
}

interface AssigneePickerDropdownProps {
  open:          boolean;
  onClose:       () => void;
  anchorRef:     React.RefObject<HTMLElement | null>;
  users:         PickerUser[];
  selected:      string[];          // selected user IDs
  onToggle:      (userId: string) => void;
  multiSelect?:  boolean;           // default true; false = close after each pick
  width?:        number;            // default 240
}

export default function AssigneePickerDropdown({
  open, onClose, anchorRef, users, selected,
  onToggle, multiSelect = true, width = 240,
}: AssigneePickerDropdownProps) {
  const [search, setSearch] = useState('');
  const [pos,    setPos]    = useState<{ top: number; left: number; maxListH: number } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) { setSearch(''); return; }
    const el = anchorRef.current;
    if (!el) return;
    const rect   = el.getBoundingClientRect();
    const MARGIN = 8;
    const GAP    = 4;
    const SEARCH_H = 53; // search bar + border

    // ── Horizontal: right-align to anchor, clamp inside viewport ──────────
    const left = Math.max(
      MARGIN,
      Math.min(rect.right - width, window.innerWidth - width - MARGIN),
    );

    // ── Vertical: measure real available space, pick best direction ────────
    const spaceBelow = window.innerHeight - rect.bottom - GAP - MARGIN;
    const spaceAbove = rect.top - GAP - MARGIN;
    const goAbove    = spaceBelow < 140 && spaceAbove > spaceBelow;

    // Cap total dropdown height to available space in chosen direction
    const maxTotalH  = Math.min(320, goAbove ? spaceAbove : spaceBelow);
    const maxListH   = Math.max(60, maxTotalH - SEARCH_H);
    const top        = goAbove ? rect.top - GAP - maxTotalH : rect.bottom + GAP;

    setPos({ top, left, maxListH });
    requestAnimationFrame(() => inputRef.current?.focus());
  }, [open, users.length, width]);

  if (!open || !pos) return null;
  const { top, left, maxListH } = pos;

  const q        = search.trim().toLowerCase();
  const filtered = q ? users.filter((u) => u.name.toLowerCase().includes(q)) : users;

  return createPortal(
    <>
      {/* Backdrop — escapes any CSS transform parent via portal */}
      <div className="fixed inset-0 z-[9998]" onClick={onClose} />

      {/* Dropdown */}
      <div
        style={{ position: 'fixed', top, left, zIndex: 9999, width }}
        className="bg-white border border-[#E9EAEB] rounded-xl shadow-xl overflow-hidden"
      >
        {/* Search bar */}
        <div className="px-3 py-2.5 border-b border-[#F2F4F7]">
          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[#F9FAFB] border border-[#E9EAEB]">
            <svg width="13" height="13" viewBox="0 0 20 20" fill="none" className="text-[#A4A7AE] shrink-0" aria-hidden="true">
              <path d="M17.5 17.5L13.875 13.875M15.833 9.167a6.667 6.667 0 1 1-13.333 0 6.667 6.667 0 0 1 13.333 0z"
                stroke="currentColor" strokeWidth="1.67" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <input
              ref={inputRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search members…"
              className="flex-1 min-w-0 bg-transparent text-[12px] text-[#344054] placeholder-[#A4A7AE] outline-none"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="shrink-0 text-[#A4A7AE] hover:text-[#717680] transition-colors"
                aria-label="Clear search"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                  <path d="M9 3L3 9M3 3l6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* User list */}
        <div className="overflow-y-auto py-1" style={{ maxHeight: maxListH }}>
          {filtered.length === 0 ? (
            <p className="px-4 py-3 text-[12px] text-[#A4A7AE] text-center">
              {users.length === 0 ? 'No members available' : `No results for "${search}"`}
            </p>
          ) : (
            filtered.map((u) => {
              const isSelected = selected.includes(u.id);
              return (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => { onToggle(u.id); if (!multiSelect) onClose(); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-[#F9FAFB] transition-colors"
                >
                  <Avatar name={u.name} src={u.avatar_url ?? undefined} size="xs" className="shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] text-[#181D27] truncate">{u.name}</p>
                    {(u.member_role ?? u.role) && (
                      <p className="text-[11px] text-[#A4A7AE] truncate">{u.member_role ?? u.role}</p>
                    )}
                  </div>
                  {isSelected && (
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0" aria-hidden="true">
                      <path d="M2 7L5.5 10.5L12 3.5" stroke="#7F56D9" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>
    </>,
    document.body,
  );
}
