import { useState } from 'react';
import MetricCard from '../components/dashboard/MetricCard';
import QuickLinks from '../components/dashboard/QuickLinks';
import TasksTable from '../components/dashboard/TasksTable';
import DateRangePicker from '../components/DateRangePicker';
import WelcomeGuide from '../components/ui/WelcomeGuide';
import TabBar from '../components/ui/TabBar';
import TimeFilterBar from '../components/ui/TimeFilterBar';
import type { TimeFilter } from '../components/ui/TimeFilterBar';
import { useAuth } from '../context/AuthContext';

type SubTab = 'tasks' | 'timesheets' | 'transcripts';

const SUB_TABS: { id: SubTab; label: string }[] = [
  { id: 'tasks',       label: 'Tasks'       },
  { id: 'timesheets',  label: 'Timesheets'  },
  { id: 'transcripts', label: 'Transcripts' },
];

export default function Dashboard() {
  const [activeTime, setActiveTime] = useState<TimeFilter>('all');
  const [activeTab,  setActiveTab]  = useState<SubTab>('tasks');
  const [guideDismissed, setGuideDismissed] = useState(false);

  const { user } = useAuth();

  // Per-user key — every new admin/member sees the guide once on first login
  const guideKey = user ? `mw_guide_seen_${user.id}` : null;
  const showGuide = !guideDismissed && !!guideKey && !localStorage.getItem(guideKey);

  function handleDismissGuide() {
    if (!guideKey) return;
    localStorage.setItem(guideKey, '1');
    setGuideDismissed(true);
  }

  return (
    <>
      {showGuide && (
        <WelcomeGuide
          userName={user?.name?.split(' ')[0] ?? 'there'}
          onDismiss={handleDismissGuide}
        />
      )}
      <main className="flex-1 min-w-0 overflow-y-auto bg-white">

      {/* Welcome heading */}
      <div className="px-8 pt-6 pb-2">
        <h1 className="text-2xl font-bold text-[#181D27]">
          Welcome back, {user?.name?.split(' ')[0] ?? 'there'}
        </h1>
        <p className="text-sm text-[#535862] mt-1">You have 6 tasks due today</p>
      </div>

      {/* Time filter + date picker */}
      <div className="flex items-center justify-between px-8 pt-4">
        <TimeFilterBar value={activeTime} onChange={setActiveTime} />
        <DateRangePicker />
      </div>

      {/* Sub-tabs */}
      <div className="px-8 mt-1">
        <TabBar
          tabs={SUB_TABS}
          activeId={activeTab}
          onChange={(id) => setActiveTab(id as SubTab)}
        />
      </div>

      {/* Content */}
      <div className="px-8 pt-5 pb-10 flex flex-col gap-6">
        {activeTab === 'tasks' && (
          <>
            <MetricCard />
            <QuickLinks />
            <TasksTable />
          </>
        )}
        {activeTab === 'timesheets' && (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-10 text-center">
            <p className="text-sm text-gray-400">Timesheet view coming soon.</p>
          </div>
        )}
        {activeTab === 'transcripts' && (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-10 text-center">
            <p className="text-sm text-gray-400">Transcripts view coming soon.</p>
          </div>
        )}
      </div>
    </main>
    </>
  );
}
