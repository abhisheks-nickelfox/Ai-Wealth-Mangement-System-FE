import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { skillsApi } from '../lib/api';
import { queryKeys } from '../lib/queryKeys';

export function useSkills() {
  return useQuery({
    queryKey: queryKeys.skills.all,
    queryFn:  () => skillsApi.list(),
  });
}

export function useCreateSkill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: skillsApi.create,
    onSuccess:  () => qc.invalidateQueries({ queryKey: queryKeys.skills.all }),
  });
}

export function useDeleteSkill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: skillsApi.delete,
    onSuccess:  () => qc.invalidateQueries({ queryKey: queryKeys.skills.all }),
  });
}
