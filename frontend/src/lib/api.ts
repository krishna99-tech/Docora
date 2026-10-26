import {
  httpClient,
  authService,
  documentService,
  workflowService,
  workspaceService,
  developerService,
  customerService,
  pdfToolsService,
} from '@/services';
import {
  AuthResponse,
  BusinessProfile,
  CreateGeneralPDFInput,
  CreateInvoiceInput,
  CreateReceiptInput,
  Customer,
  DashboardStats,
  Document,
  DocumentFolder,
  DryRunResponse,
  PaginatedResponse,
  PlanDefinition,
  SaveScheduleInput,
  Template,
  User,
  Workflow,
  WorkflowAnalytics,
  WorkflowApproval,
  WorkflowExecution,
  WorkflowSchedule,
  WorkflowTemplate,
  WorkflowVersion,
  Workspace,
  WorkspaceBillingStatus,
  WorkspaceInvoice,
  WorkspaceMember,
  ApiKey,
  Webhook,
  WebhookDelivery,
  CreateWorkflowInput,
  UpdateWorkflowInput,
} from '@/types';

/**
 * Unified ApiClient preserving backward compatibility across all existing imports.
 * Delegates domain operations to modular services in `@/services`.
 */
class ApiClient {
  // Token & Workspace Management
  setTokens(access: string, refresh: string) {
    httpClient.setTokens(access, refresh);
  }

  clearTokens() {
    httpClient.clearTokens();
  }

  getAccessToken(): string | null {
    return httpClient.getAccessToken();
  }

  getActiveWorkspaceId(): string | null {
    return httpClient.getActiveWorkspaceId();
  }

  setActiveWorkspaceId(id: string | null) {
    httpClient.setActiveWorkspaceId(id);
  }

