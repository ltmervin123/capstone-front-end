const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api';

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiErrorBody {
  message: string;
  code: string;
}

export interface ApiErrorResponse {
  success: false;
  error: ApiErrorBody;
}

export class ApiRequestError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, message: string, code: string) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
    this.code = code;
  }
}

async function parseResponseBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers);

  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers,
  });

  const body = await parseResponseBody(response);

  if (!response.ok) {
    const errorBody = body as ApiErrorResponse | null;
    const message = errorBody?.error?.message ?? 'Request failed';
    const code = errorBody?.error?.code ?? 'REQUEST_FAILED';
    throw new ApiRequestError(response.status, message, code);
  }

  return body as T;
}
