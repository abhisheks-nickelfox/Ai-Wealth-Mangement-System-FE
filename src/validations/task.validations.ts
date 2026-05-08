import * as Yup from 'yup';

export const TASK_PRIORITIES = ['Urgent', 'High', 'Medium', 'Low'] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

/**
 * Yup schema for the Add Task / Add Sub-task form.
 * Pass `requireProject: true` for top-level tasks (project field is mandatory).
 * Pass `requireProject: false` for sub-tasks (project is inherited from parent).
 */
export const createTaskSchema = (requireProject: boolean) =>
  Yup.object({
    taskTypeId: Yup.string()
      .required('Task type is required'),

    title: Yup.string()
      .trim()
      .min(2, 'Task name must be at least 2 characters')
      .required('Task name is required'),

    description: Yup.string()
      .trim()
      .optional(),

    projectId: requireProject
      ? Yup.string().required('Project is required')
      : Yup.string().optional(),

    priority: Yup.string()
      .oneOf([...TASK_PRIORITIES], 'Select a valid priority')
      .required('Priority is required'),

    startDate: Yup.string()
      .required('Start date is required'),

    endDate: Yup.string()
      .required('End date (due date) is required')
      .test(
        'end-after-start',
        'End date must be on or after start date',
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
  defaultPriority: TaskPriority = 'High',
): TaskFormValues => ({
  taskTypeId:  '',
  title:       '',
  description: '',
  projectId:   defaultProjectId,
  priority:    defaultPriority,
  startDate:   '',
  endDate:     '',
  assigneeIds: [],
});
