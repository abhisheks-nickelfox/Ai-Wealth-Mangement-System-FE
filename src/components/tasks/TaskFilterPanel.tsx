import { useState, useMemo } from 'react';
import { X, Calendar, User01 } from '@untitled-ui/icons-react';
import Avatar from '../ui/Avatar';
import SearchInput from '../ui/SearchInput';
import type { User } from '../../lib/api';

// ── Filter panel status definitions ──────────────────────────────────────────

export type DateRangeOption = 'daily' | 'weekly' | 'monthly';

export const FILTER_STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: 'to_do',           label: 'To Do' },
  { value: 'assigned',        label: 'Assigned' },
  { value: 'in_progress',     label: 'In Progress' },
  { value: 'revisions',       label: 'Revisions' },
  { value: 'internal_review', label: 'Internal Review' },
  { value: 'client_review',   label: 'Client Review' },
  { value: 'completed',       label: 'Completed' },
  { value: 'blocked',         label: 'Blocked' },
];

// ── Square checkbox (matches screenshot) ─────────────────────────────────────

export function FilterCheckbox({ checked, onChange, id }: { checked: boolean; onChange: () => void; id?: string }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      id={id}
      onClick={onChange}
      className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
        checked
          ? 'border-[#7F56D9] bg-[#7F56D9]'
          : 'border-[#D0D5DD] bg-white hover:border-[#7F56D9]'
      }`}
    >
      {checked && (
        <svg width="9" height="7" viewBox="0 0 9 7" fill="none" aria-hidden="true">
          <path d="M1 3.5L3 5.5L8 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  );
}

// ── Filter status badge (uses filter labels, not internal ones) ───────────────

export const FILTER_STATUS_COLORS: Record<string, string> = {
  to_do:           'bg-[#F2F4F7] text-[#344054] border border-[#D0D5DD]',
  assigned:        'bg-[#F4F3FF] text-[#5925DC] border border-[#D9D6FE]',
  in_progress:     'bg-[#EFF8FF] text-[#175CD3] border border-[#B2DDFF]',
  revisions:       'bg-[#FFF4ED] text-[#B93815] border border-[#F9DBAF]',
  internal_review: 'bg-[#FFFAEB] text-[#B54708] border border-[#FEDF89]',
  client_review:   'bg-[#EEF4FF] text-[#3538CD] border border-[#C7D7FD]',
  completed:       'bg-[#ECFDF3] text-[#027A48] border border-[#ABEFC6]',
  blocked:         'bg-[#FEF3F2] text-[#B42318] border border-[#FECDCA]',
};

export function FilterStatusBadge({ value, label }: { value: string; label: string }) {
  const cls = FILTER_STATUS_COLORS[value] ?? 'bg-[#F2F4F7] text-[#344054] border border-[#D0D5DD]';
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium ${cls}`}>
      {label}
    </span>
  );
}

// ── Filter panel ───────────────────────────────────────────────────────────────

export interface FilterPanelProps {
  open: boolean;
  onClose: () => void;
  users: User[];

  // pending state (inside the panel — not yet committed)
  pendingDateRange: DateRangeOption | null;
  pendingStatuses: string[];
  pendingAssigneeIds: string[];
  onChangeDateRange: (v: DateRangeOption | null) => void;
  onToggleStatus: (v: string) => void;
  onToggleAssignee: (v: string) => void;

  // actions
  onApply: () => void;
  onCancel: () => void;
}

