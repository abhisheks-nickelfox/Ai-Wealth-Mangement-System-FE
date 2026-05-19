// ── Typed query key factories ─────────────────────────────────────────────────
// Centralised key definitions prevent typos and make invalidation predictable.

export const queryKeys = {
  users: {
    all:        ['users'] as const,
    detail:     (id: string) => ['users', id] as const,
    mentionable: ['users', 'mentionable'] as const,
  },
  skills: {
    all: ['skills'] as const,
  },
  memberRoles: {
    all: ['memberRoles'] as const,
  },
  firms: {
    all:    ['firms'] as const,
    detail: (id: string) => ['firms', id] as const,
  },
  projects: {
    all:    ['projects'] as const,
    byFirm: (firmId: string) => ['projects', 'firm', firmId] as const,
    detail: (id: string) => ['projects', id] as const,
  },
  tasks: {
    all:    ['tasks'] as const,
    detail: (id: string) => ['tasks', 'detail', id] as const,
    byFirm: (firmId: string) => ['tasks', 'firm', firmId] as const,
  },
  transcripts: {
    all: ['transcripts'] as const,
  },
  prompts: {
    all: ['prompts'] as const,
  },
  messages: {
    byScope: (scope: string, scopeId: string) => ['messages', scope, scopeId] as const,
  },
  attachments: {
    byTask: (taskId: string) => ['attachments', 'task', taskId] as const,
  },
  projectAttachments: {
    byProject: (projectId: string) => ['projectAttachments', projectId] as const,
  },
  timeEntries: {
    byTask:    (taskId:    string) => ['time-entries', taskId]           as const,
    byProject: (projectId: string) => ['project-time-entries', projectId] as const,
  },
  timeLogs: {
    byTask: (taskId: string) => ['timeLogs', taskId] as const,
  },
  notifications: {
    all: ['notifications'] as const,
  },
};
