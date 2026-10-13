import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  aiService,
  type ConversationDetail,
  type ConversationSummary,
  type RenameConversationPayload,
  type StreamChatPayload,
} from '../services/aiService';
import { useAuthStore } from '../stores/authStore';

export const aiConversationsQueryKey = (userId?: string) =>
  [userId ?? '', 'ai', 'conversations'] as const;

export const aiConversationQueryKey = (userId: string | undefined, id: string | null) =>
  [userId ?? '', 'ai', 'conversation', id] as const;

/**
 * Fetch list of all saved AI conversations
 */
export function useAiConversationsQuery(options?: { enabled?: boolean }) {
  const userId = useAuthStore((state) => state.user?.id);
  return useQuery({
    queryKey: aiConversationsQueryKey(userId),
    queryFn: () => aiService.listConversations(),
    enabled: !!userId && (options?.enabled ?? true),
  });
}

/**
 * Fetch detailed messages and metadata for a specific conversation
 */
export function useAiConversationQuery(
  conversationId: string | null,
  options?: { enabled?: boolean }
) {
  const userId = useAuthStore((state) => state.user?.id);
  return useQuery({
    queryKey: aiConversationQueryKey(userId, conversationId),
    queryFn: () => {
      if (!conversationId) {
        throw new Error('Conversation ID is required');
      }
      return aiService.getConversation(conversationId);
    },
    enabled: !!userId && !!conversationId && (options?.enabled ?? true),
  });
}

/**
 * Rename an existing conversation
 */
export function useRenameAiConversation() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.user?.id);

  return useMutation({
    mutationFn: ({ id, title }: RenameConversationPayload) =>
      aiService.renameConversation(id, title),
    onSuccess: (updated) => {
      queryClient.setQueryData<ConversationSummary[]>(
        aiConversationsQueryKey(userId),
        (current) =>
          current?.map((conv) =>
            conv.id === updated.id ? { ...conv, title: updated.title } : conv
          )
      );
      queryClient.setQueryData<ConversationDetail>(
        aiConversationQueryKey(userId, updated.id),
        (current) => (current ? { ...current, title: updated.title } : current)
      );
      void queryClient.invalidateQueries({
        queryKey: aiConversationsQueryKey(userId),
      });
    },
  });
}

/**
 * Delete a specific conversation
 */
export function useDeleteAiConversation() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.user?.id);

  return useMutation({
    mutationFn: (id: string) => aiService.deleteConversation(id),
    onSuccess: (_, deletedId) => {
      queryClient.setQueryData<ConversationSummary[]>(
        aiConversationsQueryKey(userId),
        (current) => current?.filter((conv) => conv.id !== deletedId)
      );
      queryClient.removeQueries({
        queryKey: aiConversationQueryKey(userId, deletedId),
      });
      void queryClient.invalidateQueries({
        queryKey: aiConversationsQueryKey(userId),
      });
    },
  });
}

/**
 * Clear all conversations
 */
export function useClearAllAiConversations() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.user?.id);

  return useMutation({
    mutationFn: () => aiService.clearAllConversations(),
    onSuccess: () => {
      queryClient.setQueryData<ConversationSummary[]>(
        aiConversationsQueryKey(userId),
        []
      );
      queryClient.removeQueries({ queryKey: [userId ?? '', 'ai'] });
      void queryClient.invalidateQueries({
        queryKey: aiConversationsQueryKey(userId),
      });
    },
  });
}

/**
 * Streaming chat mutation to invoke AI stream response
 */
export function useStreamAiChat() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.user?.id);

  return useMutation({
    mutationFn: ({
      message,
      history,
      callbacks,
      conversationId,
      signal,
    }: StreamChatPayload) =>
      aiService.streamAiChat(
        message,
        history,
        callbacks,
        conversationId,
        signal
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: aiConversationsQueryKey(userId),
      });
    },
  });
}

