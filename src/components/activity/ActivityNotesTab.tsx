import { useQuery } from '@tanstack/react-query';
import LoadingSpinner from '../ui/LoadingSpinner';
import EmptyState from '../ui/EmptyState';
import { timeEntriesApi, projectTimeEntriesApi } from '../../lib/api';
import { queryKeys } from '../../lib/queryKeys';
import { formatRelativeDate } from '../../lib/formatUtils';
import type { TimeEntry } from '../../lib/api';

interface ActivityNotesTabProps {
  scope:   'project' | 'task';
  scopeId: string;
}

function collectNotes(entries: TimeEntry[]): TimeEntry[] {
  return entries
    .filter((e) => e.description && e.description.trim())
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export default function ActivityNotesTab({ scope, scopeId }: ActivityNotesTabProps) {
  const isProject = scope === 'project';

  const { data: taskData, isLoading: taskLoading } = useQuery({
    queryKey: queryKeys.timeEntries.byTask(scopeId),
    queryFn:  () => timeEntriesApi.list(scopeId),
    enabled:  !isProject,
  });

  const { data: projectData, isLoading: projectLoading } = useQuery({
    queryKey: queryKeys.timeEntries.byProject(scopeId),
    queryFn:  () => projectTimeEntriesApi.list(scopeId),
    enabled:  isProject,
  });

  const isLoading = isProject ? projectLoading : taskLoading;

  const notes: TimeEntry[] = (() => {
    if (isProject && projectData) {
      const all: TimeEntry[] = [...(projectData.project_entries ?? [])];
      for (const t of projectData.task_summary ?? []) {
        all.push(...(t.entries ?? []));
        for (const sub of t.subtasks ?? []) all.push(...(sub.entries ?? []));
      }
      return collectNotes(all);
    }
    if (!isProject && taskData) {
      const all: TimeEntry[] = [...(taskData.own_entries ?? [])];
      for (const sub of taskData.subtask_summary ?? []) all.push(...(sub.entries ?? []));
      return collectNotes(all);
    }
    return [];
  })();

  if (isLoading) {
    return <div className="flex-1 flex items-center justify-center"><LoadingSpinner /></div>;
  }

  if (notes.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <EmptyState
          title="No notes yet"
          description="Notes are added when logging time — stop a timer and add a description."
        />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto divide-y divide-[#F2F4F7]">
      {notes.map((entry) => (
        <div key={entry.id} className="px-5 py-3.5 hover:bg-[#F9FAFB]">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-6 h-6 rounded-full bg-[#F4F3FF] flex items-center justify-center shrink-0 text-[10px] font-bold text-[#7F56D9]">
              {(entry.user?.name ?? 'U').charAt(0).toUpperCase()}
            </div>
            <span className="text-[12px] font-semibold text-[#344054] truncate">
              {entry.user?.name ?? 'Unknown'}
            </span>
            <span className="text-[11px] text-[#A4A7AE] ml-auto shrink-0">
              {formatRelativeDate(entry.created_at)}
            </span>
          </div>
          <p className="text-[13px] text-[#344054] leading-relaxed pl-8">{entry.description}</p>
          {entry.task && (
            <p className="text-[11px] text-[#A4A7AE] pl-8 mt-1">on: {entry.task.title}</p>
          )}
        </div>
      ))}
    </div>
  );
}
