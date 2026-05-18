// Shared constants for project/task status display — import from here, never redefine locally

export const WORKFLOW_BADGE: Record<string, { label: string; style: string }> = {
  todo:        { label: 'To Do',       style: 'bg-gray-100 text-gray-500' },
  in_progress: { label: 'In Progress', style: 'bg-purple-50 text-purple-600' },
  in_review:   { label: 'In Review',   style: 'bg-yellow-50 text-yellow-700' },
  approved:    { label: 'Approved',    style: 'bg-green-50 text-green-700' },
  completed:   { label: 'Completed',   style: 'bg-gray-100 text-gray-600' },
};

export const STATUS_LABELS: Record<string, string> = {
  to_do:           'To Do',
  assigned:        'Assigned',
  in_progress:     'In Progress',
  revisions:       'Revisions',
  internal_review: 'Internal Review',
  client_review:   'Client Review',
  completed:       'Completed',
  blocked:         'Blocked',
  closed:          'Closed',
};

/** Alias used in MyTasksPage — same data as STATUS_LABELS */
export const STATUS_GROUP_LABEL: Record<string, string> = STATUS_LABELS;

/** Ordered list of task statuses for grouped views */
export const STATUS_GROUP_ORDER: string[] = [
  'to_do',
  'assigned',
  'in_progress',
  'revisions',
  'internal_review',
  'client_review',
  'completed',
  'blocked',
];

/** Project workflow_status → display label */
export const WORKFLOW_LABEL: Record<string, string> = {
  todo:        'To Do',
  in_progress: 'In Progress',
  in_review:   'In Review',
  approved:    'Approved',
  completed:   'Completed',
};

/** Display label → project workflow_status key (inverse of WORKFLOW_LABEL) */
export const WORKFLOW_TO_KEY: Record<string, string> = {
  'To Do':       'todo',
  'In progress': 'in_progress',
  'In Review':   'in_review',
  'Approved':    'approved',
  'Completed':   'completed',
};

/** Priority display label → API priority value */
export const PRIORITY_MAP: Record<string, 'low' | 'normal' | 'high' | 'urgent'> = {
  Low:    'low',
  Normal: 'normal',
  High:   'high',
  Urgent: 'urgent',
};

export const VALID_TRANSITIONS: Record<string, string[]> = {
  to_do:           ['assigned', 'in_progress', 'blocked'],
  assigned:        ['in_progress', 'blocked'],
  in_progress:     ['revisions', 'internal_review', 'blocked'],
  revisions:       ['in_progress'],
  internal_review: ['client_review', 'revisions'],
  client_review:   ['completed', 'revisions'],
  completed:       [],
  blocked:         ['to_do', 'in_progress'],
};
