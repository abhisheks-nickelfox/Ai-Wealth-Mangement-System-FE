import { useState, useRef, useEffect } from 'react';
import { TrendUp01, Users01, CalendarDate, BellRinging01, CheckDone01, ChevronDown, X } from '@untitled-ui/icons-react';
import { DonutChart } from './DonutChart';
import { FocusItem } from './FocusItem';
import { useTasks } from '../../hooks/useTasks';
import { useFirms } from '../../hooks/useFirms';
import { PRIORITY_COLORS } from '../../lib/constants';
import type { Task } from '../../lib/api';

// ── Status → colour mapping ────────────────────────────────────────────────────

const STATUS_CONFIG = [
  { key: 'to_do',           label: 'To Do',           color: '#98A2B3' },
  { key: 'assigned',        label: 'Assigned',         color: '#2E90FA' },
  { key: 'in_progress',     label: 'In Progress',      color: '#7F56D9' },
  { key: 'revisions',       label: 'Revisions',        color: '#F79009' },
  { key: 'blocked',         label: 'Blocked',          color: '#F04438' },
  { key: 'internal_review', label: 'Internal Review',  color: '#FAC515' },
  { key: 'client_review',   label: 'Client Review',    color: '#EE46BC' },
  { key: 'completed',       label: 'Completed',        color: '#17B26A' },
] as const;

type StatusKey = typeof STATUS_CONFIG[number]['key'];

const FOCUS_ITEMS = [
  { Icon: Users01,      bg: '#FEF3F2', color: '#F04438', label: 'Team Tasks Overdue',      sub: 'Requires immediate attention',          count: 62 },
  { Icon: CalendarDate, bg: '#EFF8FF', color: '#2E90FA', label: 'Scheduled Meetings',       sub: 'Prepare and attend',                   count: 4  },
  { Icon: BellRinging01,bg: '#F4F3FF', color: '#7F56D9', label: 'Notifications',            sub: '4 new notifications — Review and respond', count: 4 },
  { Icon: CheckDone01,  bg: '#ECFDF3', color: '#17B26A', label: 'Your Tasks and overdues',  sub: 'Next actions assigned to you',         count: 4  },
];

// ── Sub-components ────────────────────────────────────────────────────────────

function TaskMiniRow({ task, dotColor }: { task: Task; dotColor: string }) {
  const pc = PRIORITY_COLORS[task.priority] ?? PRIORITY_COLORS.normal;
  return (
    <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-50 transition-colors">
      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: dotColor }} />
      <span className="flex-1 text-[12px] text-gray-800 font-medium truncate" title={task.title}>
        {task.title}
      </span>
      {task.firms?.name && (
        <span className="text-[11px] text-gray-400 truncate max-w-[80px] shrink-0">
          {task.firms.name}
        </span>
      )}
      <span
        className="text-[10px] font-semibold px-1.5 py-0.5 rounded shrink-0"
        style={{ backgroundColor: pc.bg, color: pc.text }}
      >
        {pc.label}
      </span>
    </div>
  );
}

