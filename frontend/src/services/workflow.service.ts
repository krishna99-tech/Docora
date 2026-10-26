import { HttpClient, httpClient } from './http-client';
import { API_ROUTES } from '@/constants';
import {
  CreateWorkflowInput,
  DryRunResponse,
  SaveScheduleInput,
  UpdateWorkflowInput,
  Workflow,
  WorkflowAnalytics,
  WorkflowApproval,
  WorkflowExecution,
  WorkflowSchedule,
  WorkflowTemplate,
  WorkflowVersion,
} from '@/types';

export class WorkflowService {
  constructor(private http: HttpClient = httpClient) {}

  async getWorkflows(params?: { search?: string; category?: string; status?: string }): Promise<Workflow[]> {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    const endpoint = query ? `${API_ROUTES.WORKFLOWS.BASE}?${query}` : API_ROUTES.WORKFLOWS.BASE;
    return this.http.request<Workflow[]>(endpoint);
  }

  async getWorkflow(id: string): Promise<Workflow> {
    return this.http.request<Workflow>(API_ROUTES.WORKFLOWS.BY_ID(id));
  }

  async createWorkflow(data: CreateWorkflowInput): Promise<Workflow> {
    return this.http.request<Workflow>(API_ROUTES.WORKFLOWS.BASE, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateWorkflow(id: string, data: UpdateWorkflowInput): Promise<Workflow> {
    return this.http.request<Workflow>(API_ROUTES.WORKFLOWS.BY_ID(id), {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteWorkflow(id: string): Promise<{ message: string }> {
    return this.http.request<{ message: string }>(API_ROUTES.WORKFLOWS.BY_ID(id), {
      method: 'DELETE',
    });
  }

  async duplicateWorkflow(id: string): Promise<Workflow> {
    return this.http.request<Workflow>(API_ROUTES.WORKFLOWS.DUPLICATE(id), {
      method: 'POST',
    });
  }

  async toggleWorkflow(id: string, isActive?: boolean): Promise<Workflow> {
    return this.http.request<Workflow>(API_ROUTES.WORKFLOWS.TOGGLE(id), {
      method: 'PATCH',
      body: JSON.stringify({ isActive }),
    });
  }

  async triggerWorkflow(id: string, context?: Record<string, any>, documentId?: string): Promise<WorkflowExecution> {
    return this.http.request<WorkflowExecution>(API_ROUTES.WORKFLOWS.TRIGGER(id), {
      method: 'POST',
      body: JSON.stringify({ context, documentId }),
    });
  }

  async testWorkflow(id: string, sampleInput: Record<string, any>, definition?: any): Promise<DryRunResponse> {
    return this.http.request<DryRunResponse>(API_ROUTES.WORKFLOWS.TEST(id), {
      method: 'POST',
      body: JSON.stringify({ sampleInput, definition }),
    });
  }

  async dryRunWorkflow(data: { definition: any; sampleInput?: Record<string, any> }): Promise<DryRunResponse> {
    return this.http.request<DryRunResponse>(API_ROUTES.WORKFLOWS.DRY_RUN, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async bulkExecuteWorkflow(
    id: string,
    data: { records?: any[]; csvData?: string; fieldMapping?: Record<string, string>; createZip?: boolean }
  ): Promise<WorkflowExecution> {
    return this.http.request<WorkflowExecution>(API_ROUTES.WORKFLOWS.BULK(id), {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getWorkflowVersions(id: string): Promise<WorkflowVersion[]> {
    return this.http.request<WorkflowVersion[]>(API_ROUTES.WORKFLOWS.VERSIONS(id));
  }

  async restoreWorkflowVersion(id: string, version: number): Promise<Workflow> {
    return this.http.request<Workflow>(API_ROUTES.WORKFLOWS.RESTORE_VERSION(id, version), {
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
      res = await this.http.request<WorkflowExecution[]>(`/workflows/${id}/executions${qs}`);
    } else {
      res = await this.http.request<WorkflowExecution[]>(`${API_ROUTES.WORKFLOWS.EXECUTIONS}${qs}`);
    }
    return Array.isArray(res) ? res : [];
  }

  async getWorkflowExecution(executionId: string): Promise<WorkflowExecution> {
    return this.http.request<WorkflowExecution>(API_ROUTES.WORKFLOWS.EXECUTION_BY_ID(executionId));
  }

  async retryWorkflowExecution(executionId: string): Promise<WorkflowExecution> {
    return this.http.request<WorkflowExecution>(API_ROUTES.WORKFLOWS.RETRY_EXECUTION(executionId), {
      method: 'POST',
    });
  }

  async cancelWorkflowExecution(executionId: string): Promise<{ message: string }> {
    return this.http.request<{ message: string }>(API_ROUTES.WORKFLOWS.CANCEL_EXECUTION(executionId), {
      method: 'POST',
    });
  }

  async getWorkflowApprovals(status?: string): Promise<WorkflowApproval[]> {
    const endpoint = status ? `${API_ROUTES.WORKFLOWS.APPROVALS}?status=${status}` : API_ROUTES.WORKFLOWS.APPROVALS;
    return this.http.request<WorkflowApproval[]>(endpoint);
  }

  async decideWorkflowApproval(
    approvalId: string,
    decision: 'approved' | 'rejected',
    comments?: string
  ): Promise<{ message: string; approval: WorkflowApproval }> {
    return this.http.request<{ message: string; approval: WorkflowApproval }>(
      `${API_ROUTES.WORKFLOWS.APPROVALS}/${approvalId}/decision`,
      {
        method: 'POST',
        body: JSON.stringify({ decision, comments }),
      }
    );
  }

  async getWorkflowSchedule(id: string): Promise<WorkflowSchedule | null> {
    try {
      return await this.http.request<WorkflowSchedule>(API_ROUTES.WORKFLOWS.SCHEDULE(id));
    } catch {
      return null;
    }
  }

  async saveWorkflowSchedule(id: string, data: SaveScheduleInput): Promise<WorkflowSchedule> {
    return this.http.request<WorkflowSchedule>(API_ROUTES.WORKFLOWS.SCHEDULE(id), {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getWorkflowAnalytics(): Promise<WorkflowAnalytics> {
    return this.http.request<WorkflowAnalytics>(API_ROUTES.WORKFLOWS.ANALYTICS);
  }

  async getWorkflowTemplates(): Promise<WorkflowTemplate[]> {
    return this.http.request<WorkflowTemplate[]>(API_ROUTES.WORKFLOWS.TEMPLATES);
  }

  async exportWorkflow(id: string): Promise<any> {
    return this.http.request<any>(API_ROUTES.WORKFLOWS.EXPORT(id));
  }

  async importWorkflow(data: any): Promise<Workflow> {
    return this.http.request<Workflow>(API_ROUTES.WORKFLOWS.IMPORT, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

export const workflowService = new WorkflowService();
