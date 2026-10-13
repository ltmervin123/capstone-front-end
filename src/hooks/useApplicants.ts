import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { applicantService, type ApplicantPayloadInput } from '../services/applicantService';
import { useAuthStore } from '../stores/authStore';
import { invalidateApplicantRelated } from '../lib/queryInvalidations';

export const applicantsQueryKey = (userId?: string) => [userId ?? '', 'applicants'] as const;

export function useApplicantsQuery() {
  const userId = useAuthStore((state) => state.user?.id);
  return useQuery({
    queryKey: applicantsQueryKey(userId),
    queryFn: () => applicantService.listApplicants(),
    enabled: !!userId,
  });
}

export function useCreateApplicant() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.user?.id);

  return useMutation({
    mutationFn: (payload: ApplicantPayloadInput) => applicantService.createApplicant(payload),
    onSuccess: () => {
      invalidateApplicantRelated(queryClient, userId);
    },
  });
}

export function useUpdateApplicant() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.user?.id);

  return useMutation({
    mutationFn: (params: { id: string; payload: ApplicantPayloadInput }) =>
      applicantService.updateApplicant(params.id, params.payload),
    onSuccess: () => {
      invalidateApplicantRelated(queryClient, userId);
    },
  });
}

export function useDeleteApplicant() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.user?.id);

  return useMutation({
    mutationFn: (id: string) => applicantService.deleteApplicant(id),
    onSuccess: () => {
      invalidateApplicantRelated(queryClient, userId);
    },
  });
}

