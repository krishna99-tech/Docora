import { HttpClient, httpClient } from './http-client';
import { API_ROUTES, STORAGE_KEYS } from '@/constants';
import { AuthResponse, User } from '@/types';

export class AuthService {
  constructor(private http: HttpClient = httpClient) {}

  async register(data: { name: string; email: string; password: string }): Promise<AuthResponse> {
    const res = await this.http.request<AuthResponse>(API_ROUTES.AUTH.REGISTER, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    this.http.setTokens(res.accessToken, res.refreshToken);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(res.user));
    }
    return res;
  }

  async login(data: { email: string; password: string }): Promise<AuthResponse> {
    const res = await this.http.request<AuthResponse>(API_ROUTES.AUTH.LOGIN, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    this.http.setTokens(res.accessToken, res.refreshToken);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(res.user));
    }
    return res;
  }

  async logout(): Promise<void> {
    try {
      const refreshToken = this.http.getRefreshToken() || '';
      await this.http.request(API_ROUTES.AUTH.LOGOUT, {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
      });
    } catch {
      // Ignore network error on logout
    }
    this.http.clearTokens();
  }

  async me(): Promise<User> {
    return this.http.request<User>(API_ROUTES.AUTH.ME);
  }

  async updateProfile(data: { name: string }): Promise<User> {
    const updated = await this.http.request<User>(API_ROUTES.AUTH.PROFILE, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updated));
    }
    return updated;
  }

  async changePassword(data: { currentPassword: string; newPassword: string }): Promise<{ message: string }> {
    return this.http.request<{ message: string }>(API_ROUTES.AUTH.CHANGE_PASSWORD, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

export const authService = new AuthService();
