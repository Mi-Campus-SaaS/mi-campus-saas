import axios, { AxiosHeaders, type AxiosError, type AxiosRequestConfig } from 'axios';
import { injectTraceHeaders } from '../telemetry/tracing';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
});

export function setAuthToken(token?: string) {
  if (token) api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  else delete api.defaults.headers.common['Authorization'];
}

// Build an SSE URL with auth token appended as query param for simplicity.
export function buildSseUrl(path: string): string {
  const baseStr = api.defaults.baseURL || import.meta.env.VITE_API_URL || '/api';
  const origin = globalThis.location?.origin ?? 'http://localhost';
  const baseUrl = baseStr.startsWith('http') ? baseStr : `${origin}${baseStr}`;
  const url = new URL(baseUrl);
  const pathPart = path.startsWith('/') ? path.slice(1) : path;
  const basePath = url.pathname.endsWith('/') ? url.pathname.slice(0, -1) : url.pathname;
  url.pathname = `${basePath}/${pathPart}`.replaceAll(/\/+/g, '/');
  const authHeader = api.defaults.headers.common['Authorization'] as string | undefined;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : undefined;
  if (token) url.searchParams.set('access_token', token);
  return url.toString();
}

type StoredAuth = {
  access_token: string;
  refresh_token: string;
  user?: unknown;
};

export function getStoredAuth(): StoredAuth | null {
  const raw = localStorage.getItem('auth');
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<StoredAuth>;
    if (parsed && typeof parsed === 'object' && parsed.access_token && parsed.refresh_token) {
      return parsed as StoredAuth;
    }
  } catch {
    return null;
  }
  return null;
}

export function setAuthTokens(params: { accessToken: string; refreshToken: string; user?: unknown }) {
  const existing = getStoredAuth();
  const next: StoredAuth = {
    access_token: params.accessToken,
    refresh_token: params.refreshToken,
    user: params.user ?? existing?.user,
  };
  localStorage.setItem('auth', JSON.stringify(next));
  setAuthToken(params.accessToken);
}

export function clearStoredAuth() {
  localStorage.removeItem('auth');
  setAuthToken();
}

let logoutHandler: (() => void) | null = null;
export function setLogoutHandler(handler: () => void) {
  logoutHandler = handler;
}

const NO_CACHE_HEADER_VALUE = 'no-cache';

function applyNoCacheHeaders(headers: AxiosHeaders, method: string): void {
  if (method !== 'get') return;
  if (!headers.has('Cache-Control')) headers.set('Cache-Control', NO_CACHE_HEADER_VALUE);
  if (!headers.has('Pragma')) headers.set('Pragma', NO_CACHE_HEADER_VALUE);
}

// Ensure Authorization header exists for requests early in app lifecycle
api.interceptors.request.use((config) => {
  const saved = getStoredAuth();
  const token = saved?.access_token;

  // Add trace headers to all requests
  const traceHeaders = injectTraceHeaders();
  const method = (config.method ?? 'get').toLowerCase();

  const headers = config.headers instanceof AxiosHeaders ? config.headers : new AxiosHeaders(config.headers ?? {});
  if (!headers.has('Authorization') && token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  applyNoCacheHeaders(headers, method);
  Object.entries(traceHeaders).forEach(([key, value]) => {
    headers.set(key, value);
  });
  config.headers = headers;
  return config;
});

let refreshPromise: Promise<string> | null = null;

async function performTokenRefresh(): Promise<string> {
  const saved = getStoredAuth();
  const refreshToken = saved?.refresh_token;
  if (!refreshToken) {
    throw new Error('No refresh token');
  }
  const res = await api.post<{ access_token: string; refresh_token: string }>('/auth/refresh', {
    refresh_token: refreshToken,
  });
  const newAccess = res.data.access_token;
  const newRefresh = res.data.refresh_token;
  setAuthTokens({ accessToken: newAccess, refreshToken: newRefresh });
  return newAccess;
}

function getRefreshPromise(): Promise<string> {
  refreshPromise ??= performTokenRefresh().finally(() => {
    refreshPromise = null;
  });
  return refreshPromise;
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const status = error.response?.status;
    const config = error.config as (AxiosRequestConfig & { _retry?: boolean }) | undefined;
    const requestUrl = config?.url || '';

    const isAuthEndpoint = requestUrl.includes('/auth/login') || requestUrl.includes('/auth/refresh');
    const shouldAttemptRefresh = status === 401 && !config?._retry && !isAuthEndpoint;

    if (shouldAttemptRefresh) {
      try {
        const token = await getRefreshPromise();
        if (config) {
          config._retry = true;
          if (config.headers instanceof AxiosHeaders) {
            config.headers.set('Authorization', `Bearer ${token}`);
          } else if (config.headers) {
            (config.headers as unknown as Record<string, string>)['Authorization'] = `Bearer ${token}`;
          } else {
            config.headers = new AxiosHeaders({ Authorization: `Bearer ${token}` });
          }
        }
        return api.request(config!);
      } catch {
        clearStoredAuth();
        if (logoutHandler) logoutHandler();
      }
    }

    throw error;
  },
);
