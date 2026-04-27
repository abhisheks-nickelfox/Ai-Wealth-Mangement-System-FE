import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { SearchLg } from '@untitled-ui/icons-react';

import NavSection from './sidebar/NavSection';
import NavItem from './sidebar/NavItem';
import ExpandableNavItem from './sidebar/ExpandableNavItem';
import { useFirms } from '../hooks/useFirms';

import vectorLogo      from '../assets/logo/Logomark.svg';
import iconInbox       from '../assets/navbar-icon/icon-inbox.png';
import iconDashboard   from '../assets/navbar-icon/icon-dashboard.png';
import iconFirms       from '../assets/navbar-icon/icon-firms.png';
import iconMyTasks     from '../assets/navbar-icon/icon-my-tasks.png';
import iconSettings    from '../assets/navbar-icon/icon-settings.png';
import iconUsers       from '../assets/navbar-icon/icon-users.png';
import iconProjects    from '../assets/navbar-icon/icon-projects.svg';
import iconTimeReports from '../assets/navbar-icon/icon-time-reports.svg';
import iconTeamPulse   from '../assets/navbar-icon/icon-team-pulse.svg';
import iconTranscripts from '../assets/navbar-icon/icon-transcripts.png';

const NavIcon = ({ src }: { src: string }) => (
  <img src={src} alt="" width={20} height={20} className="shrink-0" />
);

// ── My Tasks sub-items ────────────────────────────────────────────────────────
const MY_TASKS = [
  { id: 'my-timesheet',  label: 'My Timesheet' },
  { id: 'transcripts',   label: 'Transcripts Flow' },
  { id: 'todo',          label: 'Todo',           badge: { count: 10, variant: 'blue'    as const } },
  { id: 'assigned-me',   label: 'Assigned to me', badge: { count: 10, variant: 'brand'   as const } },
  { id: 'today-due',     label: 'Today Due',      badge: { count: 10, variant: 'success' as const } },
  { id: 'overdue',       label: 'Overdue',        badge: { count: 10, variant: 'error'   as const } },
  { id: 'active',        label: 'Active' },
  { id: 'assigned',      label: 'Assigned' },
  { id: 'in-progress',   label: 'In Progress' },
  { id: 'urgent',        label: 'Urgent' },
  { id: 'blocked',       label: 'Blocked' },
  { id: 'revisions',     label: 'Revisions' },
  { id: 'closed',        label: 'Closed' },
  { id: 'complete',      label: 'Complete' },
];

// ── Sidebar ───────────────────────────────────────────────────────────────────

function getActiveNav(pathname: string): string {
  if (pathname === '/dashboard' || pathname === '/') return 'dashboard';
  if (pathname.startsWith('/users'))       return 'users';
  if (pathname.startsWith('/inbox'))       return 'inbox';
  if (pathname.startsWith('/transcripts')) return 'transcripts';
  if (pathname.startsWith('/settings'))    return 'settings';
  if (pathname.startsWith('/firms'))       return 'firms';
  if (pathname.startsWith('/projects'))    return 'projects';
  if (pathname.startsWith('/time-reports')) return 'time-reports';
  if (pathname.startsWith('/team-pulse'))  return 'team-pulse';
  if (pathname.startsWith('/timesheet'))   return 'my-timesheet';
  return '';
}

function getActiveFirmId(pathname: string): string {
  const match = pathname.match(/^\/firms\/([^/]+)/);
  return match ? match[1] : '';
}

