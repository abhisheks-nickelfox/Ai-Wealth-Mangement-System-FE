// ── API client for frontend-new ───────────────────────────────────────────────
// All requests go through this module. Never use fetch() directly in components.
// Token injection and error normalisation are handled by axios interceptors in
// src/lib/network/interceptors.ts

import axiosInstance from './network/axiosInstance';

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const response = await axiosInstance.request<T>({
    method,
    url: path,
    data: body,
  });
  return response.data;
}

// ── Auth API ──────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'member' | 'project_manager';
  permissions: string[];
}

export const authApi = {
  login: (email: string, password: string) =>
    request<{ data: { user: AuthUser; token: string } }>('POST', '/auth/login', {
      email,
      password,
    }).then((r) => r.data),

  /** Returns full profile including first_name, last_name, avatar_url, skills, etc. */
  me: () =>
    request<{ data: User }>('GET', '/auth/me').then((r) => r.data),

  forgotPassword: (email: string) =>
    request<{ message: string }>('POST', '/auth/forgot-password', { email }),

  resetPassword: (token: string, password: string) =>
    request<{ message: string }>('POST', '/auth/reset-password', { token, password }),

  changePassword: (current_password: string, new_password: string) =>
    request<{ message: string }>('POST', '/auth/change-password', { current_password, new_password }),
};

// ── Shared types ─────────────────────────────────────────────────────────────

export interface SkillMember {
  id: string;
  name: string;
  avatar_url: string | null;
}

export interface Skill {
  id: string;
  name: string;
  category: string | null;
  description?: string | null;
  color?: string | null;
  created_at: string;
  task_count: number;
  members: SkillMember[];
}

export interface User {
  id: string;
  name: string;
  first_name: string | null;
  last_name: string | null;
  phone_number: string | null;
  avatar_url: string | null;
  email: string;
  role: 'admin' | 'member' | 'project_manager';
  member_role: string | null;
  status: 'Active' | 'invited' | 'Disabled';
  permissions: string[];
  skills: Skill[];
  rate_amount: number | null;
  rate_frequency: 'Hourly' | 'Daily' | 'Weekly' | 'Monthly' | null;
  created_at: string;
  updated_at: string | null;
}

export interface CreateUserPayload {
  name?: string;
  email: string;
  password?: string;
  role?: 'admin' | 'member' | 'project_manager';
  member_role?: string;
  permissions?: string[];
  skill_ids?: string[];
  status?: 'Active' | 'invited' | 'Disabled';
  rate_amount?: number | null;
  rate_frequency?: 'Hourly' | 'Daily' | 'Weekly' | 'Monthly' | null;
}

export interface UpdateUserPayload {
  name?: string;
  password?: string;
  role?: 'admin' | 'member' | 'project_manager';
  member_role?: string;
  permissions?: string[];
  skill_ids?: string[];
  skills_with_experience?: { skill_id: string; experience?: string | null }[];
  status?: 'Active' | 'invited' | 'Disabled';
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  avatar_url?: string;
  rate_amount?: number | null;
  rate_frequency?: 'Hourly' | 'Daily' | 'Weekly' | 'Monthly' | null;
}

// ── Users API ─────────────────────────────────────────────────────────────────

export const usersApi = {
  list: () =>
    request<{ data: User[] }>('GET', '/users').then((r) => r.data),

  get: (id: string) =>
    request<{ data: User }>('GET', `/users/${id}`).then((r) => r.data),

  create: (payload: CreateUserPayload) =>
    request<{ data: User }>('POST', '/users', payload).then((r) => r.data),

  update: (id: string, payload: UpdateUserPayload) =>
    request<{ data: User }>('PATCH', `/users/${id}`, payload).then((r) => r.data),

  delete: (id: string) =>
    request<{ message: string }>('DELETE', `/users/${id}`),

  resendInvite: (id: string) =>
    request<{ message: string }>('POST', `/users/${id}/resend-invite`),
};

// ── Member Roles API ──────────────────────────────────────────────────────────

export interface MemberRole {
  id: string;
  name: string;
  created_at: string;
}

export const memberRolesApi = {
  list: () =>
    request<{ data: MemberRole[] }>('GET', '/member-roles').then((r) => r.data),

  create: (name: string) =>
    request<{ data: MemberRole }>('POST', '/member-roles', { name }).then((r) => r.data),

  delete: (id: string) =>
    request<{ message: string }>('DELETE', `/member-roles/${id}`),
};

