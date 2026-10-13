import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { feedbackService, type CreateFeedbackPayload, type ReplyFeedbackPayload, type UpdateFeedbackStatusPayload } from '../services/feedbackService';
import type { FeedbackItem } from '../types/types';
import { useAuthStore } from '../stores/authStore';

export const feedbackQueryKey = (userId?: string) => [userId ?? '', 'feedback'] as const;

function patchFeedbackItem(queryClient: QueryClient, userId: string | undefined, record: FeedbackItem) {
  queryClient.setQueryData<FeedbackItem[]>(feedbackQueryKey(userId), (current) =>
    current?.map((item) => (item.id === record.id ? record : item)),
  );
}

function removeFeedbackItem(queryClient: QueryClient, userId: string | undefined, id: string) {
  queryClient.setQueryData<FeedbackItem[]>(feedbackQueryKey(userId), (current) =>
    current?.filter((item) => item.id !== id),
  );
}

export function useFeedbackQuery(options?: { enabled?: boolean; refetchInterval?: number | false }) {
  const userId = useAuthStore((state) => state.user?.id);
  return useQuery({
    queryKey: feedbackQueryKey(userId),
    queryFn: () => feedbackService.listFeedback(),
    enabled: !!userId && (options?.enabled ?? true),
    refetchInterval: options?.refetchInterval,
  });
}

export function useCreateFeedback() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.user?.id);

  return useMutation({
    mutationFn: (payload: CreateFeedbackPayload) => feedbackService.createFeedback(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: feedbackQueryKey(userId) });
    },
  });
}

export function useUpdateFeedbackStatus() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.user?.id);

  return useMutation({
    mutationFn: (params: { id: string } & UpdateFeedbackStatusPayload) =>
      feedbackService.updateFeedbackStatus(params.id, { status: params.status }),
    onMutate: async (params) => {
      const key = feedbackQueryKey(userId);
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<FeedbackItem[]>(key);
      queryClient.setQueryData<FeedbackItem[]>(key, (current) =>
        current?.map((item) => (item.id === params.id ? { ...item, status: params.status } : item)),
      );
      return { previous };
    },
    onError: (_error, _params, context) => {
      if (context?.previous) {
        queryClient.setQueryData(feedbackQueryKey(userId), context.previous);
      }
    },
    onSuccess: (record) => {
      patchFeedbackItem(queryClient, userId, record);
    },
  });
}

export function useReplyToFeedback() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.user?.id);

  return useMutation({
    mutationFn: (params: { id: string } & ReplyFeedbackPayload) =>
      feedbackService.replyToFeedback(params.id, {
        adminResponse: params.adminResponse,
        status: params.status,
      }),
    onSuccess: (record) => {
      patchFeedbackItem(queryClient, userId, record);
    },
  });
}

export function useDeleteFeedback() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.user?.id);

  return useMutation({
    mutationFn: (id: string) => feedbackService.deleteFeedback(id),
    onMutate: async (id) => {
      const key = feedbackQueryKey(userId);
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<FeedbackItem[]>(key);
      removeFeedbackItem(queryClient, userId, id);
      return { previous };
    },
    onError: (_error, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(feedbackQueryKey(userId), context.previous);
      }
    },
    onSuccess: (result) => {
      removeFeedbackItem(queryClient, userId, result.id);
    },
  });
}

export function useMarkFeedbackNotificationsRead() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.user?.id);

  return useMutation({
    mutationFn: () => feedbackService.markNotificationsRead(),
    onSuccess: () => {
      queryClient.setQueryData<FeedbackItem[]>(feedbackQueryKey(userId), (current) =>
        current?.map((item) =>
          item.employeeNotified
            ? { ...item, hasUnreadNotification: false }
            : item,
        ),
      );
    },
  });
}

