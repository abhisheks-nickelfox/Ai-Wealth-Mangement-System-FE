import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ChevronRight,
  ArrowNarrowLeft,
  DotsVertical,
  Edit01,
  Trash01,
  FileCheck01,
  Paperclip,
  Send01,
  Plus,
} from '@untitled-ui/icons-react';
import Avatar from '../components/ui/Avatar';
import AvatarStack from '../components/ui/AvatarStack';
import DropdownMenu from '../components/ui/DropdownMenu';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { useQuery } from '@tanstack/react-query';
import { tasksApi } from '../lib/api';
import { queryKeys } from '../lib/queryKeys';
import { useMessages, useSendMessage } from '../hooks/useMessages';
import { useFirmDetail, useProjects } from '../hooks/useFirms';
import { useUsers } from '../hooks/useUsers';
import { useCreateTask } from '../hooks/useTasks';
import TaskDetailPanel from '../components/firms/TaskDetailPanel';
import AddTaskModal from '../components/firms/AddTaskModal';
import type { TaskFormData } from '../components/firms/AddTaskModal';
import {
  TASK_STATUS_BADGE,
  PRIORITY_BADGE,
  StatusDot,
  formatDeadline,
} from '../components/firms/TaskRow';

import type { Task, Message } from '../lib/api';
import TaskIcon from '../components/icons/TaskIcon';

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function formatDateDivider(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  if (sameDay(d, today)) return 'Today';
  if (sameDay(d, yesterday)) return 'Yesterday';
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
}

function groupMessagesByDate(messages: Message[]): { date: string; messages: Message[] }[] {
  const groups: { date: string; messages: Message[] }[] = [];
  for (const msg of messages) {
    const label = formatDateDivider(msg.created_at);
    const last = groups[groups.length - 1];
    if (last && last.date === label) {
      last.messages.push(msg);
    } else {
      groups.push({ date: label, messages: [msg] });
    }
  }
  return groups;
}

function formatHoursSpent(hours: number | null | undefined): string {
  if (!hours) return '—';
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

// ── Activity Panel Tabs ───────────────────────────────────────────────────────

type ActivityTab = 'recent' | 'files' | 'notes';

const ACTIVITY_TABS: { id: ActivityTab; label: string }[] = [
  { id: 'recent', label: 'Recent' },
  { id: 'files',  label: 'Files & Links' },
  { id: 'notes',  label: 'Notes' },
];

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyActivityState({ tab }: { tab: ActivityTab }) {
  const messages: Record<ActivityTab, { icon: string; text: string }> = {
    recent: { icon: '💬', text: 'No messages yet. Start the conversation.' },
    files:  { icon: '📎', text: 'No files or links attached yet.' },
    notes:  { icon: '📝', text: 'No notes added yet.' },
  };
  const { icon, text } = messages[tab];
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-2 py-12 px-4 text-center">
      <span className="text-3xl" role="img" aria-hidden="true">{icon}</span>
      <p className="text-[13px] text-[#717680]">{text}</p>
    </div>
  );
}

// ── Date divider ──────────────────────────────────────────────────────────────

function DateDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="flex-1 h-px bg-[#E9EAEB]" />
      <span className="text-[11px] font-semibold text-[#A4A7AE] shrink-0">{label}</span>
      <div className="flex-1 h-px bg-[#E9EAEB]" />
    </div>
  );
}

// ── MessageBubble ─────────────────────────────────────────────────────────────

function MessageBubble({ message }: { message: Message }) {
  return (
    <div className="flex flex-col gap-1.5 mb-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Avatar
            name={message.user.name}
            src={message.user.avatar_url ?? undefined}
            size="sm"
            online
          />
          <span className="text-[13px] font-semibold text-[#181D27]">
            {message.user.name}
          </span>
        </div>
        <span className="text-[11px] text-[#A4A7AE] shrink-0">
          {formatTime(message.created_at)}
        </span>
      </div>
      <div className="ml-10 bg-white rounded-lg border border-[#E9EAEB] px-3 py-2.5 text-[13px] text-[#414651] leading-relaxed">
        {message.body}
      </div>
    </div>
  );
}

// ── Activity Panel ────────────────────────────────────────────────────────────

interface ActivityPanelProps {
  taskId: string;
}

