import { useState } from 'react';
import { ChevronDown, ChevronRight, FilterLines } from '@untitled-ui/icons-react';
import AvatarStack from '../ui/AvatarStack';
import { PriorityBadge, TaskStatusBadge } from '../tasks/TaskBadges';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Project {
  id:        string;
  name:      string;
  tag?:      string;
  tagColor?: string;
  dot:       string;        // dot color
  client:    string;
  assignees: { name: string; bg: string }[];
  dueDate:   string;
  priority:  'low' | 'normal' | 'high' | 'urgent';
  status:    'in_progress' | 'draft' | 'resolved' | 'discarded' | 'internal_review';
  children?: Omit<Project, 'children'>[];
}

// ── Dummy data ────────────────────────────────────────────────────────────────

const AVATARS = [
  { name: 'Alice', bg: '#D6BBFB' },
  { name: 'Bob',   bg: '#93C5FD' },
  { name: 'Carol', bg: '#6EE7B7' },
  { name: 'Dave',  bg: '#FCA5A5' },
];

const PROJECTS: Project[] = [
  {
    id: '1', name: 'Website changes For AWP', tag: 'Website design', tagColor: '#EFF8FF',
    dot: '#F79009', client: 'Ashwati Capital', assignees: AVATARS, dueDate: 'Tomorrow',
    priority: 'high', status: 'in_progress',
    children: [
      { id: '1-1', name: 'Home page redesign',   dot: '#F79009', client: 'Ashwati Capital', assignees: AVATARS.slice(0,2), dueDate: 'Tomorrow', priority: 'high', status: 'in_progress' },
      { id: '1-2', name: 'Copy & Content update', dot: '#F79009', client: 'Ashwati Capital', assignees: AVATARS.slice(0,2), dueDate: 'Tomorrow', priority: 'normal', status: 'draft' },
    ],
  },
  {
    id: '2', name: 'Marketing Landing page',
    dot: '#2E90FA', client: 'Ashwati Capital', assignees: AVATARS.slice(0,3), dueDate: 'Tomorrow',
    priority: 'high', status: 'in_progress',
    children: [
      { id: '2-1', name: 'SEO Optimization', dot: '#2E90FA', client: 'Ashwati Capital', assignees: AVATARS.slice(0,2), dueDate: 'Tomorrow', priority: 'high', status: 'in_progress' },
    ],
  },
  {
    id: '3', name: 'Website changes For AWP', tag: 'Website design', tagColor: '#F4F3FF',
    dot: '#7F56D9', client: 'IGA Health', assignees: AVATARS, dueDate: 'Tomorrow',
    priority: 'high', status: 'in_progress',
  },
  {
    id: '4', name: 'Marketing Landing page',
    dot: '#17B26A', client: 'IGA Health', assignees: AVATARS.slice(1,4), dueDate: 'Tomorrow',
    priority: 'high', status: 'in_progress',
  },
  {
    id: '5', name: 'Website changes For AWP', tag: 'Website design', tagColor: '#EFF8FF',
    dot: '#F04438', client: 'Ashwati Capital', assignees: AVATARS, dueDate: 'Tomorrow',
    priority: 'high', status: 'in_progress',
  },
  {
    id: '6', name: 'Website changes For AWP', tag: 'Website design', tagColor: '#FFF6ED',
    dot: '#FAC515', client: 'Ashwati Capital', assignees: AVATARS.slice(0,3), dueDate: 'Tomorrow',
    priority: 'high', status: 'in_progress',
  },
  {
    id: '7', name: 'Marketing Landing page',
    dot: '#EE46BC', client: 'IGA Health', assignees: AVATARS.slice(0,2), dueDate: 'Tomorrow',
    priority: 'high', status: 'in_progress',
  },
];


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
  project:    Project | Omit<Project, 'children'>;
  depth?:     number;
  expanded?:  boolean;
  onToggle?:  () => void;
}

function ProjectRow({ project, depth = 0, expanded, onToggle }: RowProps) {
  const hasChildren = 'children' in project && !!project.children?.length;

  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors">

      {/* Project name */}
      <td className="py-2.5 pr-3">
        <div
          className="flex items-center gap-2"
          style={{ paddingLeft: depth > 0 ? `${depth * 20}px` : 0 }}
        >
          {hasChildren ? (
            <button onClick={onToggle} className="shrink-0 text-gray-400 hover:text-gray-600 p-0.5" aria-label={expanded ? 'Collapse' : 'Expand'}>
              {expanded
                ? <ChevronDown width={14} height={14} />
                : <ChevronRight width={14} height={14} />
              }
            </button>
          ) : (
            <span className="w-5 shrink-0" />
          )}

          <ProjectDot color={project.dot} />

          <span className={`text-[13px] font-semibold leading-tight ${depth > 0 ? 'text-gray-600' : 'text-gray-900'}`}>
            {project.name}
          </span>

          {project.tag && (
            <span
              className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md border border-blue-200 text-blue-700 shrink-0"
              style={{ backgroundColor: project.tagColor ?? '#EFF8FF' }}
            >
              {project.tag}
            </span>
          )}
        </div>
      </td>

      {/* Client */}
      <td className="py-2.5 pr-3">
        <span className="text-[12px] text-gray-700">{project.client}</span>
      </td>

      {/* Assignee */}
      <td className="py-2.5 pr-3">
        <AvatarStack avatars={project.assignees} max={3} showAddButton={false} />
      </td>

      {/* Due date */}
      <td className="py-2.5 pr-3">
        <span className="text-[12px] text-gray-700">{project.dueDate}</span>
      </td>

      {/* Priority */}
      <td className="py-2.5 pr-3">
        <PriorityBadge priority={project.priority} />
      </td>

      {/* Status */}
      <td className="py-2.5">
        <TaskStatusBadge status={project.status} />
      </td>
    </tr>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

const FIRMS     = ['All Firms', 'Ashwati Capital', 'IGA Health'];
const ASSIGNEES = ['All Assignees', 'Alice', 'Bob', 'Carol'];

export default function TasksTable() {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set(['1']));
  const [firmFilter,  setFirmFilter]  = useState('All Firms');
  const [firmOpen,    setFirmOpen]    = useState(false);
  const [assigneeFilter, setAssigneeFilter] = useState('All Assignees');
  const [assigneeOpen,   setAssigneeOpen]   = useState(false);

  const toggle = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const filtered = PROJECTS.filter((p) => {
    if (firmFilter !== 'All Firms' && p.client !== firmFilter) return false;
    if (assigneeFilter !== 'All Assignees' && !p.assignees.some((a) => a.name === assigneeFilter)) return false;
    return true;
  });

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
            label="Filter by firm" value={firmFilter} options={FIRMS}
            open={firmOpen} onToggle={() => { setFirmOpen((v) => !v); setAssigneeOpen(false); }}
            onSelect={setFirmFilter}
          />
          <FilterDropdown
            label="Filter by Assignee" value={assigneeFilter} options={ASSIGNEES}
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
            {filtered.flatMap((project) => {
              const isExpanded = expandedIds.has(project.id);
              const rows = [
                <ProjectRow
                  key={project.id}
                  project={project}
                  expanded={isExpanded}
                  onToggle={() => toggle(project.id)}
                />,
              ];
              if (isExpanded && project.children) {
                project.children.forEach((child) =>
                  rows.push(<ProjectRow key={child.id} project={child} depth={1} />)
                );
              }
              return rows;
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="py-8 text-center text-sm text-gray-400">
                  No projects match the selected filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
