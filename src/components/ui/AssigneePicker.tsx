import { useState, useRef } from 'react';
import { Plus, X } from '@untitled-ui/icons-react';
import { useClickOutside } from '../../hooks/useClickOutside';
import Avatar from './Avatar';
import type { User } from '../../lib/api';

interface AssigneePickerProps {
  users: User[];
  selected: string[];
  onToggle: (id: string) => void;
  label?: string;
  error?: string;
}

export default function AssigneePicker({
  users,
  selected,
  onToggle,
  label = 'Assignee',
  error,
}: AssigneePickerProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setOpen(false));

  const selectedUsers = users.filter((u) => selected.includes(u.id));
  const extra = selectedUsers.length > 3 ? selectedUsers.length - 3 : 0;

  return (
    <div ref={ref} className="relative">
      <label className="block text-sm font-medium text-[#344054] mb-1.5 whitespace-nowrap">
        {label}
      </label>

      <div className="flex items-center gap-1 h-[42px]">
        {selectedUsers.slice(0, 3).map((u) => (
          <button
            key={u.id}
            type="button"
            onClick={() => onToggle(u.id)}
            title={`Remove ${u.name}`}
            className="relative group shrink-0"
          >
            <Avatar name={u.name} src={u.avatar_url ?? undefined} size="sm" />
            <span className="absolute -top-0.5 -right-0.5 hidden group-hover:flex w-3.5 h-3.5 bg-red-500 rounded-full items-center justify-center">
              <X width={8} height={8} className="text-white" />
            </span>
          </button>
        ))}

        {extra > 0 && (
          <span className="w-7 h-7 rounded-full bg-[#F2F4F7] flex items-center justify-center text-[11px] font-semibold text-[#414651] border-2 border-white -ml-1 shrink-0">
            +{extra}
          </span>
        )}

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="w-7 h-7 rounded-full border-2 border-dashed border-[#D5D7DA] flex items-center justify-center text-[#A4A7AE] hover:border-[#7F56D9] hover:text-[#7F56D9] transition-colors shrink-0 ml-0.5"
        >
          <Plus width={12} height={12} />
        </button>
      </div>

      {error && (
        <p className="mt-1 text-xs text-red-500">{error}</p>
      )}

      {open && (
        <div className="absolute top-full mt-1 left-0 z-20 bg-white border border-[#E9EAEB] rounded-xl shadow-lg py-1 min-w-[220px] max-h-52 overflow-y-auto">
          {users.length === 0 ? (
            <p className="px-3 py-2 text-sm text-[#717680]">No team members</p>
          ) : (
            users.map((u) => {
              const checked = selected.includes(u.id);
              return (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => onToggle(u.id)}
                  className="flex items-center gap-2.5 w-full px-3 py-2 hover:bg-[#F9FAFB] text-left"
                >
                  <Avatar name={u.name} src={u.avatar_url ?? undefined} size="xs" />
                  <span className="flex-1 text-sm text-[#344054] truncate">{u.name}</span>
                  {checked && (
                    <span className="w-4 h-4 rounded-full bg-[#7F56D9] flex items-center justify-center shrink-0">
                      <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                        <path d="M1 3L3 5L7 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
