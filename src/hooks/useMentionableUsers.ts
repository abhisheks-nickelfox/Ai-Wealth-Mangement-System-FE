import { useQuery } from '@tanstack/react-query';
import { mentionableUsersApi } from '../lib/api';
import { queryKeys } from '../lib/queryKeys';

export function useMentionableUsers() {
  const query = useQuery({
    queryKey: queryKeys.users.mentionable,
    queryFn:  mentionableUsersApi.list,
    staleTime: 5 * 60 * 1000,
  });
  return {
    ...query,
    data: query.data?.filter((u) => u.status === 'Active') ?? [],
  };
}
