import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { SearchLg } from '@untitled-ui/icons-react';
import type { Firm, Task } from '../../lib/api';

const NAV_PAGES = [
  { id: 'inbox',        label: 'Inbox',            path: '/inbox' },
  { id: 'dashboard',    label: 'Dashboard',         path: '/dashboard' },
  { id: 'projects',     label: 'Projects',          path: '/projects' },
  { id: 'my-tasks',     label: 'My Tasks',          path: '/my-tasks' },
  { id: 'timesheet',    label: 'Timesheet',         path: '/timesheet' },
  { id: 'time-reports', label: 'Time Reports',      path: '/time-reports' },
  { id: 'transcripts',  label: 'Transcripts Flow',  path: '/transcripts' },
  { id: 'users',        label: 'Users',             path: '/users' },
  { id: 'team-pulse',   label: 'Team Pulse',        path: '/team-pulse' },
  { id: 'settings',     label: 'Settings',          path: '/settings' },
];

interface SearchItem {
  key:       string;
  group:     'Pages' | 'Firms' | 'Tasks';
  label:     string;
  sublabel?: string;
  path:      string;
}

interface Props {
  open:    boolean;
  onClose: () => void;
  firms:   Firm[];
  tasks:   Task[];
}

export default function SearchModal({ open, onClose, firms, tasks }: Props) {
  const navigate    = useNavigate();
  const [query, setQuery]           = useState('');
  const [activeIdx, setActiveIdx]   = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef  = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setQuery('');
      setActiveIdx(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  const items = useMemo<SearchItem[]>(() => {
    const q = query.trim().toLowerCase();

    const pages: SearchItem[] = NAV_PAGES
      .filter(p => !q || p.label.toLowerCase().includes(q))
      .map(p => ({ key: `nav-${p.id}`, group: 'Pages', label: p.label, path: p.path }));

    const firmItems: SearchItem[] = firms
      .filter(f => !q || f.name.toLowerCase().includes(q))
      .slice(0, 6)
      .map(f => ({ key: `firm-${f.id}`, group: 'Firms', label: f.name, path: `/firms/${f.id}` }));

    const taskItems: SearchItem[] = tasks
      .filter(t => !q || t.title.toLowerCase().includes(q))
      .slice(0, 5)
      .map(t => ({
        key:      `task-${t.id}`,
        group:    'Tasks',
        label:    t.title,
        sublabel: t.firms?.name,
        path:     '/my-tasks',
      }));

    return [...pages, ...firmItems, ...taskItems];
  }, [query, firms, tasks]);

  useEffect(() => { setActiveIdx(0); }, [items.length]);

  const selectItem = useCallback((item: SearchItem) => {
    navigate(item.path);
    onClose();
  }, [navigate, onClose]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape')     { onClose(); return; }
      if (e.key === 'ArrowDown')  { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, items.length - 1)); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, 0)); }
      else if (e.key === 'Enter' && items[activeIdx]) { selectItem(items[activeIdx]); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, items, activeIdx, selectItem, onClose]);

  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-idx="${activeIdx}"]`) as HTMLElement | null;
    el?.scrollIntoView({ block: 'nearest' });
  }, [activeIdx]);

  if (!open) return null;

  // Build groups preserving global index for keyboard tracking
  // Rendered via portal so sidebar overflow/sticky doesn't trap the fixed overlay
  let gIdx = 0;
  const groups: { group: string; rows: { item: SearchItem; idx: number }[] }[] = [];
  for (const g of ['Pages', 'Firms', 'Tasks'] as const) {
    const rows = items
      .filter(it => it.group === g)
      .map(item => ({ item, idx: gIdx++ }));
    if (rows.length) groups.push({ group: g, rows });
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] bg-black/40"
      onMouseDown={onClose}
    >
      <div
        className="w-full max-w-[560px] mx-4 bg-white rounded-xl shadow-2xl overflow-hidden"
        onMouseDown={e => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-100">
          <SearchLg width={18} height={18} className="text-gray-400 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search pages, firms, tasks…"
            className="flex-1 text-[14px] text-gray-900 placeholder:text-gray-400 bg-transparent outline-none"
          />
          {query && (
            <button
              type="button"
              onMouseDown={e => { e.preventDefault(); setQuery(''); }}
              className="text-gray-400 hover:text-gray-600 transition-colors text-lg leading-none px-0.5"
              aria-label="Clear"
            >
              ×
            </button>
          )}
          <kbd className="text-[11px] text-gray-400 border border-gray-200 rounded px-1.5 py-0.5 font-medium shrink-0">
            Esc
          </kbd>
        </div>

        {/* Results list */}
        <div ref={listRef} className="max-h-[400px] overflow-y-auto">
          {items.length === 0 ? (
            <p className="text-center text-[13px] text-gray-400 py-10">
              No results for &ldquo;{query}&rdquo;
            </p>
          ) : (
            <div className="py-2">
              {groups.map(({ group, rows }) => (
                <div key={group}>
                  <p className="px-4 pt-3 pb-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                    {group}
                  </p>
                  {rows.map(({ item, idx }) => {
                    const isActive = idx === activeIdx;
                    return (
                      <button
                        key={item.key}
                        type="button"
                        data-idx={idx}
                        onMouseDown={() => selectItem(item)}
                        onMouseEnter={() => setActiveIdx(idx)}
                        className={`w-full text-left flex items-center gap-3 px-4 py-2.5 transition-colors ${
                          isActive ? 'bg-[#F4EBFF]' : 'hover:bg-gray-50'
                        }`}
                      >
                        <span className={`flex-1 text-[13px] font-medium truncate ${
                          isActive ? 'text-[#7F56D9]' : 'text-gray-800'
                        }`}>
                          {item.label}
                        </span>
                        {item.sublabel && (
                          <span className="text-[12px] text-gray-400 truncate max-w-[160px] shrink-0">
                            {item.sublabel}
                          </span>
                        )}
                        {isActive && (
                          <kbd className="text-[10px] text-[#7F56D9] border border-[#D6BBFB] rounded px-1.5 py-0.5 shrink-0">
                            ↵
                          </kbd>
                        )}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer hints */}
        <div className="border-t border-gray-100 px-4 py-2 flex items-center gap-4 text-[11px] text-gray-400">
          <span>
            <kbd className="border border-gray-200 rounded px-1 mr-0.5">↑</kbd>
            <kbd className="border border-gray-200 rounded px-1">↓</kbd>
            {' '}navigate
          </span>
          <span><kbd className="border border-gray-200 rounded px-1">↵</kbd> select</span>
          <span><kbd className="border border-gray-200 rounded px-1">Esc</kbd> close</span>
        </div>
      </div>
    </div>,
    document.body
  );
}
