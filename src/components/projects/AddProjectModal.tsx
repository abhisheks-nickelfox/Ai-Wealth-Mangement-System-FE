import { useState, useRef } from 'react';
import { Formik, Form } from 'formik';
import {
  HelpCircle,
  CalendarDate,
  ChevronDown,
  X,
} from '@untitled-ui/icons-react';
import Avatar from '../ui/Avatar';
import AssigneePicker from '../ui/AssigneePicker';
import FileUploadZone, { type UploadedFile, createUploadedFile, revokeUploadedFiles } from '../ui/FileUploadZone';
import SlideOver from '../ui/SlideOver';
import Input from '../ui/Input';
import { useClickOutside } from '../../hooks/useClickOutside';
import type { User } from '../../lib/api';
import { createProjectSchema } from '../../validations/project.validations';

// ── Types ─────────────────────────────────────────────────────────────────────

interface AddProjectModalProps {
  open: boolean;
  onClose: () => void;
  firmName?: string;
  users?: User[];
  defaultWorkflowStatus?: string;
  existingProjectNames?: string[];
  onCreate?: (data: ProjectFormData) => Promise<void>;
}

export interface ProjectFormData {
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  assigneeIds: string[];
  priority: 'High' | 'Medium' | 'Low';
  files: File[];
  workflowStatus: string;
}

const PRIORITY_OPTIONS = ['High', 'Medium', 'Low'] as const;
const PRIORITY_DOT: Record<string, string> = {
  High:   'bg-red-500',
  Medium: 'bg-yellow-400',
  Low:    'bg-green-500',
};

