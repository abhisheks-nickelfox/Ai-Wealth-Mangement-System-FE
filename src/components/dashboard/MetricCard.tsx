import { TrendUp01, Users01, CalendarDate, BellRinging01, CheckDone01, ChevronDown } from '@untitled-ui/icons-react';
import { useState } from 'react';
import { DonutChart } from './DonutChart';
import { FocusItem } from './FocusItem';

// ── Data ──────────────────────────────────────────────────────────────────────

const SEGMENTS = [
  { label: 'Todo',            count: 57,  color: '#98A2B3' },
  { label: 'Assigned',        count: 100, color: '#2E90FA' },
  { label: 'Inprogress',      count: 40,  color: '#7F56D9' },
  { label: 'Revisions',       count: 64,  color: '#F79009' },
  { label: 'Blocked',         count: 10,  color: '#F04438' },
  { label: 'Internal Review', count: 40,  color: '#FAC515' },
  { label: 'Client Review',   count: 51,  color: '#EE46BC' },
  { label: 'Completed',       count: 51,  color: '#17B26A' },
];

const TOTAL = SEGMENTS.reduce((s, seg) => s + seg.count, 0); // 413

const FOCUS_ITEMS = [
  {
    Icon:  Users01,
    bg:    '#FEF3F2',
    color: '#F04438',
    label: 'Team Tasks Overdue',
    sub:   'Requires immediate attention',
    count: 62,
  },
  {
    Icon:  CalendarDate,
    bg:    '#EFF8FF',
    color: '#2E90FA',
    label: 'Scheduled Meetings',
    sub:   'Prepare and attend',
    count: 4,
  },
  {
    Icon:  BellRinging01,
    bg:    '#F4F3FF',
    color: '#7F56D9',
    label: 'Notifications',
    sub:   '4 new notifications — Review and respond',
    count: 4,
  },
  {
    Icon:  CheckDone01,
    bg:    '#ECFDF3',
    color: '#17B26A',
    label: 'Your Tasks and overdues',
    sub:   'Next actions assigned to you',
    count: 4,
  },
];

const FIRMS = ['All Firms', 'Ashwati Capital', 'IGA Health', 'Acme Corp'];

// ── Sub-components ────────────────────────────────────────────────────────────

function LegendRow({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-1.5 min-w-0">
        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
        <span className="text-[11px] text-gray-600 truncate">{label}</span>
      </div>
      <span className="text-[11px] font-semibold text-gray-700 shrink-0">{count}</span>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function MetricCard() {
  const [firm, setFirm] = useState('All Firms');
  const [firmOpen, setFirmOpen] = useState(false);

  const left  = SEGMENTS.slice(0, 4);
  const right = SEGMENTS.slice(4);

  return (
    <div className="flex rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">

      {/* ── LEFT: Total Tasks ── */}
      <div className="flex-1 flex flex-col gap-4 px-5 py-4 border-r border-gray-100">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-900">Total Tasks</p>
            <p className="text-xs text-gray-500 mt-0.5">You have 6 overdues</p>
          </div>

          {/* Choose Firm dropdown */}
          <div className="relative">
            <button
              onClick={() => setFirmOpen((v) => !v)}
              className="flex items-center gap-1.5 text-[12px] font-medium text-gray-600 border border-gray-200 rounded-md px-2.5 py-1 bg-white hover:bg-gray-50 transition-colors"
            >
              {firm}
              <ChevronDown width={13} height={13} className="text-gray-400" />
            </button>
            {firmOpen && (
              <div className="absolute right-0 top-full mt-1 z-10 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[140px]">
                {FIRMS.map((f) => (
                  <button
                    key={f}
                    onClick={() => { setFirm(f); setFirmOpen(false); }}
                    className={`w-full text-left px-3 py-1.5 text-[12px] hover:bg-gray-50 transition-colors ${
                      f === firm ? 'font-semibold text-brand-700' : 'text-gray-700'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Chart + legend row */}
        <div className="flex items-center gap-4">
          <DonutChart segments={SEGMENTS} total={TOTAL} />

          {/* Legend: two columns */}
          <div className="flex-1 grid grid-cols-2 gap-x-4 gap-y-2">
            {left.map((s) => <LegendRow key={s.label} {...s} />)}
            {right.map((s) => <LegendRow key={s.label} {...s} />)}
          </div>
        </div>

        {/* Trend */}
        <div className="flex items-center gap-1.5 text-success-700">
          <TrendUp01 width={14} height={14} />
          <span className="text-xs font-semibold">9.2%</span>
          <span className="text-xs text-gray-500">More Productivity</span>
        </div>
      </div>

      {/* ── RIGHT: Your Focus Today ── */}
      <div className="flex-1 flex flex-col px-5 py-4">

        {/* Header */}
        <div className="mb-4">
          <p className="text-sm font-semibold text-gray-900">Your Focus today</p>
          <p className="text-xs text-gray-500 mt-0.5">You have 42 overdue tasks to address</p>
        </div>

        {/* Focus rows */}
        <div className="flex flex-col divide-y divide-gray-100">
          {FOCUS_ITEMS.map((item) => (
            <FocusItem key={item.label} {...item} />
          ))}
        </div>
      </div>
    </div>
  );
}
