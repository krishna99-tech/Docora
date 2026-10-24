'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Copy, Trash2, Palette, CheckCircle2, FileText, Check } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';
import { Template } from '@/types';

export default function TemplatesPage() {
  const [docTypeFilter, setDocTypeFilter] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateType, setNewTemplateType] = useState<'receipt' | 'invoice' | 'general'>('receipt');
  const [newTemplateDesc, setNewTemplateDesc] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: templates, isLoading, refetch } = useQuery({
    queryKey: ['templates-list', docTypeFilter],
    queryFn: () => api.listTemplates(docTypeFilter),
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
        description="Choose and configure high-contrast layouts for receipts, invoices, and general reports"
        action={{ label: 'New Template', onClick: () => setIsCreateOpen(true) }}
      />

      <div className="p-8 space-y-6 max-w-7xl">
        {/* Filter Bar */}
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            {['', 'receipt', 'invoice', 'general'].map((t) => (
              <button
                key={t}
                onClick={() => setDocTypeFilter(t)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer capitalize ${
                  docTypeFilter === t
                    ? 'bg-[var(--primary)] text-[var(--primary-foreground)]'
                    : 'bg-[var(--surface-secondary)] text-[var(--foreground)] border border-[var(--border)] hover:bg-[var(--surface-hover)]'
                }`}
              >
                {t === '' ? 'All Templates' : `${t}s`}
              </button>
            ))}
          </div>
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            <div className="col-span-full py-12 text-center text-xs text-[var(--muted-foreground)]">
              Loading templates...
            </div>
          ) : !templates || templates.length === 0 ? (
            <div className="col-span-full py-16 text-center">
              <Palette className="w-8 h-8 text-[var(--muted-foreground)] mx-auto mb-2" />
              <p className="font-semibold text-sm">No templates found</p>
            </div>
          ) : (
            templates.map((tmpl) => (
              <Card key={tmpl.id} className="flex flex-col justify-between h-64 border border-[var(--border)] shadow-xs">
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
                <div className="pt-4 border-t border-[var(--border)] flex items-center justify-between">
                  <span className="text-[11px] font-mono text-[var(--muted-foreground)]">
                    v{tmpl.version} {tmpl.userId ? '(Custom)' : '(System)'}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDuplicate(tmpl.id)}
                      title="Duplicate Template"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </Button>

                    {tmpl.userId && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(tmpl.id)}
                        title="Delete Custom Template"
                        className="text-red-500 hover:text-red-600"
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
    </div>
  );
}
