import * as Yup from 'yup';

export const TASK_PRIORITIES = ['urgent', 'high', 'normal', 'low'] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

/**
 * Yup schema for the Add Task / Add Sub-task form.
 * Pass `requireProject: true` for top-level tasks (project field is mandatory).
 * Pass `requireProject: false` for sub-tasks (project is inherited from parent).
 */
export const createTaskSchema = (requireProject: boolean) =>
  Yup.object({
    taskTypeId: Yup.string()
      .required('Please select a task type'),

    title: Yup.string()
      .trim()
      .min(2, 'Task name must be at least 2 characters')
      .required('Please enter a name for this task'),

    description: Yup.string()
      .trim()
      .optional(),

    projectId: requireProject
      ? Yup.string().required('Please select a project for this task')
      : Yup.string().optional(),

    priority: Yup.string()
      .oneOf([...TASK_PRIORITIES], 'Please select a priority level')
      .required('Please select a priority level'),

    startDate: Yup.string()
      .required('Please select a start date'),

    endDate: Yup.string()
      .required('Please select a due date for this task')
      .test(
        'end-after-start',
        'Due date must be the same as or after the start date',
        function (endDate) {
          const { startDate } = this.parent as { startDate: string };
          if (!startDate || !endDate) return true;
          return endDate >= startDate;
        },
      ),

    assigneeIds: Yup.array(Yup.string().required()).optional().default([]),
  });

export type TaskFormValues = {
  taskTypeId: string;
  title: string;
  description: string;
  projectId: string;
  priority: TaskPriority;
  startDate: string;
  endDate: string;
  assigneeIds: string[];
};

export const taskInitialValues = (
  defaultProjectId = '',
  defaultPriority: TaskPriority = 'high',
): TaskFormValues => ({
  taskTypeId:  '',
  title:       '',
  description: '',
  projectId:   defaultProjectId,
  priority:    defaultPriority,
  startDate:   new Date().toISOString().slice(0, 10),
  endDate:     '',
  assigneeIds: [],
});