// ── Onboarding API ────────────────────────────────────────────────────────────

export const onboardingApi = {
  /** Validates an invite token and returns the invited user's email + name. */
  validate: (token: string) =>
    request<{ data: { email: string; name: string } }>(
      'GET',
      `/auth/onboarding/validate?token=${encodeURIComponent(token)}`,
    ).then((r) => r.data),

  /** Uploads a base64-encoded cropped avatar and stores the public URL. */
  uploadAvatar: (token: string, image: string) =>
    request<{ data: { avatar_url: string } }>('POST', '/auth/onboarding/avatar', {
      token,
      image,
    }).then((r) => r.data),

  /** Completes onboarding: sets password, updates profile fields, activates account. */
  complete: (payload: {
    token: string;
    first_name: string;
    last_name: string;
    phone_number?: string;
    avatar_url?: string;
    password: string;
    skills?: { skill_name: string; experience?: string }[];
    pending_skills?: string[];
  }) =>
    request<{ data: { token: string | null; user?: { id: string; email: string; name: string } } }>(
      'POST',
      '/auth/onboarding/complete',
      payload,
    ).then((r) => r.data),
};

// ── Profile API (current user self-update) ────────────────────────────────────

export interface UpdateProfilePayload {
  name?: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  avatar_url?: string;
  member_role?: string;
  skill_ids?: string[];
  skills_with_experience?: { skill_id: string; experience?: string | null }[];
}

export const profileApi = {
  /** Update the current user's own profile fields via the admin users endpoint. */
  update: (id: string, payload: UpdateProfilePayload) =>
    request<{ data: User }>('PATCH', `/users/${id}`, payload).then((r) => r.data),

  /** Upload a base64 image to Supabase Storage and return the public URL. */
  uploadAvatar: (userId: string, image: string) =>
    request<{ data: { avatar_url: string } }>('POST', `/users/${userId}/avatar`, {
      image,
    }).then((r) => r.data),
};

// ── Skills API ────────────────────────────────────────────────────────────────

export const skillsApi = {
  list: () =>
    request<{ data: Skill[] }>('GET', '/skills').then((r) => r.data),

  create: (payload: { name: string; category?: string; description?: string; color?: string }) =>
    request<{ data: Skill }>('POST', '/skills', payload).then((r) => r.data),

  update: (id: string, payload: { name?: string; category?: string; description?: string; color?: string }) =>
    request<{ data: Skill }>('PATCH', `/skills/${id}`, payload).then((r) => r.data),

  delete: (id: string) =>
    request<{ message: string }>('DELETE', `/skills/${id}`),

  setMembers: (id: string, user_ids: string[]) =>
    request<{ message: string }>('PUT', `/skills/${id}/members`, { user_ids }),
};

// ── Transcripts API ───────────────────────────────────────────────────────────

export interface Transcript {
  id: string;
  title: string;
  call_date: string;
  duration_sec: number;
  participants: string[];
  firm_id: string | null;
  archived: boolean;
  source?: string;
  raw_transcript?: string;
  created_at: string;
}

export interface Firm {
  id: string;
  name: string;
  location: string | null;
  address: string | null;
  website: string | null;
  logo_url: string | null;
  description: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_role: string | null;
  contact_phone: string | null;
  account_manager_id: string | null;
  default_prompt_id: string | null;
  created_at: string;
}

export interface Prompt {
  id: string;
  name: string;
  type: string | null;
  content?: string;
}

export interface ProjectMember {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
}

export interface Project {
  id:              string;
  firm_id:         string;
  name:            string;
  description:     string | null;
  status:          'active' | 'archived';
  workflow_status: 'todo' | 'in_progress' | 'in_review' | 'approved' | 'completed';
  start_date:      string | null;
  end_date:        string | null;
  priority:        'high' | 'medium' | 'low';
  share_token:     string | null;
  created_at:      string;
  updated_at:      string;
  firm_name:       string | null;
  ticket_count:    number;
  members:         ProjectMember[];
}

export interface SharedProjectView {
  id:              string;
  name:            string;
  description:     string | null;
  workflow_status: 'todo' | 'in_progress' | 'in_review' | 'approved' | 'completed';
  firm_name:       string | null;
  members:         { id: string; name: string; avatar_url: string | null }[];
  task_totals:     { total: number; todo: number; in_progress: number; in_review: number; completed: number };
}

