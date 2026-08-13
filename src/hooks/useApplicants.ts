import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { applicantService, type ApplicantPayloadInput } from '../services/applicantService';

export const APPLICANTS_QUERY_KEY = ['applicants'] as const;

export function useApplicantsQuery() {
  return useQuery({
    queryKey: APPLICANTS_QUERY_KEY,
    queryFn: () => applicantService.listApplicants(),
  });
}

export function useCreateApplicant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ApplicantPayloadInput) => applicantService.createApplicant(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: APPLICANTS_QUERY_KEY });
    },
  });
}

export function useUpdateApplicant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { id: string; payload: ApplicantPayloadInput }) =>
      applicantService.updateApplicant(params.id, params.payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: APPLICANTS_QUERY_KEY });
    },
  });
}

export function useDeleteApplicant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => applicantService.deleteApplicant(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: APPLICANTS_QUERY_KEY });
    },
  });
}
