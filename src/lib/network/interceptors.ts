import type { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

function getToken(): string | null {
  return localStorage.getItem('mw_token') ?? sessionStorage.getItem('mw_token');
}

function clearToken(): void {
  localStorage.removeItem('mw_token');
  sessionStorage.removeItem('mw_token');
}

export function applyInterceptors(instance: AxiosInstance): void {
  // ── Request: inject Bearer token ────────────────────────────────────────────
  instance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      const token = getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error),
  );

  // ── Response: normalize errors + auto-logout on 401 ─────────────────────────
  instance.interceptors.response.use(
    (response: AxiosResponse) => response,
    (error: AxiosError<{ error?: string }>) => {
      if (error.code === 'ECONNABORTED') {
        return Promise.reject(new Error('Request timed out. Please try again.'));
      }

      if (error.response) {
        const msg =
          error.response.data?.error ??
          `Request failed with status ${error.response.status}`;

        if (error.response.status === 401) {
          clearToken();
          window.location.href = '/login';
        }

        return Promise.reject(new Error(msg));
      }

      return Promise.reject(error);
    },
  );
}
