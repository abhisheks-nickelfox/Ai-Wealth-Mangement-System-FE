import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '../lib/api';
import type { UpdateUserPayload } from '../lib/api';
import { queryKeys } from '../lib/queryKeys';

export function useUsers() {
  return useQuery({
    queryKey:  queryKeys.users.all,
    queryFn:   () => usersApi.list(),
    staleTime: 300_000,
  });
}

/** Same cache as useUsers but data is pre-filtered to Active members only. Use this for all assignee pickers. */
export function useActiveUsers() {
  const query = useUsers();
  return {
    ...query,
    data: query.data?.filter((u) => u.status === 'Active') ?? [],
  };
}

export function useUser(id: string) {
  return useQuery({
    queryKey:  queryKeys.users.detail(id),
    queryFn:   () => usersApi.get(id),
    enabled:   !!id,
    staleTime: 300_000,
  });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: usersApi.create,
    onSuccess:  () => qc.invalidateQueries({ queryKey: queryKeys.users.all }),
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateUserPayload }) =>
      usersApi.update(id, payload),
    onSuccess: (_updatedUser, { id }) => {
      qc.invalidateQueries({ queryKey: queryKeys.users.all });
      qc.invalidateQueries({ queryKey: queryKeys.users.detail(id) });
    },
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: usersApi.delete,
    onSuccess:  () => qc.invalidateQueries({ queryKey: queryKeys.users.all }),
  });
}

export function useResendInvite() {
  return useMutation({ mutationFn: usersApi.resendInvite });
}
