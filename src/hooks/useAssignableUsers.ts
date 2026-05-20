import { useTaskTypes } from './useTaskTypes';
import type { User } from '../lib/api';

export function useAssignableUsers(
  taskTypeId: string | null | undefined,
  allUsers: User[],
): User[] {
  const { data: taskTypes = [] } = useTaskTypes();

  if (!taskTypeId) return allUsers;

  const taskType = taskTypes.find((t) => t.id === taskTypeId);
  // Task types not loaded yet — fall back to all users to avoid empty flash
  if (!taskType) return allUsers;
  // Task type found but no members configured → nobody is assignable
  if (!taskType.members?.length) return [];

  return allUsers.filter((u) => taskType.members.some((m) => m.id === u.id));
}
