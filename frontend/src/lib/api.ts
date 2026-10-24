import {
  AuthResponse,
  BusinessProfile,
  CreateGeneralPDFInput,
  CreateInvoiceInput,
  CreateReceiptInput,
  Customer,
  DashboardStats,
  Document,
  PaginatedResponse,
  Template,
  User,
} from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '/api/v1';

class ApiClient {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.accessToken = localStorage.getItem('docora_access_token');
      this.refreshToken = localStorage.getItem('docora_refresh_token');
    }
  }

  setTokens(access: string, refresh: string) {
    this.accessToken = access;
    this.refreshToken = refresh;
    if (typeof window !== 'undefined') {
      localStorage.setItem('docora_access_token', access);
      localStorage.setItem('docora_refresh_token', refresh);
    }
  }

  clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('docora_access_token');
      localStorage.removeItem('docora_refresh_token');
      localStorage.removeItem('docora_user');
    }
  }

  getAccessToken(): string | null {
    if (!this.accessToken && typeof window !== 'undefined') {
      this.accessToken = localStorage.getItem('docora_access_token');
    }
    return this.accessToken;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = new Headers(options.headers || {});

    if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }

    const token = this.getAccessToken();
    if (token && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    let response = await fetch(url, { ...options, headers });

    // Handle 401 Unauthorized by attempting a token refresh
    if (response.status === 401 && this.refreshToken && !endpoint.includes('/auth/')) {
      const refreshed = await this.tryRefreshToken();
      if (refreshed) {
        headers.set('Authorization', `Bearer ${this.accessToken}`);
        response = await fetch(url, { ...options, headers });
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
        // Fallback to status text
      }
      throw new Error(errorMessage);
    }

    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  }

  private async tryRefreshToken(): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: this.refreshToken }),
      });
      if (!res.ok) return false;
      const data: AuthResponse = await res.json();
      this.setTokens(data.accessToken, data.refreshToken);
      return true;
    } catch {
      return false;
    }
  }

  // Auth Endpoints
  async register(data: { name: string; email: string; password: string }): Promise<AuthResponse> {
    const res = await this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    this.setTokens(res.accessToken, res.refreshToken);
    if (typeof window !== 'undefined') {
      localStorage.setItem('docora_user', JSON.stringify(res.user));
    }
    return res;
  }

  async login(data: { email: string; password: string }): Promise<AuthResponse> {
    const res = await this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    this.setTokens(res.accessToken, res.refreshToken);
    if (typeof window !== 'undefined') {
      localStorage.setItem('docora_user', JSON.stringify(res.user));
    }
    return res;
  }

  async logout(): Promise<void> {
    if (this.refreshToken) {
      try {
        await this.request('/auth/logout', {
          method: 'POST',
          body: JSON.stringify({ refreshToken: this.refreshToken }),
        });
      } catch {
        // Ignore network error on logout
      }
    }
    this.clearTokens();
  }

  async me(): Promise<User> {
    return this.request<User>('/auth/me');
  }

  // Dashboard Endpoints
  async getDashboardStats(): Promise<DashboardStats> {
    return this.request<DashboardStats>('/dashboard/stats');
  }

  async getRecentDocuments(limit = 10): Promise<Document[]> {
    return this.request<Document[]>(`/dashboard/recent-documents?limit=${limit}`);
  }

  // Receipts Endpoints
  async createReceipt(data: CreateReceiptInput): Promise<Document> {
    return this.request<Document>('/receipts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async listReceipts(params: Record<string, string | number> = {}): Promise<PaginatedResponse<Document>> {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== '') query.append(k, String(v));
    });
    return this.request<PaginatedResponse<Document>>(`/receipts?${query.toString()}`);
  }

  async getReceipt(id: string): Promise<Document> {
    return this.request<Document>(`/receipts/${id}`);
  }

  async finalizeReceipt(id: string): Promise<Document> {
    return this.request<Document>(`/receipts/${id}/finalize`, { method: 'POST' });
  }

  async cancelReceipt(id: string): Promise<void> {
    return this.request<void>(`/receipts/${id}/cancel`, { method: 'POST' });
  }

  // Invoices Endpoints
  async createInvoice(data: CreateInvoiceInput): Promise<Document> {
    return this.request<Document>('/invoices', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async listInvoices(params: Record<string, string | number> = {}): Promise<PaginatedResponse<Document>> {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== '') query.append(k, String(v));
    });
    return this.request<PaginatedResponse<Document>>(`/invoices?${query.toString()}`);
  }

  async getInvoice(id: string): Promise<Document> {
    return this.request<Document>(`/invoices/${id}`);
  }

  async finalizeInvoice(id: string): Promise<Document> {
    return this.request<Document>(`/invoices/${id}/finalize`, { method: 'POST' });
  }

  async cancelInvoice(id: string): Promise<void> {
    return this.request<void>(`/invoices/${id}/cancel`, { method: 'POST' });
  }

  // General Documents Endpoints
  async listDocuments(params: Record<string, string | number> = {}): Promise<PaginatedResponse<Document>> {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== '') query.append(k, String(v));
    });
    return this.request<PaginatedResponse<Document>>(`/documents?${query.toString()}`);
  }

  async getDocument(id: string): Promise<Document> {
    return this.request<Document>(`/documents/${id}`);
  }

  async deleteDocument(id: string): Promise<void> {
    return this.request<void>(`/documents/${id}`, { method: 'DELETE' });
  }

  async createGeneralPdf(data: CreateGeneralPDFInput): Promise<Document> {
    return this.request<Document>('/pdf-generator/generate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Previews & Downloads
  async getDocumentPreviewBlob(id: string): Promise<Blob> {
    const token = this.getAccessToken();
    const res = await fetch(`${API_BASE_URL}/documents/${id}/preview`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new Error('Failed to generate preview PDF');
    return res.blob();
  }

  async downloadDocument(id: string, filename: string): Promise<void> {
    const token = this.getAccessToken();
    const res = await fetch(`${API_BASE_URL}/documents/${id}/download`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new Error('Failed to download PDF document');
    const blob = await res.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = window.document.createElement('a');
    a.href = downloadUrl;
    a.download = filename || `document-${id.slice(0, 8)}.pdf`;
    window.document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(downloadUrl);
    a.remove();
  }

  // Templates
  async listTemplates(type?: string): Promise<Template[]> {
    const query = type ? `?type=${type}` : '';
    return this.request<Template[]>(`/templates${query}`);
  }

  async getTemplate(id: string): Promise<Template> {
    return this.request<Template>(`/templates/${id}`);
  }

  async createTemplate(data: Partial<Template>): Promise<Template> {
    return this.request<Template>('/templates', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateTemplate(id: string, data: Partial<Template>): Promise<Template> {
    return this.request<Template>(`/templates/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async duplicateTemplate(id: string): Promise<Template> {
    return this.request<Template>(`/templates/${id}/duplicate`, { method: 'POST' });
  }

  async deleteTemplate(id: string): Promise<void> {
    return this.request<void>(`/templates/${id}`, { method: 'DELETE' });
  }

  // Customers
  async listCustomers(params: Record<string, string | number> = {}): Promise<{ data: Customer[]; total: number }> {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== '') query.append(k, String(v));
    });
    return this.request<{ data: Customer[]; total: number }>(`/customers?${query.toString()}`);
  }

  async getCustomer(id: string): Promise<Customer> {
    return this.request<Customer>(`/customers/${id}`);
  }

  async createCustomer(data: { name: string; email?: string; phone?: string; address?: string }): Promise<Customer> {
    return this.request<Customer>('/customers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCustomer(id: string, data: { name: string; email?: string; phone?: string; address?: string }): Promise<Customer> {
    return this.request<Customer>(`/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteCustomer(id: string): Promise<void> {
    return this.request<void>(`/customers/${id}`, { method: 'DELETE' });
  }

  // Business Profile
  async getBusinessProfile(): Promise<BusinessProfile> {
    return this.request<BusinessProfile>('/business-profile');
  }

  async updateBusinessProfile(data: Partial<BusinessProfile>): Promise<BusinessProfile> {
    return this.request<BusinessProfile>('/business-profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }
}

export const api = new ApiClient();
