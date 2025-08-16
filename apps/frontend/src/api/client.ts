import axios, { AxiosHeaders, type AxiosError, type AxiosRequestConfig } from 'axios';
import { injectTraceHeaders } from '../telemetry/tracing';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
});

export function setAuthToken(token?: string) {
  if (token) api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  else delete api.defaults.headers.common['Authorization'];
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

// Ensure Authorization header exists for requests early in app lifecycle
api.interceptors.request.use((config) => {
  const saved = getStoredAuth();
  const token = saved?.access_token;

  // Add trace headers to all requests
  const traceHeaders = injectTraceHeaders();

  if (config.headers instanceof AxiosHeaders) {
    if (!config.headers.has('Authorization') && token) {
      config.headers.set('Authorization', `Bearer ${token}`);
    }
    Object.entries(traceHeaders).forEach(([key, value]) => {
      config.headers.set(key, value);
    });
    return config;
  }

  if (!config.headers) {
    config.headers = new AxiosHeaders({
      Authorization: token ? `Bearer ${token}` : undefined,
      ...traceHeaders,
    });
    return config;
  }

  const h = config.headers as unknown as Record<string, string>;
  if (!('Authorization' in h) && token) h['Authorization'] = `Bearer ${token}`;
  Object.assign(h, traceHeaders);
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
          } else if (!config.headers) {
            config.headers = new AxiosHeaders({ Authorization: `Bearer ${token}` });
          } else {
            (config.headers as unknown as Record<string, string>)['Authorization'] = `Bearer ${token}`;
          }
        }
        return api.request(config!);
      } catch {
        clearStoredAuth();
        if (logoutHandler) logoutHandler();
      }
    }

    return Promise.reject(error);
  },
);
