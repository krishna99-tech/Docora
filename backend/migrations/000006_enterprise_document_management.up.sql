-- Migration 000006: Enterprise Document Management (Folders, Tags, Compliance Archival & Retention)

CREATE TABLE IF NOT EXISTS document_folders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES document_folders(id) ON DELETE CASCADE,
    name VARCHAR(128) NOT NULL,
    color VARCHAR(32) DEFAULT '#666666',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_document_folders_ws ON document_folders(workspace_id);
CREATE INDEX IF NOT EXISTS idx_document_folders_parent ON document_folders(parent_id);

ALTER TABLE documents
ADD COLUMN IF NOT EXISTS folder_id UUID REFERENCES document_folders(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS compliance_standard VARCHAR(32) DEFAULT 'standard',
ADD COLUMN IF NOT EXISTS retention_until TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS is_archived BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_documents_folder ON documents(folder_id);
CREATE INDEX IF NOT EXISTS idx_documents_archived ON documents(is_archived);
