import { useRef, useEffect, useState } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import {
  HelpCircle,
  CalendarDate,
  ChevronDown,
  X,
} from '@untitled-ui/icons-react';
import SlideOver from '../ui/SlideOver';
import Input from '../ui/Input';
import AssigneePicker from '../ui/AssigneePicker';
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
  TASK_PRIORITIES,
  type TaskFormValues,
  type TaskPriority,
} from '../../validations/task.validations';
import type { User, Project } from '../../lib/api';

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
  onCreate?: (data: TaskFormData) => Promise<void>;
}

/** Data emitted to the parent on successful submission. */
export interface TaskFormData {
  title: string;
  description: string;
  type: string;
  priority: TaskPriority;
  projectId: string;
  assigneeIds: string[];
  startDate: string;
  endDate: string;
  files: File[];
  initialStatus?: string;
  parentTaskId?: string;
}

// ── Priority dot colours ──────────────────────────────────────────────────────

const PRIORITY_DOT: Record<string, string> = {
  Urgent: 'bg-red-500',
  High:   'bg-orange-400',
  Medium: 'bg-yellow-400',
  Low:    'bg-green-500',
};

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

  // Sync defaultProjectId when modal opens
  const formikRef = useRef<import('formik').FormikProps<TaskFormValues>>(null);
  useEffect(() => {
    if (open && formikRef.current) {
      formikRef.current.setFieldValue('projectId', defaultProjectId);
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
    const selectedType = taskTypes.find((t) => t.id === values.taskTypeId);
    try {
      await onCreate?.({
        title:         values.title,
        description:   values.description,
        type:          selectedType?.name ?? values.taskTypeId,
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
        if (values.endDate) {
          if (values.projectId) {
            const proj = projects.find((p) => p.id === values.projectId);
            if (proj?.end_date && values.endDate > proj.end_date) {
              errs.endDate = `End date cannot exceed project due date (${proj.end_date})`;
            }
          }
          if (parentTaskDeadline && values.endDate > parentTaskDeadline) {
            errs.endDate = `Sub-task due date cannot exceed parent task due date (${parentTaskDeadline})`;
          }
        }
        return errs;
      }}
      validateOnBlur
      validateOnChange={false}
      onSubmit={handleSubmit}
    >
      {({ values, errors, touched, isSubmitting, setFieldValue, resetForm }) => {
        const selectedTaskType    = taskTypes.find((t) => t.id === values.taskTypeId);
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
                <label className="block text-sm font-medium text-[#344054] mb-1.5">
                  Task Type <span className="text-red-500">*</span>
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
                  <HelpCircle width={14} height={14} className="text-[#A4A7AE]" />
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
                  <label className="block text-sm font-medium text-[#344054] mb-1.5">
                    Project <span className="text-red-500">*</span>
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

                <div>
                  <label className="block text-sm font-medium text-[#344054] mb-1.5">
                    Start date <span className="text-red-500">*</span>
                  </label>
                  <Field name="startDate">
                    {({ field }: import('formik').FieldProps) => (
                      <Input
                        {...field}
                        type="date"
                        error={touched.startDate && errors.startDate ? errors.startDate : undefined}
                        rightIcon={<CalendarDate width={16} height={16} className="text-[#717680] pointer-events-none" />}
                      />
                    )}
                  </Field>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#344054] mb-1.5">
                    End date <span className="text-red-500">*</span>
                    {(() => {
                      const cap = parentTaskDeadline
                        ? (selectedProject?.end_date && selectedProject.end_date < parentTaskDeadline ? selectedProject.end_date : parentTaskDeadline)
                        : selectedProject?.end_date;
                      return cap ? (
                        <span className="ml-1 text-[11px] font-normal text-[#A4A7AE]">(max {cap})</span>
                      ) : null;
                    })()}
                  </label>
                  <Field name="endDate">
                    {({ field }: import('formik').FieldProps) => {
                      const maxDate = parentTaskDeadline
                        ? (selectedProject?.end_date && selectedProject.end_date < parentTaskDeadline ? selectedProject.end_date : parentTaskDeadline)
                        : selectedProject?.end_date;
                      return (
                      <Input
                        {...field}
                        type="date"
                        max={maxDate ?? undefined}
                        error={touched.endDate && errors.endDate ? errors.endDate : undefined}
                        rightIcon={<CalendarDate width={16} height={16} className="text-[#717680] pointer-events-none" />}
                      />
                      );
                    }}
                  </Field>
                </div>

                <AssigneePicker
                  users={users}
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
                  <label className="block text-sm font-medium text-[#344054] mb-1.5">
                    Priority <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPriorityMenu((v) => !v)}
                    className="w-full border border-[#D5D7DA] rounded-lg px-3 py-2.5 text-sm text-[#181D27] outline-none focus:ring-2 focus:ring-[#7F56D9] transition bg-white flex items-center gap-2 whitespace-nowrap"
                  >
                    <span className={`w-2 h-2 rounded-full shrink-0 ${PRIORITY_DOT[values.priority]}`} />
                    {values.priority}
                    <ChevronDown width={14} height={14} className="ml-auto text-[#717680]" />
                  </button>
                  {showPriorityMenu && (
                    <div className="absolute bottom-full mb-1 left-0 z-10 bg-white border border-[#E9EAEB] rounded-xl shadow-lg py-1 min-w-[130px]">
                      {TASK_PRIORITIES.map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => {
                            setFieldValue('priority', p as TaskPriority);
                            setShowPriorityMenu(false);
                          }}
                          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-[#344054] hover:bg-[#F9FAFB]"
                        >
                          <span className={`w-2 h-2 rounded-full shrink-0 ${PRIORITY_DOT[p]}`} />
                          {p}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Selected assignee chips */}
              {values.assigneeIds.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {users
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
