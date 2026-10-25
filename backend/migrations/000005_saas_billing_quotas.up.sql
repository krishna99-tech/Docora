-- Migration 000005: SaaS Plans, Billing, and Quota Management

ALTER TABLE workspaces
ADD COLUMN IF NOT EXISTS plan VARCHAR(32) NOT NULL DEFAULT 'free',
ADD COLUMN IF NOT EXISTS billing_cycle VARCHAR(16) NOT NULL DEFAULT 'monthly',
ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(32) NOT NULL DEFAULT 'active',
ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(128),
ADD COLUMN IF NOT EXISTS stripe_subscription_id VARCHAR(128),
ADD COLUMN IF NOT EXISTS quota_documents_monthly INT NOT NULL DEFAULT 50,
ADD COLUMN IF NOT EXISTS quota_storage_mb INT NOT NULL DEFAULT 100,
ADD COLUMN IF NOT EXISTS quota_members INT NOT NULL DEFAULT 3,
ADD COLUMN IF NOT EXISTS quota_workflows INT NOT NULL DEFAULT 3;

CREATE TABLE IF NOT EXISTS workspace_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    invoice_number VARCHAR(64) NOT NULL,
    amount INT NOT NULL DEFAULT 0,
    currency VARCHAR(8) NOT NULL DEFAULT 'USD',
    status VARCHAR(32) NOT NULL DEFAULT 'paid',
    paid_at TIMESTAMPTZ DEFAULT NOW(),
    hosted_invoice_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workspace_invoices_ws ON workspace_invoices(workspace_id);
