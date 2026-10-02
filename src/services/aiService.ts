import { refreshAuthSession } from '../utils/apiClient';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface StreamCallbacks {
  onStatus?: (status: string) => void;
  onDelta?: (delta: string) => void;
  onDone?: (meta: { latencyMs?: number }) => void;
  onError?: (error: Error) => void;
}

export async function streamAiChat(
  message: string,
  history: ChatMessage[],
  callbacks: StreamCallbacks,
  signal?: AbortSignal
): Promise<void> {
  let response = await fetch(`${API_BASE_URL}/ai/chat/stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ message, history }),
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
        body: JSON.stringify({ message, history }),
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
            if (currentEvent === 'status' && typeof data?.message === 'string') {
              callbacks.onStatus?.(data.message);
            } else if (currentEvent === 'delta' && typeof data?.text === 'string') {
              callbacks.onDelta?.(data.text);
            } else if (currentEvent === 'done') {
              callbacks.onDone?.(data as { latencyMs?: number });
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
