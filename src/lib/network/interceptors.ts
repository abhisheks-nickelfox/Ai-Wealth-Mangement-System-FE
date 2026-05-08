import type { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

// Dispatched globally so any mounted component can surface the error as a toast
function emitApiError(message: string) {
  window.dispatchEvent(new CustomEvent<{ message: string }>('api-error', { detail: { message } }));
}

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
      // Timeout
      if (error.code === 'ECONNABORTED') {
        const msg = 'Request timed out. Please try again.';
        emitApiError(msg);
        return Promise.reject(new Error(msg));
      }

      // Server responded with an error status
      if (error.response) {
        const msg =
          error.response.data?.error ??
          `Request failed with status ${error.response.status}`;

        if (error.response.status === 401 && !window.location.pathname.startsWith('/login')) {
          clearToken();
          window.location.href = '/login';
        }

        // Surface unexpected server errors globally (5xx)
        if (error.response.status >= 500) {
          emitApiError('Something went wrong on the server. Please try again.');
        }

        return Promise.reject(new Error(msg));
      }

      // No response — backend not running or network issue
      const msg = 'Unable to reach the server. Make sure the backend is running.';
      emitApiError(msg);
      return Promise.reject(new Error(msg));
    },
  );
}