const TEMPLATE_OPTIONS = [
  'No Templates Required',
  'Marketing Campaign',
  'Website Redesign',
  'Brand Strategy',
  'Social Media',
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function AddProjectModal({
  open,
  onClose,
  firmName = '',
  users = [],
  defaultWorkflowStatus = 'todo',
  existingProjectNames = [],
  onCreate,
}: AddProjectModalProps) {
  const [template,    setTemplate]    = useState('No Templates Required');
  const [description, setDescription] = useState('');
  const [startDate,   setStartDate]   = useState('');
  const [endDate,     setEndDate]     = useState('');
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
  const [priority,    setPriority]    = useState<'High' | 'Medium' | 'Low'>('High');
  const [files,       setFiles]       = useState<UploadedFile[]>([]);

  const [showTemplateMenu, setShowTemplateMenu] = useState(false);
  const [showPriorityMenu, setShowPriorityMenu] = useState(false);
  const templateRef = useRef<HTMLDivElement>(null);
  const priorityRef = useRef<HTMLDivElement>(null);
  useClickOutside(templateRef, () => setShowTemplateMenu(false));
  useClickOutside(priorityRef, () => setShowPriorityMenu(false));

  const toggleAssignee = (id: string) =>
    setAssigneeIds((prev) => prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]);

  function addFile(f: File) {
    setFiles((prev) => [...prev, createUploadedFile(f)]);
  }

  function removeFile(idx: number) {
    setFiles((prev) => {
      const copy = [...prev];
      const removed = copy.splice(idx, 1)[0];
      if (removed.preview) URL.revokeObjectURL(removed.preview);
      return copy;
    });
  }

  const handleClose = () => {
    revokeUploadedFiles(files);
    setTemplate('No Templates Required');
    setDescription(''); setStartDate(''); setEndDate('');
    setAssigneeIds([]); setPriority('High'); setFiles([]);
    onClose();
  };

  const [dateError, setDateError] = useState('');
  const [apiError, setApiError] = useState('');

  return (
    <Formik
      initialValues={{ name: '' }}
      validationSchema={createProjectSchema}
      validate={(values) => {
        const errs: { name?: string } = {};
        const trimmed = values.name.trim().toLowerCase();
        if (trimmed && existingProjectNames.some((n) => n.trim().toLowerCase() === trimmed)) {
          errs.name = 'A project with this name already exists for this firm';
        }
        return errs;
      }}
      onSubmit={async (values, { setSubmitting }) => {
        setDateError('');
        setApiError('');
        if (!startDate) {
          setDateError('Start date is required.');
          setSubmitting(false);
          return;
        }
        if (!endDate) {
          setDateError('End date is required.');
          setSubmitting(false);
          return;
        }
        if (endDate < startDate) {
          setDateError('End date must be on or after the start date.');
          setSubmitting(false);
          return;
        }
        try {
          await onCreate?.({
            name:           values.name,
            description,
            startDate,
            endDate,
            assigneeIds,
            priority,
            files:          files.map((f) => f.file),
            workflowStatus: defaultWorkflowStatus,
          });
          handleClose();
        } catch (err) {
          setApiError(err instanceof Error ? err.message : 'Failed to create project. Please try again.');
        } finally {
          setSubmitting(false);
        }
      }}
    >
      {({ values, errors, touched, handleChange, handleBlur, isSubmitting, resetForm, submitForm }) => {
        const wrappedClose = () => { resetForm(); handleClose(); };

        return (
          <SlideOver
            open={open}
            onClose={wrappedClose}
            title={values.name.trim() || 'Create a Project'}
            subtitle={firmName ? `${firmName}` : 'Fill in the details below'}
            width="max-w-[680px]"
            footer={
              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={wrappedClose}
                  className="px-4 py-2.5 rounded-lg border border-[#D5D7DA] bg-white text-sm font-semibold text-[#344054] hover:bg-[#F9FAFB] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => submitForm()}
                  disabled={isSubmitting}
                  className="px-4 py-2.5 rounded-lg bg-[#7F56D9] hover:bg-[#6941C6] disabled:opacity-50 text-white text-sm font-semibold transition-colors"
                >
                  {isSubmitting ? 'Creating…' : 'Create'}
                </button>
              </div>
            }
          >
            <Form className="flex flex-col gap-5">

              {apiError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
                  {apiError}
                </div>
              )}

              {/* Choose from a template */}
              <div ref={templateRef} className="relative">
                <label className="block text-sm font-medium text-[#344054] mb-1.5">
                  Choose from a template <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowTemplateMenu((v) => !v)}
                  className="w-full flex items-center justify-between border border-[#D5D7DA] rounded-lg px-3 py-2.5 text-sm text-[#181D27] bg-white hover:border-[#7F56D9] focus:ring-2 focus:ring-[#7F56D9] outline-none transition-colors"
                >
                  <span>{template}</span>
                  <ChevronDown width={16} height={16} className="text-[#717680] shrink-0" />
                </button>
                {showTemplateMenu && (
                  <div className="absolute top-full mt-1 left-0 right-0 z-20 bg-white border border-[#E9EAEB] rounded-xl shadow-lg py-1">
                    {TEMPLATE_OPTIONS.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => { setTemplate(t); setShowTemplateMenu(false); }}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-[#F9FAFB] ${template === t ? 'text-[#7F56D9] font-semibold' : 'text-[#344054]'}`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Name of project */}
              <Input
                label="Name of project"
                type="text"
                name="name"
                value={values.name}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Marketing site redesign"
                error={touched.name && errors.name ? errors.name : undefined}
                required
              />

              {/* Description */}
              <div>
                <label className="flex items-center gap-1 text-sm font-medium text-[#344054] mb-1.5">
                  Description
                  <HelpCircle width={14} height={14} className="text-[#A4A7AE]" />
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="A little about the company and the team that you'll be working with."
                  rows={4}
                  className="w-full border border-[#D5D7DA] rounded-lg px-3 py-2.5 text-sm text-[#181D27] placeholder-[#A4A7AE] outline-none focus:ring-2 focus:ring-[#7F56D9] focus:border-transparent transition bg-white resize-none"
                />
              </div>

              {/* Start date / End date / Assignee / Priority */}
              <div className="flex flex-col gap-1.5">
                <div className="grid grid-cols-[1fr_1fr_auto_auto] gap-4 items-end">

                  <Input
                    label="Start date"
                    type="date"
                    value={startDate}
                    onChange={(e) => { setStartDate(e.target.value); setDateError(''); }}
                    rightIcon={<CalendarDate width={16} height={16} className="text-[#717680] pointer-events-none" />}
                    required
                    error={!startDate && dateError ? 'Required' : undefined}
                  />

                  <Input
                    label="End date"
                    type="date"
                    value={endDate}
                    onChange={(e) => { setEndDate(e.target.value); setDateError(''); }}
                    rightIcon={<CalendarDate width={16} height={16} className="text-[#717680] pointer-events-none" />}
                    required
                    error={!endDate && dateError ? 'Required' : undefined}
                  />

                  <AssigneePicker users={users} selected={assigneeIds} onToggle={toggleAssignee} />

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
                      <span className={`w-2 h-2 rounded-full shrink-0 ${PRIORITY_DOT[priority]}`} />
                      {priority}
                      <ChevronDown width={14} height={14} className="ml-auto text-[#717680]" />
                    </button>
                    {showPriorityMenu && (
                      <div className="absolute bottom-full mb-1 left-0 z-10 bg-white border border-[#E9EAEB] rounded-xl shadow-lg py-1 min-w-[130px]">
                        {PRIORITY_OPTIONS.map((p) => (
                          <button
                            key={p}
                            type="button"
                            onClick={() => { setPriority(p); setShowPriorityMenu(false); }}
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
                {dateError && <p className="text-xs text-red-500">{dateError}</p>}
              </div>

              {/* Selected assignees chips */}
              {assigneeIds.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {users
                    .filter((u) => assigneeIds.includes(u.id))
                    .map((u) => (
                      <div key={u.id} className="flex items-center gap-1.5 px-2.5 py-1 bg-[#F9F5FF] border border-[#E9D7FE] rounded-full">
                        <Avatar name={u.name} src={u.avatar_url ?? undefined} size="xs" />
                        <span className="text-xs font-medium text-[#6941C6] max-w-[120px] truncate">{u.name}</span>
                        <button type="button" onClick={() => toggleAssignee(u.id)} className="text-[#9E77ED] hover:text-[#6941C6]">
                          <X width={12} height={12} />
                        </button>
                      </div>
                    ))}
                </div>
              )}

              {/* Upload files */}
              <div>
                <label className="block text-sm font-medium text-[#344054] mb-1.5">
                  Upload files <span className="text-red-500">*</span>
                </label>
                <FileUploadZone files={files} onAdd={addFile} onRemove={removeFile} />
              </div>

            </Form>
          </SlideOver>
        );
      }}
    </Formik>
  );
}
