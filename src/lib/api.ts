// ── API client for frontend-new ───────────────────────────────────────────────
// All requests go through this module. Never use fetch() directly in components.

const BASE_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:3000/api';

function getToken(): string | null {
  return localStorage.getItem('mw_token') ?? sessionStorage.getItem('mw_token');
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const token = getToken();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      method,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });

    let json: unknown;
    try {
      json = await res.json();
    } catch {
      throw new Error(`Server error (${res.status}). Please try again.`);
    }

    if (!res.ok) {
      const err = json as { error?: string };
      throw new Error(err.error ?? `Request failed with status ${res.status}`);
    }

    return json as T;
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('Request timed out. Please try again.');
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

// ── Auth API ──────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'member' | 'project_manager' | 'super_admin';
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
};

// ── Shared types ─────────────────────────────────────────────────────────────

export interface Skill {
  id: string;
  name: string;
  category: string | null;
  created_at: string;
}

export interface User {
  id: string;
  name: string;
  first_name: string | null;
  last_name: string | null;
  phone_number: string | null;
  avatar_url: string | null;
  email: string;
  role: 'admin' | 'member' | 'project_manager' | 'super_admin';
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

  create: (payload: { name: string; category?: string }) =>
    request<{ data: Skill }>('POST', '/skills', payload).then((r) => r.data),

  delete: (id: string) =>
    request<{ message: string }>('DELETE', `/skills/${id}`),
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
  description: string | null;
}

export interface Prompt {
  id: string;
  name: string;
  type: string | null;
  content?: string;
}

export interface Task {
  id: string;
  session_id: string | null;
  firm_id: string;
  project_id: string | null;
  assignee_id: string | null;
  title: string;
  description: string | null;
  type: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: string;
  deadline: string | null;
  estimated_hours: number | null;
  ai_generated: boolean;
  edited: boolean;
  archived: boolean;
  created_at: string;
  firms?: { name: string };
  assignee?: { name: string; email: string } | null;
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
    request<{ data: { session_id: string; firm_id: string; tickets: Task[] } }>(
      'POST', `/transcripts/${id}/process`, payload,
    ).then((r) => r.data),
};

export const firmsApi = {
  list: () => request<{ data: Firm[] }>('GET', '/firms').then((r) => r.data),
  get: (id: string) => request<{ data: Firm }>('GET', `/firms/${id}`).then((r) => r.data),
};

export const promptsApi = {
  list: () => request<{ data: Prompt[] }>('GET', '/prompts').then((r) => r.data),
};

export const tasksApi = {
  list: (params?: { firm_id?: string; session_id?: string; status?: string }) => {
    const q = new URLSearchParams();
    if (params?.firm_id) q.set('firm_id', params.firm_id);
    if (params?.session_id) q.set('session_id', params.session_id);
    if (params?.status) q.set('status', params.status);
    const qs = q.toString() ? `?${q.toString()}` : '';
    return request<{ data: Task[] }>('GET', `/tasks${qs}`).then((r) => r.data);
  },
  update: (id: string, payload: Partial<Pick<Task, 'title' | 'description' | 'priority' | 'deadline'>>) =>
    request<{ data: Task }>('PATCH', `/tasks/${id}`, payload).then((r) => r.data),
  assignApprove: (id: string, payload: { assignee_id: string; priority?: string; deadline?: string }) =>
    request<{ data: Task }>('PATCH', `/tasks/${id}/assign-approve`, payload).then((r) => r.data),
  discard: (id: string) =>
    request<{ data: Task }>('PATCH', `/tasks/${id}/discard`).then((r) => r.data),
  archive: (id: string, archived: boolean) =>
    request<{ data: Task }>('PATCH', `/tasks/${id}/archive`, { archived }).then((r) => r.data),
};
