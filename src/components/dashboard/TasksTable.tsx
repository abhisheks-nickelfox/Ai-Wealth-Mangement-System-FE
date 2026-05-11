import { useState, useMemo, useEffect } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight, FilterLines } from '@untitled-ui/icons-react';
import AvatarStack from '../ui/AvatarStack';
import { PriorityBadge, TaskStatusBadge } from '../tasks/TaskBadges';
import { useTasks } from '../../hooks/useTasks';
import { useFirms } from '../../hooks/useFirms';
import type { Task } from '../../lib/api';

// ── Dot colors cycling per firm ───────────────────────────────────────────────

const DOT_COLORS = ['#F79009', '#2E90FA', '#7F56D9', '#17B26A', '#F04438', '#FAC515', '#EE46BC'];

function dotColorForFirm(firmId: string | null, _firmNames: string[]): string {
  if (!firmId) return '#A4A7AE';
  return DOT_COLORS[Math.abs(firmId.charCodeAt(0) + firmId.charCodeAt(firmId.length - 1)) % DOT_COLORS.length];
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface RowData {
  id:        string;
  name:      string;
  dot:       string;
  client:    string;
  assignees: { name: string; bg: string }[];
  dueDate:   string;
  priority:  Task['priority'];
  status:    Task['status'];
}


// ── Project dot (concentric rings) ───────────────────────────────────────────

function ProjectDot({ color }: { color: string }) {
  return (
    <span className="relative inline-flex items-center justify-center w-4 h-4 shrink-0">
      <span className="absolute w-4 h-4 rounded-full opacity-20" style={{ backgroundColor: color }} />
      <span className="absolute w-2.5 h-2.5 rounded-full opacity-40" style={{ backgroundColor: color }} />
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
    </span>
  );
}

// ── Row component ─────────────────────────────────────────────────────────────

interface RowProps {
  row:       RowData;
  depth?:    number;
}

function ProjectRow({ row, depth = 0 }: RowProps) {
  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors">

      {/* Task name */}
      <td className="py-2.5 pr-3">
        <div
          className="flex items-center gap-2"
          style={{ paddingLeft: depth > 0 ? `${depth * 20}px` : 0 }}
        >
          <span className="w-5 shrink-0" />
          <ProjectDot color={row.dot} />
          <span className="text-[13px] font-semibold leading-tight text-gray-900">
            {row.name}
          </span>
        </div>
      </td>

      {/* Client */}
      <td className="py-2.5 pr-3">
        <span className="text-[12px] text-gray-700">{row.client}</span>
      </td>

      {/* Assignee */}
      <td className="py-2.5 pr-3">
        <AvatarStack avatars={row.assignees} max={3} showAddButton={false} />
      </td>

      {/* Due date */}
      <td className="py-2.5 pr-3">
        <span className="text-[12px] text-gray-700">{row.dueDate}</span>
      </td>

      {/* Priority */}
      <td className="py-2.5 pr-3">
        <PriorityBadge priority={row.priority} />
      </td>

      {/* Status */}
      <td className="py-2.5">
        <TaskStatusBadge status={row.status} />
      </td>
    </tr>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

const PAGE_SIZE = 20;

export default function TasksTable() {
  const [firmFilter,  setFirmFilter]  = useState('All Firms');
  const [firmOpen,    setFirmOpen]    = useState(false);
  const [assigneeFilter, setAssigneeFilter] = useState('All Assignees');
  const [assigneeOpen,   setAssigneeOpen]   = useState(false);
  const [page, setPage] = useState(1);

  const { data: tasks   = [] } = useTasks();
  const { data: firms   = [] } = useFirms();

  // Build unique assignee names from loaded tasks for the filter dropdown
  const assigneeNames = useMemo(() => {
    const names = new Set<string>();
    tasks.forEach((t) => { if (t.assignee?.name) names.add(t.assignee.name); });
    return ['All Assignees', ...Array.from(names)];
  }, [tasks]);

  const firmOptions = useMemo(() => ['All Firms', ...firms.map((f) => f.name)], [firms]);

  // Map Task → RowData for the table
  const rows: RowData[] = useMemo(() => tasks.map((task) => ({
    id:        task.id,
    name:      task.title,
    dot:       dotColorForFirm(task.firm_id, firms.map((f) => f.id)),
    client:    task.firms?.name ?? '—',
    assignees: task.assignee ? [{ name: task.assignee.name, bg: '#D6BBFB' }] : [],
    dueDate:   task.deadline ?? '—',
    priority:  task.priority,
    status:    task.status,
  })), [tasks, firms]);

  const filtered = rows.filter((r) => {
    if (firmFilter !== 'All Firms' && r.client !== firmFilter) return false;
    if (assigneeFilter !== 'All Assignees' && !r.assignees.some((a) => a.name === assigneeFilter)) return false;
    return true;
  });

  useEffect(() => { setPage(1); }, [firmFilter, assigneeFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows   = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function FilterDropdown({
    label, value, options, open, onToggle, onSelect,
  }: {
    label: string; value: string; options: string[];
    open: boolean; onToggle: () => void; onSelect: (v: string) => void;
  }) {
    return (
      <div className="relative">
        <button
          onClick={onToggle}
          className="flex items-center gap-1.5 text-[12px] font-medium text-gray-600 border border-gray-200 rounded-md px-2.5 py-1.5 bg-white hover:bg-gray-50 transition-colors"
        >
          <FilterLines width={13} height={13} className="text-gray-400" />
          {value === options[0] ? label : value}
          <ChevronDown width={12} height={12} className="text-gray-400" />
        </button>
        {open && (
          <div className="absolute right-0 top-full mt-1 z-10 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[160px]">
            {options.map((opt) => (
              <button
                key={opt}
                onClick={() => { onSelect(opt); onToggle(); }}
                className={`w-full text-left px-3 py-1.5 text-[12px] hover:bg-gray-50 transition-colors ${
                  opt === value ? 'font-semibold text-brand-700' : 'text-gray-700'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-[17px] font-semibold text-gray-900">Project Summary</h2>

        <div className="flex items-center gap-2">
          <FilterDropdown
            label="Filter by firm" value={firmFilter} options={firmOptions}
            open={firmOpen} onToggle={() => { setFirmOpen((v) => !v); setAssigneeOpen(false); }}
            onSelect={setFirmFilter}
          />
          <FilterDropdown
            label="Filter by Assignee" value={assigneeFilter} options={assigneeNames}
            open={assigneeOpen} onToggle={() => { setAssigneeOpen((v) => !v); setFirmOpen(false); }}
            onSelect={setAssigneeFilter}
          />
        </div>
      </div>

      {/* Table */}
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-gray-600 uppercase tracking-wider w-[35%]">Projects</th>
              <th className="px-3 py-2.5 text-left text-[11px] font-semibold text-gray-600 uppercase tracking-wider">Client</th>
              <th className="px-3 py-2.5 text-left text-[11px] font-semibold text-gray-600 uppercase tracking-wider">Assignee</th>
              <th className="px-3 py-2.5 text-left text-[11px] font-semibold text-gray-600 uppercase tracking-wider">Due date</th>
              <th className="px-3 py-2.5 text-left text-[11px] font-semibold text-gray-600 uppercase tracking-wider">Priority</th>
              <th className="px-3 py-2.5 text-left text-[11px] font-semibold text-gray-600 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {pageRows.map((row) => (
              <ProjectRow key={row.id} row={row} />
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="py-8 text-center text-sm text-gray-400">
                  No tasks match the selected filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-3 px-1">
          <p className="text-[12px] text-gray-500">
            {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1 rounded text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              aria-label="Previous page"
            >
              <ChevronLeft width={16} height={16} />
            </button>
            <span className="text-[12px] text-gray-600 px-2">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-1 rounded text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              aria-label="Next page"
            >
              <ChevronRight width={16} height={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
