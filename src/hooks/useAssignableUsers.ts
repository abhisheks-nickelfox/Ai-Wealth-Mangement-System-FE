import { useTaskTypes } from './useTaskTypes';
import type { User } from '../lib/api';

/**
 * Returns the subset of `allUsers` that are assigned to the given task type.
 * Falls back to all users when the task type has no members configured.
 */
export function useAssignableUsers(
  taskTypeId: string | null | undefined,
  allUsers: User[],
): User[] {
  const { data: taskTypes = [] } = useTaskTypes();

  if (!taskTypeId) return allUsers;

  const taskType = taskTypes.find((t) => t.id === taskTypeId);
  if (!taskType?.members?.length) return allUsers;

  return allUsers.filter((u) => taskType.members.some((m) => m.id === u.id));
}
