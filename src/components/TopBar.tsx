import { useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { LogOut01, ChevronRight } from '@untitled-ui/icons-react';
import { useAuth } from '../context/AuthContext';
import { useClickOutside } from '../hooks/useClickOutside';
import { useUser } from '../hooks/useUsers';
import { useFirmDetail } from '../hooks/useFirms';
import AccountCard from './AccountCard';

// ── Route → breadcrumb config ─────────────────────────────────────────────────

interface Crumb {
  label: string;
  to?: string;
}

function useBreadcrumbs(): Crumb[] {
  const { pathname } = useLocation();
  const parts = pathname.split('/').filter(Boolean);

  // /dashboard
  if (pathname === '/dashboard') {
    return [{ label: 'Dashboard' }];
  }

  // /transcripts/:id/tasks
  if (parts[0] === 'transcripts' && parts[2] === 'tasks') {
    return [
      { label: 'Transcripts', to: '/transcripts' },
      { label: parts[1] }, // resolved by TranscriptTitleCrumb below
    ];
  }

  // /transcripts
  if (pathname === '/transcripts') {
    return [{ label: 'Transcripts' }];
  }

  // /firms/:id
  if (parts[0] === 'firms' && parts[1]) {
    return [
      { label: 'Firms' },
      { label: parts[1] }, // resolved by FirmNameCrumb below
    ];
  }

  // /inbox
  if (pathname === '/inbox') {
    return [{ label: 'Inbox' }];
  }

  // /settings
  if (pathname === '/settings') {
    return [{ label: 'Settings' }];
  }

  // /users/:id/settings
  if (parts[0] === 'users' && parts[2] === 'settings') {
    return [
      { label: 'Users', to: '/users' },
      { label: parts[1] }, // resolved by UserNameCrumb below
    ];
  }

  // /users/new
  if (parts[0] === 'users' && parts[1] === 'new') {
    return [
      { label: 'Users', to: '/users' },
      { label: 'Invite' },
    ];
  }

  // /users
  if (pathname === '/users') {
    return [{ label: 'Users' }];
  }

  return [];
}

// Resolves the user name for the /users/:id/settings breadcrumb
function UserNameCrumb({ id }: { id: string }) {
  const { data: user } = useUser(id);
  return <span>{user?.first_name ?? user?.name?.split(' ')[0] ?? '…'}</span>;
}

// Resolves the firm name for the /firms/:id breadcrumb
function FirmNameCrumb({ id }: { id: string }) {
  const { data: firm } = useFirmDetail(id);
  return <span>{firm?.name ?? '…'}</span>;
}

// Resolves the transcript title for the /transcripts/:id/tasks breadcrumb
function TranscriptTitleCrumb() {
  const { state } = useLocation();
  const title = (state as { transcript?: { title?: string } } | null)?.transcript?.title;
  return <span>{title ?? '…'}</span>;
}

// ── TopBar ────────────────────────────────────────────────────────────────────

export default function TopBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const crumbs = useBreadcrumbs();

  useClickOutside(containerRef, () => setOpen(false));

  if (!user) return null;

  // Parse path parts for dynamic crumb resolution
  const parts = pathname.split('/').filter(Boolean);
  const isUserSettings = parts[0] === 'users' && parts[2] === 'settings';
  const settingsUserId = isUserSettings ? parts[1] : '';
  const isFirmDetail = parts[0] === 'firms' && !!parts[1];
  const firmId = isFirmDetail ? parts[1] : '';
  const isTranscriptTasks = parts[0] === 'transcripts' && parts[2] === 'tasks';

  return (
    <header className="h-[64px] shrink-0 flex items-center justify-between px-6 bg-white border-b border-[#E9EAEB]">

      {/* Left: breadcrumb */}
      {crumbs.length > 0 ? (
        <nav className="flex items-center gap-1">
          {/* Dashboard only: show avatar box + user name as root */}
          {pathname === '/dashboard' && (
            <div className="flex items-center gap-1.5">
              <div className="w-7 h-7 rounded-md border border-gray-200 bg-warning-200 shrink-0" />
              <span className="text-[13px] font-semibold text-gray-500 px-2 py-1 rounded-md">
                {user.name}
              </span>
            </div>
          )}

          {/* Page crumbs */}
          {crumbs.map((crumb, i) => {
            const isLast = i === crumbs.length - 1;
            const isFirst = i === 0;

            const label = isLast
              ? isUserSettings
                ? <UserNameCrumb id={settingsUserId} />
                : isFirmDetail
                ? <FirmNameCrumb id={firmId} />
                : isTranscriptTasks
                ? <TranscriptTitleCrumb />
                : crumb.label
              : crumb.label;

            return (
              <span key={i} className="flex items-center gap-1">
                {(pathname === '/dashboard' || !isFirst) && (
                  <ChevronRight width={16} height={16} className="text-gray-400" />
                )}
                {isLast ? (
                  <span className="text-[13px] font-semibold text-gray-600 bg-gray-50 px-2 py-1 rounded-md">
                    {label}
                  </span>
                ) : (
                  <button
                    onClick={() => crumb.to && navigate(crumb.to)}
                    className="text-[13px] font-semibold text-gray-500 px-2 py-1 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    {label}
                  </button>
                )}
              </span>
            );
          })}
        </nav>
      ) : (
        <div />
      )}

      {/* Right: account card */}
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
            <div className="px-4 py-3 border-b border-[#E9EAEB]">
              <p className="text-sm font-semibold text-[#181D27] truncate">{user.name}</p>
              <p className="text-xs text-[#535862] truncate">{user.email}</p>
              <span className="inline-block mt-1.5 text-[10px] font-medium px-1.5 py-0.5 rounded bg-[#F4EBFF] text-[#6941C6] capitalize">
                {user.role.replace('_', ' ')}
              </span>
            </div>
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
