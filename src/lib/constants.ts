// ── Shared UI constants used across AddUserPage and EditUserDrawer ─────────────

export const EXTRA_PERMISSIONS = [
  { key: 'create_projects',       label: 'Project Creation' },
  { key: 'create_tasks',          label: 'Task Creation' },
  { key: 'view_global_timesheet', label: 'Global timesheet' },
] as const;

export const ROLE_OPTIONS = [
  { value: 'member',          label: 'Member' },
  { value: 'admin',           label: 'Admin' },
  { value: 'project_manager', label: 'Project Manager' },
];

export const STATUS_OPTIONS = [
  { value: 'Active',   label: 'Active'   },
  { value: 'invited',  label: 'Invited'  },
  { value: 'Disabled', label: 'Disabled' },
];

// ── Task status display maps (single source of truth for TaskBadges + pages) ──

export const TASK_STATUS_COLORS: Record<string, string> = {
  to_do:           'bg-[#F9FAFB] text-[#344054] border border-[#D0D5DD]',
  assigned:        'bg-[#EFF8FF] text-[#1565C0] border border-[#B2DDFF]',
  in_progress:     'bg-[#EEF4FF] text-[#3538CD] border border-[#C7D7FD]',
  revisions:       'bg-[#FFF4ED] text-[#B93815] border border-[#F9DBAF]',
  internal_review: 'bg-[#F4F3FF] text-[#5925DC] border border-[#D9D6FE]',
  client_review:   'bg-[#FFFAEB] text-[#B54708] border border-[#FEF0C7]',
  completed:       'bg-[#ECFDF3] text-[#027A48] border border-[#ABEFC6]',
  blocked:         'bg-[#FFF1F3] text-[#C01048] border border-[#FEA3B4]',
};

export const TASK_STATUS_LABELS: Record<string, string> = {
  to_do:           'To Do',
  assigned:        'Assigned',
  in_progress:     'In Progress',
  revisions:       'Revisions',
  internal_review: 'Internal Review',
  client_review:   'Client Review',
  completed:       'Completed',
  blocked:         'Blocked',
};

export const TASK_STATUS_BADGE: Record<string, { label: string; className: string }> = {
  draft:             { label: 'Draft',       className: 'bg-gray-100 text-gray-500' },
  to_do:             { label: 'To Do',       className: 'bg-gray-100 text-gray-500' },
  assigned:          { label: 'Assigned',    className: 'bg-blue-50 text-blue-600' },
  in_progress:       { label: 'In Progress', className: 'bg-purple-50 text-purple-600' },
  revisions:         { label: 'Revisions',   className: 'bg-orange-50 text-orange-600' },
  internal_review:   { label: 'In Review',   className: 'bg-yellow-50 text-yellow-700' },
  client_review:     { label: 'Client Rev',  className: 'bg-indigo-50 text-indigo-600' },
  compliance_review: { label: 'Compliance',  className: 'bg-amber-50 text-amber-700' },
  approved:          { label: 'Approved',    className: 'bg-green-50 text-green-700' },
  closed:            { label: 'Closed',      className: 'bg-gray-200 text-gray-600' },
  completed:         { label: 'Completed',   className: 'bg-green-50 text-green-600' },
  blocked:           { label: 'Blocked',     className: 'bg-red-50 text-red-600' },
  discarded:         { label: 'Discarded',   className: 'bg-red-50 text-red-600' },
};

export const PRIORITY_BADGE: Record<string, { label: string; className: string }> = {
  urgent: { label: 'Urgent', className: 'bg-red-50 text-red-600' },
  high:   { label: 'High',   className: 'bg-orange-50 text-orange-600' },
  normal: { label: 'Normal', className: 'bg-yellow-50 text-yellow-700' },
  low:    { label: 'Low',    className: 'bg-green-50 text-green-600' },
};

export const PRIORITY_COLORS: Record<string, { label: string; bg: string; text: string }> = {
  low:    { label: 'Low',    bg: '#F2F4F7', text: '#344054' },
  normal: { label: 'Normal', bg: '#EFF8FF', text: '#1570EF' },
  high:   { label: 'High',   bg: '#FEF0C7', text: '#B54708' },
  urgent: { label: 'Urgent', bg: '#FEF3F2', text: '#B42318' },
};

export const TASK_STATUS_DOT: Record<string, string> = {
  to_do:           '#A4A7AE',
  assigned:        '#7F56D9',
  in_progress:     '#2E90FA',
  revisions:       '#F79009',
  internal_review: '#7F56D9',
  client_review:   '#444CE7',
  completed:       '#17B26A',
  blocked:         '#F04438',
};

export const EXPERIENCE_OPTIONS = [
  '0-2 Years',
  '2-5 Years',
  '5 Years',
  '5-10 Years',
  '10+ Years',
] as const;

// Reusable Tailwind class strings for form inputs
export const inputCls  = 'w-full border border-[#D5D7DA] rounded-lg px-3 py-2.5 text-sm text-[#181D27] placeholder-[#A4A7AE] outline-none focus:ring-2 focus:ring-[#7F56D9] focus:border-transparent';
export const labelCls  = 'block text-sm font-medium text-[#414651] mb-1.5';
