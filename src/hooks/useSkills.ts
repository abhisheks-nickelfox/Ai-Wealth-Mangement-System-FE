import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { skillsApi } from '../lib/api';
import { queryKeys } from '../lib/queryKeys';

export function useSkills() {
  return useQuery({
    queryKey:  queryKeys.skills.all,
    queryFn:   () => skillsApi.list(),
    staleTime: 600_000,
  });
}

export function useCreateSkill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: skillsApi.create,
    onSuccess:  () => qc.invalidateQueries({ queryKey: queryKeys.skills.all }),
  });
}

export function useUpdateSkill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: { name?: string; category?: string; description?: string; color?: string } }) =>
      skillsApi.update(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.skills.all }),
  });
}

export function useDeleteSkill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: skillsApi.delete,
    onSuccess:  () => qc.invalidateQueries({ queryKey: queryKeys.skills.all }),
  });
}

export function useSetSkillMembers() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, user_ids }: { id: string; user_ids: string[] }) =>
      skillsApi.setMembers(id, user_ids),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.skills.all }),
  });
}
