import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { memberRolesApi } from '../lib/api';
import { queryKeys } from '../lib/queryKeys';

export function useMemberRoles() {
  return useQuery({
    queryKey: queryKeys.memberRoles.all,
    queryFn:  () => memberRolesApi.list(),
  });
}

export function useCreateMemberRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => memberRolesApi.create(name),
    onSuccess:  () => qc.invalidateQueries({ queryKey: queryKeys.memberRoles.all }),
  });
}

export function useDeleteMemberRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: memberRolesApi.delete,
    onSuccess:  () => qc.invalidateQueries({ queryKey: queryKeys.memberRoles.all }),
  });
}
