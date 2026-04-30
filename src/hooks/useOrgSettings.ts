import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orgSettingsApi } from '../lib/api';

export function useOrgSettings() {
  return useQuery({
    queryKey: ['org-settings'],
    queryFn: orgSettingsApi.get,
    staleTime: 0,
  });
}

export function useUploadOrgLogo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: orgSettingsApi.uploadLogo,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['org-settings'] }),
  });
}
