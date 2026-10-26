import { z } from 'zod';

export const createWorkflowSchema = z.object({
  name: z.string().min(3, 'Workflow name must be at least 3 characters'),
  description: z.string().optional(),
  category: z.string().default('invoicing'),
  triggerType: z.enum(['manual', 'event', 'schedule', 'webhook']).default('manual'),
  definition: z.record(z.string(), z.any()).default({ nodes: [], edges: [] }),
  isActive: z.boolean().default(false),
  tags: z.array(z.string()).optional(),
});

export const updateWorkflowSchema = createWorkflowSchema.partial().extend({
  changeSummary: z.string().optional(),
});

export const saveScheduleSchema = z.object({
  cronExpression: z.string().min(1, 'Cron expression is required'),
  timezone: z.string().default('UTC'),
  isEnabled: z.boolean().default(true),
  inputPayload: z.record(z.string(), z.any()).optional(),
});

export type CreateWorkflowFormData = z.infer<typeof createWorkflowSchema>;
export type UpdateWorkflowFormData = z.infer<typeof updateWorkflowSchema>;
export type SaveScheduleFormData = z.infer<typeof saveScheduleSchema>;
