import { useState } from 'react';
import { useUpdateTask } from './useTasks';
import { useUpdateProject } from './useFirms';
import type { Task, Project } from '../lib/api';

interface ConflictInfo {
  taskId:         string;
  taskTitle:      string;
  taskDeadline:   string;  // task's current deadline (YYYY-MM-DD)
  targetProject:  Project; // project being moved into
  newTaskDate:    string;  // editable in the modal
  newProjectDate: string;  // editable in the modal
}

export type { ConflictInfo };

export function useDeadlineConflict(
  tasks: Task[],
  projects: Project[],
  onError: (msg: string) => void,
) {
  const [conflict,       setConflict]       = useState<ConflictInfo | null>(null);
  const [conflictSaving, setConflictSaving] = useState(false);
  const updateTask    = useUpdateTask();
  const updateProject = useUpdateProject();

  /**
   * Checks whether moving `taskId` into `projectId` creates a deadline conflict.
   * If there is no conflict the task is moved immediately.
   * If there is a conflict, the conflict state is set so the caller can show a modal.
   */
  const checkAndMove = async (taskId: string, projectId: string | null) => {
    const targetProject = projects.find((p) => p.id === projectId);
    const task          = tasks.find((t) => t.id === taskId);

    if (!targetProject?.end_date) {
      try {
        await updateTask.mutateAsync({ id: taskId, payload: { project_id: projectId } });
      } catch (err) {
        onError(err instanceof Error ? err.message : 'Failed to update project');
      }
      return;
    }

    // Check if task deadline OR any sub-task deadline exceeds the target project end_date
    const taskConflicts = task?.deadline && targetProject.end_date && task.deadline > targetProject.end_date;
    const subConflicts  = targetProject.end_date != null && (task?.subtasks ?? []).some(
      (s) => s.deadline && s.deadline > targetProject.end_date!,
    );

    if (taskConflicts || subConflicts) {
      setConflict({
        taskId,
        taskTitle:    task!.title,
        taskDeadline: task?.deadline ?? targetProject.end_date,
        targetProject,
        newTaskDate: task?.deadline && task.deadline > targetProject.end_date!
          ? task.deadline
          : targetProject.end_date!,
        newProjectDate: targetProject.end_date!,
      });
      return;
    }

    try {
      await updateTask.mutateAsync({ id: taskId, payload: { project_id: projectId } });
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed to update project');
    }
  };

  /**
   * Confirms a pending conflict: updates the task deadline, clamps sub-task deadlines,
   * and optionally updates the project end date if the user changed it.
   */
  const confirmConflict = async () => {
    if (!conflict) return;
    setConflictSaving(true);
    try {
      const { taskId, targetProject, newTaskDate, newProjectDate } = conflict;

      // Update task: assign to project + clamp deadline
      await updateTask.mutateAsync({ id: taskId, payload: {
        project_id: targetProject.id,
        deadline:   newTaskDate,
      }});

      // Clamp any sub-task deadlines that exceed newTaskDate
      const task       = tasks.find((t) => t.id === taskId);
      const subUpdates = (task?.subtasks ?? [])
        .filter((s) => s.deadline && s.deadline > newTaskDate)
        .map((s) => updateTask.mutateAsync({ id: s.id, payload: { deadline: newTaskDate } }));
      await Promise.all(subUpdates);

      // Update project end_date if user changed it
      if (newProjectDate !== targetProject.end_date) {
        await updateProject.mutateAsync({ id: targetProject.id, payload: { end_date: newProjectDate } });
      }

      setConflict(null);
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed to resolve conflict');
    } finally {
      setConflictSaving(false);
    }
  };

  return {
    conflict,
    conflictSaving,
    setConflict,        // exposed so the modal's inline date inputs can patch the state
    checkAndMove,
    confirmConflict,
    dismissConflict: () => setConflict(null),
  };
}
