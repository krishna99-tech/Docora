-- Migration 000003: Advanced Workflow Automation Platform

-- 1. Extend Workflows Table with category, tags, and webhook token
ALTER TABLE workflows ADD COLUMN IF NOT EXISTS category VARCHAR(100) NOT NULL DEFAULT 'General';
ALTER TABLE workflows ADD COLUMN IF NOT EXISTS tags JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE workflows ADD COLUMN IF NOT EXISTS webhook_token VARCHAR(64) UNIQUE;

-- Backfill webhook tokens for existing workflows
UPDATE workflows SET webhook_token = REPLACE(gen_random_uuid()::text, '-', '') WHERE webhook_token IS NULL;

-- 2. Workflow Versions Table
CREATE TABLE IF NOT EXISTS workflow_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
    version_number INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    trigger_type VARCHAR(50) NOT NULL DEFAULT 'manual',
    definition JSONB NOT NULL,
    change_summary VARCHAR(255) NOT NULL DEFAULT '',
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_workflow_version UNIQUE (workflow_id, version_number)
);

CREATE INDEX IF NOT EXISTS idx_workflow_versions_wf ON workflow_versions(workflow_id, version_number DESC);

-- 3. Extend Workflow Executions Table
ALTER TABLE workflow_executions ADD COLUMN IF NOT EXISTS trigger_source VARCHAR(50) NOT NULL DEFAULT 'manual';
ALTER TABLE workflow_executions ADD COLUMN IF NOT EXISTS duration_ms BIGINT NOT NULL DEFAULT 0;
ALTER TABLE workflow_executions ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE workflow_executions ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
ALTER TABLE workflow_executions ADD COLUMN IF NOT EXISTS records_total INT NOT NULL DEFAULT 0;
ALTER TABLE workflow_executions ADD COLUMN IF NOT EXISTS records_processed INT NOT NULL DEFAULT 0;
ALTER TABLE workflow_executions ADD COLUMN IF NOT EXISTS records_failed INT NOT NULL DEFAULT 0;
ALTER TABLE workflow_executions ADD COLUMN IF NOT EXISTS generated_doc_ids JSONB NOT NULL DEFAULT '[]'::jsonb;

-- 4. Workflow Step Executions Table (Detailed step-level monitoring & history)
CREATE TABLE IF NOT EXISTS workflow_step_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    execution_id UUID NOT NULL REFERENCES workflow_executions(id) ON DELETE CASCADE,
    node_id VARCHAR(100) NOT NULL,
    node_type VARCHAR(100) NOT NULL,
    node_label VARCHAR(255) NOT NULL DEFAULT '',
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'running', 'completed', 'failed', 'skipped'
    input_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    output_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    error_message TEXT NOT NULL DEFAULT '',
    duration_ms BIGINT NOT NULL DEFAULT 0,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    step_order INT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_wf_step_exec_execution ON workflow_step_executions(execution_id, step_order ASC);

-- 5. Workflow Schedules Table
CREATE TABLE IF NOT EXISTS workflow_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    cron_expression VARCHAR(100) NOT NULL DEFAULT '',
    frequency VARCHAR(50) NOT NULL DEFAULT 'daily', -- 'hourly', 'daily', 'weekly', 'monthly', 'cron'
    timezone VARCHAR(100) NOT NULL DEFAULT 'UTC',
    is_active BOOLEAN NOT NULL DEFAULT true,
    next_run_at TIMESTAMPTZ,
    last_run_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workflow_schedules_active ON workflow_schedules(is_active, next_run_at);
CREATE INDEX IF NOT EXISTS idx_workflow_schedules_wf ON workflow_schedules(workflow_id);
