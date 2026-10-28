import { getToken, clearAuth } from './auth';

/**
 * SmartUni Centralized API Client
 * Supports uniform base URL resolution, JWT authentication, JSON error parsing,
 * and authenticated file download links for both local dev and production.
 */

const rawApiUrl = (import.meta.env.VITE_API_URL as string | undefined)?.trim() || '';
export const API_BASE_URL = rawApiUrl.replace(/\/+$/, '');

/**
 * Resolves full API URL with environment-appropriate prefix
 */
export function resolveApiUrl(path: string): string {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  const normalized = path.startsWith('/') ? path : `/${path}`;
  if (API_BASE_URL) {
    return `${API_BASE_URL}${normalized}`;
  }
  return normalized;
}

/**
 * Resolves authenticated file download or preview URL for browser navigation/<a> tags
 */
export function getDownloadUrl(url: string | null | undefined): string {
  if (!url) return '';
  const token = getToken();

  // If already an external third-party URL (e.g. YouTube, external docs)
  if (url.startsWith('http://') || url.startsWith('https://')) {
    if (!API_BASE_URL || !url.startsWith(API_BASE_URL)) {
      return url;
    }
  }

  const resolved = resolveApiUrl(url);
  if (!token) return resolved;

  const sep = resolved.includes('?') ? '&' : '?';
  return `${resolved}${sep}token=${encodeURIComponent(token)}`;
}

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(status: number, message: string, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

export interface ApiRequestOptions extends RequestInit {
  skipAuth?: boolean;
}

/**
 * Standardized API fetch wrapper
 */
export async function apiRequest<T = any>(
  endpoint: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const url = resolveApiUrl(endpoint);
  const { skipAuth = false, headers: customHeaders, ...fetchOptions } = options;

  const headers = new Headers(customHeaders || {});

  // Attach JWT Bearer token if not explicitly skipped
  if (!skipAuth && !headers.has('Authorization')) {
    const token = getToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  // Auto-set Content-Type: application/json for non-FormData bodies
  if (
    fetchOptions.body &&
    typeof fetchOptions.body === 'string' &&
    !headers.has('Content-Type')
  ) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, {
    ...fetchOptions,
    headers,
  });

  // Handle empty or 204 No Content responses
  if (response.status === 204) {
    return {} as T;
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401) {
      clearAuth();
    }

    const errorMsg =
      data?.message ||
      data?.error ||
      (response.status === 401
        ? 'Сессия мерзімі аяқталды. Қайта жүйеге кіріңіз.'
        : response.status === 403
        ? 'Бұл әрекетті орындауға рұқсатыңыз жоқ.'
        : response.status === 404
        ? 'Сұралған ресурс табылмады.'
        : `Сервер қатесі (${response.status})`);

    throw new ApiError(response.status, errorMsg, data);
  }

  return data as T;
}

export const api = {
  get: <T = any>(endpoint: string, options?: ApiRequestOptions) =>
    apiRequest<T>(endpoint, { ...options, method: 'GET' }),

  post: <T = any>(endpoint: string, body?: any, options?: ApiRequestOptions) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body !== undefined && typeof body !== 'string' && !(body instanceof FormData)
        ? JSON.stringify(body)
        : body,
    }),

  patch: <T = any>(endpoint: string, body?: any, options?: ApiRequestOptions) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body !== undefined && typeof body !== 'string' && !(body instanceof FormData)
        ? JSON.stringify(body)
        : body,
    }),

  put: <T = any>(endpoint: string, body?: any, options?: ApiRequestOptions) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body !== undefined && typeof body !== 'string' && !(body instanceof FormData)
        ? JSON.stringify(body)
        : body,
    }),

  delete: <T = any>(endpoint: string, options?: ApiRequestOptions) =>
    apiRequest<T>(endpoint, { ...options, method: 'DELETE' }),

  upload: <T = any>(
    endpoint: string,
    payload: { fileName: string; fileBase64: string; fileSize?: number },
    options?: ApiRequestOptions,
  ) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};

