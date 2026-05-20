import { useRef, useEffect, useState } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import {
  ChevronDown,
  X,
} from '@untitled-ui/icons-react';
import HelpTooltip from '../ui/HelpTooltip';
import SlideOver from '../ui/SlideOver';
import Input from '../ui/Input';
import DatePickerField from '../ui/DatePickerField';
import AssigneePicker from '../ui/AssigneePicker';
import { PRIORITY_DOT, PRIORITY_OPTIONS } from './TaskBadges';
import FileUploadZone, {
  type UploadedFile,
  createUploadedFile,
  revokeUploadedFiles,
} from '../ui/FileUploadZone';
import { useClickOutside } from '../../hooks/useClickOutside';
import { useTaskTypes } from '../../hooks/useTaskTypes';
import {
  createTaskSchema,
  taskInitialValues,
  type TaskFormValues,
  type TaskPriority,
} from '../../validations/task.validations';
import type { User, Project, TaskType } from '../../lib/api';

function filterByTaskType(taskType: TaskType | undefined, allUsers: User[]): User[] {
  if (!taskType?.members?.length) return allUsers;
  return allUsers.filter((u) => taskType.members.some((m) => m.id === u.id));
}

// ── Public types ──────────────────────────────────────────────────────────────

export interface AddTaskModalProps {
  open: boolean;
  onClose: () => void;
  firmName?: string;
  users?: User[];
  projects?: Project[];
  defaultProjectId?: string;
  defaultStatus?: string;
  /** When set, this modal creates a sub-task under this parent task ID. */
  parentTaskId?: string;
  /** Deadline of the parent task — sub-task end date must not exceed it. */
  parentTaskDeadline?: string;
  /** Start date of the parent task — sub-task start date must not be before it. */
  parentTaskStartDate?: string;
  onCreate?: (data: TaskFormData) => Promise<void>;
}

/** Data emitted to the parent on successful submission. */
export interface TaskFormData {
  title: string;
  description: string;
  type: string;
  task_type_id?: string;
  priority: TaskPriority;
  projectId: string;
  assigneeIds: string[];
  startDate: string;
  endDate: string;
  files: File[];
  initialStatus?: string;
  parentTaskId?: string;
}


// ── Main component ────────────────────────────────────────────────────────────