export interface CreateProjectPayload {
  firm_id:         string;
  name:            string;
  description?:    string;
  workflow_status?: Project['workflow_status'];
  member_ids?:     string[];
  start_date?:     string;
  end_date?:       string;
  priority?:       Project['priority'];
}

export interface UpdateProjectPayload {
  name?:            string;
  description?:     string;
  status?:          'active' | 'archived';
  workflow_status?: Project['workflow_status'];
  member_ids?:      string[];
  start_date?:      string | null;
  end_date?:        string | null;
  priority?:        Project['priority'];
}

export const projectsApi = {
  list: (firm_id?: string) => {
    const qs = firm_id ? `?firm_id=${firm_id}` : '';
    return request<{ data: Project[] }>('GET', `/projects${qs}`).then((r) => r.data);
  },
  get: (id: string) =>
    request<{ data: Project }>('GET', `/projects/${id}`).then((r) => r.data),
  create: (payload: CreateProjectPayload) =>
    request<{ data: Project }>('POST', '/projects', payload).then((r) => r.data),
  update: (id: string, payload: UpdateProjectPayload) =>
    request<{ data: Project }>('PATCH', `/projects/${id}`, payload).then((r) => r.data),
  archive: (id: string) =>
    request<{ data: Project }>('PATCH', `/projects/${id}/archive`).then((r) => r.data),
  getTasks: (id: string) =>
    request<{ data: { id: string; title: string; status: string; priority: string; parent_task_id: string | null }[] }>('GET', `/projects/${id}/tasks`)
      .then((r) => r.data),
  delete: (id: string, task_ids: string[] = []) =>
    request<{ deleted: boolean; hasTickets: boolean; projectDeleted: boolean }>(
      'DELETE', `/projects/${id}`, { task_ids },
    ),
  generateShareLink: (id: string) =>
    request<{ data: { share_token: string } }>('POST', `/projects/${id}/share`).then((r) => r.data),
  getSharedProject: (token: string) =>
    request<{ data: SharedProjectView }>('GET', `/projects/shared/${token}`).then((r) => r.data),
  getOverview: (id: string) =>
    request<{ data: unknown }>('GET', `/projects/${id}/overview`).then((r) => r.data),
  listMembers: (id: string) =>
    request<{ data: User[] }>('GET', `/projects/${id}/members`).then((r) => r.data),
  addMember: (id: string, user_id: string) =>
    request<{ data: User[] }>('POST', `/projects/${id}/members`, { user_id }).then((r) => r.data),
  removeMember: (id: string, userId: string) =>
    request<{ data: User[] }>('DELETE', `/projects/${id}/members/${userId}`).then((r) => r.data),
};

export interface TaskAssignee {
  id:         string;
  name:       string;
  email:      string;
  avatar_url: string | null;
}

export interface Task {
  id:              string;
  session_id:      string | null;
  firm_id:         string;
  project_id:      string | null;
  parent_task_id:  string | null;
  task_type_id:    string | null;
  assignee_id:     string | null;
  title:           string;
  description:     string | null;
  type:            string;
  priority:        'low' | 'normal' | 'high' | 'urgent';
  status:          'to_do' | 'assigned' | 'in_progress' | 'revisions' | 'internal_review' | 'client_review' | 'completed' | 'blocked';
  deadline:        string | null;
  estimated_hours: number | null;
  ai_generated:    boolean;
  edited:          boolean;
  archived:        boolean;
  created_at:      string;
  firms?:          { name: string };
  assignee?:       { name: string; email: string } | null;
  assignees?:      TaskAssignee[];
  subtasks?:       Task[];
}

export const transcriptsApi = {
  list: (archived?: boolean | 'all') => {
    const q = archived === 'all' ? '?archived=all' : archived === true ? '?archived=true' : '';
    return request<{ data: Transcript[] }>('GET', `/transcripts${q}`).then((r) => r.data);
  },
  create: (payload: {
    title: string; call_date: string; duration_sec?: number;
    participants?: string[]; raw_transcript: string; firm_id?: string;
  }) => request<{ data: Transcript }>('POST', '/transcripts', payload).then((r) => r.data),
  toggleArchive: (id: string) =>
    request<{ data: Transcript }>('PATCH', `/transcripts/${id}/archive`).then((r) => r.data),
  sync: () => request<{ data: unknown }>('POST', '/transcripts/sync').then((r) => r.data),
  process: (id: string, payload: { firm_id: string; prompt_id: string; text_notes?: string }) =>
    request<{ data: { session_id: string; firm_id: string; tasks: Task[] } }>(
      'POST', `/transcripts/${id}/process`, payload,
    ).then((r) => r.data),
};

