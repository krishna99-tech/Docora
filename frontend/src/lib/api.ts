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
  Workflow,
  CreateWorkflowInput,
  UpdateWorkflowInput,
  WorkflowVersion,
  WorkflowExecution,
  WorkflowApproval,
  WorkflowSchedule,
  SaveScheduleInput,
  WorkflowAnalytics,
  DryRunResponse,
  WorkflowTemplate,
  ApiKey,
  Webhook,
  WebhookDelivery,
  Workspace,
  WorkspaceMember,
  WorkspaceBillingStatus,
  PlanDefinition,
  WorkspaceInvoice,
  DocumentFolder,
} from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '/api/v1';

class ApiClient {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private activeWorkspaceId: string | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.accessToken = localStorage.getItem('docora_access_token');
      this.refreshToken = localStorage.getItem('docora_refresh_token');
      this.activeWorkspaceId = localStorage.getItem('docora_active_workspace_id');
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
      localStorage.removeItem('docora_active_workspace_id');
    }
  }

  getAccessToken(): string | null {
    if (!this.accessToken && typeof window !== 'undefined') {
      this.accessToken = localStorage.getItem('docora_access_token');
    }
    return this.accessToken;
  }

  getActiveWorkspaceId(): string | null {
    if (!this.activeWorkspaceId && typeof window !== 'undefined') {
      this.activeWorkspaceId = localStorage.getItem('docora_active_workspace_id');
    }
    return this.activeWorkspaceId;
  }

  setActiveWorkspaceId(id: string | null) {
    this.activeWorkspaceId = id;
    if (typeof window !== 'undefined') {
      if (id) {
        localStorage.setItem('docora_active_workspace_id', id);
        window.dispatchEvent(new CustomEvent('workspace-changed', { detail: { workspaceId: id } }));
      } else {
        localStorage.removeItem('docora_active_workspace_id');
        window.dispatchEvent(new CustomEvent('workspace-changed', { detail: { workspaceId: null } }));
      }
    }
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
        // Fallback to status text
      }
      throw new Error(errorMessage);
    }

    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  }

  async requestBlob(endpoint: string, options: RequestInit = {}): Promise<Blob> {
    const url = `${API_BASE_URL}${endpoint}`;
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
        // Fallback to status text
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
      const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
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
    try {
      await this.request('/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ refreshToken: this.refreshToken || '' }),
      });
    } catch {
      // Ignore network error on logout
    }
    this.clearTokens();
  }

  async me(): Promise<User> {
    return this.request<User>('/auth/me');
  }

  async updateProfile(data: { name: string }): Promise<User> {
    const updated = await this.request<User>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    if (typeof window !== 'undefined') {
      localStorage.setItem('docora_user', JSON.stringify(updated));
    }
    return updated;
  }

  async changePassword(data: { currentPassword: string; newPassword: string }): Promise<{ message: string }> {
    return this.request<{ message: string }>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Dashboard Endpoints
  async getDashboardStats(): Promise<DashboardStats> {
    return this.request<DashboardStats>('/dashboard/stats');
  }

  async getRecentDocuments(limit = 10): Promise<Document[]> {
    const res = await this.request<Document[]>(`/dashboard/recent-documents?limit=${limit}`);
    return Array.isArray(res) ? res : [];
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

  async updateReceipt(id: string, data: CreateReceiptInput): Promise<Document> {
    return this.request<Document>(`/receipts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
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

  async updateInvoice(id: string, data: CreateInvoiceInput): Promise<Document> {
    return this.request<Document>(`/invoices/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
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
    return this.requestBlob(`/documents/${id}/preview`);
  }

  async downloadDocument(id: string, filename: string): Promise<void> {
    const blob = await this.requestBlob(`/documents/${id}/download`);
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

  // PDF Tools Endpoints
  async pdfMerge(formData: FormData): Promise<Blob> {
    return this.requestBlob('/pdf-tools/merge?download=true', {
      method: 'POST',
      body: formData,
    });
  }

  async pdfCompress(formData: FormData, download = true): Promise<Blob> {
    const query = download ? '?download=true' : '';
    return this.requestBlob(`/pdf-tools/compress${query}`, {
      method: 'POST',
      body: formData,
    });
  }

  async pdfRotate(formData: FormData): Promise<Blob> {
    return this.requestBlob('/pdf-tools/rotate', {
      method: 'POST',
      body: formData,
    });
  }

  async pdfWatermark(formData: FormData): Promise<Blob> {
    return this.requestBlob('/pdf-tools/watermark', {
      method: 'POST',
      body: formData,
    });
  }

  async pdfPageNumbers(formData: FormData): Promise<Blob> {
    return this.requestBlob('/pdf-tools/page-numbers', {
      method: 'POST',
      body: formData,
    });
  }

  async pdfImagesToPdf(formData: FormData): Promise<Blob> {
    return this.requestBlob('/pdf-tools/images-to-pdf', {
      method: 'POST',
      body: formData,
    });
  }

  async pdfMetadata(formData: FormData): Promise<any> {
    return this.request<any>('/pdf-tools/metadata', {
      method: 'POST',
      body: formData,
    });
  }

  async pdfGetJobs(): Promise<any[]> {
    return this.request<any[]>('/pdf-tools/jobs');
  }

  // ---------------------------------------------------------------------------
  // WORKFLOW AUTOMATION PLATFORM API
  // ---------------------------------------------------------------------------

  async getWorkflows(params?: { search?: string; category?: string; status?: string }): Promise<Workflow[]> {
    const q = new URLSearchParams();
    if (params?.search) q.append('search', params.search);
    if (params?.category) q.append('category', params.category);
    if (params?.status) q.append('status', params.status);
    const qs = q.toString() ? `?${q.toString()}` : '';
    return this.request<Workflow[]>(`/workflows${qs}`);
  }

  async getWorkflow(id: string): Promise<Workflow> {
    return this.request<Workflow>(`/workflows/${id}`);
  }

  async createWorkflow(data: CreateWorkflowInput): Promise<Workflow> {
    return this.request<Workflow>('/workflows', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateWorkflow(id: string, data: UpdateWorkflowInput): Promise<Workflow> {
    return this.request<Workflow>(`/workflows/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteWorkflow(id: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/workflows/${id}`, {
      method: 'DELETE',
    });
  }

  async duplicateWorkflow(id: string): Promise<Workflow> {
    return this.request<Workflow>(`/workflows/${id}/duplicate`, {
      method: 'POST',
    });
  }

  async triggerWorkflow(id: string, context?: Record<string, any>, documentId?: string): Promise<WorkflowExecution> {
    return this.request<WorkflowExecution>(`/workflows/${id}/trigger`, {
      method: 'POST',
      body: JSON.stringify({ context, documentId }),
    });
  }

  async testWorkflow(id: string, sampleInput: Record<string, any>, definition?: any): Promise<DryRunResponse> {
    return this.request<DryRunResponse>(`/workflows/${id}/test`, {
      method: 'POST',
      body: JSON.stringify({ definition, sampleInput }),
    });
  }

  async dryRunWorkflow(data: { definition: any; sampleInput?: Record<string, any> }): Promise<DryRunResponse> {
    return this.request<DryRunResponse>('/workflows/test', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async bulkExecuteWorkflow(
    id: string,
    data: { records?: any[]; csvData?: string; fieldMapping?: Record<string, string>; createZip?: boolean }
  ): Promise<WorkflowExecution> {
    return this.request<WorkflowExecution>(`/workflows/${id}/bulk`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getWorkflowVersions(id: string): Promise<WorkflowVersion[]> {
    return this.request<WorkflowVersion[]>(`/workflows/${id}/versions`);
  }

  async restoreWorkflowVersion(id: string, version: number): Promise<Workflow> {
    return this.request<Workflow>(`/workflows/${id}/versions/${version}/restore`, {
      method: 'POST',
    });
  }

  async getWorkflowExecutions(
    id?: string,
    params?: { status?: string; limit?: number; offset?: number }
  ): Promise<WorkflowExecution[]> {
    const q = new URLSearchParams();
    if (params?.status) q.append('status', params.status);
    if (params?.limit) q.append('limit', params.limit.toString());
    if (params?.offset) q.append('offset', params.offset.toString());
    const qs = q.toString() ? `?${q.toString()}` : '';

    let res: WorkflowExecution[];
    if (id) {
      res = await this.request<WorkflowExecution[]>(`/workflows/${id}/executions${qs}`);
    } else {
      res = await this.request<WorkflowExecution[]>(`/workflows/executions${qs}`);
    }
    return Array.isArray(res) ? res : [];
  }

  async getWorkflowExecution(executionId: string): Promise<WorkflowExecution> {
    return this.request<WorkflowExecution>(`/workflows/executions/${executionId}`);
  }

  async retryWorkflowExecution(executionId: string): Promise<WorkflowExecution> {
    return this.request<WorkflowExecution>(`/workflows/executions/${executionId}/retry`, {
      method: 'POST',
    });
  }

  async cancelWorkflowExecution(executionId: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/workflows/executions/${executionId}/cancel`, {
      method: 'POST',
    });
  }

  async getWorkflowApprovals(status?: string): Promise<WorkflowApproval[]> {
    const q = status ? `?status=${status}` : '';
    return this.request<WorkflowApproval[]>(`/workflows/approvals${q}`);
  }

  async decideWorkflowApproval(
    approvalId: string,
    status: 'approved' | 'rejected',
    decisionNotes?: string
  ): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/workflows/approvals/${approvalId}/decide`, {
      method: 'POST',
      body: JSON.stringify({ status, decisionNotes }),
    });
  }

  async getWorkflowSchedule(id: string): Promise<WorkflowSchedule | null> {
    return this.request<WorkflowSchedule | null>(`/workflows/${id}/schedule`);
  }

  async saveWorkflowSchedule(id: string, data: SaveScheduleInput): Promise<WorkflowSchedule> {
    return this.request<WorkflowSchedule>(`/workflows/${id}/schedule`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getWorkflowAnalytics(): Promise<WorkflowAnalytics> {
    return this.request<WorkflowAnalytics>('/workflows/analytics');
  }

  async getWorkflowTemplates(): Promise<WorkflowTemplate[]> {
    return this.request<WorkflowTemplate[]>('/workflows/templates');
  }

  async exportWorkflow(id: string): Promise<any> {
    return this.request<any>(`/workflows/${id}/export`);
  }

  async importWorkflow(data: any): Promise<Workflow> {
    return this.request<Workflow>('/workflows/import', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Developer Platform
  async listApiKeys(): Promise<ApiKey[]> {
    return this.request<ApiKey[]>('/developer/keys');
  }

  async createApiKey(data: { name: string; permissions: string[] }): Promise<ApiKey> {
    return this.request<ApiKey>('/developer/keys', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async revokeApiKey(id: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/developer/keys/${id}`, {
      method: 'DELETE',
    });
  }

  async listWebhooks(): Promise<Webhook[]> {
    return this.request<Webhook[]>('/developer/webhooks');
  }

  async createWebhook(data: { targetUrl: string; events: string[]; secret?: string }): Promise<Webhook> {
    return this.request<Webhook>('/developer/webhooks', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteWebhook(id: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/developer/webhooks/${id}`, {
      method: 'DELETE',
    });
  }

  async listWebhookDeliveries(webhookId: string): Promise<WebhookDelivery[]> {
    return this.request<WebhookDelivery[]>(`/developer/webhooks/${webhookId}/deliveries`);
  }

  async testWebhook(webhookId: string, eventType?: string): Promise<WebhookDelivery> {
    return this.request<WebhookDelivery>(`/developer/webhooks/${webhookId}/test`, {
      method: 'POST',
      body: JSON.stringify({ eventType: eventType || 'document.created' }),
    });
  }

  // Workspaces
  async listWorkspaces(): Promise<Workspace[]> {
    return this.request<Workspace[]>('/workspaces');
  }

  async createWorkspace(data: { name: string; slug: string }): Promise<Workspace> {
    return this.request<Workspace>('/workspaces', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getWorkspace(id: string): Promise<Workspace> {
    return this.request<Workspace>(`/workspaces/${id}`);
  }

  async getWorkspaceMembers(id: string): Promise<WorkspaceMember[]> {
    return this.request<WorkspaceMember[]>(`/workspaces/${id}/members`);
  }

  async addWorkspaceMember(id: string, data: { email: string; role: string }): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/workspaces/${id}/members`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async removeWorkspaceMember(id: string, userId: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/workspaces/${id}/members/${userId}`, {
      method: 'DELETE',
    });
  }

  // PDF Processing Jobs
  async listPdfJobs(): Promise<any[]> {
    const res = await this.request<any[]>('/pdf-tools/jobs');
    return Array.isArray(res) ? res : [];
  }

  // SaaS Billing & Quotas
  async getBillingStatus(): Promise<WorkspaceBillingStatus> {
    return this.request<WorkspaceBillingStatus>('/billing/status');
  }

  async getBillingPlans(): Promise<PlanDefinition[]> {
    return this.request<PlanDefinition[]>('/billing/plans');
  }

  async changePlan(plan: string, billingCycle: string): Promise<WorkspaceBillingStatus> {
    return this.request<WorkspaceBillingStatus>('/billing/change-plan', {
      method: 'POST',
      body: JSON.stringify({ plan, billingCycle }),
    });
  }

  async getBillingInvoices(): Promise<WorkspaceInvoice[]> {
    return this.request<WorkspaceInvoice[]>('/billing/invoices');
  }

  // Enterprise Folders & Documents Management
  async listFolders(): Promise<DocumentFolder[]> {
    return this.request<DocumentFolder[]>('/folders');
  }

  async createFolder(data: { name: string; color?: string; parentId?: string }): Promise<DocumentFolder> {
    return this.request<DocumentFolder>('/folders', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateFolder(id: string, data: { name?: string; color?: string; parentId?: string }): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/folders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteFolder(id: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/folders/${id}`, {
      method: 'DELETE',
    });
  }

  async moveDocuments(documentIds: string[], folderId: string | null): Promise<{ message: string }> {
    return this.request<{ message: string }>('/folders/move', {
      method: 'POST',
      body: JSON.stringify({ documentIds, folderId }),
    });
  }

  async tagDocuments(documentIds: string[], tags: string[]): Promise<{ message: string }> {
    return this.request<{ message: string }>('/folders/tag', {
      method: 'POST',
      body: JSON.stringify({ documentIds, tags }),
    });
  }

  async archiveDocuments(documentIds: string[], archive: boolean): Promise<{ message: string }> {
    return this.request<{ message: string }>('/folders/archive', {
      method: 'POST',
      body: JSON.stringify({ documentIds, archive }),
    });
  }

  async applyCompliance(complianceStandard: string, retentionDays: number): Promise<{ message: string }> {
    return this.request<{ message: string }>('/folders/compliance', {
      method: 'POST',
      body: JSON.stringify({ complianceStandard, retentionDays }),
    });
  }
}

export const api = new ApiClient();

