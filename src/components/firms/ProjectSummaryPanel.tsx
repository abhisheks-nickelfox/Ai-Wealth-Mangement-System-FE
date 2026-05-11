import { useState, useEffect, useMemo } from 'react';
import {
  X, ChevronDown, Plus, Link01, Archive,
  Trash01, Edit01, Clock,
} from '@untitled-ui/icons-react';
import Avatar from '../ui/Avatar';
import AvatarStack from '../ui/AvatarStack';
import AttachmentsSection from '../tasks/AttachmentsSection';
import { useTasks } from '../../hooks/useTasks';
import { projectsApi } from '../../lib/api';
import type { User } from '../../lib/api';
import type { ProjectDetail } from './ProjectDetailPanel';

// ── Status config ─────────────────────────────────────────────────────────────

type ProjectStatus = ProjectDetail['status'];

const STATUS_STYLE: Record<ProjectStatus, { dot: string; pill: string }> = {
  'To Do':       { dot: '#A4A7AE', pill: 'bg-[#F2F4F7] text-[#344054]' },
  'In progress': { dot: '#7F56D9', pill: 'bg-[#F4F3FF] text-[#6941C6]' },
  'In Review':   { dot: '#F79009', pill: 'bg-[#FFFAEB] text-[#B54708]' },
  'Approved':    { dot: '#17B26A', pill: 'bg-[#ECFDF3] text-[#027A48]' },
  'Completed':   { dot: '#181D27', pill: 'bg-[#F2F4F7] text-[#181D27]' },
  'Blocked':     { dot: '#F04438', pill: 'bg-[#FFF1F3] text-[#C01048]' },
};

const STATUS_OPTIONS: ProjectStatus[] = [
  'To Do', 'In progress', 'In Review', 'Approved', 'Completed', 'Blocked',
];

const PRIORITY_STYLE: Record<string, { badge: string; dot: string }> = {
  high:   { badge: 'bg-[#FFF4ED] text-[#C4320A] border border-[#FDDCAB]', dot: '#C4320A' },
  medium: { badge: 'bg-[#FFFAEB] text-[#B54708] border border-[#FEDF89]', dot: '#B54708' },
  low:    { badge: 'bg-[#F6FEF9] text-[#027A48] border border-[#ABEFC6]', dot: '#027A48' },
};

const TASK_TYPE_COLOR: Record<string, string> = {
  task:               'bg-[#F2F4F7] text-[#344054]',
  design:             'bg-[#EEF4FF] text-[#3538CD]',
  content:            'bg-[#F0FDF4] text-[#166534]',
  development:        'bg-[#F4F3FF] text-[#5925DC]',
  account_management: 'bg-[#FFF1F3] text-[#C01048]',
};

const TASK_STATUS_DOT: Record<string, string> = {
  draft:              '#A4A7AE',
  in_progress:        '#7F56D9',
  assigned:           '#3538CD',
  revisions:          '#F79009',
  internal_review:    '#6941C6',
  client_review:      '#175CD3',
  compliance_review:  '#B54708',
  approved:           '#17B26A',
  closed:             '#181D27',
  completed:          '#181D27',
  blocked:            '#F04438',
};

