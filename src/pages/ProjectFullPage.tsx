import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ChevronRight,
  ChevronDown,
  X,
  Send01,
  Plus,
  Dataflow03,
  FolderClosed,
  ArrowRight,
  File06,
} from '@untitled-ui/icons-react';
import Avatar from '../components/ui/Avatar';
import AvatarStack from '../components/ui/AvatarStack';
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
  PRIORITY_BADGE,
  StatusDot,
  formatDeadline,
} from '../components/firms/TaskRow';
import { projectsApi } from '../lib/api';
import { queryKeys } from '../lib/queryKeys';
import type { Task, Message, Project } from '../lib/api';

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function formatDayLabel(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  if (sameDay(d, today)) return 'Today';
  if (sameDay(d, yesterday)) return 'Yesterday';
  return d.toLocaleDateString('en-US', { weekday: 'long' });
}

function groupByDay(messages: Message[]) {
  const out: { date: string; messages: Message[] }[] = [];
  for (const m of messages) {
    const label = formatDayLabel(m.created_at);
    const last = out[out.length - 1];
    if (last && last.date === label) last.messages.push(m);
    else out.push({ date: label, messages: [m] });
  }
  return out;
}

const WORKFLOW_LABEL: Record<Project['workflow_status'], string> = {
  todo: 'To Do', in_progress: 'In Progress', in_review: 'In Review', approved: 'Approved', completed: 'Completed',
};

// ── Activity panel ─────────────────────────────────────────────────────────────

type ActivityTab = 'recent' | 'files' | 'notes';
const TABS: { id: ActivityTab; label: string }[] = [
  { id: 'recent', label: 'Recent' },
  { id: 'files',  label: 'Files & Links' },
  { id: 'notes',  label: 'Notes' },
];

function DateDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 my-3">
      <div className="flex-1 h-px bg-[#E9EAEB]" />
      <span className="text-[11px] font-medium text-[#A4A7AE] shrink-0">{label}</span>
      <div className="flex-1 h-px bg-[#E9EAEB]" />
    </div>
  );
}

function MessageRow({ message, currentUserId }: { message: Message; currentUserId?: string }) {
  const isMe = message.user_id === currentUserId;

  if (isMe) {
    return (
      <div className="flex flex-col items-end gap-1 mb-4">
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-[#A4A7AE]">{formatTime(message.created_at)}</span>
          <span className="text-[12px] font-semibold text-[#414651]">You</span>
        </div>
        <div className="max-w-[80%] bg-white border border-[#E9EAEB] rounded-2xl rounded-tr-sm px-3.5 py-2.5 text-[13px] text-[#181D27] leading-relaxed shadow-sm">
          {message.body}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-2.5 mb-4">
      <Avatar name={message.user.name} src={message.user.avatar_url ?? undefined} size="sm" online className="shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[12px] font-semibold text-[#181D27]">{message.user.name}</span>
          <span className="text-[11px] text-[#A4A7AE]">{formatTime(message.created_at)}</span>
        </div>
        <div className="max-w-[85%] bg-white border border-[#E9EAEB] rounded-2xl rounded-tl-sm px-3.5 py-2.5 text-[13px] text-[#414651] leading-relaxed shadow-sm">
          {message.body}
        </div>
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
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages.length]);

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
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
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }

  const groups = groupByDay(messages);

  return (
    <aside className="w-[380px] shrink-0 flex flex-col border-l border-[#E9EAEB] bg-white h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3 shrink-0">
        <h2 className="text-[16px] font-semibold text-[#181D27]">Activity</h2>
        <button className="w-7 h-7 rounded-md flex items-center justify-center text-[#717680] hover:bg-[#F9FAFB] transition-colors">
          <X width={16} height={16} />
        </button>
      </div>

      {/* Tabs */}
      <div className="px-4 pb-3 shrink-0">
        <div className="flex items-center rounded-lg border border-[#D5D7DA] overflow-hidden">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2 text-[12px] font-semibold transition-all border-r last:border-r-0 border-[#D5D7DA] ${
                activeTab === tab.id
                  ? 'bg-white text-[#181D27]'
                  : 'bg-white text-[#717680] hover:text-[#414651] hover:bg-[#F9FAFB]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      <div className="h-px bg-[#E9EAEB] shrink-0" />

      {activeTab === 'recent' ? (
        <>
          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-2 min-h-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-10"><LoadingSpinner /></div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-2 text-center">
                <span className="text-3xl">💬</span>
                <p className="text-[13px] text-[#717680]">No messages yet. Start the conversation.</p>
              </div>
            ) : (
              groups.map((g) => (
                <div key={g.date}>
                  <DateDivider label={g.date} />
                  {g.messages.map((m) => <MessageRow key={m.id} message={m} />)}
                </div>
              ))
            )}
          </div>

          {/* Input */}
          <div className="shrink-0 border-t border-[#E9EAEB] px-4 py-3">
            <div className="flex items-end gap-2 rounded-xl border border-[#E9EAEB] bg-white px-3.5 py-2.5 focus-within:border-[#7F56D9] focus-within:ring-2 focus-within:ring-[#7F56D9]/10 transition-all">
              <textarea
                ref={textareaRef}
                value={draft}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                rows={1}
                placeholder="Message"
                className="flex-1 resize-none text-[13px] text-[#181D27] placeholder-[#A4A7AE] outline-none bg-transparent leading-relaxed"
              />
              <button
                type="button"
                onClick={handleSend}
                disabled={!draft.trim() || sendMessage.isPending}
                className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed bg-[#7F56D9] hover:bg-[#6941C6] text-white"
              >
                <Send01 width={13} height={13} />
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center gap-2 py-16 text-center px-4">
          <span className="text-3xl">{activeTab === 'files' ? '📎' : '📝'}</span>
          <p className="text-[13px] text-[#717680]">
            {activeTab === 'files' ? 'No files or links attached yet.' : 'No notes added yet.'}
          </p>
        </div>
      )}
    </aside>
  );
}

