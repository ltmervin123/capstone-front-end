import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { feedbackService, type CreateFeedbackPayload, type ReplyFeedbackPayload, type UpdateFeedbackStatusPayload } from '../services/feedbackService';
import type { FeedbackItem } from '../types/types';

export const FEEDBACK_QUERY_KEY = ['feedback'] as const;

function patchFeedbackItem(queryClient: QueryClient, record: FeedbackItem) {
  queryClient.setQueryData<FeedbackItem[]>(FEEDBACK_QUERY_KEY, (current) =>
    current?.map((item) => (item.id === record.id ? record : item)),
  );
}

function removeFeedbackItem(queryClient: QueryClient, id: string) {
  queryClient.setQueryData<FeedbackItem[]>(FEEDBACK_QUERY_KEY, (current) =>
    current?.filter((item) => item.id !== id),
  );
}

export function useFeedbackQuery(options?: { enabled?: boolean; refetchInterval?: number | false }) {
  return useQuery({
    queryKey: FEEDBACK_QUERY_KEY,
    queryFn: () => feedbackService.listFeedback(),
    enabled: options?.enabled ?? true,
    refetchInterval: options?.refetchInterval,
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

export function useUpdateFeedbackStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { id: string } & UpdateFeedbackStatusPayload) =>
      feedbackService.updateFeedbackStatus(params.id, { status: params.status }),
    onMutate: async (params) => {
      await queryClient.cancelQueries({ queryKey: FEEDBACK_QUERY_KEY });
      const previous = queryClient.getQueryData<FeedbackItem[]>(FEEDBACK_QUERY_KEY);
      queryClient.setQueryData<FeedbackItem[]>(FEEDBACK_QUERY_KEY, (current) =>
        current?.map((item) => (item.id === params.id ? { ...item, status: params.status } : item)),
      );
      return { previous };
    },
    onError: (_error, _params, context) => {
      if (context?.previous) {
        queryClient.setQueryData(FEEDBACK_QUERY_KEY, context.previous);
      }
    },
    onSuccess: (record) => {
      patchFeedbackItem(queryClient, record);
    },
  });
}

export function useReplyToFeedback() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { id: string } & ReplyFeedbackPayload) =>
      feedbackService.replyToFeedback(params.id, {
        adminResponse: params.adminResponse,
        status: params.status,
      }),
    onSuccess: (record) => {
      patchFeedbackItem(queryClient, record);
    },
  });
}

export function useDeleteFeedback() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => feedbackService.deleteFeedback(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: FEEDBACK_QUERY_KEY });
      const previous = queryClient.getQueryData<FeedbackItem[]>(FEEDBACK_QUERY_KEY);
      removeFeedbackItem(queryClient, id);
      return { previous };
    },
    onError: (_error, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(FEEDBACK_QUERY_KEY, context.previous);
      }
    },
    onSuccess: (result) => {
      removeFeedbackItem(queryClient, result.id);
    },
  });
}

export function useMarkFeedbackNotificationsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => feedbackService.markNotificationsRead(),
    onSuccess: () => {
      queryClient.setQueryData<FeedbackItem[]>(FEEDBACK_QUERY_KEY, (current) =>
        current?.map((item) =>
          item.employeeNotified
            ? { ...item, hasUnreadNotification: false }
            : item,
        ),
      );
    },
  });
}
