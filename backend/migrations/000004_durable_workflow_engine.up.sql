-- Migration 000004: Durable Workflow Engine, Version Pinning & Retries

-- 1. Extend Workflow Executions with Version Pinning
ALTER TABLE workflow_executions ADD COLUMN IF NOT EXISTS version_number INT NOT NULL DEFAULT 1;
ALTER TABLE workflow_executions ADD COLUMN IF NOT EXISTS pinned_definition JSONB NOT NULL DEFAULT '{"nodes": [], "edges": []}'::jsonb;

-- 2. Extend Workflow Step Executions with Retry Tracking
ALTER TABLE workflow_step_executions ADD COLUMN IF NOT EXISTS attempt INT NOT NULL DEFAULT 1;
ALTER TABLE workflow_step_executions ADD COLUMN IF NOT EXISTS max_retries INT NOT NULL DEFAULT 3;
ALTER TABLE workflow_step_executions ADD COLUMN IF NOT EXISTS retry_policy JSONB NOT NULL DEFAULT '{"maxAttempts": 3, "initialBackoffMs": 500, "backoffMultiplier": 2.0}'::jsonb;

-- 3. Indexes for Faster Execution and Schedule Querying
CREATE INDEX IF NOT EXISTS idx_workflow_executions_status ON workflow_executions(status);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_wf_status ON workflow_executions(workflow_id, status);
CREATE INDEX IF NOT EXISTS idx_workflow_step_exec_node ON workflow_step_executions(execution_id, node_id);
