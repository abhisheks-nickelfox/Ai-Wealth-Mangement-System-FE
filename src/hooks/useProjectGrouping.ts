import { useMemo } from 'react';
import type { Task, Project } from '../lib/api';

const TASK_STATUS_TO_GROUP: Record<string, string> = {
  to_do:             'todo',
  assigned:          'assigned',
  in_progress:       'inprogress',
  revisions:         'revisions',
  internal_review:   'inreview',
  client_review:     'clientreview',
  compliance_review: 'clientreview',
  approved:          'completed',
  closed:            'completed',
  completed:         'completed',
  blocked:           'blocked',
  draft:             'todo',
};

const WORKFLOW_TO_GROUP: Record<string, string> = {
  todo:        'todo',
  in_progress: 'inprogress',
  in_review:   'inreview',
  approved:    'completed',
  completed:   'completed',
};

const GROUP_IDS = [
  'todo', 'assigned', 'inprogress', 'revisions',
  'inreview', 'clientreview', 'completed', 'blocked',
];

export interface ProjectGroupEntry {
  project: Project;
  taskCount: number;
}

/**
 * Groups projects by task status. Projects with tasks appear in every section
 * whose tasks they contain. Projects without tasks fall back to workflow_status.
 */
export function useProjectGrouping(
  allTasks: Task[],
  filteredProjects: Project[],
  filterStatuses: string[],
): Map<string, ProjectGroupEntry[]> {
  const projectGroupsFromTasks = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const task of allTasks) {
      if (!task.project_id) continue;
      const groupId = TASK_STATUS_TO_GROUP[task.status];
      if (!groupId) continue;
      if (!map.has(task.project_id)) map.set(task.project_id, new Set());
      map.get(task.project_id)!.add(groupId);
    }
    return map;
  }, [allTasks]);

  const projectTaskCounts = useMemo(() => {
    const map = new Map<string, Map<string, number>>();
    for (const task of allTasks) {
      if (!task.project_id) continue;
      const groupId = TASK_STATUS_TO_GROUP[task.status];
      if (!groupId) continue;
      if (!map.has(task.project_id)) map.set(task.project_id, new Map());
      const inner = map.get(task.project_id)!;
      inner.set(groupId, (inner.get(groupId) ?? 0) + 1);
    }
    return map;
  }, [allTasks]);

  const filteredProjectIds  = useMemo(() => new Set(filteredProjects.map((p) => p.id)), [filteredProjects]);
  const filteredProjectsMap = useMemo(() => new Map(filteredProjects.map((p) => [p.id, p])), [filteredProjects]);

  return useMemo(() => {
    const map = new Map<string, ProjectGroupEntry[]>();
    for (const id of GROUP_IDS) map.set(id, []);

    const projectsWithTasks = new Set<string>();

    for (const [projectId, groupSet] of projectGroupsFromTasks) {
      if (!filteredProjectIds.has(projectId)) continue;
      const project = filteredProjectsMap.get(projectId);
      if (!project) continue;

      const applicableGroups = filterStatuses.length > 0
        ? [...groupSet].filter((g) => filterStatuses.includes(g))
        : [...groupSet];

      if (applicableGroups.length > 0) {
        projectsWithTasks.add(projectId);
        for (const groupId of applicableGroups) {
          const taskCount = projectTaskCounts.get(projectId)?.get(groupId) ?? 0;
          map.get(groupId)?.push({ project, taskCount });
        }
      }
    }

    if (filterStatuses.length === 0) {
      for (const project of filteredProjects) {
        if (projectsWithTasks.has(project.id)) continue;
        const groupId = WORKFLOW_TO_GROUP[project.workflow_status] ?? 'todo';
        map.get(groupId)?.push({ project, taskCount: 0 });
      }
    }

    return map;
  }, [filteredProjects, filteredProjectIds, filteredProjectsMap, projectGroupsFromTasks, projectTaskCounts, filterStatuses]);
}
