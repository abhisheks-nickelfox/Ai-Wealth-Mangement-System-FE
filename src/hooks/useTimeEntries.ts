import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { timeEntriesApi, projectTimeEntriesApi } from '../lib/api'
import { useTimer } from '../context/TimerContext'
import { queryKeys } from '../lib/queryKeys'

// ── Query keys ────────────────────────────────────────────────────────────────

const PROJ_TIME_KEY = (id: string) => ['project-direct-time-entries', id]

export function useTimeEntries(taskId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.timeEntries.byTask(taskId ?? ''),
    queryFn:  () => timeEntriesApi.list(taskId!),
    enabled:  !!taskId,
  })
}

export function useStartTimer(taskId: string) {
  const qc = useQueryClient()
  const { startTimer } = useTimer()
  return useMutation({
    mutationFn: () => timeEntriesApi.start(taskId),
    onSuccess: (entry) => {
      startTimer({ entryId: entry.id, taskId, taskTitle: '', startedAt: entry.started_at })
      qc.invalidateQueries({ queryKey: queryKeys.timeEntries.byTask(taskId) })
    },
  })
}

export function useStopTimer(taskId: string) {
  const qc = useQueryClient()
  const { stopTimer } = useTimer()
  return useMutation({
    mutationFn: ({ entryId, description }: { entryId: string; description?: string }) =>
      timeEntriesApi.stop(taskId, entryId, description),
    onSuccess: () => {
      stopTimer()
      qc.invalidateQueries({ queryKey: queryKeys.timeEntries.byTask(taskId) })
    },
  })
}

export function useCreateTimeEntry(taskId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: { started_at: string; ended_at?: string; duration_seconds?: number; description?: string }) =>
      timeEntriesApi.create(taskId, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.timeEntries.byTask(taskId) }),
  })
}

export function useUpdateTimeEntry(taskId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ entryId, ...payload }: { entryId: string; started_at?: string; ended_at?: string; duration_seconds?: number; description?: string }) =>
      timeEntriesApi.update(taskId, entryId, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.timeEntries.byTask(taskId) }),
  })
}

export function useDeleteTimeEntry(taskId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (entryId: string) => timeEntriesApi.delete(taskId, entryId),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.timeEntries.byTask(taskId) }),
  })
}

export function useProjectTimeEntries(projectId: string | undefined) {
  return useQuery({
    queryKey: PROJ_TIME_KEY(projectId ?? ''),
    queryFn:  () => projectTimeEntriesApi.list(projectId!),
    enabled:  !!projectId,
  })
}

export function useStartProjectTimer(projectId: string) {
  const qc = useQueryClient()
  const { startTimer } = useTimer()
  return useMutation({
    mutationFn: () => projectTimeEntriesApi.start(projectId),
    onSuccess: (entry) => {
      startTimer({ entryId: entry.id, taskId: '', projectId, taskTitle: '', startedAt: entry.started_at })
      qc.invalidateQueries({ queryKey: PROJ_TIME_KEY(projectId) })
    },
  })
}

export function useStopProjectTimer(projectId: string) {
  const qc = useQueryClient()
  const { stopTimer } = useTimer()
  return useMutation({
    mutationFn: ({ entryId, description }: { entryId: string; description?: string }) =>
      projectTimeEntriesApi.stop(projectId, entryId, description),
    onSuccess: () => {
      stopTimer()
      qc.invalidateQueries({ queryKey: PROJ_TIME_KEY(projectId) })
    },
  })
}

export function useCreateProjectTimeEntry(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: { started_at: string; ended_at?: string; duration_seconds?: number; description?: string }) =>
      projectTimeEntriesApi.create(projectId, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: PROJ_TIME_KEY(projectId) }),
  })
}

export function useUpdateProjectTimeEntry(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ entryId, ...payload }: { entryId: string; started_at?: string; ended_at?: string; duration_seconds?: number; description?: string }) =>
      projectTimeEntriesApi.update(projectId, entryId, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: PROJ_TIME_KEY(projectId) }),
  })
}

export function useDeleteProjectTimeEntry(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (entryId: string) => projectTimeEntriesApi.delete(projectId, entryId),
    onSuccess: () => qc.invalidateQueries({ queryKey: PROJ_TIME_KEY(projectId) }),
  })
}
