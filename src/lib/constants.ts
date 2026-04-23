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
  { value: 'Active',   label: 'Active' },
  { value: 'invited',  label: 'Invited' },
  { value: 'Disabled', label: 'Disabled' },
];

// Reusable Tailwind class strings for form inputs
export const inputCls  = 'w-full border border-[#D5D7DA] rounded-lg px-3 py-2.5 text-sm text-[#181D27] placeholder-[#A4A7AE] outline-none focus:ring-2 focus:ring-[#7F56D9] focus:border-transparent';
export const labelCls  = 'block text-sm font-medium text-[#414651] mb-1.5';
