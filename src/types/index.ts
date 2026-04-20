// ── User / Team ───────────────────────────────────────────────────────────────

export type UserStatus = 'Active' | 'invited' | 'Disabled';

export interface TeamMember {
  id: string;
  name: string;
  handle: string;
  avatarBg: string;
  avatarInitials?: string;
  status: UserStatus;
  /** Free-text job title (member_role from DB) */
  role: string;
  email: string;
  skills: string[];
}

// ── Tasks ─────────────────────────────────────────────────────────────────────

export interface Task {
  id: string;
  title: string;
  isParent?: boolean;
  children?: Task[];
}

// ── Forms ─────────────────────────────────────────────────────────────────────

export type SystemRole = 'admin' | 'member';

export type Role = 'Admin' | 'Project Manager' | 'Member';

export type CoreArea =
  | 'Marketing'
  | 'Account Management'
  | 'Project management'
  | 'UX Design'
  | 'Content'
  | 'Graphic design';