export function FilterPanel({
  open,
  onClose,
  users,
  pendingDateRange,
  pendingStatuses,
  pendingAssigneeIds,
  onChangeDateRange,
  onToggleStatus,
  onToggleAssignee,
  onApply,
  onCancel,
}: FilterPanelProps) {
  const [assigneeSearch, setAssigneeSearch] = useState('');

  const filteredUsers = useMemo(() => {
    if (!assigneeSearch.trim()) return users;
    const q = assigneeSearch.toLowerCase();
    return users.filter((u) => u.name.toLowerCase().includes(q));
  }, [users, assigneeSearch]);

  return (
    <>
      {/* Backdrop — closes panel on click */}
      <div
        className={`fixed inset-0 z-40 transition-opacity duration-200 ${
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        aria-hidden="true"
        onClick={onClose}
      />

      {/* Panel — slides in from right, full viewport height */}
      <aside
        className={`fixed inset-y-0 right-0 z-50 w-[380px] bg-white border-l border-[#E9EAEB] shadow-xl flex flex-col transition-transform duration-300 ease-in-out ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Filter tasks"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-[#E9EAEB] shrink-0">
          <h2 className="text-base font-semibold text-[#181D27]">Filter</h2>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-md text-[#717680] hover:bg-[#F2F4F7] transition-colors"
            aria-label="Close filter panel"
          >
            <X width={16} height={16} aria-hidden="true" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 pb-6">

          {/* ── Date Range ── */}
          <p className="text-sm font-semibold text-[#181D27] pt-5 pb-3">Date Range</p>

          {/* Daily / Weekly / Monthly + Select dates — all on one row */}
          <div className="flex items-center gap-1.5">
            {(['daily', 'weekly', 'monthly'] as const).map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => onChangeDateRange(pendingDateRange === opt ? null : opt)}
                className={`px-3 py-1.5 rounded-lg text-[13px] font-medium transition-colors whitespace-nowrap ${
                  pendingDateRange === opt
                    ? 'bg-[#7F56D9] text-white'
                    : 'bg-white text-[#414651] border border-[#D0D5DD] hover:bg-[#F9FAFB]'
                }`}
              >
                {opt.charAt(0).toUpperCase() + opt.slice(1)}
              </button>
            ))}
            <button
              type="button"
              className="flex items-center gap-1.5 border border-[#D0D5DD] rounded-lg px-2.5 py-1.5 text-[13px] text-[#414651] bg-white hover:bg-[#F9FAFB] transition-colors whitespace-nowrap shrink-0"
            >
              <Calendar width={14} height={14} className="text-[#717680] shrink-0" aria-hidden="true" />
              Select dates
            </button>
          </div>

          {/* ── Status ── */}
          <p className="text-sm font-semibold text-[#181D27] pt-5 pb-2">Status</p>

          <ul className="flex flex-col" role="group" aria-label="Filter by status">
            {FILTER_STATUS_OPTIONS.map((opt) => (
              <li key={opt.value}>
                <label className="flex items-center gap-3 py-2 cursor-pointer">
                  <FilterCheckbox
                    checked={pendingStatuses.includes(opt.value)}
                    onChange={() => onToggleStatus(opt.value)}
                    id={`filter-status-${opt.value}`}
                  />
                  <FilterStatusBadge value={opt.value} label={opt.label} />
                </label>
              </li>
            ))}
          </ul>

          {/* ── By Assignee ── */}
          <p className="text-sm font-semibold text-[#181D27] pt-5 pb-2">By Assignee</p>

          {/* Assignee search input */}
          <SearchInput
            value={assigneeSearch}
            onChange={setAssigneeSearch}
            placeholder="Search"
            className="mb-1"
          />

          {/* Assignee list */}
          <ul className="flex flex-col" role="group" aria-label="Filter by assignee">
            {/* Unassigned row */}
            <li>
              <label className="flex items-center gap-3 py-2 cursor-pointer">
                <FilterCheckbox
                  checked={pendingAssigneeIds.includes('unassigned')}
                  onChange={() => onToggleAssignee('unassigned')}
                  id="filter-assignee-unassigned"
                />
                <div className="w-7 h-7 rounded-full bg-[#F2F4F7] flex items-center justify-center shrink-0">
                  <User01 width={14} height={14} className="text-[#717680]" aria-hidden="true" />
                </div>
                <span className="text-[13px] text-[#414651]">Unassigned</span>
              </label>
            </li>

            {filteredUsers.map((user) => (
              <li key={user.id}>
                <label className="flex items-center gap-3 py-2 cursor-pointer">
                  <FilterCheckbox
                    checked={pendingAssigneeIds.includes(user.id)}
                    onChange={() => onToggleAssignee(user.id)}
                    id={`filter-assignee-${user.id}`}
                  />
                  <Avatar
                    name={user.name}
                    src={user.avatar_url ?? undefined}
                    size="sm"
                    className="shrink-0"
                  />
                  <span className="text-[13px] text-[#414651] truncate">{user.name}</span>
                </label>
              </li>
            ))}
          </ul>
        </div>

        {/* Sticky footer */}
        <div className="shrink-0 border-t border-[#E9EAEB] px-5 py-4 flex items-center gap-3 bg-white">
          <button
            type="button"
            onClick={onApply}
            className="text-[13px] font-semibold text-[#7F56D9] hover:underline mr-auto"
          >
            Save filter
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-lg border border-[#D0D5DD] bg-white text-[13px] font-semibold text-[#344054] hover:bg-[#F9FAFB] transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onApply}
            className="px-4 py-2 rounded-lg bg-[#7F56D9] text-[13px] font-semibold text-white hover:bg-[#6941C6] transition-colors"
          >
            Apply
          </button>
        </div>
      </aside>
    </>
  );
}
