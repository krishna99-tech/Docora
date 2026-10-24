-- Extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Refresh tokens table
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_hash ON refresh_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);

-- 3. Business profiles table
CREATE TABLE IF NOT EXISTS business_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    business_name VARCHAR(255) NOT NULL DEFAULT '',
    address TEXT NOT NULL DEFAULT '',
    phone VARCHAR(100) NOT NULL DEFAULT '',
    email VARCHAR(255) NOT NULL DEFAULT '',
    tax_registration_number VARCHAR(100) NOT NULL DEFAULT '',
    logo_storage_key VARCHAR(255) NOT NULL DEFAULT '',
    currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    date_format VARCHAR(50) NOT NULL DEFAULT 'YYYY-MM-DD',
    number_format VARCHAR(50) NOT NULL DEFAULT 'comma_period',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Customers table
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL DEFAULT '',
    phone VARCHAR(100) NOT NULL DEFAULT '',
    address TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customers_user_id ON customers(user_id);
CREATE INDEX IF NOT EXISTS idx_customers_user_name ON customers(user_id, name);

-- 5. Templates table
CREATE TABLE IF NOT EXISTS templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE, -- NULL for global/system templates
    name VARCHAR(255) NOT NULL,
    document_type VARCHAR(50) NOT NULL, -- 'receipt', 'invoice', 'general'
    description TEXT NOT NULL DEFAULT '',
    template_content JSONB NOT NULL DEFAULT '{}'::jsonb,
    version INT NOT NULL DEFAULT 1,
    is_default BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_templates_user_type ON templates(user_id, document_type, is_active);

-- 6. Document numbering sequence counter table (concurrency safe)
CREATE TABLE IF NOT EXISTS document_sequences (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    document_type VARCHAR(50) NOT NULL,
    current_val BIGINT NOT NULL DEFAULT 0,
    prefix VARCHAR(20) NOT NULL DEFAULT '',
    PRIMARY KEY (user_id, document_type)
);

-- 7. Documents table
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    document_number VARCHAR(100) NOT NULL,
    document_type VARCHAR(50) NOT NULL, -- 'receipt', 'invoice', 'general'
    title VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'draft', -- 'draft', 'issued', 'partially_paid', 'paid', 'overdue', 'cancelled'
    currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    subtotal_minor BIGINT NOT NULL DEFAULT 0,
    discount_minor BIGINT NOT NULL DEFAULT 0,
    tax_minor BIGINT NOT NULL DEFAULT 0,
    total_minor BIGINT NOT NULL DEFAULT 0,
    amount_paid_minor BIGINT NOT NULL DEFAULT 0,
    balance_minor BIGINT NOT NULL DEFAULT 0,
    issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE,
    payment_method VARCHAR(100) NOT NULL DEFAULT '',
    payment_reference VARCHAR(100) NOT NULL DEFAULT '',
    notes TEXT NOT NULL DEFAULT '',
    terms TEXT NOT NULL DEFAULT '',
    template_version_id UUID REFERENCES templates(id) ON DELETE SET NULL,
    storage_key VARCHAR(255) NOT NULL DEFAULT '',
    filename VARCHAR(255) NOT NULL DEFAULT '',
    mime_type VARCHAR(100) NOT NULL DEFAULT 'application/pdf',
    file_size BIGINT NOT NULL DEFAULT 0,
    sha256 VARCHAR(64) NOT NULL DEFAULT '',
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    finalized_at TIMESTAMPTZ,
    CONSTRAINT uq_user_document_number UNIQUE (user_id, document_type, document_number)
);

CREATE INDEX IF NOT EXISTS idx_documents_user_type_status ON documents(user_id, document_type, status);
CREATE INDEX IF NOT EXISTS idx_documents_user_created ON documents(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_documents_customer ON documents(customer_id);

-- 8. Document Items table
CREATE TABLE IF NOT EXISTS document_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    quantity DECIMAL(12, 4) NOT NULL DEFAULT 1,
    unit_price_minor BIGINT NOT NULL DEFAULT 0,
    discount_minor BIGINT NOT NULL DEFAULT 0,
    tax_rate DECIMAL(6, 4) NOT NULL DEFAULT 0,
    tax_minor BIGINT NOT NULL DEFAULT 0,
    line_total_minor BIGINT NOT NULL DEFAULT 0,
    sort_order INT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_document_items_document ON document_items(document_id, sort_order ASC);

-- 9. Document Audit Logs
CREATE TABLE IF NOT EXISTS document_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    previous_status VARCHAR(50),
    new_status VARCHAR(50),
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_document_id ON document_audit_logs(document_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON document_audit_logs(user_id, created_at DESC);

-- Seed System Default Templates
INSERT INTO templates (id, user_id, name, document_type, description, template_content, version, is_default, is_active)
VALUES 
(
    '00000000-0000-0000-0000-000000000001',
    NULL,
    'Simple Receipt',
    'receipt',
    'A clean, minimal, single-column receipt format ideal for retail or services.',
    '{"layout": "simple", "accentColor": "#111111", "fontFamily": "Inter, sans-serif", "showLogo": true}'::jsonb,
    1,
    true,
    true
),
(
    '00000000-0000-0000-0000-000000000002',
    NULL,
    'Professional Receipt',
    'receipt',
    'Modern executive receipt with breakdown tables, payment verification, and watermark.',
    '{"layout": "professional", "accentColor": "#000000", "fontFamily": "Inter, sans-serif", "showLogo": true, "showBorders": true}'::jsonb,
    1,
    false,
    true
),
(
    '00000000-0000-0000-0000-000000000003',
    NULL,
    'Minimal Invoice',
    'invoice',
    'Lightweight, high-contrast invoice layout focused on clarity and readability.',
    '{"layout": "minimal", "accentColor": "#111111", "fontFamily": "Inter, sans-serif", "showLogo": true}'::jsonb,
    1,
    true,
    true
),
(
    '00000000-0000-0000-0000-000000000004',
    NULL,
    'Professional Invoice',
    'invoice',
    'Comprehensive B2B invoice layout with tax identification, due dates, terms, and bank details.',
    '{"layout": "professional", "accentColor": "#000000", "fontFamily": "Inter, sans-serif", "showLogo": true, "showDueBadge": true}'::jsonb,
    1,
    false,
    true
),
(
    '00000000-0000-0000-0000-000000000005',
    NULL,
    'General Report',
    'general',
    'Standard document layout for formal business summaries, statements, and reports.',
    '{"layout": "report", "accentColor": "#111111", "fontFamily": "Inter, sans-serif", "showCover": false, "pageNumbers": true}'::jsonb,
    1,
    true,
    true
)
ON CONFLICT (id) DO NOTHING;
