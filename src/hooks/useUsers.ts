import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '../lib/api';
import type { UpdateUserPayload } from '../lib/api';
import { queryKeys } from '../lib/queryKeys';

export function useUsers() {
  return useQuery({
    queryKey: queryKeys.users.all,
    queryFn:  () => usersApi.list(),
  });
}

export function useUser(id: string) {
  return useQuery({
    queryKey: queryKeys.users.detail(id),
    queryFn:  () => usersApi.get(id),
    enabled:  !!id,
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
    onSuccess: (updatedUser, { id }) => {
      qc.setQueryData(queryKeys.users.detail(id), updatedUser);
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
