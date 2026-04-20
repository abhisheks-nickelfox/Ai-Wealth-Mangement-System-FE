import { useState } from 'react';
import Header from '../components/Header';
import MetricCard from '../components/dashboard/MetricCard';
import QuickLinks from '../components/dashboard/QuickLinks';
import TasksTable from '../components/dashboard/TasksTable';
import DateRangePicker from '../components/DateRangePicker';
import WelcomeGuide from '../components/ui/WelcomeGuide';
import { useAuth } from '../context/AuthContext';

type TimeFilter = 'all' | 'custom' | '30d' | '7d' | '24h';
type SubTab     = 'tasks' | 'timesheets' | 'transcripts';

const TIME_FILTERS: { id: TimeFilter; label: string }[] = [
  { id: 'all',    label: 'All time'  },
  { id: 'custom', label: 'Custom'    },
  { id: '30d',    label: '30 days'   },
  { id: '7d',     label: '7 days'    },
  { id: '24h',    label: '24 hours'  },
];

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

      <Header />

      {/* Time filter + date picker */}
      <div className="flex items-center justify-between px-8 pt-4">
        <div className="flex items-center gap-0.5 bg-gray-50 border border-gray-200 rounded-lg p-0.5">
          {TIME_FILTERS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setActiveTime(id)}
              className={`px-3 py-1.5 rounded-md text-[13px] font-semibold whitespace-nowrap transition-all ${
                activeTime === id
                  ? 'bg-white text-gray-700 border border-gray-300 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <DateRangePicker />
      </div>

      {/* Sub-tabs */}
      <div className="flex border-b border-gray-200 px-8 mt-1">
        {SUB_TABS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`pb-2.5 pt-2 mr-5 text-[14px] font-semibold transition-all border-b-2 ${
              activeTab === id
                ? 'text-brand-700 border-brand-600'
                : 'text-gray-500 border-transparent hover:text-gray-700'
            }`}
          >
            {label}
          </button>
        ))}
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
