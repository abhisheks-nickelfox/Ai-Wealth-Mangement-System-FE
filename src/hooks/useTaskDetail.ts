import { useQuery } from '@tanstack/react-query';
import { tasksApi } from '../lib/api';
import { queryKeys } from '../lib/queryKeys';
import { formatDeadline } from '../components/tasks/TaskRow';
import { useFirmDetail, useProjects } from './useFirms';
import { useActiveUsers } from './useUsers';
import { useAssignableUsers } from './useAssignableUsers';
import { useCreateTask, useUpdateTask } from './useTasks';
import type { Task } from '../lib/api';
import type { TaskDetailData } from '../components/tasks/TaskDetailPanel';
import type { TaskFormData } from '../components/tasks/AddTaskModal';

const PRIORITY_MAP: Record<string, 'low' | 'normal' | 'high' | 'urgent'> = {
  Low: 'low', Medium: 'normal', High: 'high', Urgent: 'urgent',
};

export function useTaskDetail(firmId: string | undefined, taskId: string | undefined) {
  const { data: firm,  isLoading: firmLoading } = useFirmDetail(firmId!);
  const { data: task,  isLoading: taskLoading } = useQuery<Task>({
    queryKey: queryKeys.tasks.detail(taskId!),
    queryFn:  () => tasksApi.get(taskId!),
    enabled:  !!taskId,
  });
  const { data: projects = [] } = useProjects(firmId);
  const { data: users    = [] } = useActiveUsers();
  const assignableUsers         = useAssignableUsers(task?.task_type_id, users);
  const createTask              = useCreateTask();
  const updateTask              = useUpdateTask();

  const isSubTask   = !!task?.parent_task_id;
  const taskProject = task?.project_id
    ? (projects.find((p) => p.id === task.project_id) ?? null)
    : null;

  const { data: parentTask } = useQuery<Task>({
    queryKey: queryKeys.tasks.detail(task?.parent_task_id ?? ''),
    queryFn:  () => tasksApi.get(task!.parent_task_id!),
    enabled:  isSubTask,
  });

  const loading  = firmLoading || taskLoading;
  const deadline = task ? formatDeadline(task.deadline ?? null) : null;
  const assignees = task?.assignees ?? (
    task?.assignee_id && task?.assignee
      ? [{ id: task.assignee_id, name: task.assignee.name, email: task.assignee.email, avatar_url: null }]
      : []
  );
  const subTasks  = task?.subtasks ?? [];
  const timeSpent = task?.estimated_hours;

  async function handleSaveTask(taskIdToSave: string, data: TaskDetailData) {
    await updateTask.mutateAsync({
      id: taskIdToSave,
      payload: {
        title:        data.title,
        description:  data.description,
        priority:     data.priority,
        assignee_ids: data.assignee_ids,
        deadline:     data.deadline || undefined,
        project_id:   data.project_id,
      },
    });
  }

  async function toggleTaskAssignee(userId: string) {
    if (!task) return;
    const current = (task.assignees ?? []).map((a) => a.id);
    const next = current.includes(userId)
      ? current.filter((id) => id !== userId)
      : [...current, userId];
    await updateTask.mutateAsync({ id: task.id, payload: { assignee_ids: next } }).catch(() => {});
  }

  async function handleCreateSubTask(firmId: string, data: TaskFormData) {
    await createTask.mutateAsync({
      firm_id:        firmId,
      project_id:     task?.project_id ?? undefined,
      parent_task_id: taskId,
      title:          data.title,
      description:    data.description || undefined,
      type:           'task',
      priority:       PRIORITY_MAP[data.priority] ?? 'normal',
      deadline:       data.endDate || undefined,
      assignee_ids:   data.assigneeIds,
    });
  }

  return {
    firm, task, projects, users, assignableUsers, parentTask,
    isSubTask, taskProject, loading, deadline, assignees, subTasks, timeSpent,
    updateTask, handleSaveTask, toggleTaskAssignee, handleCreateSubTask,
  };
}
