import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ChevronRight,
  ChevronDown,
  DotsVertical,
  Edit01,
  Trash01,
  Paperclip,
  Send01,
  Plus,
  Dataflow03,
  Users01,
} from '@untitled-ui/icons-react';
import Avatar from '../components/ui/Avatar';
import AvatarStack from '../components/ui/AvatarStack';
import DropdownMenu from '../components/ui/DropdownMenu';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { useMessages, useSendMessage } from '../hooks/useMessages';
import { useFirmDetail, useProjects } from '../hooks/useFirms';
import { useTasksByFirm, useCreateTask, useUpdateTask } from '../hooks/useTasks';
import { useUsers } from '../hooks/useUsers';
import AddTaskModal from '../components/firms/AddTaskModal';
import TaskDetailPanel from '../components/firms/TaskDetailPanel';
import type { TaskFormData } from '../components/firms/AddTaskModal';
import type { TaskDetailData } from '../components/firms/TaskDetailPanel';
import {
  TASK_STATUS_BADGE,
  PRIORITY_BADGE,
  StatusDot,
  formatDeadline,
} from '../components/firms/TaskRow';
import { projectsApi } from '../lib/api';
import { queryKeys } from '../lib/queryKeys';
import type { Task, Message, Project } from '../lib/api';

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

const WORKFLOW_LABEL: Record<Project['workflow_status'], string> = {
  todo:        'To Do',
  in_progress: 'In Progress',
  in_review:   'In Review',
  approved:    'Approved',
  completed:   'Completed',
};

const WORKFLOW_DOT: Record<Project['workflow_status'], string> = {
  todo:        'bg-[#A4A7AE]',
  in_progress: 'bg-[#17B26A]',
  in_review:   'bg-[#F79009]',
  approved:    'bg-[#6941C6]',
  completed:   'bg-[#181D27]',
};

const PRIORITY_DOT: Record<Project['priority'], string> = {
  high:   'bg-orange-400',
  medium: 'bg-yellow-400',
  low:    'bg-green-500',
};

// ── Activity sub-components ───────────────────────────────────────────────────

type ActivityTab = 'recent' | 'files' | 'notes';
const ACTIVITY_TABS: { id: ActivityTab; label: string }[] = [
  { id: 'recent', label: 'Recent' },
  { id: 'files',  label: 'Files & Links' },
  { id: 'notes',  label: 'Notes' },
];

function EmptyActivityState({ tab }: { tab: ActivityTab }) {
  const map: Record<ActivityTab, { icon: string; text: string }> = {
    recent: { icon: '💬', text: 'No messages yet. Start the conversation.' },
    files:  { icon: '📎', text: 'No files or links attached yet.' },
    notes:  { icon: '📝', text: 'No notes added yet.' },
  };
  const { icon, text } = map[tab];
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-2 py-12 px-4 text-center">
      <span className="text-3xl" role="img" aria-hidden="true">{icon}</span>
      <p className="text-[13px] text-[#717680]">{text}</p>
    </div>
  );
}

function DateDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="flex-1 h-px bg-[#E9EAEB]" />
      <span className="text-[11px] font-semibold text-[#A4A7AE] shrink-0">{label}</span>
      <div className="flex-1 h-px bg-[#E9EAEB]" />
    </div>
  );
}

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
          <span className="text-[13px] font-semibold text-[#181D27]">{message.user.name}</span>
        </div>
        <span className="text-[11px] text-[#A4A7AE] shrink-0">{formatTime(message.created_at)}</span>
      </div>
      <div className="ml-10 bg-white rounded-lg border border-[#E9EAEB] px-3 py-2.5 text-[13px] text-[#414651] leading-relaxed">
        {message.body}
      </div>
    </div>
  );
}