function ActivityPanel({ taskId }: ActivityPanelProps) {
  const [activeTab, setActiveTab] = useState<ActivityTab>('recent');
  const [draft, setDraft]         = useState('');
  const textareaRef               = useRef<HTMLTextAreaElement>(null);
  const scrollRef                 = useRef<HTMLDivElement>(null);

  const { data: messages = [], isLoading } = useMessages('task', taskId);
  const sendMessage                        = useSendMessage();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length]);

  // Auto-resize textarea
  function handleTextareaChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setDraft(e.target.value);
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }

  async function handleSend() {
    const body = draft.trim();
    if (!body || sendMessage.isPending) return;
    setDraft('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    await sendMessage.mutateAsync({ scope: 'task', scope_id: taskId, body });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const groups = groupMessagesByDate(messages);

  return (
    <aside
      className="w-[380px] shrink-0 flex flex-col border-l border-[#E9EAEB] bg-[#FAFAFA] h-full"
      aria-label="Activity panel"
    >
      {/* Tab strip */}
      <div className="flex border-b border-[#E9EAEB] px-4 shrink-0 bg-white">
        {ACTIVITY_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`pb-2.5 pt-3 mr-5 text-[13px] font-semibold border-b-2 -mb-px transition-all ${
              activeTab === tab.id
                ? 'border-[#7F56D9] text-[#7F56D9]'
                : 'border-transparent text-[#717680] hover:text-[#414651]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content area */}
      {activeTab === 'recent' ? (
        <>
          {/* Messages scroll area */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto px-4 py-3 min-h-0"
          >
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <LoadingSpinner />
              </div>
            ) : messages.length === 0 ? (
              <EmptyActivityState tab="recent" />
            ) : (
              groups.map((group) => (
                <div key={group.date}>
                  <DateDivider label={group.date} />
                  {group.messages.map((msg) => (
                    <MessageBubble key={msg.id} message={msg} />
                  ))}
                </div>
              ))
            )}
          </div>

          {/* Message input */}
          <div className="shrink-0 border-t border-[#E9EAEB] bg-white px-3 py-2.5">
            <div className="flex items-end gap-2 rounded-lg border border-[#E9EAEB] px-3 py-2 focus-within:border-[#7F56D9] focus-within:ring-2 focus-within:ring-[#7F56D9]/10 transition-all bg-white">
              <textarea
                ref={textareaRef}
                value={draft}
                onChange={handleTextareaChange}
                onKeyDown={handleKeyDown}
                rows={1}
                placeholder="Message..."
                className="flex-1 resize-none text-[13px] text-[#181D27] placeholder-[#A4A7AE] outline-none bg-transparent leading-relaxed"
                aria-label="Type a message"
              />
              <button
                type="button"
                onClick={handleSend}
                disabled={!draft.trim() || sendMessage.isPending}
                aria-label="Send message"
                className="shrink-0 w-7 h-7 rounded-md flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed bg-[#7F56D9] hover:bg-[#6941C6] text-white"
              >
                <Send01 width={14} height={14} aria-hidden="true" />
              </button>
            </div>
            <p className="text-[10px] text-[#A4A7AE] mt-1.5 pl-0.5">
              Press Enter to send, Shift+Enter for new line
            </p>
          </div>
        </>
      ) : (
        <EmptyActivityState tab={activeTab} />
      )}
    </aside>
  );
}

// ── Sub-task row ──────────────────────────────────────────────────────────────

function SubTaskRow({ task, onClick }: { task: Task; onClick: () => void }) {
  const { text: dateText, overdue } = formatDeadline(task.deadline ?? null);
  const priorityStyle = PRIORITY_BADGE[task.priority] ?? 'bg-gray-100 text-gray-500';
  const assignees = task.assignees ?? [];

  return (
    <div
      className="flex items-center gap-3 px-3 py-2.5 border-b border-[#E9EAEB] last:border-0 hover:bg-[#F9FAFB] cursor-pointer transition-colors group"
      onClick={onClick}
    >
      <StatusDot status={task.status} />
      <TaskIcon width={13} height={13} className="text-[#A4A7AE] shrink-0" />
      <span className="flex-1 min-w-0 text-[13px] text-[#181D27] truncate group-hover:text-[#6941C6] transition-colors">{task.title}</span>
      {(() => {
        const s = TASK_STATUS_BADGE[task.status];
        return s ? (
          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold shrink-0 ${s.style}`}>
            {s.label}
          </span>
        ) : null;
      })()}
      {assignees.length > 0 && (
        <AvatarStack
          avatars={assignees.map((a) => ({ name: a.name, src: a.avatar_url ?? undefined }))}
          max={3}
          showAddButton={false}
        />
      )}
      <span className={`text-[11px] shrink-0 ${overdue ? 'text-red-500 font-medium' : 'text-[#717680]'}`}>
        {dateText}
      </span>
      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold capitalize shrink-0 ${priorityStyle}`}>
        {task.priority}
      </span>
    </div>
  );
}

// ── Metadata grid cell ────────────────────────────────────────────────────────

function MetaCell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-[#A4A7AE]">
        {label}
      </span>
      <div className="text-[13px] text-[#181D27]">{children}</div>
    </div>
  );
}

// ── TaskDetailPage ────────────────────────────────────────────────────────────

export default function TaskDetailPage() {
  const { firmId, taskId } = useParams<{ firmId: string; taskId: string }>();
  const navigate           = useNavigate();
  const [actionsOpen,    setActionsOpen]    = useState(false);
  const [selectedSubTask, setSelectedSubTask] = useState<import('../lib/api').Task | null>(null);
  const [showAddSubTask,  setShowAddSubTask]  = useState(false);

  const { data: firm,  isLoading: firmLoading  } = useFirmDetail(firmId!);
  const { data: task,  isLoading: taskLoading  } = useQuery<Task>({
    queryKey: queryKeys.tasks.detail(taskId!),
    queryFn:  () => tasksApi.get(taskId!),
    enabled:  !!taskId,
  });
  const { data: projects = [] } = useProjects(firmId);
  const { data: users    = [] } = useUsers();
  const createTask              = useCreateTask();

  const isSubTask   = !!task?.parent_task_id;
  const taskProject = task?.project_id ? projects.find((p) => p.id === task.project_id) ?? null : null;

  // Fetch parent task for breadcrumb when viewing a sub-task
  const { data: parentTask } = useQuery<Task>({
    queryKey: queryKeys.tasks.detail(task?.parent_task_id ?? ''),
    queryFn:  () => tasksApi.get(task!.parent_task_id!),
    enabled:  isSubTask,
  });

  const loading = firmLoading || taskLoading;

  const statusInfo  = task ? (TASK_STATUS_BADGE[task.status]  ?? { label: task.status,  style: 'bg-gray-100 text-gray-500' }) : null;
  const priorityStyle = task ? (PRIORITY_BADGE[task.priority] ?? 'bg-gray-100 text-gray-500') : null;
  const deadline      = task ? formatDeadline(task.deadline ?? null) : null;

  const assignees = task?.assignees ?? (
    task?.assignee_id && task?.assignee
      ? [{ id: task.assignee_id, name: task.assignee.name, email: task.assignee.email, avatar_url: null }]
      : []
  );

  const subTasks  = task?.subtasks ?? [];
  const timeSpent = task?.estimated_hours;

  const priorityMap: Record<string, 'low' | 'normal' | 'high' | 'urgent'> = {
    Low: 'low', Medium: 'normal', High: 'high', Urgent: 'urgent',
  };

  async function handleCreateSubTask(data: TaskFormData) {
    await createTask.mutateAsync({
      firm_id: firmId!,
      project_id: task?.project_id ?? undefined,
      parent_task_id: taskId,
      title: data.title,
      description: data.description || undefined,
      type: (data.type as 'task' | 'design' | 'development' | 'account_management') || 'task',
      priority: priorityMap[data.priority] ?? 'normal',
      deadline: data.endDate || undefined,
      assignee_ids: data.assigneeIds,
    });
    setShowAddSubTask(false);
  }

  // ── Render: loading ───────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  // ── Render: not found ─────────────────────────────────────────────────────

  if (!task) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 text-center px-6">
        <TaskIcon width={40} height={40} className="text-[#C8CDD6]" />
        <p className="text-[15px] font-semibold text-[#181D27]">Task not found</p>
        <p className="text-[13px] text-[#717680]">
          This task may have been deleted or you may not have access.
        </p>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-[13px] font-semibold text-[#7F56D9] hover:text-[#6941C6] transition-colors"
        >
          <ArrowNarrowLeft width={15} height={15} aria-hidden="true" />
          Go back
        </button>
      </div>
    );
  }

  // ── Render: main ─────────────────────────────────────────────────────────

  return (
    <>
    <div className="flex h-full overflow-hidden bg-white">
      {/* ── Left column: task detail ── */}
      <div className="flex-1 min-w-0 flex flex-col overflow-y-auto">
        {/* Header */}
        <div className="px-8 pt-7 pb-0">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-[12px] text-[#717680] mb-5 flex-wrap" aria-label="Breadcrumb">
            <button
              type="button"
              onClick={() => navigate('/firms')}
              className="hover:text-[#7F56D9] transition-colors font-medium"
            >
              Firms
            </button>
            <ChevronRight width={12} height={12} className="text-[#C8CDD6]" aria-hidden="true" />
            <button
              type="button"
              onClick={() => navigate(`/firms/${firmId}`)}
              className="hover:text-[#7F56D9] transition-colors font-medium truncate max-w-[140px]"
            >
              {firm?.name ?? '...'}
            </button>
            {taskProject && (
              <>
                <ChevronRight width={12} height={12} className="text-[#C8CDD6]" aria-hidden="true" />
                <button
                  type="button"
                  onClick={() => navigate(`/firms/${firmId}`)}
                  className="hover:text-[#7F56D9] transition-colors font-medium"
                >
                  Projects
                </button>
                <ChevronRight width={12} height={12} className="text-[#C8CDD6]" aria-hidden="true" />
                <button
                  type="button"
                  onClick={() => navigate(`/firms/${firmId}/projects/${taskProject.id}`)}
                  className="hover:text-[#7F56D9] transition-colors font-medium truncate max-w-[140px]"
                >
                  {taskProject.name}
                </button>
              </>
            )}
            {isSubTask && parentTask && (
              <>
                <ChevronRight width={12} height={12} className="text-[#C8CDD6]" aria-hidden="true" />
                <button
                  type="button"
                  onClick={() => navigate(`/firms/${firmId}/tasks/${parentTask.id}`)}
                  className="hover:text-[#7F56D9] transition-colors font-medium truncate max-w-[140px]"
                >
                  {parentTask.title}
                </button>
              </>
            )}
            <ChevronRight width={12} height={12} className="text-[#C8CDD6]" aria-hidden="true" />
            <span className="truncate max-w-[200px] text-[#414651] font-semibold">{task.title}</span>
          </nav>

          {/* Title row */}
          <div className="flex items-start justify-between gap-4 mb-1">
            <h1 className="text-xl font-semibold text-[#181D27] leading-snug">{task.title}</h1>

            {/* Actions dropdown */}
            <div className="relative shrink-0 mt-0.5">
              <button
                type="button"
                onClick={() => setActionsOpen((v) => !v)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[#E9EAEB] text-[13px] font-medium text-[#414651] hover:bg-[#F9FAFB] transition-colors"
                aria-haspopup="true"
                aria-expanded={actionsOpen}
              >
                Actions
                <DotsVertical width={14} height={14} className="text-[#717680]" aria-hidden="true" />
              </button>
              <DropdownMenu
                open={actionsOpen}
                onClose={() => setActionsOpen(false)}
                align="right"
                items={[
                  {
                    label: 'Edit',
                    icon: <Edit01 width={14} height={14} className="text-[#717680]" aria-hidden="true" />,
                    onClick: () => setActionsOpen(false),
                  },
                  {
                    label: 'Convert to Template',
                    icon: <FileCheck01 width={14} height={14} className="text-[#717680]" aria-hidden="true" />,
                    onClick: () => setActionsOpen(false),
                  },
                  {
                    label: 'Delete',
                    icon: <Trash01 width={14} height={14} aria-hidden="true" />,
                    onClick: () => setActionsOpen(false),
                    variant: 'danger',
                  },
                ]}
              />
            </div>
          </div>

          {/* Subtitle */}
          <p className="text-[12px] text-[#A4A7AE] mb-6">
            Created on{' '}
            {new Date(task.created_at).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
            {task.ai_generated && (
              <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-purple-50 text-purple-600">
                AI generated
              </span>
            )}
          </p>
        </div>

        {/* ── Metadata grid ── */}
        <div className="px-8 py-5 border-y border-[#E9EAEB] grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-5">
          {/* Assignee */}
          <MetaCell label="Assignee">
            {assignees.length > 0 ? (
              <AvatarStack
                avatars={assignees.map((a) => ({
                  name: a.name,
                  src: 'avatar_url' in a && a.avatar_url ? a.avatar_url : undefined,
                }))}
                max={4}
                showAddButton={false}
              />
            ) : (
              <span className="text-[#A4A7AE]">Unassigned</span>
            )}
          </MetaCell>

          {/* Status */}
          <MetaCell label="Status">
            {statusInfo && (
              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold ${statusInfo.style}`}>
                <StatusDot status={task.status} />
                {statusInfo.label}
              </span>
            )}
          </MetaCell>

          {/* Priority */}
          <MetaCell label="Priority">
            {priorityStyle && (
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold capitalize ${priorityStyle}`}>
                {task.priority}
              </span>
            )}
          </MetaCell>

          {/* Due */}
          <MetaCell label="Due Date">
            {deadline ? (
              <span className={`text-[13px] font-medium ${deadline.overdue ? 'text-red-500' : 'text-[#181D27]'}`}>
                {deadline.text}
              </span>
            ) : (
              <span className="text-[#A4A7AE]">—</span>
            )}
          </MetaCell>

          {/* Task Type */}
          <MetaCell label="Task Type">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-50 text-purple-700 capitalize">
              {task.type.replace(/_/g, ' ')}
            </span>
          </MetaCell>

          {/* Timesheet */}
          <MetaCell label="Timesheet">
            <span className="text-[13px] text-[#181D27]">{formatHoursSpent(timeSpent)}</span>
          </MetaCell>
        </div>

        {/* ── Description ── */}
        <section className="px-8 py-5 border-b border-[#E9EAEB]" aria-labelledby="desc-heading">
          <h2 id="desc-heading" className="text-[12px] font-semibold uppercase tracking-wider text-[#A4A7AE] mb-3">
            Description
          </h2>
          {task.description ? (
            <p className="text-[14px] text-[#414651] leading-relaxed whitespace-pre-wrap">
              {task.description}
            </p>
          ) : (
            <p className="text-[13px] text-[#A4A7AE] italic">No description provided.</p>
          )}
        </section>

        {/* ── Attachments ── */}
        <section className="px-8 py-5 border-b border-[#E9EAEB]" aria-labelledby="attach-heading">
          <h2 id="attach-heading" className="text-[12px] font-semibold uppercase tracking-wider text-[#A4A7AE] mb-3">
            Attachments
          </h2>
          <div className="flex flex-col items-center justify-center py-6 rounded-lg border border-dashed border-[#E9EAEB] bg-[#FAFAFA] gap-2">
            <Paperclip width={20} height={20} className="text-[#C8CDD6]" aria-hidden="true" />
            <p className="text-[13px] text-[#A4A7AE]">No attachments yet</p>
            <p className="text-[11px] text-[#C8CDD6]">Drag and drop files here or click to browse</p>
          </div>
        </section>

        {/* ── Sub Tasks — only shown for top-level tasks, not sub-tasks ── */}
        {!isSubTask && (
          <section className="px-8 py-5" aria-labelledby="subtasks-heading">
            <div className="flex items-center gap-2 mb-3">
              <h2 id="subtasks-heading" className="text-[12px] font-semibold uppercase tracking-wider text-[#A4A7AE]">
                Sub Tasks
              </h2>
              {subTasks.length > 0 && (
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#F4F3FF] text-[10px] font-bold text-[#7F56D9]">
                  {subTasks.length}
                </span>
              )}
            </div>

            {subTasks.length > 0 ? (
              <div className="rounded-lg border border-[#E9EAEB] overflow-hidden">
                {subTasks.map((sub) => (
                  <SubTaskRow key={sub.id} task={sub} onClick={() => setSelectedSubTask(sub)} />
                ))}
              </div>
            ) : (
              <p className="text-[13px] text-[#A4A7AE] mb-3">No sub-tasks yet.</p>
            )}

            <button
              type="button"
              onClick={() => setShowAddSubTask(true)}
              className="group mt-3 flex items-center gap-2 text-[#717680] text-[13px] font-semibold hover:text-[#6941C6] transition-colors"
            >
              <span className="w-5 h-5 rounded-full border border-dashed border-gray-300 flex items-center justify-center shrink-0 text-gray-400 group-hover:border-[#7F56D9] group-hover:text-[#7F56D9] transition-colors">
                <Plus width={9} height={9} />
              </span>
              Add Sub-task
            </button>
          </section>
        )}
      </div>

      {/* ── Right column: activity panel ── */}
      <ActivityPanel taskId={taskId!} />
    </div>

    {/* Sub-task slide-over */}
    <TaskDetailPanel
      open={!!selectedSubTask}
      onClose={() => setSelectedSubTask(null)}
      task={selectedSubTask}
      firmId={firmId}
      users={users}
      onViewTask={() => {
        setSelectedSubTask(null);
        navigate(`/firms/${firmId}/tasks/${selectedSubTask?.id}`);
      }}
      viewLabel="View Sub-task"
    />

    {/* Add Sub-task modal */}
    <AddTaskModal
      open={showAddSubTask}
      onClose={() => setShowAddSubTask(false)}
      firmName={firm?.name}
      users={users}
      projects={projects}
      defaultProjectId={task?.project_id ?? undefined}
      parentTaskId={taskId}
      onCreate={handleCreateSubTask}
    />
    </>
  );
}
