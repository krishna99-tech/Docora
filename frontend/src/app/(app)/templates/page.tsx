'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Plus,
  Copy,
  Trash2,
  Palette,
  CheckCircle2,
  FileText,
  Check,
  Download,
  Upload,
  Sparkles,
  ShoppingBag,
  ExternalLink,
  Code,
} from 'lucide-react';
import { Header } from '@/components/layout/header';
import { TablePagination } from '@/components/ui/table-pagination';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import { Template } from '@/types';

// Curated SaaS Marketplace Presets
const MARKETPLACE_PRESETS = [
  {
    id: 'stripe-minimalist-invoice',
    name: 'Stripe Minimalist B2B Invoice',
    documentType: 'invoice' as const,
    description: 'Ultra-clean monochrome layout featuring tax matrix, remittance instructions, and payment QR block.',
    templateContent: {
      layout: 'stripe-minimal',
      fontFamily: 'Inter, sans-serif',
      accentColor: '#000000',
      showBorder: false,
      headerStyle: 'split',
      taxBreakdown: true,
    },
  },
  {
    id: 'thermal-pos-receipt',
    name: 'Thermal POS Point-of-Sale',
    documentType: 'receipt' as const,
    description: 'Compact 80mm roll format optimized for retail POS, cashier ID, barcode, and return policy fine-print.',
    templateContent: {
      layout: 'thermal-80mm',
      fontFamily: 'Courier New, monospace',
      accentColor: '#111111',
      showBarcode: true,
      condensed: true,
    },
  },
  {
    id: 'executive-board-statement',
    name: 'Executive Board Financial Statement',
    documentType: 'general' as const,
    description: 'High-contrast typography, KPI summary cards, structured balance sheets, and formal corporate signature block.',
    templateContent: {
      layout: 'executive-report',
      fontFamily: 'Outfit, sans-serif',
      accentColor: '#0a0a0a',
      includeSignatureBlock: true,
      cardDividers: true,
    },
  },
  {
    id: 'freelance-hourly-quote',
    name: 'Freelancer Time & Materials Invoice',
    documentType: 'invoice' as const,
    description: 'Designed for consultants and software engineers with hourly rate logs, milestone tracking, and Net-30 payment terms.',
    templateContent: {
      layout: 'time-materials',
      fontFamily: 'Inter, sans-serif',
      accentColor: '#262626',
      hourlyTracking: true,
      netDays: 30,
    },
  },
  {
    id: 'vat-compliance-tax-bill',
    name: 'Cross-Border VAT / GST Compliance',
    documentType: 'invoice' as const,
    description: 'Strict European & international tax compliance formatting with reverse charge notices and dual-currency breakdowns.',
    templateContent: {
      layout: 'vat-tax-standard',
      fontFamily: 'Inter, sans-serif',
      accentColor: '#000000',
      vatCompliant: true,
      reverseChargeNotice: true,
    },
  },
  {
    id: 'modern-dispatch-packing-slip',
    name: 'Logistics Dispatch & Packing Slip',
    documentType: 'general' as const,
    description: 'Warehouse shipment note with sku checklist, recipient verification signatures, and package weight metrics.',
    templateContent: {
      layout: 'logistics-slip',
      fontFamily: 'Inter, sans-serif',
      accentColor: '#171717',
      showChecklist: true,
      showWeightTable: true,
    },
  },
];

