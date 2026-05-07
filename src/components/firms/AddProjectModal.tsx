import { useState, useRef } from 'react';
import { Formik, Form } from 'formik';
import {
  HelpCircle,
  CalendarDate,
  ChevronDown,
  Plus,
  X,
  UploadCloud01,
  Trash01,
} from '@untitled-ui/icons-react';
import Avatar from '../ui/Avatar';
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

// ── Assignee picker ───────────────────────────────────────────────────────────

function AssigneePicker({
  users,
  selected,
  onToggle,
}: {
  users: User[];
  selected: string[];
  onToggle: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setOpen(false));

  const selectedUsers = users.filter((u) => selected.includes(u.id));
  const extra = selectedUsers.length > 3 ? selectedUsers.length - 3 : 0;

  return (
    <div ref={ref} className="relative">
      <label className="block text-sm font-medium text-[#344054] mb-1.5 whitespace-nowrap">
        Assignee
      </label>
      <div className="flex items-center gap-1 h-[42px]">
        {selectedUsers.slice(0, 3).map((u) => (
          <button
            key={u.id}
            type="button"
            onClick={() => onToggle(u.id)}
            title={`Remove ${u.name}`}
            className="relative group shrink-0"
          >
            <Avatar name={u.name} src={u.avatar_url ?? undefined} size="sm" />
            <span className="absolute -top-0.5 -right-0.5 hidden group-hover:flex w-3.5 h-3.5 bg-red-500 rounded-full items-center justify-center">
              <X width={8} height={8} className="text-white" />
            </span>
          </button>
        ))}
        {extra > 0 && (
          <span className="w-7 h-7 rounded-full bg-[#F2F4F7] flex items-center justify-center text-[11px] font-semibold text-[#414651] border-2 border-white -ml-1 shrink-0">
            +{extra}
          </span>
        )}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="w-7 h-7 rounded-full border-2 border-dashed border-[#D5D7DA] flex items-center justify-center text-[#A4A7AE] hover:border-[#7F56D9] hover:text-[#7F56D9] transition-colors shrink-0 ml-0.5"
        >
          <Plus width={12} height={12} />
        </button>
      </div>

      {open && (
        <div className="absolute top-full mt-1 left-0 z-20 bg-white border border-[#E9EAEB] rounded-xl shadow-lg py-1 min-w-[220px] max-h-52 overflow-y-auto">
          {users.length === 0 ? (
            <p className="px-3 py-2 text-sm text-[#717680]">No team members</p>
          ) : (
            users.map((u) => {
              const checked = selected.includes(u.id);
              return (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => onToggle(u.id)}
                  className="flex items-center gap-2.5 w-full px-3 py-2 hover:bg-[#F9FAFB] text-left"
                >
                  <Avatar name={u.name} src={u.avatar_url ?? undefined} size="xs" />
                  <span className="flex-1 text-sm text-[#344054] truncate">{u.name}</span>
                  {checked && (
                    <span className="w-4 h-4 rounded-full bg-[#7F56D9] flex items-center justify-center shrink-0">
                      <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                        <path d="M1 3L3 5L7 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

// ── File upload zone ──────────────────────────────────────────────────────────

interface UploadedFile {
  file: File;
  preview: string | null;
}

function FileUploadZone({
  files,
  onAdd,
  onRemove,
}: {
  files: UploadedFile[];
  onAdd: (f: File) => void;
  onRemove: (idx: number) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function handleFiles(list: FileList | null) {
    if (!list) return;
    Array.from(list).forEach((f) => onAdd(f));
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Drop zone */}
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
        className={`flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-xl px-6 py-8 cursor-pointer transition-colors select-none ${
          dragging
            ? 'border-[#7F56D9] bg-[#F4F3FF]'
            : 'border-[#D5D7DA] bg-white hover:border-[#7F56D9] hover:bg-[#F9F5FF]'
        }`}
      >
        <div className="flex items-center justify-center w-10 h-10 rounded-full border border-[#E9EAEB] bg-white shadow-sm">
          <UploadCloud01 width={20} height={20} className="text-[#535862]" />
        </div>
        <div className="text-center">
          <p className="text-sm text-[#535862]">
            <span className="font-semibold text-[#6941C6]">Click to upload</span>{' '}
            or drag and drop
          </p>
          <p className="text-xs text-[#A4A7AE] mt-0.5">SVG, PNG, JPG or GIF (max. 800×400px)</p>
        </div>
      </div>

      {/* Uploaded file list */}
      {files.length > 0 && (
        <div className="flex flex-col gap-2">
          {files.map(({ file, preview }, idx) => (
            <div
              key={idx}
              className="flex items-center gap-3 p-3 border border-[#E9EAEB] rounded-lg bg-white"
            >
              {preview ? (
                <img src={preview} alt={file.name} className="w-10 h-10 rounded-lg object-cover shrink-0 border border-[#E9EAEB]" />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-[#F2F4F7] flex items-center justify-center shrink-0">
                  <UploadCloud01 width={16} height={16} className="text-[#717680]" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#344054] truncate">{file.name}</p>
                <p className="text-xs text-[#717680]">{(file.size / 1024).toFixed(0)} KB</p>
              </div>
              <button
                type="button"
                onClick={() => onRemove(idx)}
                className="shrink-0 text-[#717680] hover:text-[#D92D20] transition-colors p-1 rounded"
              >
                <Trash01 width={14} height={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/svg+xml,image/png,image/jpeg,image/gif"
        multiple
        className="hidden"
        onChange={(e) => { handleFiles(e.target.files); e.target.value = ''; }}
      />
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function AddProjectModal({
  open,
  onClose,
  firmName = '',
  users = [],
  defaultWorkflowStatus = 'todo',
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
    const preview = f.type.startsWith('image/')
      ? URL.createObjectURL(f)
      : null;
    setFiles((prev) => [...prev, { file: f, preview }]);
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
    files.forEach((f) => { if (f.preview) URL.revokeObjectURL(f.preview); });
    setTemplate('No Templates Required');
    setDescription(''); setStartDate(''); setEndDate('');
    setAssigneeIds([]); setPriority('High'); setFiles([]);
    onClose();
  };

  const [dateError, setDateError] = useState('');

  return (
    <Formik
      initialValues={{ name: '' }}
      validationSchema={createProjectSchema}
      onSubmit={async (values, { setSubmitting }) => {
        setDateError('');
        if (startDate && endDate && endDate < startDate) {
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
        } finally {
          setSubmitting(false);
        }
      }}
    >
      {({ values, errors, touched, handleChange, handleBlur, isSubmitting, resetForm }) => {
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
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2.5 rounded-lg bg-[#7F56D9] hover:bg-[#6941C6] disabled:opacity-50 text-white text-sm font-semibold transition-colors"
                >
                  {isSubmitting ? 'Creating…' : 'Create'}
                </button>
              </div>
            }
          >
            <Form className="flex flex-col gap-5">

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
                  />

                  <Input
                    label="End date"
                    type="date"
                    value={endDate}
                    onChange={(e) => { setEndDate(e.target.value); setDateError(''); }}
                    rightIcon={<CalendarDate width={16} height={16} className="text-[#717680] pointer-events-none" />}
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