export const firmsApi = {
  list: () => request<{ data: Firm[] }>('GET', '/firms').then((r) => r.data),
  get: (id: string) => request<{ data: Firm }>('GET', `/firms/${id}`).then((r) => r.data),
  create: (payload: Partial<Firm> & { name: string }) =>
    request<{ data: Firm }>('POST', '/firms', payload).then((r) => r.data),
  update: (id: string, payload: Partial<Firm>) =>
    request<{ data: Firm }>('PATCH', `/firms/${id}`, payload).then((r) => r.data),
  uploadLogo: (id: string, image: string) =>
    request<{ data: { logo_url: string } }>('POST', `/firms/${id}/logo`, { image }).then((r) => r.data),
  delete: (id: string) => request<void>('DELETE', `/firms/${id}`),
};

export const promptsApi = {
  list: () => request<{ data: Prompt[] }>('GET', '/prompts').then((r) => r.data),
};

export type TaskStatus = Task['status'];

export const VALID_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  to_do:           ['assigned', 'in_progress', 'blocked'],
  assigned:        ['in_progress', 'blocked'],
  in_progress:     ['revisions', 'internal_review', 'blocked'],
  revisions:       ['in_progress'],
  internal_review: ['client_review', 'revisions'],
  client_review:   ['completed', 'revisions'],
  completed:       [],
  blocked:         ['to_do', 'in_progress'],
};

export interface CreateTaskPayload {
  firm_id:         string;
  title:           string;
  type?:           string;
  task_type_id?:   string;
  priority?:       'low' | 'normal' | 'high' | 'urgent';
  description?:    string;
  project_id?:     string;
  assignee_id?:    string;
  assignee_ids?:   string[];
  deadline?:       string;
  start_date?:     string;
  estimated_hours?: number;
  initial_status?: string;
  parent_task_id?: string;
}

export const tasksApi = {
  get: (id: string) =>
    request<{ data: Task }>('GET', `/tasks/${id}`).then((r) => r.data),
  create: (payload: CreateTaskPayload) =>
    request<{ data: Task }>('POST', '/tasks', payload).then((r) => r.data),
  list: (params?: { firm_id?: string; session_id?: string; status?: string; assignee_id?: string; overdue?: string; project_id?: string }) => {
    const q = new URLSearchParams();
    if (params?.firm_id)    q.set('firm_id',    params.firm_id);
    if (params?.session_id) q.set('session_id', params.session_id);
    if (params?.status)     q.set('status',     params.status);
    if (params?.assignee_id) q.set('assignee_id', params.assignee_id);
    if (params?.overdue)    q.set('overdue',    params.overdue);
    if (params?.project_id) q.set('project_id', params.project_id);
    const qs = q.toString() ? `?${q.toString()}` : '';
    return request<{ data: Task[] }>('GET', `/tasks${qs}`).then((r) => r.data);
  },
  update: (id: string, payload: Partial<Pick<Task, 'title' | 'description' | 'priority' | 'deadline'>> & { assignee_id?: string | null; assignee_ids?: string[]; project_id?: string | null }) =>
    request<{ data: Task }>('PATCH', `/tasks/${id}`, payload).then((r) => r.data),
  assignApprove: (id: string, payload: { assignee_id: string; priority?: string; deadline?: string }) =>
    request<{ data: Task }>('PATCH', `/tasks/${id}/assign-approve`, payload).then((r) => r.data),
  transition: (id: string, status: TaskStatus, change_note?: string) =>
    request<{ data: Task }>('PATCH', `/tasks/${id}/transition`, { status, change_note }).then((r) => r.data),
  discard: (id: string) =>
    request<{ data: Task }>('PATCH', `/tasks/${id}/discard`).then((r) => r.data),
  resolve: (id: string) =>
    request<{ data: Task }>('PATCH', `/tasks/${id}/resolve`, {}).then((r) => r.data),
  archive: (id: string, archived: boolean) =>
    request<{ data: Task }>('PATCH', `/tasks/${id}/archive`, { archived }).then((r) => r.data),
  delete: (id: string) =>
    request<{ message: string }>('DELETE', `/tasks/${id}`),
  listSubTasks: (parentId: string) =>
    request<{ data: Task[] }>('GET', `/tasks/${parentId}/subtasks`).then((r) => r.data),
  regenerate: (id: string, payload?: { prompt_id?: string }) =>
    request<{ data: Task }>('POST', `/tasks/${id}/regenerate`, payload).then((r) => r.data),
};

