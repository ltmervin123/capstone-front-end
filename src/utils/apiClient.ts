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

export interface ApiRequestOptions extends RequestInit {
  skipAuthRefresh?: boolean;
  _retry?: boolean;
}

type SessionRefresher = () => Promise<boolean>;

let sessionRefresher: SessionRefresher | null = null;
let refreshPromise: Promise<boolean> | null = null;

export function setSessionRefresher(refresher: SessionRefresher): void {
  sessionRefresher = refresher;
}

export async function refreshAuthSession(): Promise<boolean> {
  if (!sessionRefresher) {
    return false;
  }

  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = sessionRefresher().finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
}

const AUTH_EXCLUDED_PATHS = ['/auth/login', '/auth/refresh', '/auth/logout'];

function shouldSkipRefresh(path: string, options: ApiRequestOptions): boolean {
  if (options.skipAuthRefresh || options._retry) {
    return true;
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return AUTH_EXCLUDED_PATHS.some((excluded) => normalizedPath.startsWith(excluded));
}

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const headers = new Headers(options.headers);

  // Let the browser set multipart boundary for FormData uploads.
  if (options.body && !(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers,
  });

  if (response.status === 401 && !shouldSkipRefresh(path, options)) {
    const refreshed = await refreshAuthSession();
    if (refreshed) {
      return apiRequest<T>(path, {
        ...options,
        _retry: true,
      });
    }
  }

  const body = await parseResponseBody(response);

  if (!response.ok) {
    const errorBody = body as ApiErrorResponse | null;
    const message = errorBody?.error?.message ?? 'Request failed';
    const code = errorBody?.error?.code ?? 'REQUEST_FAILED';
    throw new ApiRequestError(response.status, message, code);
  }

  return body as T;
}