function LegendRow({
  label, count, color, selected, onClick,
}: {
  label: string; count: number; color: string;
  selected?: boolean; onClick?: () => void;
}) {
  return (
    <div
      className={`flex items-center justify-between gap-2 rounded px-1 py-0.5 transition-colors ${
        onClick ? 'cursor-pointer hover:bg-gray-50' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex items-center gap-1.5 min-w-0">
        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
        <span className={`text-[11px] truncate ${selected ? 'font-semibold text-[#7F56D9]' : 'text-gray-600'}`}>
          {label}
        </span>
      </div>
      <span className={`text-[11px] font-semibold shrink-0 ${selected ? 'text-[#7F56D9]' : 'text-gray-700'}`}>
        {count}
      </span>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function MetricCard() {
  const [selectedFirmId, setSelectedFirmId] = useState<string | null>(null);
  const [firmOpen, setFirmOpen]             = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!selectedStatus) return;
    function handleMouseDown(e: MouseEvent) {
      if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
        setSelectedStatus(null);
      }
    }
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [selectedStatus]);

  const { data: firms = [] } = useFirms();
  const { data: tasks = [] } = useTasks(selectedFirmId ? { firm_id: selectedFirmId } : undefined);
  const total = tasks.length;

  const segments = STATUS_CONFIG.map(({ key, label, color }) => ({
    label,
    color,
    count: tasks.filter((t) => t.status === key).length,
  }));

  const left  = segments.slice(0, 4);
  const right = segments.slice(4);

  const selectedFirmName = selectedFirmId
    ? (firms.find((f) => f.id === selectedFirmId)?.name ?? 'All Firms')
    : 'All Firms';

  // Derive the config entry for the selected status
  const selectedConfig = selectedStatus
    ? STATUS_CONFIG.find((s) => s.label === selectedStatus)
    : null;

  const filteredTasks = selectedConfig
    ? tasks.filter((t) => t.status === (selectedConfig.key as StatusKey))
    : [];

  function toggleStatus(label: string) {
    setSelectedStatus((v) => (v === label ? null : label));
  }

  return (
    <div ref={cardRef} className="flex rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">

      {/* ── LEFT: Total Tasks ── */}
      <div className="flex-1 flex flex-col gap-4 px-5 py-4 border-r border-gray-100">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-900">Total Tasks</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {total} task{total !== 1 ? 's' : ''} {selectedFirmId ? `for ${selectedFirmName}` : 'across all firms'}
            </p>
          </div>

          {/* Firm filter dropdown */}
          <div className="relative">
            <button
              onClick={() => setFirmOpen((v) => !v)}
              className="flex items-center gap-1.5 text-[12px] font-medium text-gray-600 border border-gray-200 rounded-md px-2.5 py-1 bg-white hover:bg-gray-50 transition-colors"
            >
              {selectedFirmName}
              <ChevronDown width={13} height={13} className="text-gray-400" />
            </button>
            {firmOpen && (
              <div className="absolute right-0 top-full mt-1 z-10 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[160px] max-h-48 overflow-y-auto">
                <button
                  key="all"
                  onClick={() => { setSelectedFirmId(null); setFirmOpen(false); }}
                  className={`w-full text-left px-3 py-1.5 text-[12px] hover:bg-gray-50 transition-colors ${
                    !selectedFirmId ? 'font-semibold text-[#7F56D9]' : 'text-gray-700'
                  }`}
                >
                  All Firms
                </button>
                {firms.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => { setSelectedFirmId(f.id); setFirmOpen(false); }}
                    className={`w-full text-left px-3 py-1.5 text-[12px] hover:bg-gray-50 transition-colors ${
                      f.id === selectedFirmId ? 'font-semibold text-[#7F56D9]' : 'text-gray-700'
                    }`}
                  >
                    {f.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Chart + legend row */}
        <div className="flex items-center gap-4">
          <DonutChart
            segments={total > 0 ? segments : [{ label: 'No tasks', count: 1, color: '#E4E7EC' }]}
            total={total > 0 ? total : 0}
            selectedLabel={selectedStatus ?? undefined}
            onSegmentClick={toggleStatus}
          />

          {/* Legend: two columns */}
          <div className="flex-1 grid grid-cols-2 gap-x-4 gap-y-0.5">
            {left.map((s) => (
              <LegendRow
                key={s.label}
                {...s}
                selected={selectedStatus === s.label}
                onClick={() => toggleStatus(s.label)}
              />
            ))}
            {right.map((s) => (
              <LegendRow
                key={s.label}
                {...s}
                selected={selectedStatus === s.label}
                onClick={() => toggleStatus(s.label)}
              />
            ))}
          </div>
        </div>

        {/* Trend */}
        <div className="flex items-center gap-1.5 text-success-700">
          <TrendUp01 width={14} height={14} />
          <span className="text-xs font-semibold">9.2%</span>
          <span className="text-xs text-gray-500">More Productivity</span>
        </div>
      </div>

      {/* ── RIGHT: Focus Today / Status breakdown ── */}
      <div className="flex-1 flex flex-col px-5 py-4">

        {!selectedConfig ? (
          /* Default: Your Focus Today */
          <>
            <div className="mb-4">
              <p className="text-sm font-semibold text-gray-900">Your Focus today</p>
              <p className="text-xs text-gray-500 mt-0.5">You have 42 overdue tasks to address</p>
            </div>
            <div className="flex flex-col divide-y divide-gray-100">
              {FOCUS_ITEMS.map((item) => (
                <FocusItem key={item.label} {...item} />
              ))}
            </div>
          </>
        ) : (
          /* Status breakdown panel */
          <>
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-1.5">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: selectedConfig.color }}
                  />
                  <p className="text-sm font-semibold text-gray-900">
                    {selectedConfig.label} Tasks
                  </p>
                  <span
                    className="ml-1 text-[11px] font-bold px-1.5 py-0.5 rounded-full"
                    style={{
                      backgroundColor: selectedConfig.color + '22',
                      color: selectedConfig.color,
                    }}
                  >
                    {filteredTasks.length}
                  </span>
                </div>
                <p className="text-[11px] text-gray-400 mt-0.5">Click a segment to explore</p>
              </div>
              <button
                onClick={() => setSelectedStatus(null)}
                className="p-1 rounded hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600 shrink-0"
                aria-label="Close"
              >
                <X width={14} height={14} />
              </button>
            </div>

            {/* Task list */}
            <div className="flex-1 overflow-y-auto space-y-1 max-h-[180px] pr-1">
              {filteredTasks.length === 0 ? (
                <p className="text-[12px] text-gray-400 py-4 text-center">
                  No tasks in this status
                </p>
              ) : (
                filteredTasks.map((task) => (
                  <TaskMiniRow key={task.id} task={task} dotColor={selectedConfig.color} />
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
