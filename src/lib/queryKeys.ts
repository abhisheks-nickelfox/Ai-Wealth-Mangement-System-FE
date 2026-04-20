// ── Typed query key factories ─────────────────────────────────────────────────
// Centralised key definitions prevent typos and make invalidation predictable.

export const queryKeys = {
  users: {
    all:    ['users'] as const,
    detail: (id: string) => ['users', id] as const,
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
  tasks: {
    all:    ['tasks'] as const,
    byFirm: (firmId: string) => ['tasks', 'firm', firmId] as const,
  },
  transcripts: {
    all: ['transcripts'] as const,
  },
  prompts: {
    all: ['prompts'] as const,
  },
};