// ── Sub-task row (matches screenshot format exactly) ──────────────────────────

function SubTaskRow({ task, onOpen }: { task: Task; onOpen: (t: Task) => void }) {
  const { text: dateText, overdue } = formatDeadline(task.deadline ?? null);
  const priorityStyle = PRIORITY_BADGE[task.priority] ?? 'bg-gray-100 text-gray-500';
  const assignees = task.assignees ?? [];

  return (
    <div
      className="flex items-center gap-3 px-4 py-2.5 border-b border-[#F2F4F7] last:border-0 hover:bg-[#F9FAFB] cursor-pointer transition-colors group"
      onClick={() => onOpen(task)}
    >
      <StatusDot status={task.status} />
      <Dataflow03 width={13} height={13} className="text-[#A4A7AE] shrink-0" />
      <span className="flex-1 min-w-0 text-[13px] text-[#344054] truncate group-hover:text-[#6941C6] transition-colors">
        {task.title}
      </span>
      <div className="flex items-center gap-1 shrink-0">
        <AvatarStack
          avatars={assignees.map((a) => ({ name: a.name, src: a.avatar_url ?? undefined }))}
          max={3}
          showAddButton={true}
          addAs="div"
        />
      </div>
      <span className={`text-[12px] shrink-0 w-[80px] text-center ${overdue ? 'text-red-500 font-medium' : 'text-[#717680]'}`}>
        {dateText}
      </span>
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold capitalize shrink-0 ${priorityStyle}`}>
        {task.priority}
      </span>
    </div>
  );
}

// ── ProjectFullPage ────────────────────────────────────────────────────────────

export default function ProjectFullPage() {
  const { firmId, projectId } = useParams<{ firmId: string; projectId: string }>();
  const navigate              = useNavigate();
  const [actionsOpen,     setActionsOpen]     = useState(false);
  const [showAddSubTask,  setShowAddSubTask]  = useState(false);
  const [subTaskParentId, setSubTaskParentId] = useState<string | undefined>();
  const [selectedTask,    setSelectedTask]    = useState<Task | null>(null);

  const { data: firm    }               = useFirmDetail(firmId!);
  const { data: project, isLoading }    = useQuery({
    queryKey: queryKeys.projects.detail(projectId!),
    queryFn:  () => projectsApi.get(projectId!),
    enabled:  !!projectId,
  });
  const { data: allTasks = [] }         = useTasksByFirm(firmId!);
  const { data: users    = [] }         = useUsers();
  const { data: projects = [] }         = useProjects(firmId);
  const createTask                      = useCreateTask();
  const updateTask                      = useUpdateTask();

  const projectTasks = allTasks.filter((t) => t.project_id === projectId && !t.parent_task_id);

  async function handleSaveTask(taskId: string, data: TaskDetailData) {
    await updateTask.mutateAsync({ id: taskId, payload: {
      title: data.title, description: data.description, priority: data.priority,
      assignee_ids: data.assignee_ids, deadline: data.deadline || undefined, project_id: data.project_id,
    }});
    setSelectedTask(null);
  }

  const priorityMap: Record<string, 'low' | 'normal' | 'high' | 'urgent'> = {
    Low: 'low', Medium: 'normal', High: 'high', Urgent: 'urgent',
  };

  async function handleCreateSubTask(data: TaskFormData) {
    await createTask.mutateAsync({
      firm_id: firmId!, project_id: projectId, parent_task_id: subTaskParentId,
      title: data.title, description: data.description || undefined,
      type: (data.type as 'task' | 'design' | 'development' | 'account_management') || 'task',
      priority: priorityMap[data.priority] ?? 'normal',
      deadline: data.endDate || undefined,
      assignee_ids: data.assigneeIds,
    });
    setShowAddSubTask(false);
    setSubTaskParentId(undefined);
  }

  if (isLoading) {
    return <div className="flex h-full items-center justify-center"><LoadingSpinner /></div>;
  }
  if (!project) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3">
        <p className="text-[15px] font-semibold text-[#181D27]">Project not found</p>
        <button onClick={() => navigate(`/firms/${firmId}`)} className="text-[13px] text-[#7F56D9] font-semibold hover:underline">
          Back to firm
        </button>
      </div>
    );
  }

  const members  = project.members ?? [];
  const endDate  = project.end_date
    ? new Date(project.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : 'No due date';

  return (
    <div className="flex h-full overflow-hidden bg-[#FAFAFA]">

      {/* ── Left: main content ── */}
      <div className="flex-1 min-w-0 flex flex-col overflow-y-auto bg-white">

        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 px-8 pt-6 pb-0 flex-wrap">
          <button onClick={() => navigate('/firms')} className="text-[12px] text-[#717680] hover:text-[#6941C6] font-medium transition-colors">
            Firms
          </button>
          <ChevronRight width={12} height={12} className="text-[#C8CDD6]" />
          <button onClick={() => navigate(`/firms/${firmId}`)} className="text-[12px] text-[#717680] hover:text-[#6941C6] font-medium transition-colors truncate max-w-[160px]">
            {firm?.name ?? '...'}
          </button>
          <ChevronRight width={12} height={12} className="text-[#C8CDD6]" />
          <button onClick={() => navigate(`/firms/${firmId}`)} className="text-[12px] text-[#717680] hover:text-[#6941C6] font-medium transition-colors">
            Projects
          </button>
          <ChevronRight width={12} height={12} className="text-[#C8CDD6]" />
          <span className="text-[12px] font-semibold text-[#6941C6] truncate max-w-[200px]">
            {project.name}
          </span>
        </div>

        {/* Title section */}
        <div className="px-8 pt-4 pb-5 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <FolderClosed width={20} height={20} className="text-[#A4A7AE] shrink-0" />
              <h1 className="text-[20px] font-semibold text-[#181D27] leading-tight">{project.name}</h1>
            </div>
            <p className="text-[12px] text-[#A4A7AE] ml-[28px]">
              Created on {new Date(project.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>

          {/* Actions */}
          <div className="relative shrink-0">
            <button
              onClick={() => setActionsOpen(v => !v)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#D5D7DA] bg-white text-[13px] font-semibold text-[#344054] hover:bg-[#F9FAFB] transition-colors"
            >
              Actions
              <ChevronDown width={14} height={14} className="text-[#717680]" />
            </button>
            {actionsOpen && (
              <div className="absolute right-0 top-full mt-1 z-30 bg-white border border-[#E9EAEB] rounded-xl shadow-lg py-1 min-w-[180px]">
                {[
                  { label: 'Edit', onClick: () => { setActionsOpen(false); navigate(`/firms/${firmId}`); } },
                  { label: 'Delete (with safety)', danger: true, onClick: () => setActionsOpen(false) },
                  { label: 'Convert to Template', onClick: () => setActionsOpen(false) },
                ].map((item) => (
                  <button
                    key={item.label}
                    onClick={item.onClick}
                    className={`flex items-center gap-2.5 w-full px-3.5 py-2.5 text-[13px] text-left hover:bg-[#F9FAFB] transition-colors ${item.danger ? 'text-red-500' : 'text-[#344054]'}`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Metadata grid ── */}
        <div className="px-8 pb-6 grid grid-cols-3 gap-x-6 gap-y-5 border-b border-[#F2F4F7]">
          {/* Assignee */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#A4A7AE] mb-2">Assignee</p>
            {members.length > 0 ? (
              <div className="flex items-center gap-1">
                <AvatarStack
                  avatars={members.map((m) => ({ name: m.name, src: m.avatar_url ?? undefined }))}
                  max={3}
                  showAddButton={true}
                  addAs="div"
                />
                {members.length > 3 && (
                  <span className="text-[12px] text-[#717680] font-medium">+{members.length - 3}</span>
                )}
              </div>
            ) : (
              <span className="text-[13px] text-[#A4A7AE]">Unassigned</span>
            )}
          </div>

          {/* Status */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#A4A7AE] mb-2">Status</p>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#F9FAFB] border border-[#E9EAEB] text-[12px] font-medium text-[#344054]">
              {WORKFLOW_LABEL[project.workflow_status]}
              <ArrowRight width={12} height={12} className="text-[#A4A7AE]" />
            </div>
          </div>

          {/* Priority */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#A4A7AE] mb-2">Priority</p>
            <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[12px] font-semibold capitalize ${
              project.priority === 'high'   ? 'bg-red-50 text-red-600' :
              project.priority === 'medium' ? 'bg-yellow-50 text-yellow-700' :
                                              'bg-green-50 text-green-700'
            }`}>
              {project.priority}
            </span>
          </div>

          {/* Due date */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#A4A7AE] mb-2">Due date</p>
            <span className="text-[13px] font-medium text-[#344054]">{endDate}</span>
          </div>

          {/* Task Type */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#A4A7AE] mb-2">Task Type</p>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-50 text-purple-700">Design</span>
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-green-50 text-green-700">Content</span>
            </div>
          </div>

          {/* Timesheet */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#A4A7AE] mb-2">Timesheet</p>
            <div className="flex items-center gap-1.5">
              {members[0] && (
                <Avatar name={members[0].name} src={members[0].avatar_url ?? undefined} size="xs" />
              )}
              <span className="text-[13px] font-medium text-[#344054]">
                {project.ticket_count > 0 ? `${project.ticket_count * 2}hr` : '—'}
              </span>
            </div>
          </div>
        </div>

        {/* ── Description ── */}
        <section className="px-8 py-5 border-b border-[#F2F4F7]">
          <h2 className="text-[14px] font-semibold text-[#181D27] mb-3">Description</h2>
          {project.description ? (
            <p className="text-[14px] text-[#535862] leading-relaxed">{project.description}</p>
          ) : (
            <p className="text-[13px] text-[#A4A7AE] italic">No description provided.</p>
          )}
        </section>

        {/* ── Attachments ── */}
        <section className="px-8 py-5 border-b border-[#F2F4F7]">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[14px] font-semibold text-[#181D27]">Attachments</h2>
            <button className="text-[12px] font-semibold text-[#6941C6] hover:text-[#53389E] transition-colors">Edit</button>
          </div>
          {/* Placeholder file card */}
          <div className="flex items-center gap-3 p-3 rounded-xl border border-[#E9EAEB] bg-[#F9FAFB] w-fit">
            <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center shrink-0">
              <File06 width={18} height={18} className="text-red-500" />
            </div>
            <div>
              <p className="text-[13px] font-semibold text-[#181D27]">No attachments yet</p>
              <p className="text-[11px] text-[#A4A7AE]">Drop files here to attach</p>
            </div>
          </div>
        </section>

        {/* ── Custom Fields ── */}
        <section className="px-8 py-5 border-b border-[#F2F4F7]">
          <h2 className="text-[14px] font-semibold text-[#181D27] mb-3">Custom Fields</h2>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#A4A7AE] mb-2">Service type</p>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-full bg-[#F2F4F7] text-[12px] font-medium text-[#344054]">Hubspot management</span>
              <span className="px-3 py-1 rounded-full bg-[#F2F4F7] text-[12px] font-medium text-[#344054]">Financial copy writing</span>
            </div>
          </div>
        </section>

        {/* ── Tasks ── */}
        <section className="px-8 py-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-[14px] font-semibold text-[#181D27]">Tasks</h2>
              {projectTasks.length > 0 && (
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#F4F3FF] text-[10px] font-bold text-[#6941C6]">
                  {projectTasks.length}
                </span>
              )}
            </div>
          </div>

          {projectTasks.length > 0 ? (
            <div className="flex flex-col gap-2">
              {projectTasks.map((task) => {
                const subTasks = task.subtasks ?? [];
                return (
                  <div key={task.id} className="rounded-xl border border-[#E9EAEB] overflow-hidden">
                    {/* Parent task row */}
                    <SubTaskRow task={task} onOpen={setSelectedTask} />

                    {/* Nested sub-task rows */}
                    {subTasks.length > 0 && (
                      <div className="border-t border-[#F2F4F7]">
                        {subTasks.map((sub) => (
                          <div
                            key={sub.id}
                            className="flex items-center gap-3 px-4 py-2 border-b border-[#F2F4F7] last:border-0 hover:bg-[#F9FAFB] cursor-pointer transition-colors group bg-[#FAFAFA]"
                            onClick={() => setSelectedTask(sub)}
                          >
                            <div className="w-4 shrink-0" />
                            <div className="w-px h-4 bg-[#E4E7EC] shrink-0" />
                            <StatusDot status={sub.status} />
                            <Dataflow03 width={12} height={12} className="text-[#C8CDD6] shrink-0" />
                            <span className="flex-1 min-w-0 text-[12px] text-[#535862] truncate group-hover:text-[#6941C6] transition-colors">
                              {sub.title}
                            </span>
                            {(sub.assignees ?? []).length > 0 && (
                              <AvatarStack
                                avatars={(sub.assignees ?? []).map((a) => ({ name: a.name, src: a.avatar_url ?? undefined }))}
                                max={3}
                                showAddButton={false}
                              />
                            )}
                            {(() => {
                              const { text: dt, overdue } = formatDeadline(sub.deadline ?? null);
                              return (
                                <span className={`text-[11px] shrink-0 w-[80px] text-center ${overdue ? 'text-red-500 font-medium' : 'text-[#717680]'}`}>
                                  {dt}
                                </span>
                              );
                            })()}
                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold capitalize shrink-0 ${PRIORITY_BADGE[sub.priority] ?? 'bg-gray-100 text-gray-500'}`}>
                              {sub.priority}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add sub-task button per task */}
                    <div className="px-4 py-2 border-t border-[#F2F4F7] bg-[#FAFAFA]">
                      <button
                        type="button"
                        onClick={() => { setSubTaskParentId(task.id); setShowAddSubTask(true); }}
                        className="flex items-center gap-1.5 text-[12px] text-[#A4A7AE] hover:text-[#6941C6] transition-colors"
                      >
                        <span className="w-4 h-4 rounded-full border border-dashed border-[#A4A7AE] hover:border-[#6941C6] flex items-center justify-center shrink-0 transition-colors">
                          <Plus width={8} height={8} />
                        </span>
                        Add Sub-task
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-[13px] text-[#A4A7AE] mb-4">No tasks yet.</p>
          )}

          <button
            type="button"
            onClick={() => { setSubTaskParentId(undefined); setShowAddSubTask(true); }}
            className="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-[#7F56D9] text-[#6941C6] text-[13px] font-semibold hover:bg-[#F4F3FF] transition-colors"
          >
            <span className="w-[18px] h-[18px] rounded-full border-2 border-dashed border-[#7F56D9] flex items-center justify-center shrink-0">
              <Plus width={9} height={9} />
            </span>
            Add Task
          </button>
        </section>
      </div>

      {/* ── Right: Activity ── */}
      <ActivityPanel projectId={projectId!} />

      {/* Task detail drawer */}
      <TaskDetailPanel
        open={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        task={selectedTask}
        users={users}
        projects={projects}
        firmId={firmId}
        onSave={handleSaveTask}
        viewLabel={selectedTask?.parent_task_id ? 'View Sub Task' : 'View Task'}
        onViewTask={selectedTask ? () => {
          setSelectedTask(null);
          navigate(`/firms/${firmId}/tasks/${selectedTask.id}`);
        } : undefined}
      />

      {/* Add task modal */}
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