export default function AddTaskModal({
  open,
  onClose,
  firmName = '',
  users = [],
  projects = [],
  defaultProjectId = '',
  defaultStatus,
  parentTaskId,
  parentTaskDeadline,
  parentTaskStartDate,
  onCreate,
}: AddTaskModalProps) {
  const { data: taskTypes = [] } = useTaskTypes();

  // Files are managed outside Formik (File objects aren't serialisable values)
  const [files, setFiles] = useState<UploadedFile[]>([]);

  const typeRef     = useRef<HTMLDivElement>(null);
  const projectRef  = useRef<HTMLDivElement>(null);
  const priorityRef = useRef<HTMLDivElement>(null);
  const [showTypeMenu,     setShowTypeMenu]     = useState(false);
  const [showProjectMenu,  setShowProjectMenu]  = useState(false);
  const [showPriorityMenu, setShowPriorityMenu] = useState(false);

  useClickOutside(typeRef,     () => setShowTypeMenu(false));
  useClickOutside(projectRef,  () => setShowProjectMenu(false));
  useClickOutside(priorityRef, () => setShowPriorityMenu(false));

  // Sync defaultProjectId and reset startDate to today when modal opens
  const formikRef = useRef<import('formik').FormikProps<TaskFormValues>>(null);
  useEffect(() => {
    if (open && formikRef.current) {
      formikRef.current.setFieldValue('projectId', defaultProjectId);
      formikRef.current.setFieldValue('startDate', new Date().toISOString().slice(0, 10));
    }
  }, [open, defaultProjectId]);

  const schema = createTaskSchema(!parentTaskId);

  function handleClose(resetForm: () => void) {
    revokeUploadedFiles(files);
    setFiles([]);
    setShowTypeMenu(false);
    setShowProjectMenu(false);
    setShowPriorityMenu(false);
    resetForm();
    onClose();
  }

  async function handleSubmit(
    values: TaskFormValues,
    { setSubmitting, resetForm }: import('formik').FormikHelpers<TaskFormValues>,
  ) {
    try {
      await onCreate?.({
        title:         values.title,
        description:   values.description,
        type:          'task',
        task_type_id:  values.taskTypeId || undefined,
        priority:      values.priority,
        projectId:     values.projectId,
        assigneeIds:   values.assigneeIds,
        startDate:     values.startDate,
        endDate:       values.endDate,
        files:         files.map((f) => f.file),
        initialStatus: defaultStatus,
        parentTaskId,
      });
      revokeUploadedFiles(files);
      setFiles([]);
      resetForm();
      onClose();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Formik
      innerRef={formikRef}
      initialValues={taskInitialValues(defaultProjectId)}
      validationSchema={schema}
      validate={(values) => {
        const errs: Partial<Record<keyof typeof values, string>> = {};
        const proj = values.projectId ? projects.find((p) => p.id === values.projectId) : undefined;

        // start date constraints
        if (values.startDate) {
          if (proj?.start_date && values.startDate < proj.start_date) {
            errs.startDate = `Start date cannot be before project start date (${proj.start_date})`;
          } else if (parentTaskStartDate && values.startDate < parentTaskStartDate) {
            errs.startDate = `Sub-task start date cannot be before parent task start date (${parentTaskStartDate})`;
          } else if (values.startDate && values.endDate && values.startDate > values.endDate) {
            errs.startDate = 'Start date cannot be after end date';
          }
        }

        // end date constraints
        if (values.endDate) {
          if (proj?.end_date && values.endDate > proj.end_date) {
            errs.endDate = `End date cannot exceed project due date (${proj.end_date})`;
          } else if (parentTaskDeadline && values.endDate > parentTaskDeadline) {
            errs.endDate = `Sub-task due date cannot exceed parent task due date (${parentTaskDeadline})`;
          } else if (proj?.start_date && values.endDate < proj.start_date) {
            errs.endDate = `End date cannot be before project start date (${proj.start_date})`;
          } else if (values.startDate && values.endDate < values.startDate) {
            errs.endDate = 'End date must be on or after start date';
          }
        }
        return errs;
      }}
      validateOnBlur
      validateOnChange
      onSubmit={handleSubmit}
    >
      {({ values, errors, touched, isSubmitting, setFieldValue, resetForm }) => {
        const selectedTaskType = taskTypes.find((t) => t.id === values.taskTypeId);
        const assignableUsers  = filterByTaskType(selectedTaskType, users);
        const selectedProject     = projects.find((p) => p.id === values.projectId);
        const selectedProjectName = selectedProject?.name ?? '';

        return (
          <SlideOver
            open={open}
            onClose={() => handleClose(resetForm)}
            title={values.title.trim() || (parentTaskId ? 'Create Sub-task' : 'Create a Task')}
            subtitle={
              parentTaskId
                ? 'Creating a sub-task under the selected task'
                : (firmName || 'Fill in the details below')
            }
            width="max-w-[680px]"
            footer={
              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => handleClose(resetForm)}
                  className="px-4 py-2.5 rounded-lg border border-[#D5D7DA] bg-white text-sm font-semibold text-[#344054] hover:bg-[#F9FAFB] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="add-task-form"
                  disabled={isSubmitting}
                  className="px-4 py-2.5 rounded-lg bg-[#7F56D9] hover:bg-[#6941C6] disabled:opacity-50 text-white text-sm font-semibold transition-colors"
                >
                  {isSubmitting ? 'Creating…' : 'Create'}
                </button>
              </div>
            }
          >
            <Form id="add-task-form" className="flex flex-col gap-5" noValidate>

              {/* Task type */}
              <div ref={typeRef} className="relative">
                <label className="flex items-center gap-1 text-sm font-medium text-[#344054] mb-1.5">
                  Task Type <span className="text-red-500">*</span>
                  <HelpTooltip text="Categorise the work (e.g. Design, Development, Content) for filtering and reporting." position="top" />
                </label>
                <button
                  type="button"
                  onClick={() => setShowTypeMenu((v) => !v)}
                  className={`w-full flex items-center justify-between border rounded-lg px-3 py-2.5 text-sm bg-white hover:border-[#7F56D9] outline-none transition-colors ${
                    touched.taskTypeId && errors.taskTypeId
                      ? 'border-red-400 focus:ring-red-400'
                      : 'border-[#D5D7DA] focus:ring-2 focus:ring-[#7F56D9]'
                  }`}
                >
                  {selectedTaskType ? (
                    <span className="flex items-center gap-2 text-[#181D27]">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: selectedTaskType.color ?? '#6B7280' }}
                      />
                      {selectedTaskType.name}
                    </span>
                  ) : (
                    <span className="text-[#A4A7AE]">Select task type</span>
                  )}
                  <ChevronDown width={16} height={16} className="text-[#717680] shrink-0" />
                </button>
                {touched.taskTypeId && errors.taskTypeId && (
                  <p className="mt-1 text-xs text-red-500">{errors.taskTypeId}</p>
                )}
                {showTypeMenu && (
                  <div className="absolute top-full mt-1 left-0 right-0 z-20 bg-white border border-[#E9EAEB] rounded-xl shadow-lg py-1 max-h-52 overflow-y-auto">
                    {taskTypes.length === 0 ? (
                      <p className="px-3 py-2 text-sm text-[#717680]">No task types configured</p>
                    ) : (
                      taskTypes.map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => {
                            setFieldValue('taskTypeId', t.id);
                            setFieldValue('assigneeIds', []);
                            setShowTypeMenu(false);
                          }}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-[#F9FAFB] ${
                            values.taskTypeId === t.id ? 'text-[#7F56D9] font-semibold' : 'text-[#344054]'
                          }`}
                        >
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: t.color ?? '#6B7280' }}
                          />
                          {t.name}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Task name */}
              <div>
                <label className="block text-sm font-medium text-[#344054] mb-1.5">
                  {parentTaskId ? 'Sub-task Name' : 'Task Name'}{' '}
                  <span className="text-red-500">*</span>
                </label>
                <Field name="title">
                  {({ field }: import('formik').FieldProps) => (
                    <Input
                      {...field}
                      type="text"
                      placeholder={
                        parentTaskId
                          ? 'e.g. Write copy for hero section'
                          : 'e.g. Design homepage hero section'
                      }
                      error={touched.title && errors.title ? errors.title : undefined}
                    />
                  )}
                </Field>
              </div>

              {/* Description */}
              <div>
                <label className="flex items-center gap-1 text-sm font-medium text-[#344054] mb-1.5">
                  Description
                  <HelpTooltip text="Describe what needs to be done, acceptance criteria, and any relevant context." position="top" />
                </label>
                <Field
                  as="textarea"
                  name="description"
                  placeholder="A little about the task and what needs to be done."
                  rows={4}
                  className="w-full border border-[#D5D7DA] rounded-lg px-3 py-2.5 text-sm text-[#181D27] placeholder-[#A4A7AE] outline-none focus:ring-2 focus:ring-[#7F56D9] focus:border-transparent transition bg-white resize-none"
                />
                <ErrorMessage name="description" component="p" className="mt-1 text-xs text-red-500" />
              </div>

              {/* Project — hidden for sub-tasks */}
              {!parentTaskId && (
                <div ref={projectRef} className="relative">
                  <label className="flex items-center gap-1 text-sm font-medium text-[#344054] mb-1.5">
                    Project <span className="text-red-500">*</span>
                    <HelpTooltip text="The project this task belongs to. Dates will be constrained to the project's timeline." position="top" />
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowProjectMenu((v) => !v)}
                    className={`w-full flex items-center justify-between border rounded-lg px-3 py-2.5 text-sm bg-white hover:border-[#7F56D9] outline-none transition-colors ${
                      touched.projectId && errors.projectId
                        ? 'border-red-400'
                        : 'border-[#D5D7DA] focus:ring-2 focus:ring-[#7F56D9]'
                    }`}
                  >
                    {selectedProjectName
                      ? <span className="truncate text-[#181D27]">{selectedProjectName}</span>
                      : <span className="text-[#A4A7AE]">Select a project</span>
                    }
                    <ChevronDown width={16} height={16} className="text-[#717680] shrink-0 ml-2" />
                  </button>
                  {touched.projectId && errors.projectId && (
                    <p className="mt-1 text-xs text-red-500">{errors.projectId}</p>
                  )}
                  {showProjectMenu && (
                    <div className="absolute top-full mt-1 left-0 right-0 z-20 bg-white border border-[#E9EAEB] rounded-xl shadow-lg py-1 max-h-52 overflow-y-auto">
                      {projects.length === 0 ? (
                        <p className="px-3 py-2 text-sm text-[#717680]">No projects available</p>
                      ) : (
                        projects.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => {
                              setFieldValue('projectId', p.id);
                              // Clear dates that are now out of bounds for the new project
                              if (values.startDate && p.start_date && values.startDate < p.start_date) {
                                setFieldValue('startDate', '');
                              }
                              if (values.endDate) {
                                if ((p.end_date && values.endDate > p.end_date) ||
                                    (p.start_date && values.endDate < p.start_date)) {
                                  setFieldValue('endDate', '');
                                }
                              }
                              setShowProjectMenu(false);
                            }}
                            className={`w-full text-left px-3 py-2 text-sm hover:bg-[#F9FAFB] ${
                              values.projectId === p.id ? 'text-[#7F56D9] font-semibold' : 'text-[#344054]'
                            }`}
                          >
                            {p.name}
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Start date / End date / Assignee / Priority */}
              <div className="grid grid-cols-[1fr_1fr_auto_auto] gap-4 items-start">

                <DatePickerField
                  label="Start date"
                  required
                  value={values.startDate}
                  onChange={(v) => { setFieldValue('startDate', v); }}
                  min={(() => {
                    const minStart = parentTaskStartDate
                      ? (selectedProject?.start_date && selectedProject.start_date > parentTaskStartDate ? selectedProject.start_date : parentTaskStartDate)
                      : selectedProject?.start_date;
                    return minStart ?? undefined;
                  })()}
                  max={values.endDate || selectedProject?.end_date || undefined}
                  error={touched.startDate && errors.startDate ? errors.startDate : undefined}
                  clearable
                />

                <div>
                  <label className="flex items-center gap-1 text-sm font-medium text-[#344054] mb-1.5">
                    End date <span className="text-red-500">*</span>
                    <HelpTooltip text="When the task must be completed. Cannot exceed the project or parent task deadline." position="top" />
                    {(() => {
                      const cap = parentTaskDeadline
                        ? (selectedProject?.end_date && selectedProject.end_date < parentTaskDeadline ? selectedProject.end_date : parentTaskDeadline)
                        : selectedProject?.end_date;
                      return cap ? (
                        <span className="ml-1 text-[11px] font-normal text-[#A4A7AE]">(max {cap})</span>
                      ) : null;
                    })()}
                  </label>
                  <DatePickerField
                    value={values.endDate}
                    onChange={(v) => setFieldValue('endDate', v)}
                    min={values.startDate || selectedProject?.start_date || undefined}
                    max={(() => {
                      const maxDate = parentTaskDeadline
                        ? (selectedProject?.end_date && selectedProject.end_date < parentTaskDeadline ? selectedProject.end_date : parentTaskDeadline)
                        : selectedProject?.end_date;
                      return maxDate ?? undefined;
                    })()}
                    error={touched.endDate && errors.endDate ? errors.endDate : undefined}
                    clearable
                  />
                </div>

                <AssigneePicker
                  users={assignableUsers}
                  selected={values.assigneeIds}
                  onToggle={(id) => {
                    const next = values.assigneeIds.includes(id)
                      ? values.assigneeIds.filter((a) => a !== id)
                      : [...values.assigneeIds, id];
                    setFieldValue('assigneeIds', next);
                  }}
                />

                {/* Priority */}
                <div ref={priorityRef} className="relative">
                  <label className="flex items-center gap-1 text-sm font-medium text-[#344054] mb-1.5">
                    Priority <span className="text-red-500">*</span>
                    <HelpTooltip text="Urgent: drop everything · High: ASAP · Normal: standard · Low: backlog" position="top" />
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPriorityMenu((v) => !v)}
                    className="w-full border border-[#D5D7DA] rounded-lg px-3 py-2.5 text-sm text-[#181D27] outline-none focus:ring-2 focus:ring-[#7F56D9] transition bg-white flex items-center gap-2 whitespace-nowrap"
                  >
                    <span className={`w-2 h-2 rounded-full shrink-0 ${PRIORITY_DOT[values.priority]}`} />
                    {PRIORITY_OPTIONS.find((o) => o.value === values.priority)?.label ?? values.priority}
                    <ChevronDown width={14} height={14} className="ml-auto text-[#717680]" />
                  </button>
                  {showPriorityMenu && (
                    <div className="absolute bottom-full mb-1 left-0 z-10 bg-white border border-[#E9EAEB] rounded-xl shadow-lg py-1 min-w-[130px]">
                      {PRIORITY_OPTIONS.map(({ value, label }) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => {
                            setFieldValue('priority', value as TaskPriority);
                            setShowPriorityMenu(false);
                          }}
                          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-[#344054] hover:bg-[#F9FAFB]"
                        >
                          <span className={`w-2 h-2 rounded-full shrink-0 ${PRIORITY_DOT[value]}`} />
                          {label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Selected assignee chips */}
              {values.assigneeIds.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {assignableUsers
                    .filter((u) => values.assigneeIds.includes(u.id))
                    .map((u) => (
                      <div
                        key={u.id}
                        className="flex items-center gap-1.5 px-2.5 py-1 bg-[#F9F5FF] border border-[#E9D7FE] rounded-full"
                      >
                        <span className="text-xs font-medium text-[#6941C6] max-w-[120px] truncate">
                          {u.name}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setFieldValue(
                              'assigneeIds',
                              values.assigneeIds.filter((id) => id !== u.id),
                            )
                          }
                          className="text-[#9E77ED] hover:text-[#6941C6]"
                        >
                          <X width={12} height={12} />
                        </button>
                      </div>
                    ))}
                </div>
              )}

              {/* File upload */}
              <FileUploadZone
                label="Upload files"
                files={files}
                onAdd={(f) => setFiles((prev) => [...prev, createUploadedFile(f)])}
                onRemove={(idx) =>
                  setFiles((prev) => {
                    const copy = [...prev];
                    const removed = copy.splice(idx, 1)[0];
                    if (removed.preview) URL.revokeObjectURL(removed.preview);
                    return copy;
                  })
                }
              />

            </Form>
          </SlideOver>
        );
      }}
    </Formik>
  );
}