export default function Sidebar() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const activeNav = getActiveNav(location.pathname);

  // Derive the active My Tasks sub-item from the URL
  const defaultTaskId =
    activeNav === 'transcripts' ? 'transcripts' :
    activeNav === 'my-timesheet' ? 'my-timesheet' : '';
  const [activeTask, setActiveTask] = useState(defaultTaskId);

  const { data: firms = [], isLoading: firmsLoading } = useFirms();
  const firmItems = firms.map((f) => ({ id: f.id, label: f.name }));
  const activeFirm = getActiveFirmId(location.pathname);

  function handleMyTaskClick(id: string) {
    if (id === 'transcripts') { navigate('/transcripts'); setActiveTask(id); }
    else if (id === 'my-timesheet') { navigate('/timesheet'); setActiveTask(id); }
    else setActiveTask(id);
  }

  return (
    <aside className="w-64 shrink-0 bg-white border-r border-gray-200 flex flex-col h-screen sticky top-0 overflow-y-auto">

      {/* ── Logo ─────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2.5 px-5 pt-4 pb-2 shrink-0">
        <img src={vectorLogo} alt="AI Wealth Connections" className="h-10 w-auto object-contain shrink-0" />
        <div>
          <p className="text-[15px] font-bold text-gray-900 leading-tight">AI Wealth</p>
          <p className="text-[11px] text-black-500 leading-tight">Connections</p>
        </div>
      </div>

      {/* ── Search ───────────────────────────────────────────────────── */}
      <div className="px-3 pb-3 shrink-0">
        <div className="flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-2 bg-white shadow-sm">
          <SearchLg width={16} height={16} className="text-gray-400 shrink-0" />
          <span className="flex-1 text-sm text-gray-400">Search</span>
          <span className="border border-gray-200 rounded px-1.5 py-0.5 text-[11px] text-gray-400 font-medium leading-none">
            ⌘K
          </span>
        </div>
      </div>

      {/* ── Navigation ───────────────────────────────────────────────── */}
      <nav className="flex-1 px-2 overflow-y-auto pb-4">

        {/* GENERAL */}
        <NavSection heading="GENERAL">
          <NavItem
            label="Inbox"
            icon={<NavIcon src={iconInbox} />}
            active={activeNav === 'inbox'}
            onClick={() => navigate('/inbox')}
          />
          <div data-tour="tour-dashboard">
            <NavItem
              label="Dashboard"
              icon={<NavIcon src={iconDashboard} />}
              active={activeNav === 'dashboard'}
              onClick={() => navigate('/dashboard')}
            />
          </div>
          {firmsLoading ? (
            <div className="ml-2 flex flex-col gap-1 py-1">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-7 bg-gray-100 rounded-md animate-pulse mx-1" />
              ))}
            </div>
          ) : (
            <div data-tour="tour-firms">
              <ExpandableNavItem
                label="Firms"
                icon={<NavIcon src={iconFirms} />}
                items={firmItems}
                activeItemId={activeFirm}
                onItemClick={(id) => navigate(`/firms/${id}`)}
              />
            </div>
          )}
        </NavSection>

        {/* WORK MANAGEMENT */}
        <NavSection heading="WORK MANAGEMENT">
          <NavItem
            label="Projects"
            icon={<NavIcon src={iconProjects} />}
            active={activeNav === 'projects'}
            onClick={() => navigate('/projects')}
          />
          <NavItem
            label="Time reports"
            icon={<NavIcon src={iconTimeReports} />}
            active={activeNav === 'time-reports'}
            onClick={() => navigate('/time-reports')}
          />
          <NavItem
            label="Team Pulse"
            icon={<NavIcon src={iconTeamPulse} />}
            active={activeNav === 'team-pulse'}
            onClick={() => navigate('/team-pulse')}
          />
        </NavSection>

        {/* AI HUB */}
        <NavSection heading="AI HUB">
          <div data-tour="tour-transcripts">
            <NavItem
              label="Transcripts Flow"
              icon={<NavIcon src={iconTranscripts} />}
              active={activeNav === 'transcripts'}
              onClick={() => navigate('/transcripts')}
            />
          </div>
        </NavSection>

        {/* YOU */}
        <NavSection heading="YOU">
          <ExpandableNavItem
            label="My Tasks"
            icon={<NavIcon src={iconMyTasks} />}
            items={MY_TASKS}
            activeItemId={activeTask}
            onItemClick={handleMyTaskClick}
          />
        </NavSection>

        {/* PLATFORM */}
        <NavSection heading="PLATFORM">
          <div data-tour="tour-users">
            <NavItem
              label="Users"
              icon={<NavIcon src={iconUsers} />}
              active={activeNav === 'users'}
              onClick={() => navigate('/users')}
            />
          </div>
          <NavItem
            label="Settings"
            icon={<NavIcon src={iconSettings} />}
            active={activeNav === 'settings'}
            onClick={() => navigate('/settings')}
          />
        </NavSection>

      </nav>
    </aside>
  );
}
