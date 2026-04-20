import { useQuery } from '@tanstack/react-query';
import { promptsApi } from '../lib/api';
import { queryKeys } from '../lib/queryKeys';

export function usePrompts() {
  return useQuery({
    queryKey: queryKeys.prompts.all,
    queryFn:  () => promptsApi.list(),
  });
}