// ── Attachments API ───────────────────────────────────────────────────────────

export interface TaskAttachment {
  id:          string;
  task_id:     string;
  uploaded_by: string;
  file_name:   string;
  file_size:   number;
  mime_type:   string;
  storage_url: string;
  created_at:  string;
}

export const attachmentsApi = {
  list: (taskId: string) =>
    request<{ data: TaskAttachment[] }>('GET', `/tasks/${taskId}/attachments`).then((r) => r.data),

  upload: (taskId: string, file: File): Promise<TaskAttachment> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async () => {
        const dataUrl = reader.result as string;
        // Strip the data:<type>;base64, prefix — send raw base64
        const base64 = dataUrl.split(',')[1];
        try {
          const result = await request<{ data: TaskAttachment }>('POST', `/tasks/${taskId}/attachments`, {
            file_name: file.name,
            file_size: file.size,
            mime_type: file.type || 'application/octet-stream',
            data:      base64,
          });
          resolve(result.data);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    }),

  delete: (taskId: string, attId: string) =>
    request<{ deleted: boolean }>('DELETE', `/tasks/${taskId}/attachments/${attId}`),
};

// ── Project Attachments API ───────────────────────────────────────────────────

export interface ProjectAttachment {
  id:              string;
  project_id:      string;
  file_url:        string;
  file_name:       string;
  file_size:       number;
  file_type:       string;
  uploaded_by:     string;
  uploader_name:   string | null;
  uploader_avatar: string | null;
  created_at:      string;
}

function uploadFileAsBase64(projectId: string, file: File): Promise<ProjectAttachment> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = (reader.result as string).split(',')[1];
      try {
        const result = await request<{ data: ProjectAttachment }>(
          'POST', `/projects/${projectId}/attachments`,
          { file_name: file.name, file_size: file.size, mime_type: file.type || 'application/octet-stream', data: base64 },
        );
        resolve(result.data);
      } catch (err) { reject(err); }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export const projectAttachmentsApi = {
  list:   (projectId: string) =>
    request<{ data: ProjectAttachment[] }>('GET', `/projects/${projectId}/attachments`).then((r) => r.data),
  upload: (projectId: string, file: File) => uploadFileAsBase64(projectId, file),
  delete: (projectId: string, attId: string) =>
    request<{ deleted: boolean }>('DELETE', `/projects/${projectId}/attachments/${attId}`),
};

// ── Org Settings API ──────────────────────────────────────────────────────────

export const orgSettingsApi = {
  get: () =>
    request<{ data: { id: string; logo_url: string | null; updated_at: string } }>('GET', '/org-settings')
      .then((r) => r.data),
  uploadLogo: (image: string) =>
    request<{ data: { logo_url: string } }>('POST', '/org-settings/logo', { image })
      .then((r) => r.data),
};

// ── Notifications API ─────────────────────────────────────────────────────────

export interface NotificationActor {
  id:         string;
  name:       string;
  avatar_url: string | null;
}

export interface AppNotification {
  id:         string;
  user_id:    string;
  ticket_id:  string | null;
  scope:      string;
  scope_id:   string | null;
  actor_id:   string | null;
  message_id: string | null;
  type:       string;
  title:      string;
  message:    string;
  read:       boolean;
  created_at: string;
  actor:      NotificationActor | null;
}

export const notificationsApi = {
  list: () =>
    request<{ data: AppNotification[] }>('GET', '/notifications').then((r) => r.data),
  markRead: (id: string) =>
    request<void>('PATCH', `/notifications/${id}/read`),
  markAllRead: () =>
    request<void>('PATCH', '/notifications/read-all'),
  unreadCount: () =>
    request<{ data: { count: number } }>('GET', '/notifications/unread-count').then((r) => r.data.count),
};

// ── Time Logs API (legacy — kept for InboxPage activity feed) ────────────────

export interface TimeLog {
  id:             string;
  ticket_id:      string;
  user_id:        string;
  hours:          number;
  comment:        string | null;
  log_type:       'estimate' | 'partial' | 'final' | 'revision' | 'transition';
  revision_cycle: number;
  created_at:     string;
  updated_at:     string;
  users?:         { name: string; email: string; avatar_url?: string | null } | null;
}

