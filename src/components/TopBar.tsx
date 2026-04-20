import { useRef, useState } from 'react';
import { LogOut01 } from '@untitled-ui/icons-react';
import { useAuth } from '../context/AuthContext';
import { useClickOutside } from '../hooks/useClickOutside';
import AccountCard from './AccountCard';

export default function TopBar() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useClickOutside(containerRef, () => setOpen(false));

  if (!user) return null;

  return (
    <header className="h-[64px] shrink-0 flex items-center justify-end px-6 bg-white border-b border-[#E9EAEB]">
      <div className="relative" ref={containerRef} data-tour="tour-profile">
        <div onClick={() => setOpen((v) => !v)}>
          <AccountCard
            user={{ name: user.name, email: user.email, avatar: user.avatar_url ?? undefined }}
            showSelectorChevron
            showOnlineDot
            asButton
          />
        </div>

        {open && (
          <div className="absolute right-0 top-full mt-1.5 w-[240px] bg-white border border-[#E9EAEB] rounded-xl shadow-lg py-1 z-50">
            {/* User info */}
            <div className="px-4 py-3 border-b border-[#E9EAEB]">
              <p className="text-sm font-semibold text-[#181D27] truncate">{user.name}</p>
              <p className="text-xs text-[#535862] truncate">{user.email}</p>
              <span className="inline-block mt-1.5 text-[10px] font-medium px-1.5 py-0.5 rounded bg-[#F4EBFF] text-[#6941C6] capitalize">
                {user.role.replace('_', ' ')}
              </span>
            </div>

            {/* Logout */}
            <button
              type="button"
              onClick={() => { setOpen(false); logout(); }}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#D92D20] hover:bg-red-50 transition-colors"
            >
              <LogOut01 width={16} height={16} />
              Log out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
