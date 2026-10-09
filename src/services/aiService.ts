import { apiRequest, refreshAuthSession, type ApiSuccessResponse } from '../utils/apiClient';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ConversationSummary {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
  lastMessage: string | null;
}

export interface ConversationDetailMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sourcesUsed?: unknown;
  createdAt: string;
}

export interface ConversationDetail {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: ConversationDetailMessage[];
}

export interface StreamCallbacks {
  onConversationId?: (conversationId: string) => void;
  onStatus?: (status: string) => void;
  onDelta?: (delta: string) => void;
  onDone?: (meta: { latencyMs?: number; conversationId?: string }) => void;
  onError?: (error: Error) => void;
}

export interface RenameConversationPayload {
  id: string;
  title: string;
}

export interface StreamChatPayload {
  message: string;
  history: ChatMessage[];
  callbacks: StreamCallbacks;
  conversationId?: string;
  signal?: AbortSignal;
}

export const aiService = {
  async listConversations(): Promise<ConversationSummary[]> {
    const res = await apiRequest<ApiSuccessResponse<ConversationSummary[]>>('/ai/conversations');
    return res.data;
  },

  async getConversation(id: string): Promise<ConversationDetail> {
    const res = await apiRequest<ApiSuccessResponse<ConversationDetail>>(`/ai/conversations/${id}`);
    return res.data;
  },

  async renameConversation(id: string, title: string): Promise<{ id: string; title: string }> {
    const res = await apiRequest<ApiSuccessResponse<{ id: string; title: string }>>(`/ai/conversations/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ title }),
    });
    return res.data;
  },

  async deleteConversation(id: string): Promise<void> {
    await apiRequest<ApiSuccessResponse<{ success: boolean }>>(`/ai/conversations/${id}`, {
      method: 'DELETE',
    });
  },

  async clearAllConversations(): Promise<void> {
    await apiRequest<ApiSuccessResponse<{ success: boolean }>>('/ai/conversations', {
      method: 'DELETE',
    });
  },

  streamAiChat,
};

export async function streamAiChat(
  message: string,
  history: ChatMessage[],
  callbacks: StreamCallbacks,
  conversationId?: string,
  signal?: AbortSignal
): Promise<void> {
  const payload: { message: string; history: ChatMessage[]; conversationId?: string } = {
    message,
    history,
  };
  if (conversationId) {
    payload.conversationId = conversationId;
  }

  let response = await fetch(`${API_BASE_URL}/ai/chat/stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(payload),
    signal,
  });

  if (response.status === 401) {
    const refreshed = await refreshAuthSession();
    if (refreshed) {
      response = await fetch(`${API_BASE_URL}/ai/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload),
        signal,
      });
    }
  }

  if (!response.ok) {
    let errorMessage = `Server error (${response.status})`;
    try {
      const errorJson = (await response.json()) as { error?: { message?: string }; message?: string };
      if (errorJson?.error?.message) {
        errorMessage = errorJson.error.message;
      } else if (errorJson?.message) {
        errorMessage = errorJson.message;
      }
    } catch {
      // Ignore JSON parse failure
    }
    throw new Error(errorMessage);
  }

  if (!response.body) {
    throw new Error('ReadableStream not supported by browser.');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      let currentEvent = 'message';
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) {
          currentEvent = 'message';
          continue;
        }

        if (trimmed.startsWith('event:')) {
          currentEvent = trimmed.slice(6).trim();
        } else if (trimmed.startsWith('data:')) {
          const rawData = trimmed.slice(5).trim();
          try {
            const data = JSON.parse(rawData) as Record<string, unknown>;
            if (currentEvent === 'conversation' && typeof data?.conversationId === 'string') {
              callbacks.onConversationId?.(data.conversationId);
            } else if (currentEvent === 'status' && typeof data?.message === 'string') {
              callbacks.onStatus?.(data.message);
            } else if (currentEvent === 'delta' && typeof data?.text === 'string') {
              callbacks.onDelta?.(data.text);
            } else if (currentEvent === 'done') {
              callbacks.onDone?.(data as { latencyMs?: number; conversationId?: string });
            } else if (currentEvent === 'error') {
              callbacks.onError?.(new Error((data?.error as string) || 'AI generation error'));
            }
          } catch {
            // Ignore non-JSON lines
          }
        }
      }
    }
  } catch (err) {
    if ((err as Error)?.name === 'AbortError') {
      return;
    }
    callbacks.onError?.(err instanceof Error ? err : new Error(String(err)));
    throw err;
  }
}