export const timeLogsApi = {
  list: (taskId: string) =>
    request<{ data: TimeLog[] }>('GET', `/tasks/${taskId}/time-logs`).then((r) => r.data),
};

// ── Time Entries API ──────────────────────────────────────────────────────────

export interface TimeEntry {
  id:               string;
  task_id:          string | null;
  project_id:       string | null;
  user_id:          string;
  started_at:       string;
  ended_at:         string | null;
  duration_seconds: number | null;
  description:      string | null;
  is_billable:      boolean;
  is_running:       boolean;
  created_at:       string;
  updated_at:       string;
  user?:            { id: string; name: string; email: string; avatar_url: string | null };
  task?:            { id: string; title: string; firm_id: string };
}

export interface SubtaskTimeSummary {
  task_id:       string;
  title:         string;
  total_seconds: number;
  entries:       TimeEntry[];
}

export interface TaskDirectTimeSummary {
  task_id:       string;
  title:         string;
  total_seconds: number;
  own_seconds:   number;
  entries:       TimeEntry[];
  subtasks:      SubtaskTimeSummary[];
}

export interface TaskTimeEntrySummary {
  own_entries:       TimeEntry[];
  subtask_summary:   SubtaskTimeSummary[];
  own_total_seconds: number;
  total_seconds:     number;
}

export interface ProjectTaskTimeSummary {
  task_id:       string;
  title:         string;
  total_seconds: number;
  own_seconds:   number;
  entries:       TimeEntry[];
  subtasks:      SubtaskTimeSummary[];
}

export interface ProjectTimeEntrySummary {
  project_id:    string;
  total_seconds: number;
  tasks:         ProjectTaskTimeSummary[];
}

export const timeEntriesApi = {
  list: (taskId: string) =>
    request<TaskTimeEntrySummary>('GET', `/tasks/${taskId}/time-entries`),
  create: (taskId: string, payload: { started_at: string; ended_at?: string; duration_seconds?: number; description?: string }) =>
    request<TimeEntry>('POST', `/tasks/${taskId}/time-entries`, payload),
  start: (taskId: string) =>
    request<TimeEntry>('POST', `/tasks/${taskId}/time-entries/start`),
  stop: (taskId: string, entryId: string, description?: string) =>
    request<TimeEntry>('PATCH', `/tasks/${taskId}/time-entries/${entryId}/stop`, description ? { description } : undefined),
  update: (taskId: string, entryId: string, payload: Partial<{ started_at: string; ended_at: string; duration_seconds: number; description: string }>) =>
    request<TimeEntry>('PATCH', `/tasks/${taskId}/time-entries/${entryId}`, payload),
  delete: (taskId: string, entryId: string) =>
    request<void>('DELETE', `/tasks/${taskId}/time-entries/${entryId}`),
  runningTimer: () =>
    request<TimeEntry | null>('GET', '/tasks/me/running-timer'),
};

export interface ProjectDirectTimeEntrySummary {
  project_entries:   TimeEntry[];
  task_summary:      TaskDirectTimeSummary[];
  own_total_seconds: number;
  total_seconds:     number;
}

export const projectTimeEntriesApi = {
  list:   (projectId: string) =>
    request<ProjectDirectTimeEntrySummary>('GET', `/projects/${projectId}/time-entries`),
  start:  (projectId: string) =>
    request<TimeEntry>('POST', `/projects/${projectId}/time-entries/start`),
  stop:   (projectId: string, entryId: string, description?: string) =>
    request<TimeEntry>('PATCH', `/projects/${projectId}/time-entries/${entryId}/stop`, description ? { description } : undefined),
  create: (projectId: string, payload: { started_at: string; ended_at?: string; duration_seconds?: number; description?: string }) =>
    request<TimeEntry>('POST', `/projects/${projectId}/time-entries`, payload),
  delete: (projectId: string, entryId: string) =>
    request<void>('DELETE', `/projects/${projectId}/time-entries/${entryId}`),
};

// ── Dashboard API ─────────────────────────────────────────────────────────────

