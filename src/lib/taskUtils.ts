/**
 * Resolves the effective initial status for a new task.
 *
 * Rule: 'assigned' requires at least one assignee.
 * If the caller requests 'assigned' but provides no assignees, fall back to 'to_do'
 * so the task is never left in 'assigned' limbo.
 *
 * Apply this in every handleCreateTask that forwards initial_status to the API.
 */
export function resolveInitialStatus(
  initialStatus: string | undefined,
  assigneeIds: string[],
): string | undefined {
  if (!initialStatus) return undefined;
  if (initialStatus === 'assigned' && assigneeIds.length === 0) return 'to_do';
  return initialStatus;
}
