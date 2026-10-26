export const WORKFLOW_CATEGORIES = {
  INVOICING: 'invoicing',
  NOTIFICATION: 'notification',
  INTEGRATION: 'integration',
  APPROVAL: 'approval',
  DATA_PIPELINE: 'data_pipeline',
} as const;

export const WORKFLOW_STATUSES = {
  DRAFT: 'draft',
  ACTIVE: 'active',
  PAUSED: 'paused',
  ARCHIVED: 'archived',
} as const;

export const EXECUTION_STATUSES = {
  PENDING: 'pending',
  RUNNING: 'running',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
  WAITING_APPROVAL: 'waiting_approval',
} as const;

export const TRIGGER_TYPES = {
  MANUAL: 'manual',
  EVENT: 'event',
  SCHEDULE: 'schedule',
  WEBHOOK: 'webhook',
} as const;