const TASK_STATUS_BADGE: Record<string, { label: string; style: string }> = {
  draft:              { label: 'Draft',              style: 'bg-[#F2F4F7] text-[#717680]' },
  in_progress:        { label: 'In Progress',        style: 'bg-[#F4F3FF] text-[#6941C6]' },
  assigned:           { label: 'Assigned',           style: 'bg-[#EEF4FF] text-[#3538CD]' },
  revisions:          { label: 'Revisions',          style: 'bg-[#FFFAEB] text-[#B54708]' },
  internal_review:    { label: 'Internal Review',    style: 'bg-[#F4F3FF] text-[#5925DC]' },
  client_review:      { label: 'Client Review',      style: 'bg-[#EFF8FF] text-[#175CD3]' },
  compliance_review:  { label: 'Compliance Review',  style: 'bg-[#FFFAEB] text-[#B54708]' },
  approved:           { label: 'Approved',           style: 'bg-[#ECFDF3] text-[#027A48]' },
  closed:             { label: 'Closed',             style: 'bg-[#F2F4F7] text-[#344054]' },
  completed:          { label: 'Completed',          style: 'bg-[#ECFDF3] text-[#027A48]' },
  blocked:            { label: 'Blocked',            style: 'bg-[#FFF1F3] text-[#C01048]' },
  to_do:              { label: 'To Do',              style: 'bg-[#F2F4F7] text-[#717680]' },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(iso?: string | null): string {
  if (!iso) return '—';
  const today = new Date().toISOString().slice(0, 10);
  const d     = new Date(iso);
  const s     = iso.slice(0, 10);
  if (s === today) return 'Today';
  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
  if (s === tomorrow.toISOString().slice(0, 10)) return 'Tomorrow';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function fmtHours(h: number): string {
  if (h <= 0) return '0m';
  const hrs  = Math.floor(h);
  const mins = Math.round((h - hrs) * 60);
  if (hrs === 0)  return `${mins}m`;
  if (mins === 0) return `${hrs}hr`;
  return `${hrs}hr ${mins}m`;
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface ProjectSummaryPanelProps {
  open:       boolean;
  onClose:    () => void;
  project:    ProjectDetail | null;
  users:      User[];
  onEdit?:    (project: ProjectDetail) => void;
  onArchive?: (projectId: string) => void;
  onDelete?:  (project: ProjectDetail) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ProjectSummaryPanel({
  open, onClose, project, users,
  onEdit, onArchive, onDelete,
}: ProjectSummaryPanelProps) {
  const [actionsOpen, setActionsOpen] = useState(false);
  const [statusOpen,  setStatusOpen]  = useState(false);
  const [copied,      setCopied]      = useState(false);
  const [shareUrl,    setShareUrl]    = useState<string | null>(null);

  const { data: allProjectTasks = [] } = useTasks(
    project?.id ? { project_id: project.id } : undefined,
  );

  // Only top-level tasks (no parent) — sub-tasks have a parent_task_id set
  const projectTasks = useMemo(
    () => allProjectTasks.filter((t) => !t.parent_task_id),
    [allProjectTasks],
  );

  const taskTypes = useMemo(
    () => [...new Set(projectTasks.map((t) => t.type).filter(Boolean))],
    [projectTasks],
  );
  const totalHours = useMemo(
    () => allProjectTasks.reduce((s, t) => s + (t.estimated_hours ?? 0), 0),
    [allProjectTasks],
  );

  const members       = project ? users.filter((u) => project.memberIds.includes(u.id)) : [];
  const memberAvatars = members.map((u) => ({ name: u.name ?? '', src: u.avatar_url ?? undefined }));

  useEffect(() => {
    if (open) { setActionsOpen(false); setStatusOpen(false); }
  }, [open]);

  useEffect(() => {
    if (!open || !project) return;
    projectsApi.generateShareLink(project.id)
      .then(({ share_token }) => setShareUrl(`${window.location.origin}/shared/project/${share_token}`))
      .catch(() => {});
  }, [open, project?.id]);

  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [open, onClose]);

  if (!project) return null;

  const st        = STATUS_STYLE[project.status] ?? STATUS_STYLE['To Do'];
  const isOverdue = project.endDate && project.endDate < new Date().toISOString().slice(0, 10);

  function handleCopy() {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/20 transition-opacity duration-300 ${
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Panel */}
      <div
        className={`fixed inset-y-0 right-0 z-50 flex flex-col bg-white shadow-2xl transition-transform duration-300 ease-in-out w-full max-w-[700px] ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >

        {/* ── Header ───────────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between px-6 pt-6 pb-5 shrink-0">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            {/* Folder icon */}
            <div className="w-10 h-10 rounded-xl bg-[#F4F3FF] flex items-center justify-center shrink-0 mt-0.5">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path
                  d="M2.5 7.5C2.5 6.58333 3.25 5.83333 4.16667 5.83333H8.33333L10 7.5H15.8333C16.75 7.5 17.5 8.25 17.5 9.16667V15C17.5 15.9167 16.75 16.6667 15.8333 16.6667H4.16667C3.25 16.6667 2.5 15.9167 2.5 15V7.5Z"
                  stroke="#7F56D9" strokeWidth="1.4" strokeLinejoin="round"
                />
              </svg>
            </div>

            <div className="min-w-0">
              <h2 className="text-[17px] font-bold text-[#181D27] leading-snug">
                {project.name}
                {project.firmName && (
                  <span className="font-normal text-[#717680]">  {project.firmName}</span>
                )}
              </h2>
              {project.createdAt && (
                <p className="text-[12px] text-[#A4A7AE] mt-0.5">
                  Created on {new Date(project.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              )}
            </div>
          </div>

          {/* Actions + Close */}
          <div className="flex items-center gap-2 shrink-0 ml-4">
            <div className="relative">
              <button
                onClick={() => setActionsOpen((v) => !v)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#D0D5DD] bg-white text-[13px] font-semibold text-[#344054] hover:bg-[#F9FAFB] transition-colors shadow-sm"
              >
                Actions
                <ChevronDown width={13} height={13} className="text-[#717680]" aria-hidden="true" />
              </button>
              {actionsOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setActionsOpen(false)} />
                  <div className="absolute right-0 top-full mt-1.5 z-50 bg-white border border-[#E9EAEB] rounded-xl shadow-lg py-1.5 min-w-[172px]">
                    {onEdit && (
                      <button
                        onClick={() => { onEdit(project); setActionsOpen(false); onClose(); }}
                        className="flex items-center gap-2.5 w-full px-4 py-2.5 text-[13px] text-[#344054] hover:bg-[#F9FAFB]"
                      >
                        <Edit01 width={14} height={14} className="text-[#717680]" aria-hidden="true" />
                        Edit Project
                      </button>
                    )}
                    <button
                      onClick={() => { handleCopy(); setActionsOpen(false); }}
                      className="flex items-center gap-2.5 w-full px-4 py-2.5 text-[13px] text-[#344054] hover:bg-[#F9FAFB]"
                    >
                      <Link01 width={14} height={14} className="text-[#717680]" aria-hidden="true" />
                      {copied ? 'Copied!' : 'Copy Link'}
                    </button>
                    {onArchive && (
                      <button
                        onClick={() => { onArchive(project.id); setActionsOpen(false); }}
                        className="flex items-center gap-2.5 w-full px-4 py-2.5 text-[13px] text-[#344054] hover:bg-[#F9FAFB]"
                      >
                        <Archive width={14} height={14} className="text-[#717680]" aria-hidden="true" />
                        Archive
                      </button>
                    )}
                    {onDelete && (
                      <>
                        <div className="h-px bg-[#E9EAEB] my-1" />
                        <button
                          onClick={() => { onDelete(project); setActionsOpen(false); }}
                          className="flex items-center gap-2.5 w-full px-4 py-2.5 text-[13px] text-red-600 hover:bg-red-50"
                        >
                          <Trash01 width={14} height={14} aria-hidden="true" />
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-[#717680] hover:bg-[#F2F4F7] transition-colors"
              aria-label="Close panel"
            >
              <X width={16} height={16} aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* ── Body (scrollable) ─────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto border-t border-[#E9EAEB]">

          {/* ── Metadata: Row 1 — 4 columns ──────────────────────────────────── */}
          <div className="grid grid-cols-4 border-b border-[#E9EAEB]">

            {/* Assignee */}
            <div className="px-5 py-4 border-r border-[#E9EAEB]">
              <p className="text-[11px] font-semibold text-[#A4A7AE] uppercase tracking-wider mb-2.5">Assignee</p>
              <div className="flex items-center gap-2 flex-wrap">
                {memberAvatars.length > 0
                  ? <AvatarStack avatars={memberAvatars} max={3} />
                  : <span className="text-[12px] text-[#C8CAD0]">None</span>
                }
                <button
                  className="w-5 h-5 rounded-full border border-dashed border-[#D0D5DD] flex items-center justify-center text-[#A4A7AE] hover:border-[#7F56D9] hover:text-[#7F56D9] transition-colors"
                  aria-label="Add assignee"
                >
                  <Plus width={10} height={10} aria-hidden="true" />
                </button>
              </div>
            </div>

            {/* Status */}
            <div className="px-5 py-4 border-r border-[#E9EAEB] relative">
              <p className="text-[11px] font-semibold text-[#A4A7AE] uppercase tracking-wider mb-2.5">Status</p>
              <button
                onClick={() => setStatusOpen((v) => !v)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-semibold ${st.pill} hover:opacity-80 transition-opacity`}
              >
                <svg width="6" height="6" viewBox="0 0 6 6" fill="none" aria-hidden="true">
                  <circle cx="3" cy="3" r="3" fill={st.dot} />
                </svg>
                {project.status}
                <span className="opacity-60 text-[11px]">→</span>
              </button>
              {statusOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setStatusOpen(false)} />
                  <div className="absolute left-3 top-full mt-1 z-50 bg-white border border-[#E9EAEB] rounded-xl shadow-lg py-1.5 min-w-[160px]">
                    {STATUS_OPTIONS.map((opt) => {
                      const os = STATUS_STYLE[opt];
                      return (
                        <button
                          key={opt}
                          className={`flex items-center gap-2.5 w-full px-4 py-2 text-[13px] hover:bg-[#F9FAFB] ${project.status === opt ? 'font-semibold text-[#6941C6]' : 'text-[#344054]'}`}
                          onClick={() => setStatusOpen(false)}
                        >
                          <svg width="8" height="8" viewBox="0 0 8 8" fill="none" aria-hidden="true">
                            <circle cx="4" cy="4" r="4" fill={os.dot} />
                          </svg>
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            {/* Priority */}
            <div className="px-5 py-4 border-r border-[#E9EAEB]">
              <p className="text-[11px] font-semibold text-[#A4A7AE] uppercase tracking-wider mb-2.5">Priority</p>
              {project.priority ? (
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[12px] font-semibold capitalize ${PRIORITY_STYLE[project.priority]?.badge ?? 'bg-gray-100 text-gray-600'}`}>
                  {project.priority}
                </span>
              ) : (
                <span className="text-[12px] text-[#C8CAD0]">—</span>
              )}
            </div>

            {/* Due date */}
            <div className="px-5 py-4">
              <p className="text-[11px] font-semibold text-[#A4A7AE] uppercase tracking-wider mb-2.5">Due date</p>
              <span className={`text-[13px] font-semibold ${isOverdue ? 'text-red-500' : 'text-[#344054]'}`}>
                {fmtDate(project.endDate)}
              </span>
            </div>
          </div>

          {/* ── Metadata: Row 2 — 2 columns ──────────────────────────────────── */}
          <div className="grid grid-cols-2 border-b border-[#E9EAEB]">

            {/* Task Type */}
            <div className="px-5 py-4 border-r border-[#E9EAEB]">
              <p className="text-[11px] font-semibold text-[#A4A7AE] uppercase tracking-wider mb-2.5">Task Type</p>
              {taskTypes.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {taskTypes.map((t) => (
                    <span
                      key={t}
                      className={`px-2.5 py-0.5 rounded text-[12px] font-semibold capitalize ${TASK_TYPE_COLOR[t] ?? 'bg-[#F2F4F7] text-[#344054]'}`}
                    >
                      {t === 'account_management' ? 'Account' : t}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-[12px] text-[#C8CAD0]">—</span>
              )}
            </div>

            {/* Timesheet */}
            <div className="px-5 py-4">
              <p className="text-[11px] font-semibold text-[#A4A7AE] uppercase tracking-wider mb-2.5">Timesheet</p>
              <div className="flex items-center gap-2">
                {members[0] && (
                  <Avatar name={members[0].name} src={members[0].avatar_url ?? undefined} size="xs" className="shrink-0" />
                )}
                <span className="text-[13px] font-semibold text-[#344054]">{fmtHours(totalHours)}</span>
                <Clock width={13} height={13} className="text-[#A4A7AE]" aria-hidden="true" />
              </div>
            </div>
          </div>

          {/* ── Description ─────────────────────────────────────────────────── */}
          <div className="px-6 py-5 border-b border-[#E9EAEB]">
            <p className="text-[14px] font-semibold text-[#181D27] mb-2.5">Description</p>
            {project.description ? (
              <p className="text-[13px] text-[#535862] leading-relaxed whitespace-pre-wrap">
                {project.description}
              </p>
            ) : (
              <p className="text-[13px] text-[#A4A7AE] italic">No description added.</p>
            )}
          </div>

          {/* ── Attachments ─────────────────────────────────────────────────── */}
          <div className="px-6 py-5 border-b border-[#E9EAEB]">
            <AttachmentsSection projectId={project.id} />
          </div>

          {/* ── Custom Fields ────────────────────────────────────────────────── */}
          <div className="px-6 py-5 border-b border-[#E9EAEB]">
            <p className="text-[14px] font-semibold text-[#181D27] mb-3">Custom Fields</p>
            <div>
              <p className="text-[11px] font-semibold text-[#A4A7AE] uppercase tracking-wider mb-2">Service type</p>
              <div className="flex flex-wrap gap-2">
                {taskTypes.length > 0 ? taskTypes.map((t) => (
                  <span
                    key={t}
                    className="px-2.5 py-1 rounded-full text-[12px] font-medium bg-[#F4F3FF] text-[#6941C6] border border-[#D9D6FE] capitalize"
                  >
                    {t === 'account_management' ? 'Account management' : t}
                  </span>
                )) : (
                  <span className="px-2.5 py-1 rounded-full text-[12px] font-medium bg-[#F4F3FF] text-[#6941C6] border border-[#D9D6FE]">
                    General
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* ── Sub Tasks ───────────────────────────────────────────────────── */}
          <div className="px-6 py-5 border-b border-[#E9EAEB]">
            <div className="flex items-center gap-2 mb-3">
              <p className="text-[14px] font-semibold text-[#181D27]">Tasks</p>
              {projectTasks.length > 0 && (
                <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-[#F4F3FF] text-[10px] font-bold text-[#6941C6]">
                  {projectTasks.length}
                </span>
              )}
            </div>

            {projectTasks.length === 0 ? (
              <p className="text-[13px] text-[#A4A7AE]">No tasks in this project.</p>
            ) : (
              <div className="flex flex-col divide-y divide-[#F2F4F7] rounded-xl border border-[#E9EAEB] overflow-hidden">
                {projectTasks.map((task) => {
                  const assignees    = users.filter((u) => u.id === task.assignee_id);
                  const allAvatars   = assignees.map((u) => ({ name: u.name ?? '', src: u.avatar_url ?? undefined }));
                  const overdue      = task.deadline && task.deadline < new Date().toISOString().slice(0, 10);
                  const dotColor     = TASK_STATUS_DOT[task.status] ?? '#A4A7AE';
                  const priStyle     = task.priority && task.priority !== 'normal'
                    ? (task.priority === 'urgent' ? 'bg-red-50 text-red-600 border border-red-200'
                      : task.priority === 'high'   ? 'bg-[#FFF4ED] text-[#C4320A] border border-[#FDDCAB]'
                      :                              'bg-[#F6FEF9] text-[#027A48] border border-[#ABEFC6]')
                    : null;

                  return (
                    <div key={task.id} className="flex items-center gap-3 px-4 py-3 hover:bg-[#F9FAFB] transition-colors group">
                      {/* Expand icon */}
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0 text-[#C8CAD0]" aria-hidden="true">
                        <path d="M5 3L9 7L5 11" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>

                      {/* Status dot ring */}
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0" aria-hidden="true">
                        <circle cx="7" cy="7" r="5.5" stroke={dotColor} strokeWidth="1.2" />
                        <circle cx="7" cy="7" r="2.5" fill={dotColor} />
                      </svg>

                      {/* Folder icon */}
                      <svg width="13" height="13" viewBox="0 0 13 13" fill="none" className="shrink-0 text-[#7F56D9]" aria-hidden="true">
                        <path d="M1.625 4.875C1.625 4.33 2.08 3.875 2.625 3.875H5.125L6.375 5.125H10.375C10.92 5.125 11.375 5.58 11.375 6.125V9.875C11.375 10.42 10.92 10.875 10.375 10.875H2.625C2.08 10.875 1.625 10.42 1.625 9.875V4.875Z" stroke="currentColor" strokeWidth="1" strokeLinejoin="round" />
                      </svg>

                      {/* Task title */}
                      <span className="flex-1 min-w-0 text-[13px] text-[#344054] font-medium truncate">
                        {task.title}
                      </span>

                      {/* Status badge */}
                      {(() => {
                        const sb = TASK_STATUS_BADGE[task.status];
                        return sb ? (
                          <span className={`shrink-0 px-2 py-0.5 rounded text-[11px] font-semibold ${sb.style}`}>
                            {sb.label}
                          </span>
                        ) : null;
                      })()}

                      {/* Assignee avatars */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {allAvatars.length > 0 && (
                          <AvatarStack avatars={allAvatars} max={3} />
                        )}
                        <button
                          className="w-5 h-5 rounded-full border border-dashed border-[#D0D5DD] flex items-center justify-center text-[#A4A7AE] hover:border-[#7F56D9] hover:text-[#7F56D9] transition-colors opacity-0 group-hover:opacity-100"
                          aria-label="Add assignee to task"
                        >
                          <Plus width={9} height={9} aria-hidden="true" />
                        </button>
                      </div>

                      {/* Due date */}
                      {task.deadline ? (
                        <span className={`text-[12px] font-medium shrink-0 ${overdue ? 'text-red-500' : 'text-[#717680]'}`}>
                          {fmtDate(task.deadline)}
                        </span>
                      ) : (
                        <span className="text-[12px] text-[#C8CAD0] shrink-0">—</span>
                      )}

                      {/* Priority badge */}
                      {priStyle && (
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded capitalize shrink-0 ${priStyle}`}>
                          {task.priority}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>


        </div>
      </div>
    </>
  );
}