function ActivityPanel({ projectId }: { projectId: string }) {
  const [activeTab, setActiveTab] = useState<ActivityTab>('recent');
  const [draft, setDraft]         = useState('');
  const textareaRef               = useRef<HTMLTextAreaElement>(null);
  const scrollRef                 = useRef<HTMLDivElement>(null);

  const { data: messages = [], isLoading } = useMessages('project', projectId);
  const sendMessage                        = useSendMessage();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length]);

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
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    await sendMessage.mutateAsync({ scope: 'project', scope_id: projectId, body });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const groups = groupMessagesByDate(messages);

  return (
    <aside className="w-[380px] shrink-0 flex flex-col border-l border-[#E9EAEB] bg-[#FAFAFA] h-full" aria-label="Activity panel">
      {/* Tabs */}
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

      {activeTab === 'recent' ? (
        <>
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 min-h-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-8"><LoadingSpinner /></div>
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
              />
              <button
                type="button"
                onClick={handleSend}
                disabled={!draft.trim() || sendMessage.isPending}
                className="shrink-0 w-7 h-7 rounded-md flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed bg-[#7F56D9] hover:bg-[#6941C6] text-white"
              >
                <Send01 width={14} height={14} aria-hidden="true" />
              </button>
            </div>
            <p className="text-[10px] text-[#A4A7AE] mt-1.5">Press Enter to send, Shift+Enter for new line</p>
          </div>
        </>
      ) : (
        <EmptyActivityState tab={activeTab} />
      )}
    </aside>
  );
}

// ── Tree task row ─────────────────────────────────────────────────────────────

interface TreeTaskRowProps {
  task:          Task;
  depth?:        number;
  onOpen:        (task: Task) => void;
  onAddSubTask?: (parentTask: Task) => void;
}

