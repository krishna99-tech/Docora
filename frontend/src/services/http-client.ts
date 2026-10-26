import { STORAGE_KEYS, API_CONFIG } from '@/constants';
import { AuthResponse } from '@/types';

export class HttpClient {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private activeWorkspaceId: string | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.accessToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      this.refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
      this.activeWorkspaceId = localStorage.getItem(STORAGE_KEYS.ACTIVE_WORKSPACE_ID);
    }
  }

  setTokens(access: string, refresh: string) {
    this.accessToken = access;
    this.refreshToken = refresh;
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, access);
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refresh);
    }
  }

  clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER);
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_WORKSPACE_ID);
    }
  }

  getAccessToken(): string | null {
    if (!this.accessToken && typeof window !== 'undefined') {
      this.accessToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    }
    return this.accessToken;
  }

  getRefreshToken(): string | null {
    if (!this.refreshToken && typeof window !== 'undefined') {
      this.refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
    }
    return this.refreshToken;
  }

  getActiveWorkspaceId(): string | null {
    if (!this.activeWorkspaceId && typeof window !== 'undefined') {
      this.activeWorkspaceId = localStorage.getItem(STORAGE_KEYS.ACTIVE_WORKSPACE_ID);
    }
    return this.activeWorkspaceId;
  }

  setActiveWorkspaceId(id: string | null) {
    this.activeWorkspaceId = id;
    if (typeof window !== 'undefined') {
      if (id) {
        localStorage.setItem(STORAGE_KEYS.ACTIVE_WORKSPACE_ID, id);
        window.dispatchEvent(new CustomEvent('workspace-changed', { detail: { workspaceId: id } }));
      } else {
        localStorage.removeItem(STORAGE_KEYS.ACTIVE_WORKSPACE_ID);
        window.dispatchEvent(new CustomEvent('workspace-changed', { detail: { workspaceId: null } }));
      }
    }
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_CONFIG.BASE_URL}${endpoint}`;
    const headers = new Headers(options.headers || {});

    if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }

    const token = this.getAccessToken();
    if (token && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    const wsId = this.getActiveWorkspaceId();
    if (wsId && !headers.has('X-Workspace-ID')) {
      headers.set('X-Workspace-ID', wsId);
    }

    const fetchOptions: RequestInit = {
      ...options,
      headers,
      credentials: options.credentials || 'include',
    };

    let response = await fetch(url, fetchOptions);

    // Handle 401 Unauthorized by attempting a token refresh
    if (response.status === 401 && !endpoint.includes('/auth/')) {
      const refreshed = await this.tryRefreshToken();
      if (refreshed) {
        if (this.accessToken) {
          headers.set('Authorization', `Bearer ${this.accessToken}`);
        }
        response = await fetch(url, { ...fetchOptions, headers });
      } else {
        this.clearTokens();
        if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/register')) {
          window.location.href = '/login';
        }
      }
    }

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch {
        // Fallback
      }
      throw new Error(errorMessage);
    }

    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  }

  async requestBlob(endpoint: string, options: RequestInit = {}): Promise<Blob> {
    const url = `${API_CONFIG.BASE_URL}${endpoint}`;
    const headers = new Headers(options.headers || {});

    const token = this.getAccessToken();
    if (token && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    const wsId = this.getActiveWorkspaceId();
    if (wsId && !headers.has('X-Workspace-ID')) {
      headers.set('X-Workspace-ID', wsId);
    }

    const fetchOptions: RequestInit = {
      ...options,
      headers,
      credentials: options.credentials || 'include',
    };

    let response = await fetch(url, fetchOptions);

    if (response.status === 401 && !endpoint.includes('/auth/')) {
      const refreshed = await this.tryRefreshToken();
      if (refreshed) {
        if (this.accessToken) {
          headers.set('Authorization', `Bearer ${this.accessToken}`);
        }
        response = await fetch(url, { ...fetchOptions, headers });
      } else {
        this.clearTokens();
        if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
          window.location.href = '/login';
        }
      }
    }

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch {
        // Fallback
      }
      throw new Error(errorMessage);
    }

    const rawBlob = await response.blob();
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/pdf') || endpoint.includes('pdf') || endpoint.includes('preview')) {
      return new Blob([rawBlob], { type: 'application/pdf' });
    }
    return rawBlob;
  }

  private async tryRefreshToken(): Promise<boolean> {
    try {
      const res = await fetch(`${API_CONFIG.BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ refreshToken: this.refreshToken || '' }),
      });
      if (!res.ok) return false;
      const data: AuthResponse = await res.json();
      if (data.accessToken) {
        this.setTokens(data.accessToken, data.refreshToken);
      }
      return true;
    } catch {
      return false;
    }
  }
}

export const httpClient = new HttpClient();