export default function TemplatesPage() {
  const [viewMode, setViewMode] = useState<'workspace' | 'marketplace'>('workspace');
  const [docTypeFilter, setDocTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(9);

  // Create Template Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateType, setNewTemplateType] = useState<'receipt' | 'invoice' | 'general'>('receipt');
  const [newTemplateDesc, setNewTemplateDesc] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Import Template Modal
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importJsonText, setImportJsonText] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  // Installing Preset
  const [installingPresetId, setInstallingPresetId] = useState<string | null>(null);

  const { data: templates = [], isLoading, refetch } = useQuery<Template[]>({
    queryKey: ['templates-list', docTypeFilter],
    queryFn: async () => {
      const res = await api.listTemplates(docTypeFilter);
      return Array.isArray(res) ? res : [];
    },
  });

  const handleDuplicate = async (id: string) => {
    try {
      await api.duplicateTemplate(id);
      refetch();
    } catch (err: any) {
      alert(`Duplicate error: ${err.message}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this custom template?')) return;
    try {
      await api.deleteTemplate(id);
      refetch();
    } catch (err: any) {
      alert(`Delete error: ${err.message}`);
    }
  };

  const handleExportTemplate = (tmpl: Template) => {
    const exportData = {
      schemaVersion: '1.0',
      exportedAt: new Date().toISOString(),
      template: {
        name: tmpl.name,
        documentType: tmpl.documentType,
        description: tmpl.description,
        templateContent: tmpl.templateContent,
      },
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${tmpl.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-template.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setImportError(null);
    setIsImporting(true);
    try {
      const parsed = JSON.parse(importJsonText);
      const tmpl = parsed.template || parsed;
      if (!tmpl.name || !tmpl.documentType) {
        throw new Error('Invalid template format: "name" and "documentType" are required.');
      }
      await api.createTemplate({
        name: tmpl.name,
        documentType: tmpl.documentType,
        description: tmpl.description || 'Imported template schema',
        templateContent: tmpl.templateContent || { layout: 'custom' },
      });
      setIsImportOpen(false);
      setImportJsonText('');
      refetch();
    } catch (err: any) {
      setImportError(err.message || 'Failed to parse template JSON');
    } finally {
      setIsImporting(false);
    }
  };

  const handleInstallPreset = async (preset: typeof MARKETPLACE_PRESETS[0]) => {
    setInstallingPresetId(preset.id);
    try {
      await api.createTemplate({
        name: preset.name,
        documentType: preset.documentType,
        description: preset.description,
        templateContent: preset.templateContent,
      });
      refetch();
      setViewMode('workspace');
    } catch (err: any) {
      alert(`Install error: ${err.message}`);
    } finally {
      setInstallingPresetId(null);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.createTemplate({
        name: newTemplateName,
        documentType: newTemplateType,
        description: newTemplateDesc,
        templateContent: {
          layout: 'custom',
          fontFamily: 'Inter, sans-serif',
          accentColor: '#111111',
        },
      });
      setIsCreateOpen(false);
      setNewTemplateName('');
      setNewTemplateDesc('');
      refetch();
    } catch (err: any) {
      alert(`Create error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      <Header
        title="Document Templates"
        description="Choose, customize, export, and import high-contrast layouts for receipts, invoices, and reports"
        action={{ label: 'New Template', onClick: () => setIsCreateOpen(true) }}
      />

      <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 max-w-7xl mx-auto w-full">
        {/* Navigation Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border)] pb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setViewMode('workspace');
                setPage(1);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                viewMode === 'workspace'
                  ? 'bg-[var(--primary)] text-[var(--primary-foreground)]'
                  : 'bg-[var(--surface-secondary)] text-[var(--foreground)] border border-[var(--border)] hover:bg-[var(--surface-hover)]'
              }`}
            >
              <Palette className="w-3.5 h-3.5" />
              <span>Workspace Templates ({templates.length})</span>
            </button>

            <button
              onClick={() => {
                setViewMode('marketplace');
                setPage(1);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                viewMode === 'marketplace'
                  ? 'bg-[var(--primary)] text-[var(--primary-foreground)]'
                  : 'bg-[var(--surface-secondary)] text-[var(--foreground)] border border-[var(--border)] hover:bg-[var(--surface-hover)]'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5 text-amber-500" />
              <span>Marketplace Presets ({MARKETPLACE_PRESETS.length})</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsImportOpen(true)}
              className="text-xs h-8"
            >
              <Upload className="w-3.5 h-3.5 mr-1" />
              Import JSON
            </Button>
          </div>
        </div>

        {/* Workspace Filters (Only in Workspace View) */}
        {viewMode === 'workspace' && (
          <div className="flex items-center justify-between">
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {['', 'receipt', 'invoice', 'general'].map((t) => (
                <button
                  key={t}
                  onClick={() => {
                    setDocTypeFilter(t);
                    setPage(1);
                  }}
                  className={`px-2.5 sm:px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer capitalize ${
                    docTypeFilter === t
                      ? 'bg-[var(--primary)] text-[var(--primary-foreground)]'
                      : 'bg-[var(--surface-secondary)] text-[var(--foreground)] border border-[var(--border)] hover:bg-[var(--surface-hover)]'
                  }`}
                >
                  {t === '' ? 'All Types' : `${t}s`}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* VIEW 1: WORKSPACE TEMPLATES */}
        {viewMode === 'workspace' && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {isLoading ? (
                <div className="col-span-full py-12 text-center text-xs text-[var(--muted-foreground)]">
                  Loading workspace templates...
                </div>
              ) : templates.length === 0 ? (
                <div className="col-span-full py-16 text-center border border-dashed border-[var(--border)] rounded-xl bg-[var(--surface)]">
                  <Palette className="w-8 h-8 text-[var(--muted-foreground)] mx-auto mb-2" />
                  <p className="font-bold text-sm text-[var(--foreground)]">No templates found</p>
                  <p className="text-xs text-[var(--muted-foreground)] mt-1 mb-4">
                    Get started by creating a new custom layout or install from the Marketplace Presets.
                  </p>
                  <Button size="sm" onClick={() => setViewMode('marketplace')} className="text-xs">
                    Browse Presets
                  </Button>
                </div>
              ) : (
                templates.slice((page - 1) * pageSize, page * pageSize).map((tmpl) => (
                  <Card
                    key={tmpl.id}
                    className="flex flex-col justify-between min-h-[220px] border border-[var(--border)] shadow-xs bg-[var(--surface)] p-5"
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted-foreground)] block">
                            {tmpl.documentType} Template
                          </span>
                          <h3 className="font-bold text-base text-[var(--foreground)] mt-0.5 tracking-tight">
                            {tmpl.name}
                          </h3>
                        </div>
                        {tmpl.isDefault && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 bg-[var(--primary)] text-[var(--primary-foreground)] rounded">
                            <Check className="w-3 h-3" /> Default
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-[var(--muted-foreground)] mt-3 line-clamp-3">
                        {tmpl.description || 'Pre-configured professional typography and table layout.'}
                      </p>
                    </div>

                    {/* Card Footer */}
                    <div className="pt-4 border-t border-[var(--border)] flex items-center justify-between mt-4">
                      <span className="text-[11px] font-mono text-[var(--muted-foreground)]">
                        v{tmpl.version} {tmpl.userId ? '(Custom)' : '(System)'}
                      </span>

                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleExportTemplate(tmpl)}
                          title="Export Template JSON"
                          className="h-7 w-7 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDuplicate(tmpl.id)}
                          title="Duplicate Template"
                          className="h-7 w-7 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </Button>

                        {tmpl.userId && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(tmpl.id)}
                            title="Delete Custom Template"
                            className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>

            {/* Pagination */}
            {templates.length > 0 && (
              <TablePagination
                page={page}
                totalPages={Math.ceil(templates.length / pageSize)}
                totalItems={templates.length}
                pageSize={pageSize}
                onPageChange={setPage}
                onPageSizeChange={(newSize) => {
                  setPageSize(newSize);
                  setPage(1);
                }}
                pageSizeOptions={[6, 9, 12, 24]}
                itemName="templates"
              />
            )}
          </>
        )}

        {/* VIEW 2: MARKETPLACE PRESETS */}
        {viewMode === 'marketplace' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {MARKETPLACE_PRESETS.map((preset) => (
              <Card
                key={preset.id}
                className="flex flex-col justify-between min-h-[240px] border border-[var(--border)] shadow-xs bg-[var(--surface)] p-5 relative overflow-hidden"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-wider">
                      {preset.documentType} Preset
                    </Badge>
                    <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded">
                      <Sparkles className="w-3 h-3" /> Ready to Use
                    </span>
                  </div>

                  <h3 className="font-bold text-base text-[var(--foreground)] tracking-tight">
                    {preset.name}
                  </h3>

                  <p className="text-xs text-[var(--muted-foreground)] mt-2 line-clamp-3">
                    {preset.description}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {Object.entries(preset.templateContent)
                      .slice(0, 3)
                      .map(([k, v]) => (
                        <span
                          key={k}
                          className="text-[10px] font-mono bg-[var(--surface-secondary)] border border-[var(--border)] px-1.5 py-0.5 rounded text-[var(--muted-foreground)]"
                        >
                          {k}: {String(v)}
                        </span>
                      ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-[var(--border)] flex items-center justify-end mt-4">
                  <Button
                    size="sm"
                    disabled={installingPresetId === preset.id}
                    onClick={() => handleInstallPreset(preset)}
                    className="text-xs h-8"
                  >
                    {installingPresetId === preset.id ? 'Installing...' : 'Install to Workspace'}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create Template Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create New Template"
        description="Define layout metadata and preset configuration"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Template Name"
            value={newTemplateName}
            onChange={(e) => setNewTemplateName(e.target.value)}
            placeholder="e.g. Modern Retail Receipt"
            required
          />

          <div>
            <label className="text-xs font-semibold text-[var(--foreground)] tracking-wide block mb-1.5">
              Document Type
            </label>
            <select
              value={newTemplateType}
              onChange={(e) => setNewTemplateType(e.target.value as any)}
              className="w-full px-3 py-2 text-sm rounded-md bg-[var(--surface)] text-[var(--foreground)] border border-[var(--border)] focus:outline-none"
            >
              <option value="receipt">Receipt</option>
              <option value="invoice">Invoice</option>
              <option value="general">General Report</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-[var(--foreground)] tracking-wide block mb-1.5">
              Description
            </label>
            <textarea
              rows={3}
              value={newTemplateDesc}
              onChange={(e) => setNewTemplateDesc(e.target.value)}
              placeholder="Intended for B2B contracts, retail POS, or statements..."
              className="w-full px-3 py-2 text-xs rounded-md bg-[var(--surface)] text-[var(--foreground)] border border-[var(--border)] focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="default" isLoading={isSubmitting}>
              Create Template
            </Button>
          </div>
        </form>
      </Modal>

      {/* Import JSON Template Modal */}
      <Modal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        title="Import Template Schema (JSON)"
        description="Paste a template JSON specification exported from another workspace or Docora instance"
      >
        <form onSubmit={handleImportSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-[var(--foreground)] tracking-wide block mb-1.5">
              Paste Template JSON
            </label>
            <textarea
              rows={8}
              value={importJsonText}
              onChange={(e) => setImportJsonText(e.target.value)}
              placeholder={`{\n  "template": {\n    "name": "Custom Corporate Invoice",\n    "documentType": "invoice",\n    "description": "High contrast invoice with corporate signature",\n    "templateContent": { "layout": "corporate" }\n  }\n}`}
              className="w-full p-3 font-mono text-xs rounded-md bg-[var(--surface-secondary)] text-[var(--foreground)] border border-[var(--border)] focus:outline-none"
              required
            />
          </div>

          {importError && (
            <div className="p-3 rounded-lg border border-red-500/30 bg-red-500/10 text-red-500 text-xs">
              {importError}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setIsImportOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="default" isLoading={isImporting}>
              {isImporting ? 'Importing...' : 'Import Template'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
