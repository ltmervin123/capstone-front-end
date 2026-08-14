import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { feedbackService, type CreateFeedbackPayload } from '../services/feedbackService';

export const FEEDBACK_QUERY_KEY = ['feedback'] as const;

export function useFeedbackQuery(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: FEEDBACK_QUERY_KEY,
    queryFn: () => feedbackService.listFeedback(),
    enabled: options?.enabled ?? true,
  });
}

export function useCreateFeedback() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateFeedbackPayload) => feedbackService.createFeedback(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: FEEDBACK_QUERY_KEY });
    },
  });
}
