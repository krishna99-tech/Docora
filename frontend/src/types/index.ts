export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export interface BusinessProfile {
  id: string;
  userId: string;
  businessName: string;
  address: string;
  phone: string;
  email: string;
  taxRegistrationNumber: string;
  logoStorageKey: string;
  currency: string;
  dateFormat: string;
  numberFormat: string;
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  createdAt: string;
  updatedAt: string;
}

export interface Template {
  id: string;
  userId?: string;
  name: string;
  documentType: 'receipt' | 'invoice' | 'general';
  description: string;
  templateContent: Record<string, any>;
  version: number;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentItem {
  id: string;
  documentId: string;
  description: string;
  quantity: number;
  unitPriceMinor: number;
  discountMinor: number;
  taxRate: number;
  taxMinor: number;
  lineTotalMinor: number;
  sortOrder: number;
}

export interface Document {
  id: string;
  userId: string;
  customerId?: string;
  customer?: Customer;
  documentNumber: string;
  documentType: 'receipt' | 'invoice' | 'general';
  title: string;
  status: 'draft' | 'finalized' | 'issued' | 'partially_paid' | 'paid' | 'overdue' | 'cancelled';
  currency: string;
  subtotalMinor: number;
  discountMinor: number;
  taxMinor: number;
  totalMinor: number;
  amountPaidMinor: number;
  balanceMinor: number;
  issueDate: string;
  dueDate?: string;
  paymentMethod: string;
  paymentReference: string;
  notes: string;
  terms: string;
  templateVersionId?: string;
  template?: Template;
  storageKey: string;
  filename: string;
  mimeType: string;
  fileSize: number;
  sha256: string;
  metadata?: any;
  items?: DocumentItem[];
  createdAt: string;
  updatedAt: string;
  finalizedAt?: string;
}

export interface DashboardStats {
  totalDocuments: number;
  receiptsGenerated: number;
  invoicesGenerated: number;
  generalPdfsGenerated: number;
  documentsThisMonth: number;
  totalReceiptRevenueMinor: number;
  totalInvoicePendingMinor: number;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ItemInput {
  description: string;
  quantity: number;
  unitPriceMinor: number;
  discountMinor: number;
  taxRate: number;
}

export interface CreateReceiptInput {
  customerId?: string;
  documentNumber?: string;
  title?: string;
  currency?: string;
  issueDate?: string;
  paymentMethod?: string;
  paymentReference?: string;
  amountPaidMinor: number;
  notes?: string;
  terms?: string;
  templateVersionId?: string;
  items: ItemInput[];
}

export interface CreateInvoiceInput {
  customerId?: string;
  documentNumber?: string;
  title?: string;
  currency?: string;
  issueDate?: string;
  dueDate?: string;
  paymentMethod?: string;
  paymentReference?: string;
  amountPaidMinor: number;
  notes?: string;
  terms?: string;
  templateVersionId?: string;
  items: ItemInput[];
}

export interface GeneralPDFSection {
  type: 'heading' | 'paragraph' | 'table' | 'key_value' | 'spacer' | 'divider';
  title?: string;
  content?: string;
  headers?: string[];
  rows?: string[][];
  pairs?: { key: string; value: string }[];
}

export interface CreateGeneralPDFInput {
  title: string;
  subtitle?: string;
  pageSize?: string;
  orientation?: string;
  margin?: string;
  includeHeader?: boolean;
  includeFooter?: boolean;
  includePageNumbers?: boolean;
  customerId?: string;
  templateVersionId?: string;
  sections: GeneralPDFSection[];
  notes?: string;
}

// -----------------------------------------------------------------------------
// WORKFLOW AUTOMATION PLATFORM TYPES
// -----------------------------------------------------------------------------

export interface NodePosition {
  x: number;
  y: number;
}

export interface WorkflowNode {
  id: string;
  type: string;
  label: string;
  position: NodePosition;
  data?: Record<string, any>;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  label?: string;
}

export interface WorkflowDefinition {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  variables?: Record<string, any>;
}

export interface Workflow {
  id: string;
  workspaceId: string;
  userId: string;
  name: string;
  description: string;
  category: string;
  triggerType: string;
  definition: WorkflowDefinition | string;
  isActive: boolean;
  version: number;
  tags?: string[] | string;
  webhookToken?: string;
  createdAt: string;
  updatedAt: string;
  totalExecutions?: number;
  successfulExecutions?: number;
  failedExecutions?: number;
  lastExecutedAt?: string;
}

export interface CreateWorkflowInput {
  name: string;
  description?: string;
  category?: string;
  triggerType: string;
  definition: WorkflowDefinition | Record<string, any>;
  isActive: boolean;
  tags?: string[];
}

export interface UpdateWorkflowInput {
  name: string;
  description?: string;
  category?: string;
  triggerType: string;
  definition: WorkflowDefinition | Record<string, any>;
  isActive: boolean;
  tags?: string[];
  changeSummary?: string;
}

export interface WorkflowVersion {
  id: string;
  workflowId: string;
  versionNumber: number;
  name: string;
  description: string;
  triggerType: string;
  definition: WorkflowDefinition | Record<string, any>;
  changeSummary: string;
  userId?: string;
  createdAt: string;
}

export interface WorkflowStepExecution {
  id: string;
  executionId: string;
  nodeId: string;
  nodeType: string;
  nodeLabel: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  inputData?: Record<string, any> | string;
  outputData?: Record<string, any> | string;
  errorMessage?: string;
  durationMs: number;
  startedAt: string;
  completedAt?: string;
  stepOrder: number;
  attempt?: number;
  maxRetries?: number;
  retryPolicy?: Record<string, any>;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  documentId?: string;
  status: 'pending' | 'running' | 'waiting_approval' | 'completed' | 'failed' | 'cancelled';
  currentStepId: string;
  triggerSource: string;
  versionNumber?: number;
  pinnedDefinition?: WorkflowDefinition | Record<string, any>;
  contextData?: Record<string, any> | string;
  logs?: Array<{ timestamp: string; level: string; message: string }> | string;
  errorMessage?: string;
  durationMs: number;
  recordsTotal: number;
  recordsProcessed: number;
  recordsFailed: number;
  generatedDocIds?: string[] | string;
  startedAt: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  workflowName?: string;
  stepExecutions?: WorkflowStepExecution[];
}

export interface WorkflowApproval {
  id: string;
  executionId: string;
  stepId: string;
  approverId?: string;
  approverName?: string;
  status: 'pending' | 'approved' | 'rejected';
  decisionNotes?: string;
  decidedAt?: string;
  createdAt: string;
  workflowName?: string;
}

export interface WorkflowSchedule {
  id: string;
  workflowId: string;
  workspaceId: string;
  cronExpression: string;
  frequency: 'hourly' | 'daily' | 'weekly' | 'monthly' | 'cron';
  timezone: string;
  isActive: boolean;
  nextRunAt?: string;
  lastRunAt?: string;
  createdAt: string;
  updatedAt: string;
  workflowName?: string;
}

export interface SaveScheduleInput {
  cronExpression?: string;
  frequency: 'hourly' | 'daily' | 'weekly' | 'monthly' | 'cron';
  timezone?: string;
  isActive: boolean;
}

export interface DailyExecutionMetric {
  date: string;
  total: number;
  successful: number;
  failed: number;
}

export interface WorkflowAnalytics {
  totalWorkflows: number;
  activeWorkflows: number;
  draftWorkflows: number;
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  successRate: number;
  avgDurationMs: number;
  documentsGenerated: number;
  dailyVolume: DailyExecutionMetric[];
}

export interface DryRunStepResult {
  nodeId: string;
  nodeType: string;
  nodeLabel: string;
  status: string;
  input: Record<string, any>;
  output: Record<string, any>;
  errorMessage?: string;
  durationMs: number;
}

export interface DryRunResponse {
  success: boolean;
  stepResults: DryRunStepResult[];
  simulatedOutput: Record<string, any>;
  logs: string[];
  durationMs: number;
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  triggerType: string;
  definition: WorkflowDefinition;
  requiredInputs: string[];
  setupInstructions: string;
}

export interface ApiKey {
  id: string;
  workspaceId: string;
  userId: string;
  name: string;
  keyPrefix: string;
  rawKey?: string;
  permissions: string[];
  lastUsedAt?: string;
  revokedAt?: string;
  createdAt: string;
}

export interface Webhook {
  id: string;
  workspaceId: string;
  targetUrl: string;
  events: string[];
  isActive: boolean;
  createdAt: string;
}

export interface WebhookDelivery {
  id: string;
  webhookId: string;
  eventType: string;
  payload: any;
  statusCode: number;
  responseBody: string;
  attempt: number;
  success: boolean;
  createdAt: string;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceMember {
  id: string;
  workspaceId: string;
  userId: string;
  role: 'owner' | 'admin' | 'editor' | 'viewer';
  userName?: string;
  userEmail?: string;
  createdAt: string;
}

