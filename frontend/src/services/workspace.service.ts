import { HttpClient, httpClient } from './http-client';
import { API_ROUTES } from '@/constants';
import {
  PlanDefinition,
  Workspace,
  WorkspaceBillingStatus,
  WorkspaceInvoice,
  WorkspaceMember,
} from '@/types';

export class WorkspaceService {
  constructor(private http: HttpClient = httpClient) {}

  async listWorkspaces(): Promise<Workspace[]> {
    return this.http.request<Workspace[]>(API_ROUTES.SETTINGS.WORKSPACES);
  }

  async createWorkspace(data: { name: string; slug: string }): Promise<Workspace> {
    return this.http.request<Workspace>(API_ROUTES.SETTINGS.WORKSPACES, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getWorkspace(id: string): Promise<Workspace> {
    return this.http.request<Workspace>(`${API_ROUTES.SETTINGS.WORKSPACES}/${id}`);
  }

  async getWorkspaceMembers(id: string): Promise<WorkspaceMember[]> {
    return this.http.request<WorkspaceMember[]>(`${API_ROUTES.SETTINGS.WORKSPACES}/${id}/members`);
  }

  async addWorkspaceMember(id: string, data: { email: string; role: string }): Promise<{ message: string }> {
    return this.http.request<{ message: string }>(`${API_ROUTES.SETTINGS.WORKSPACES}/${id}/members`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async removeWorkspaceMember(id: string, userId: string): Promise<{ message: string }> {
    return this.http.request<{ message: string }>(`${API_ROUTES.SETTINGS.WORKSPACES}/${id}/members/${userId}`, {
      method: 'DELETE',
    });
  }

  // SaaS Billing & Quotas
  async getBillingStatus(): Promise<WorkspaceBillingStatus> {
    return this.http.request<WorkspaceBillingStatus>(API_ROUTES.SETTINGS.BILLING);
  }

  async getBillingPlans(): Promise<PlanDefinition[]> {
    return this.http.request<PlanDefinition[]>(`${API_ROUTES.SETTINGS.BILLING}/plans`);
  }

  async changePlan(plan: string, billingCycle: string): Promise<WorkspaceBillingStatus> {
    return this.http.request<WorkspaceBillingStatus>(`${API_ROUTES.SETTINGS.BILLING}/change-plan`, {
      method: 'POST',
      body: JSON.stringify({ plan, billingCycle }),
    });
  }

  async getBillingInvoices(): Promise<WorkspaceInvoice[]> {
    return this.http.request<WorkspaceInvoice[]>(`${API_ROUTES.SETTINGS.BILLING}/invoices`);
  }
}

export const workspaceService = new WorkspaceService();