export const dashboardApi = {
  admin: () =>
    request<{ data: {
      total_firms: number;
      total_tickets: number;
      to_do_tickets: number;
      assigned_tickets: number;
      team_members: number;
      recent_transcripts: unknown[];
      team_workload: Array<{ id: string; name: string; email: string; count: number }>;
    } }>('GET', '/dashboard/admin').then((r) => r.data),
  teamWorkload: () =>
    request<{ data: Array<{
      user: { id: string; name: string; email: string };
      assigned: number;
      pending: number;
      resolved: number;
      total_hours: number;
    }> }>('GET', '/dashboard/team-workload').then((r) => r.data),
  overdueTickets: () =>
    request<{ data: Array<{
      id: string; title: string; priority: string; status: string;
      firm_id: string; project_id: string | null; assignee_id: string | null;
      created_at: string; updated_at: string; deadline: string | null;
      overdue_type: 'past_deadline' | 'stale_approved';
    }> }>('GET', '/dashboard/overdue-tickets').then((r) => r.data),
  member: () =>
    request<{ data: {
      total_assigned: number;
      assigned_tickets: number;
      total_hours_logged: number;
      recent_tickets: unknown[];
    } }>('GET', '/dashboard/member').then((r) => r.data),
};

// ── Task Types API ────────────────────────────────────────────────────────────

export interface TaskTypeMember {
  id: string;
  name: string;
  avatar_url: string | null;
}

export interface TaskType {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  created_at: string;
  members: TaskTypeMember[];
  task_count: number;
}

export interface CreateTaskTypePayload {
  name: string;
  description?: string;
  color?: string;
  member_ids?: string[];
}

export interface UpdateTaskTypePayload {
  name?: string;
  description?: string;
  color?: string;
  member_ids?: string[];
}

export const taskTypesApi = {
  list: () =>
    request<{ data: TaskType[] }>('GET', '/task-types').then((r) => r.data),
  create: (payload: CreateTaskTypePayload) =>
    request<{ data: TaskType }>('POST', '/task-types', payload).then((r) => r.data),
  update: (id: string, payload: UpdateTaskTypePayload) =>
    request<{ data: TaskType }>('PATCH', `/task-types/${id}`, payload).then((r) => r.data),
  delete: (id: string) =>
    request<void>('DELETE', `/task-types/${id}`),
};

// ── Mentionable Users API ─────────────────────────────────────────────────────

export interface MentionUser {
  id:         string;
  name:       string;
  first_name: string | null;
  last_name:  string | null;
  avatar_url: string | null;
  status:     string;
}

export const mentionableUsersApi = {
  list: () =>
    request<{ data: MentionUser[] }>('GET', '/users/mentions').then((r) => r.data),
};

// ── Messages API ──────────────────────────────────────────────────────────────

export interface MessageAuthor {
  id:         string;
  name:       string;
  avatar_url: string | null;
}

export interface MessageReaction {
  emoji: string;
  count: number;
  users: string[];
}

export interface Message {
  id:         string;
  scope:      string;
  scope_id:   string;
  user_id:    string;
  parent_id:  string | null;
  body:       string;
  /** True for automatic activity log entries (assignee added/removed, etc.) */
  is_system?: boolean;
  created_at: string;
  updated_at: string;
  author:     MessageAuthor;
  reactions:  MessageReaction[];
  /** IDs of users who have read this message */
  read_by:    string[];
}

export const messagesApi = {
  list: (scope: string, scopeId: string) =>
    request<{ data: Message[] }>('GET', `/messages?scope=${scope}&scope_id=${scopeId}`)
      .then((r) => r.data),

  create: (payload: { scope: string; scope_id: string; body: string; parent_id?: string; is_system?: boolean }) =>
    request<{ data: Message }>('POST', '/messages', payload).then((r) => r.data),

  markRead: (scope: string, scopeId: string) =>
    request<{ marked: number }>('POST', '/messages/read', { scope, scope_id: scopeId }),

  addReaction: (messageId: string, emoji: string) =>
    request<{ data: MessageReaction[] }>('POST', `/messages/${messageId}/reactions`, { emoji })
      .then((r) => r.data),

  removeReaction: (messageId: string, emoji: string) =>
    request<{ data: MessageReaction[] }>('DELETE', `/messages/${messageId}/reactions`, { emoji })
      .then((r) => r.data),

  delete: (messageId: string) =>
    request<void>('DELETE', `/messages/${messageId}`),

  sendTyping: (scope: string, scopeId: string) =>
    request<void>('POST', '/messages/typing', { scope, scope_id: scopeId }),
};
