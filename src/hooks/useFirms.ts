import { useQuery } from '@tanstack/react-query';
import { firmsApi } from '../lib/api';
import { queryKeys } from '../lib/queryKeys';

export function useFirms() {
  return useQuery({
    queryKey: queryKeys.firms.all,
    queryFn:  () => firmsApi.list(),
  });
}

export function useFirmDetail(id: string) {
  return useQuery({
    queryKey: queryKeys.firms.detail(id),
    queryFn:  () => firmsApi.get(id),
    enabled:  !!id,
  });
}