  // Low-level HTTP requests
  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    return httpClient.request<T>(endpoint, options);
  }

  async requestBlob(endpoint: string, options: RequestInit = {}): Promise<Blob> {
    return httpClient.requestBlob(endpoint, options);
  }

  // Authentication
  async register(data: { name: string; email: string; password: string }): Promise<AuthResponse> {
    return authService.register(data);
  }

  async login(data: { email: string; password: string }): Promise<AuthResponse> {
    return authService.login(data);
  }

  async logout(): Promise<void> {
    return authService.logout();
  }

  async me(): Promise<User> {
    return authService.me();
  }

  async updateProfile(data: { name: string }): Promise<User> {
    return authService.updateProfile(data);
  }

  async changePassword(data: { currentPassword: string; newPassword: string }): Promise<{ message: string }> {
    return authService.changePassword(data);
  }

  // Dashboard
  async getDashboardStats(): Promise<DashboardStats> {
    return documentService.getDashboardStats();
  }

  async getRecentDocuments(limit = 10): Promise<Document[]> {
    return documentService.getRecentDocuments(limit);
  }

  // Receipts
  async createReceipt(data: CreateReceiptInput): Promise<Document> {
    return documentService.createReceipt(data);
  }

  async listReceipts(params: Record<string, string | number> = {}): Promise<PaginatedResponse<Document>> {
    return documentService.listReceipts(params);
  }

  async getReceipt(id: string): Promise<Document> {
    return documentService.getReceipt(id);
  }

  async finalizeReceipt(id: string): Promise<Document> {
    return documentService.finalizeReceipt(id);
  }

  async cancelReceipt(id: string): Promise<void> {
    return documentService.cancelReceipt(id);
  }

  async updateReceipt(id: string, data: CreateReceiptInput): Promise<Document> {
    return documentService.updateReceipt(id, data);
  }

  // Invoices
  async createInvoice(data: CreateInvoiceInput): Promise<Document> {
    return documentService.createInvoice(data);
  }

  async listInvoices(params: Record<string, string | number> = {}): Promise<PaginatedResponse<Document>> {
    return documentService.listInvoices(params);
  }

  async getInvoice(id: string): Promise<Document> {
    return documentService.getInvoice(id);
  }

  async finalizeInvoice(id: string): Promise<Document> {
    return documentService.finalizeInvoice(id);
  }

  async cancelInvoice(id: string): Promise<void> {
    return documentService.cancelInvoice(id);
  }

  async updateInvoice(id: string, data: CreateInvoiceInput): Promise<Document> {
    return documentService.updateInvoice(id, data);
  }

  // General Documents
  async listDocuments(params: Record<string, string | number> = {}): Promise<PaginatedResponse<Document>> {
    return documentService.listDocuments(params);
  }

  async getDocument(id: string): Promise<Document> {
    return documentService.getDocument(id);
  }

  async deleteDocument(id: string): Promise<void> {
    return documentService.deleteDocument(id);
  }

  async createGeneralPdf(data: CreateGeneralPDFInput): Promise<Document> {
    return documentService.createGeneralPdf(data);
  }

  // Previews & Downloads
  async getDocumentPreviewBlob(id: string): Promise<Blob> {
    return documentService.getDocumentPreviewBlob(id);
  }

  async downloadDocument(id: string, filename: string): Promise<void> {
    return documentService.downloadDocument(id, filename);
  }

  // Templates
  async listTemplates(type?: string): Promise<Template[]> {
    return customerService.listTemplates(type);
  }

  async getTemplate(id: string): Promise<Template> {
    return customerService.getTemplate(id);
  }

  async createTemplate(data: Partial<Template>): Promise<Template> {
    return customerService.createTemplate(data);
  }

  async updateTemplate(id: string, data: Partial<Template>): Promise<Template> {
    return customerService.updateTemplate(id, data);
  }

  async duplicateTemplate(id: string): Promise<Template> {
    return customerService.duplicateTemplate(id);
  }

  async deleteTemplate(id: string): Promise<void> {
    return customerService.deleteTemplate(id);
  }

  // Customers
  async listCustomers(params: Record<string, string | number> = {}): Promise<{ data: Customer[]; total: number }> {
    return customerService.listCustomers(params);
  }

  async getCustomer(id: string): Promise<Customer> {
    return customerService.getCustomer(id);
  }

  async createCustomer(data: { name: string; email?: string; phone?: string; address?: string }): Promise<Customer> {
    return customerService.createCustomer(data);
  }

  async updateCustomer(id: string, data: { name: string; email?: string; phone?: string; address?: string }): Promise<Customer> {
    return customerService.updateCustomer(id, data);
  }

  async deleteCustomer(id: string): Promise<void> {
    return customerService.deleteCustomer(id);
  }

  // Business Profile
  async getBusinessProfile(): Promise<BusinessProfile> {
    return customerService.getBusinessProfile();
  }

  async updateBusinessProfile(data: Partial<BusinessProfile>): Promise<BusinessProfile> {
    return customerService.updateBusinessProfile(data);
  }

  // PDF Tools
  async pdfMerge(formData: FormData): Promise<Blob> {
    return pdfToolsService.pdfMerge(formData);
  }

  async pdfCompress(formData: FormData, download = true): Promise<Blob> {
    return pdfToolsService.pdfCompress(formData, download);
  }

  async pdfRotate(formData: FormData): Promise<Blob> {
    return pdfToolsService.pdfRotate(formData);
  }

  async pdfWatermark(formData: FormData): Promise<Blob> {
    return pdfToolsService.pdfWatermark(formData);
  }

  async pdfPageNumbers(formData: FormData): Promise<Blob> {
    return pdfToolsService.pdfPageNumbers(formData);
  }

  async pdfImagesToPdf(formData: FormData): Promise<Blob> {
    return pdfToolsService.pdfImagesToPdf(formData);
  }

  async pdfMetadata(formData: FormData): Promise<any> {
    return pdfToolsService.pdfMetadata(formData);
  }

  async pdfGetJobs(): Promise<any[]> {
    return pdfToolsService.pdfGetJobs();
  }

  async listPdfJobs(): Promise<any[]> {
    return pdfToolsService.listPdfJobs();
  }

  // Workflows
  async getWorkflows(params?: { search?: string; category?: string; status?: string }): Promise<Workflow[]> {
    return workflowService.getWorkflows(params);
  }

  async getWorkflow(id: string): Promise<Workflow> {
    return workflowService.getWorkflow(id);
  }

  async createWorkflow(data: CreateWorkflowInput): Promise<Workflow> {
    return workflowService.createWorkflow(data);
  }

  async updateWorkflow(id: string, data: UpdateWorkflowInput): Promise<Workflow> {
    return workflowService.updateWorkflow(id, data);
  }

  async deleteWorkflow(id: string): Promise<{ message: string }> {
    return workflowService.deleteWorkflow(id);
  }

  async duplicateWorkflow(id: string): Promise<Workflow> {
    return workflowService.duplicateWorkflow(id);
  }

  async toggleWorkflow(id: string, isActive?: boolean): Promise<Workflow> {
    return workflowService.toggleWorkflow(id, isActive);
  }

  async triggerWorkflow(id: string, context?: Record<string, any>, documentId?: string): Promise<WorkflowExecution> {
    return workflowService.triggerWorkflow(id, context, documentId);
  }

  async testWorkflow(id: string, sampleInput: Record<string, any>, definition?: any): Promise<DryRunResponse> {
    return workflowService.testWorkflow(id, sampleInput, definition);
  }

  async dryRunWorkflow(data: { definition: any; sampleInput?: Record<string, any> }): Promise<DryRunResponse> {
    return workflowService.dryRunWorkflow(data);
  }

  async bulkExecuteWorkflow(
    id: string,
    data: { records?: any[]; csvData?: string; fieldMapping?: Record<string, string>; createZip?: boolean }
  ): Promise<WorkflowExecution> {
    return workflowService.bulkExecuteWorkflow(id, data);
  }

  async getWorkflowVersions(id: string): Promise<WorkflowVersion[]> {
    return workflowService.getWorkflowVersions(id);
  }

  async restoreWorkflowVersion(id: string, version: number): Promise<Workflow> {
    return workflowService.restoreWorkflowVersion(id, version);
  }

  async getWorkflowExecutions(
    id?: string,
    params?: { status?: string; limit?: number; offset?: number }
  ): Promise<WorkflowExecution[]> {
    return workflowService.getWorkflowExecutions(id, params);
  }

  async getWorkflowExecution(executionId: string): Promise<WorkflowExecution> {
    return workflowService.getWorkflowExecution(executionId);
  }

  async retryWorkflowExecution(executionId: string): Promise<WorkflowExecution> {
    return workflowService.retryWorkflowExecution(executionId);
  }

  async cancelWorkflowExecution(executionId: string): Promise<{ message: string }> {
    return workflowService.cancelWorkflowExecution(executionId);
  }

  async getWorkflowApprovals(status?: string): Promise<WorkflowApproval[]> {
    return workflowService.getWorkflowApprovals(status);
  }

  async decideWorkflowApproval(
    approvalId: string,
    decision: 'approved' | 'rejected',
    comments?: string
  ): Promise<{ message: string; approval: WorkflowApproval }> {
    return workflowService.decideWorkflowApproval(approvalId, decision, comments);
  }

  async getWorkflowSchedule(id: string): Promise<WorkflowSchedule | null> {
    return workflowService.getWorkflowSchedule(id);
  }

  async saveWorkflowSchedule(id: string, data: SaveScheduleInput): Promise<WorkflowSchedule> {
    return workflowService.saveWorkflowSchedule(id, data);
  }

  async getWorkflowAnalytics(): Promise<WorkflowAnalytics> {
    return workflowService.getWorkflowAnalytics();
  }

  async getWorkflowTemplates(): Promise<WorkflowTemplate[]> {
    return workflowService.getWorkflowTemplates();
  }

  async exportWorkflow(id: string): Promise<any> {
    return workflowService.exportWorkflow(id);
  }

  async importWorkflow(data: any): Promise<Workflow> {
    return workflowService.importWorkflow(data);
  }

  // Developer Platform
  async listApiKeys(): Promise<ApiKey[]> {
    return developerService.listApiKeys();
  }

  async createApiKey(data: { name: string; permissions: string[] }): Promise<ApiKey> {
    return developerService.createApiKey(data);
  }

  async revokeApiKey(id: string): Promise<{ message: string }> {
    return developerService.revokeApiKey(id);
  }

  async listWebhooks(): Promise<Webhook[]> {
    return developerService.listWebhooks();
  }

  async createWebhook(data: { targetUrl: string; events: string[]; secret?: string }): Promise<Webhook> {
    return developerService.createWebhook(data);
  }

  async deleteWebhook(id: string): Promise<{ message: string }> {
    return developerService.deleteWebhook(id);
  }

  async listWebhookDeliveries(webhookId: string): Promise<WebhookDelivery[]> {
    return developerService.listWebhookDeliveries(webhookId);
  }

  async testWebhook(webhookId: string, eventType?: string): Promise<WebhookDelivery> {
    return developerService.testWebhook(webhookId, eventType);
  }

  // Workspaces
  async listWorkspaces(): Promise<Workspace[]> {
    return workspaceService.listWorkspaces();
  }

  async createWorkspace(data: { name: string; slug: string }): Promise<Workspace> {
    return workspaceService.createWorkspace(data);
  }

  async getWorkspace(id: string): Promise<Workspace> {
    return workspaceService.getWorkspace(id);
  }

  async getWorkspaceMembers(id: string): Promise<WorkspaceMember[]> {
    return workspaceService.getWorkspaceMembers(id);
  }

  async addWorkspaceMember(id: string, data: { email: string; role: string }): Promise<{ message: string }> {
    return workspaceService.addWorkspaceMember(id, data);
  }

  async removeWorkspaceMember(id: string, userId: string): Promise<{ message: string }> {
    return workspaceService.removeWorkspaceMember(id, userId);
  }

  // SaaS Billing & Quotas
  async getBillingStatus(): Promise<WorkspaceBillingStatus> {
    return workspaceService.getBillingStatus();
  }

  async getBillingPlans(): Promise<PlanDefinition[]> {
    return workspaceService.getBillingPlans();
  }

  async changePlan(plan: string, billingCycle: string): Promise<WorkspaceBillingStatus> {
    return workspaceService.changePlan(plan, billingCycle);
  }

  async getBillingInvoices(): Promise<WorkspaceInvoice[]> {
    return workspaceService.getBillingInvoices();
  }

  // Enterprise Folders & Compliance
  async listFolders(): Promise<DocumentFolder[]> {
    return documentService.listFolders();
  }

  async createFolder(data: { name: string; color?: string; parentId?: string }): Promise<DocumentFolder> {
    return documentService.createFolder(data);
  }

  async updateFolder(id: string, data: { name?: string; color?: string; parentId?: string }): Promise<{ message: string }> {
    return documentService.updateFolder(id, data);
  }

  async deleteFolder(id: string): Promise<{ message: string }> {
    return documentService.deleteFolder(id);
  }

  async moveDocuments(documentIds: string[], folderId: string | null): Promise<{ message: string }> {
    return documentService.moveDocuments(documentIds, folderId);
  }

  async tagDocuments(documentIds: string[], tags: string[]): Promise<{ message: string }> {
    return documentService.tagDocuments(documentIds, tags);
  }

  async archiveDocuments(documentIds: string[], archive: boolean): Promise<{ message: string }> {
    return documentService.archiveDocuments(documentIds, archive);
  }

  async applyCompliance(complianceStandard: string, retentionDays: number): Promise<{ message: string }> {
    return documentService.applyCompliance(complianceStandard, retentionDays);
  }
}

export const api = new ApiClient();
export * from '@/services';
export * from '@/constants';
export * from '@/schemas';