function TreeTaskRow({ task, depth = 0, onOpen, onAddSubTask }: TreeTaskRowProps) {
  const [expanded, setExpanded] = useState(true);
  const hasSubTasks = (task.subtasks?.length ?? 0) > 0;
  const isSubTask   = depth > 0;

  const { text: dateText, overdue } = formatDeadline(task.deadline ?? null);
  const statusInfo    = TASK_STATUS_BADGE[task.status]  ?? { label: task.status,  style: 'bg-gray-100 text-gray-500' };
  const priorityStyle = PRIORITY_BADGE[task.priority]   ?? 'bg-gray-100 text-gray-500';
  const assignees     = task.assignees ?? [];

  const pl = isSubTask ? 52 : 12;

  return (
    <>
      {/* Task row */}
      <div
        className="group flex items-center gap-2 py-2.5 pr-3 border-b border-[#E9EAEB] hover:bg-[#F9FAFB] transition-colors cursor-pointer"
        style={{ paddingLeft: `${pl}px` }}
        onClick={() => onOpen(task)}
      >
        {/* Expand chevron */}
        <button
          type="button"
          className="shrink-0"
          onClick={(e) => { e.stopPropagation(); if (hasSubTasks) setExpanded((v) => !v); }}
        >
          {hasSubTasks
            ? (expanded
                ? <ChevronDown  width={13} height={13} className="text-[#717680]" />
                : <ChevronRight width={13} height={13} className="text-[#717680]" />)
            : <ChevronRight width={13} height={13} className="text-[#C8CDD6]" aria-hidden="true" />}
        </button>

        <StatusDot status={task.status} />

        <Dataflow03
          width={isSubTask ? 12 : 14}
          height={isSubTask ? 12 : 14}
          className="shrink-0 text-[#A4A7AE]"
          aria-hidden="true"
        />

        <span className="flex-1 min-w-0 text-[13px] text-[#181D27] truncate group-hover:text-[#7F56D9] transition-colors">
          {task.title}
          {!isSubTask && hasSubTasks && (
            <span className="ml-1.5 text-[11px] text-[#A4A7AE]">{task.subtasks!.length}</span>
          )}
        </span>

        {assignees.length > 0 && (
          <AvatarStack
            avatars={assignees.map((a) => ({ name: a.name, src: a.avatar_url ?? undefined }))}
            max={3}
            showAddButton={false}
          />
        )}

        <span className={`text-[12px] shrink-0 w-[90px] text-right ${overdue ? 'text-red-500 font-medium' : 'text-[#717680]'}`}>
          {dateText}
        </span>

        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold capitalize shrink-0 w-[70px] justify-center ${priorityStyle}`}>
          {task.priority}
        </span>

        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold shrink-0 w-[90px] justify-center ${statusInfo.style}`}>
          {statusInfo.label}
        </span>
      </div>

      {/* Sub-task tree block — only for top-level tasks */}
      {!isSubTask && onAddSubTask && (
        <div className="relative">
          {/* Vertical connector line — spans children + Add Sub-task button */}
          <div
            className="absolute top-0 bottom-[14px] w-px bg-[#E4E7EC]"
            style={{ left: `${pl + 18}px` }}
          />

          {hasSubTasks && expanded && task.subtasks!.map((sub) => (
            <div key={sub.id} className="relative">
              {/* Horizontal connector */}
              <div
                className="absolute top-1/2 h-px bg-[#E4E7EC]"
                style={{ left: `${pl + 18}px`, width: '12px' }}
              />
              <TreeTaskRow task={sub} depth={depth + 1} onOpen={onOpen} onAddSubTask={undefined} />
            </div>
          ))}

          {/* Add Sub-task row */}
          <div className="relative">
            <div
              className="absolute top-1/2 h-px bg-[#E4E7EC]"
              style={{ left: `${pl + 18}px`, width: '12px' }}
            />
            <button
              type="button"
              className="flex items-center gap-2 py-[6px] pr-3 w-full text-left border-b border-[#E9EAEB] hover:bg-[#F4F3FF] transition-colors"
              style={{ paddingLeft: `${pl + 34}px` }}
              onClick={() => onAddSubTask(task)}
            >
              <span className="w-[14px] h-[14px] rounded-full border-2 border-dashed border-[#7F56D9] flex items-center justify-center shrink-0">
                <Plus width={7} height={7} className="text-[#7F56D9]" aria-hidden="true" />
              </span>
              <span className="text-[11px] font-semibold text-[#7F56D9]">Add Sub-task</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}

// ── MetaCell ──────────────────────────────────────────────────────────────────

function MetaCell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-[#A4A7AE]">{label}</span>
      <div className="text-[13px] text-[#181D27]">{children}</div>
    </div>
  );
}

// ── ProjectFullPage ───────────────────────────────────────────────────────────

export default function ProjectFullPage() {
  const { firmId, projectId } = useParams<{ firmId: string; projectId: string }>();
  const navigate              = useNavigate();
  const [actionsOpen,      setActionsOpen]      = useState(false);
  const [showAddSubTask,   setShowAddSubTask]   = useState(false);
  const [subTaskParentId,  setSubTaskParentId]  = useState<string | undefined>();
  const [selectedTask,     setSelectedTask]     = useState<Task | null>(null);

  const { data: firm,  isLoading: firmLoading  } = useFirmDetail(firmId!);
  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: queryKeys.projects.detail(projectId!),
    queryFn:  () => projectsApi.get(projectId!),
    enabled:  !!projectId,
  });
  const { data: users    = [] } = useUsers();
  const { data: projects = [] } = useProjects(firmId);
  const createTask             = useCreateTask();
  const updateTask             = useUpdateTask();
  const { data: allTasks = [], isLoading: tasksLoading } = useTasksByFirm(firmId!);

  const loading = firmLoading || projectLoading || tasksLoading;

  // Filter tasks belonging to this project
  const projectTasks = allTasks.filter((t) => t.project_id === projectId && !t.parent_task_id);

  async function handleSaveTask(taskId: string, data: TaskDetailData) {
    await updateTask.mutateAsync({
      id: taskId,
      payload: {
        title:        data.title,
        description:  data.description,
        priority:     data.priority,
        assignee_ids: data.assignee_ids,
        deadline:     data.deadline || undefined,
        project_id:   data.project_id,
      },
    });
    setSelectedTask(null);
  }

  async function handleCreateSubTask(data: TaskFormData) {
    await createTask.mutateAsync({
      firm_id:        firmId!,
      project_id:     projectId,
      parent_task_id: subTaskParentId,
      title:          data.title,
      description:    data.description || undefined,
      type:           data.type,
      priority:       data.priority,
      deadline:       data.deadline || undefined,
      assignee_ids:   data.assigneeIds,
    });
    setShowAddSubTask(false);
    setSubTaskParentId(undefined);
  }

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  // ── Not found ─────────────────────────────────────────────────────────────
  if (!project) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 text-center px-6">
        <Users01 width={40} height={40} className="text-[#C8CDD6]" aria-hidden="true" />
        <p className="text-[15px] font-semibold text-[#181D27]">Project not found</p>
        <button
          type="button"
          onClick={() => navigate(`/firms/${firmId}`)}
          className="inline-flex items-center gap-2 text-[13px] font-semibold text-[#7F56D9] hover:text-[#6941C6] transition-colors"
        >
          Back to firm
        </button>
      </div>
    );
  }

  const workflowLabel = WORKFLOW_LABEL[project.workflow_status];
  const workflowDot   = WORKFLOW_DOT[project.workflow_status];
  const priorityDot   = PRIORITY_DOT[project.priority];
  const endDate       = project.end_date
    ? new Date(project.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : null;

  // ── Main render ───────────────────────────────────────────────────────────
  return (
    <div className="flex h-full overflow-hidden bg-white">
      {/* ── Left: project detail ── */}
      <div className="flex-1 min-w-0 flex flex-col overflow-y-auto">
        {/* Header */}
        <div className="px-8 pt-7 pb-0">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-[12px] text-[#717680] mb-5" aria-label="Breadcrumb">
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
              className="hover:text-[#7F56D9] transition-colors font-medium"
            >
              {firm?.name ?? '...'}
            </button>
            <ChevronRight width={12} height={12} className="text-[#C8CDD6]" aria-hidden="true" />
            <span className="text-[#414651] font-medium truncate max-w-[240px]">{project.name}</span>
          </nav>

          {/* Title row */}
          <div className="flex items-start justify-between gap-4 mb-1">
            <div>
              <h1 className="text-xl font-semibold text-[#181D27] leading-snug">{project.name}</h1>
              {firm && (
                <p className="text-[12px] text-[#A4A7AE] mt-0.5">
                  {firm.name}
                  {project.firm_name && project.firm_name !== firm.name ? ` · ${project.firm_name}` : ''}
                </p>
              )}
            </div>

            {/* Actions */}
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
                    onClick: () => { setActionsOpen(false); navigate(`/firms/${firmId}`); },
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

          <p className="text-[12px] text-[#A4A7AE] mb-6">
            Created on{' '}
            {new Date(project.created_at).toLocaleDateString('en-US', {
              month: 'long', day: 'numeric', year: 'numeric',
            })}
          </p>
        </div>

        {/* ── Metadata grid ── */}
        <div className="px-8 py-5 border-y border-[#E9EAEB] grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-5">
          {/* Members */}
          <MetaCell label="Assignee">
            {project.members.length > 0 ? (
              <AvatarStack
                avatars={project.members.map((m) => ({ name: m.name, src: m.avatar_url ?? undefined }))}
                max={4}
                showAddButton={false}
              />
            ) : (
              <span className="text-[#A4A7AE]">No members</span>
            )}
          </MetaCell>

          {/* Status */}
          <MetaCell label="Status">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-[#F9FAFB] text-[#414651]">
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${workflowDot}`} />
              {workflowLabel}
            </span>
          </MetaCell>

          {/* Priority */}
          <MetaCell label="Priority">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-[#F9FAFB] text-[#414651] capitalize">
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${priorityDot}`} />
              {project.priority}
            </span>
          </MetaCell>

          {/* Due */}
          <MetaCell label="Due Date">
            {endDate ? (
              <span className="text-[13px] font-medium text-[#181D27]">{endDate}</span>
            ) : (
              <span className="text-[#A4A7AE]">—</span>
            )}
          </MetaCell>

          {/* Task count */}
          <MetaCell label="Task Count">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-50 text-purple-700">
              {projectTasks.length} task{projectTasks.length !== 1 ? 's' : ''}
            </span>
          </MetaCell>
        </div>

        {/* ── Description ── */}
        <section className="px-8 py-5 border-b border-[#E9EAEB]" aria-labelledby="desc-heading">
          <h2 id="desc-heading" className="text-[12px] font-semibold uppercase tracking-wider text-[#A4A7AE] mb-3">
            Description
          </h2>
          {project.description ? (
            <p className="text-[14px] text-[#414651] leading-relaxed whitespace-pre-wrap">
              {project.description}
            </p>
          ) : (
            <p className="text-[13px] text-[#A4A7AE] italic">No description provided.</p>
          )}
        </section>

        {/* ── Attachments placeholder ── */}
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

        {/* ── Sub Tasks (project tasks) ── */}
        <section className="px-8 py-5" aria-labelledby="tasks-heading">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <h2 id="tasks-heading" className="text-[12px] font-semibold uppercase tracking-wider text-[#A4A7AE]">
                Sub Tasks
              </h2>
              {projectTasks.length > 0 && (
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#F4F3FF] text-[10px] font-bold text-[#7F56D9]">
                  {projectTasks.length}
                </span>
              )}
            </div>
          </div>

          {projectTasks.length > 0 ? (
            <div className="rounded-lg border border-[#E9EAEB] overflow-hidden">
              {/* Column header */}
              <div className="flex items-center gap-2 px-3 py-2 bg-[#F9FAFB] border-b border-[#E9EAEB]">
                <span className="flex-1 text-[11px] font-semibold uppercase tracking-wider text-[#A4A7AE]">Task</span>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#A4A7AE] w-[90px] text-right">Due</span>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#A4A7AE] w-[70px] text-center">Priority</span>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#A4A7AE] w-[90px] text-center">Status</span>
              </div>
              {projectTasks.map((task) => (
                <TreeTaskRow
                  key={task.id}
                  task={task}
                  onOpen={(t) => setSelectedTask(t)}
                  onAddSubTask={(parent) => {
                    setSubTaskParentId(parent.id);
                    setShowAddSubTask(true);
                  }}
                />
              ))}
            </div>
          ) : (
            <p className="text-[13px] text-[#A4A7AE] mb-3">No tasks yet.</p>
          )}

          {/* Add task button */}
          <button
            type="button"
            onClick={() => navigate(`/firms/${firmId}`)}
            className="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-[#7F56D9] text-[#7F56D9] text-[13px] font-semibold hover:bg-[#F4F3FF] transition-colors"
          >
            <span className="w-[18px] h-[18px] rounded-full border-2 border-dashed border-[#7F56D9] flex items-center justify-center shrink-0">
              <Plus width={9} height={9} aria-hidden="true" />
            </span>
            Add Task
          </button>
        </section>
      </div>

      {/* ── Right: activity ── */}
      <ActivityPanel projectId={projectId!} />

      {/* ── Task detail drawer ── */}
      <TaskDetailPanel
        open={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        task={selectedTask}
        users={users}
        projects={projects}
        onSave={handleSaveTask}
        viewLabel={selectedTask?.parent_task_id ? 'View Sub Task' : 'View Task'}
        onViewTask={selectedTask ? () => {
          setSelectedTask(null);
          navigate(`/firms/${firmId}/tasks/${selectedTask.id}`);
        } : undefined}
      />

      {/* ── Add Sub-task modal ── */}
      <AddTaskModal
        open={showAddSubTask}
        onClose={() => { setShowAddSubTask(false); setSubTaskParentId(undefined); }}
        firmName={firm?.name}
        users={users}
        projects={projects}
        defaultProjectId={projectId}
        parentTaskId={subTaskParentId}
        onCreate={handleCreateSubTask}
      />
    </div>
  );
}
