import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  aiService,
  type ConversationDetail,
  type ConversationSummary,
  type RenameConversationPayload,
  type StreamChatPayload,
} from '../services/aiService';

export const AI_CONVERSATIONS_QUERY_KEY = ['ai', 'conversations'] as const;

export const aiConversationQueryKey = (id: string | null) =>
  ['ai', 'conversation', id] as const;

/**
 * Fetch list of all saved AI conversations
 */
export function useAiConversationsQuery(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: AI_CONVERSATIONS_QUERY_KEY,
    queryFn: () => aiService.listConversations(),
    enabled: options?.enabled ?? true,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

/**
 * Fetch detailed messages and metadata for a specific conversation
 */
export function useAiConversationQuery(
  conversationId: string | null,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: aiConversationQueryKey(conversationId),
    queryFn: () => {
      if (!conversationId) {
        throw new Error('Conversation ID is required');
      }
      return aiService.getConversation(conversationId);
    },
    enabled: !!conversationId && (options?.enabled ?? true),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Rename an existing conversation
 */
export function useRenameAiConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, title }: RenameConversationPayload) =>
      aiService.renameConversation(id, title),
    onSuccess: (updated) => {
      queryClient.setQueryData<ConversationSummary[]>(
        AI_CONVERSATIONS_QUERY_KEY,
        (current) =>
          current?.map((conv) =>
            conv.id === updated.id ? { ...conv, title: updated.title } : conv
          )
      );
      queryClient.setQueryData<ConversationDetail>(
        aiConversationQueryKey(updated.id),
        (current) => (current ? { ...current, title: updated.title } : current)
      );
      void queryClient.invalidateQueries({ queryKey: AI_CONVERSATIONS_QUERY_KEY });
    },
  });
}

/**
 * Delete a specific conversation
 */
export function useDeleteAiConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => aiService.deleteConversation(id),
    onSuccess: (_, deletedId) => {
      queryClient.setQueryData<ConversationSummary[]>(
        AI_CONVERSATIONS_QUERY_KEY,
        (current) => current?.filter((conv) => conv.id !== deletedId)
      );
      queryClient.removeQueries({ queryKey: aiConversationQueryKey(deletedId) });
      void queryClient.invalidateQueries({ queryKey: AI_CONVERSATIONS_QUERY_KEY });
    },
  });
}

/**
 * Clear all conversations
 */
export function useClearAllAiConversations() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => aiService.clearAllConversations(),
    onSuccess: () => {
      queryClient.setQueryData<ConversationSummary[]>(AI_CONVERSATIONS_QUERY_KEY, []);
      queryClient.removeQueries({ queryKey: ['ai'] });
      void queryClient.invalidateQueries({ queryKey: AI_CONVERSATIONS_QUERY_KEY });
    },
  });
}

/**
 * Streaming chat mutation to invoke AI stream response
 */
export function useStreamAiChat() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      message,
      history,
      callbacks,
      conversationId,
      signal,
    }: StreamChatPayload) =>
      aiService.streamAiChat(message, history, callbacks, conversationId, signal),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: AI_CONVERSATIONS_QUERY_KEY });
    },
  });
}
