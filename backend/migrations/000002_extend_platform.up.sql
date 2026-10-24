-- Phase 1 Migration: Multi-Tenant Workspaces, Extended Document Types, Sharing, Verification, Jobs, Versions, Workflows, and Developer API

-- 1. Workspaces
CREATE TABLE IF NOT EXISTS workspaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workspaces_owner ON workspaces(owner_id);

-- 2. Workspace Members (RBAC: owner, admin, editor, viewer)
CREATE TABLE IF NOT EXISTS workspace_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL DEFAULT 'editor',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_workspace_member UNIQUE (workspace_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_workspace_members_user ON workspace_members(user_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_workspace ON workspace_members(workspace_id);

-- Auto-create default workspace for any existing user without one
DO $$
DECLARE
    u RECORD;
    ws_id UUID;
BEGIN
    FOR u IN SELECT id, name, email FROM users LOOP
        IF NOT EXISTS (SELECT 1 FROM workspaces WHERE owner_id = u.id) THEN
            INSERT INTO workspaces (name, slug, owner_id)
            VALUES (u.name || '''s Workspace', 'ws-' || SUBSTRING(u.id::text FROM 1 FOR 8), u.id)
            RETURNING id INTO ws_id;

            INSERT INTO workspace_members (workspace_id, user_id, role)
            VALUES (ws_id, u.id, 'owner')
            ON CONFLICT DO NOTHING;
        END IF;
    END LOOP;
END $$;

-- 3. Add workspace_id columns to existing entities if not present
ALTER TABLE business_profiles ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE;
ALTER TABLE templates ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS is_archived BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS tags JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS category VARCHAR(100) NOT NULL DEFAULT 'General';

-- Backfill workspace_id for existing records from owner's workspace
UPDATE business_profiles bp
SET workspace_id = w.id
FROM workspaces w
WHERE bp.user_id = w.owner_id AND bp.workspace_id IS NULL;

UPDATE customers c
SET workspace_id = w.id
FROM workspaces w
WHERE c.user_id = w.owner_id AND c.workspace_id IS NULL;

UPDATE templates t
SET workspace_id = w.id
FROM workspaces w
WHERE t.user_id = w.owner_id AND t.workspace_id IS NULL;

UPDATE documents d
SET workspace_id = w.id
FROM workspaces w
WHERE d.user_id = w.owner_id AND d.workspace_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_documents_workspace_type ON documents(workspace_id, document_type);
CREATE INDEX IF NOT EXISTS idx_documents_workspace_status ON documents(workspace_id, status);
CREATE INDEX IF NOT EXISTS idx_documents_deleted ON documents(workspace_id, deleted_at);

-- 4. Document Versions (Historical snapshots for audit & comparison)
CREATE TABLE IF NOT EXISTS document_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    version_number INT NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    change_summary VARCHAR(255) NOT NULL DEFAULT '',
    snapshot_data JSONB NOT NULL,
    storage_key VARCHAR(255) NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_doc_version UNIQUE (document_id, version_number)
);

CREATE INDEX IF NOT EXISTS idx_doc_versions_doc_id ON document_versions(document_id, version_number DESC);

-- 5. Secure Sharing Links
CREATE TABLE IF NOT EXISTS sharing_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255),
    expires_at TIMESTAMPTZ,
    max_accesses INT DEFAULT 0, -- 0 for unlimited
    access_count INT NOT NULL DEFAULT 0,
    allow_download BOOLEAN NOT NULL DEFAULT true,
    is_revoked BOOLEAN NOT NULL DEFAULT false,
    watermark_text VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sharing_links_token ON sharing_links(token_hash);
CREATE INDEX IF NOT EXISTS idx_sharing_links_doc ON sharing_links(document_id);

-- 6. Document Verification Records
CREATE TABLE IF NOT EXISTS verification_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL UNIQUE REFERENCES documents(id) ON DELETE CASCADE,
    verification_token VARCHAR(64) NOT NULL UNIQUE,
    sha256_hash VARCHAR(64) NOT NULL,
    qr_payload TEXT NOT NULL DEFAULT '',
    is_revoked BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_verification_token ON verification_records(verification_token);
CREATE INDEX IF NOT EXISTS idx_verification_hash ON verification_records(sha256_hash);

-- 7. Processing Jobs (Async PDF operations: merge, split, compress, etc.)
CREATE TABLE IF NOT EXISTS processing_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    job_type VARCHAR(50) NOT NULL, -- 'merge', 'split', 'compress', 'extract', 'rotate', 'reorder', 'delete_pages', 'watermark', 'page_numbers', 'images_to_pdf'
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed', 'cancelled'
    input_storage_keys JSONB NOT NULL DEFAULT '[]'::jsonb,
    output_storage_key VARCHAR(255) NOT NULL DEFAULT '',
    output_filename VARCHAR(255) NOT NULL DEFAULT '',
    output_file_size BIGINT NOT NULL DEFAULT 0,
    options JSONB NOT NULL DEFAULT '{}'::jsonb,
    error_message TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_processing_jobs_user ON processing_jobs(user_id, status);
CREATE INDEX IF NOT EXISTS idx_processing_jobs_workspace ON processing_jobs(workspace_id, status);

-- 8. Developer API Keys
CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    key_prefix VARCHAR(16) NOT NULL,
    key_hash VARCHAR(255) NOT NULL UNIQUE,
    permissions JSONB NOT NULL DEFAULT '["*"]'::jsonb,
    last_used_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_workspace ON api_keys(workspace_id);

-- 9. Webhooks & Deliveries
CREATE TABLE IF NOT EXISTS webhooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    target_url TEXT NOT NULL,
    secret VARCHAR(255) NOT NULL,
    events JSONB NOT NULL DEFAULT '["document.finalized"]'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS webhook_deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    webhook_id UUID NOT NULL REFERENCES webhooks(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    status_code INT NOT NULL DEFAULT 0,
    response_body TEXT NOT NULL DEFAULT '',
    attempt INT NOT NULL DEFAULT 1,
    success BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_wh ON webhook_deliveries(webhook_id, created_at DESC);

-- 10. Workflows Automation
CREATE TABLE IF NOT EXISTS workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    trigger_type VARCHAR(50) NOT NULL DEFAULT 'manual', -- 'manual', 'document_created', 'document_finalized'
    definition JSONB NOT NULL DEFAULT '{"nodes": [], "edges": []}'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT true,
    version INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS workflow_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
    document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'running', 'waiting_approval', 'completed', 'failed', 'cancelled'
    current_step_id VARCHAR(100) NOT NULL DEFAULT '',
    context_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    logs JSONB NOT NULL DEFAULT '[]'::jsonb,
    error_message TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS workflow_approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    execution_id UUID NOT NULL REFERENCES workflow_executions(id) ON DELETE CASCADE,
    step_id VARCHAR(100) NOT NULL,
    approver_id UUID REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    decision_notes TEXT NOT NULL DEFAULT '',
    decided_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed System Templates for Quotations and Estimates
INSERT INTO templates (id, user_id, name, document_type, description, template_content, version, is_default, is_active)
VALUES
(
    '00000000-0000-0000-0000-000000000006',
    NULL,
    'Commercial Quotation',
    'quotation',
    'Professional corporate quotation layout with validity period, line item breakdowns, and terms.',
    '{"layout": "quotation", "accentColor": "#111111", "fontFamily": "Inter, sans-serif", "showValidity": true}'::jsonb,
    1,
    true,
    true
),
(
    '00000000-0000-0000-0000-000000000007',
    NULL,
    'Standard Estimate',
    'estimate',
    'Project estimate template with itemized labor, materials, and payment schedules.',
    '{"layout": "estimate", "accentColor": "#111111", "fontFamily": "Inter, sans-serif", "showSchedule": true}'::jsonb,
    1,
    true,
    true
),
(
    '00000000-0000-0000-0000-000000000008',
    NULL,
    'Statement of Account',
    'statement',
    'Financial account balance statement detailing invoices, payments received, and outstanding balances.',
    '{"layout": "statement", "accentColor": "#111111", "fontFamily": "Inter, sans-serif", "showAging": true}'::jsonb,
    1,
    true,
    true
)
ON CONFLICT (id) DO NOTHING;
