'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Plus,
  Trash2,
  Eye,
  Download,
  FileText,
  Table as TableIcon,
  AlignLeft,
  Heading,
  ListFilter,
  Edit3,
  Columns,
} from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { GeneralPDFSection } from '@/types';
import { PDFViewerModal } from '@/components/pdf/pdf-viewer-modal';
import { DocumentPreviewContainer } from '@/components/preview/document-preview-container';
import { GeneralDocPreview } from '@/components/preview/general-doc-preview';

export default function GeneralPDFGeneratorPage() {
  const [title, setTitle] = useState('Executive Business Summary');
  const [subtitle, setSubtitle] = useState('Confidential Report & Operational Metrics');
  const [pageSize, setPageSize] = useState('A4');
  const [orientation, setOrientation] = useState('portrait');
  const [margin, setMargin] = useState('normal');
  const [includeHeader, setIncludeHeader] = useState(true);
  const [includeFooter, setIncludeFooter] = useState(true);
  const [includePageNumbers, setIncludePageNumbers] = useState(true);
  const [viewMode, setViewMode] = useState<'editor' | 'preview' | 'split'>('split');

  const [sections, setSections] = useState<GeneralPDFSection[]>([
    {
      type: 'heading',
      title: '1. Executive Overview',
    },
    {
      type: 'paragraph',
      content:
        'This document provides an official business summary generated automatically by the Docora platform. All figures and operational milestones recorded herein adhere to verified accounting and compliance standards.',
    },
    {
      type: 'heading',
      title: '2. Key Performance Indicators',
    },
    {
      type: 'key_value',
      pairs: [
        { key: 'Reporting Period', value: 'Q4 Fiscal 2026' },
        { key: 'Audited Status', value: 'Verified Complete' },
        { key: 'Operating Margin', value: '38.4%' },
        { key: 'Customer Retention', value: '96.2%' },
      ],
    },
    {
      type: 'heading',
      title: '3. Milestone Deliverables',
    },
    {
      type: 'table',
      headers: ['Phase', 'Deliverable Target', 'Status', 'Owner'],
      rows: [
        ['Phase 1', 'Infrastructure & Containerization', 'Completed', 'DevOps Team'],
        ['Phase 2', 'Financial Calculation Engine', 'Completed', 'Core Backend'],
        ['Phase 3', 'Document Layout & PDF Engine', 'Completed', 'Platform Team'],
      ],
    },
  ]);

  const [isGenerating, setIsGenerating] = useState(false);
  const [createdDocId, setCreatedDocId] = useState<string | null>(null);
  const [createdDocNumber, setCreatedDocNumber] = useState<string>('');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: businessProfile } = useQuery({
    queryKey: ['business-profile'],
    queryFn: () => api.getBusinessProfile(),
  });

  const addSection = (type: GeneralPDFSection['type']) => {
    switch (type) {
      case 'heading':
        setSections([...sections, { type: 'heading', title: 'New Section Heading' }]);
        break;
      case 'paragraph':
        setSections([...sections, { type: 'paragraph', content: 'Enter your detailed paragraph text here...' }]);
        break;
      case 'table':
        setSections([
          ...sections,
          {
            type: 'table',
            headers: ['Column 1', 'Column 2', 'Column 3'],
            rows: [['Data 1', 'Data 2', 'Data 3']],
          },
        ]);
        break;
      case 'key_value':
        setSections([
          ...sections,
          {
            type: 'key_value',
            pairs: [
              { key: 'Item Label', value: 'Item Value' },
              { key: 'Another Key', value: 'Another Value' },
            ],
          },
        ]);
        break;
      case 'divider':
        setSections([...sections, { type: 'divider' }]);
        break;
      case 'spacer':
        setSections([...sections, { type: 'spacer' }]);
        break;
    }
  };

  const removeSection = (idx: number) => {
    setSections(sections.filter((_, i) => i !== idx));
  };

  const updateSectionField = (idx: number, field: string, val: any) => {
    const updated = [...sections];
    (updated[idx] as any)[field] = val;
    setSections(updated);
  };

  const handleGenerate = async (openPreviewImmediately: boolean) => {
    setError(null);
    if (!title.trim()) {
      setError('Please provide a document title');
      return;
    }

    setIsGenerating(true);

    try {
      const doc = await api.createGeneralPdf({
        title,
        subtitle,
        pageSize,
        orientation,
        margin,
        includeHeader,
        includeFooter,
        includePageNumbers,
        sections,
      });

      setCreatedDocId(doc.id);
      setCreatedDocNumber(doc.documentNumber);

      if (openPreviewImmediately) {
        setIsPreviewOpen(true);
      } else {
        await api.downloadDocument(doc.id, `${doc.documentNumber}.pdf`);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to generate PDF document');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <Header
        title="PDF Generator"
        description="Design and compile custom business PDFs, statements, and reports with live preview"
      />

      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
        {/* Top View Mode Switcher */}
        <div className="no-print flex items-center justify-between flex-wrap gap-2">
          <div className="text-xs text-[var(--muted-foreground)]">
            Design dynamic sections with real-time preview and instant print
          </div>

          <div className="flex items-center gap-1 bg-[var(--surface-secondary)] p-1 rounded-lg border border-[var(--border)] text-xs">
            <button
              type="button"
              onClick={() => setViewMode('editor')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold transition-all ${
                viewMode === 'editor'
                  ? 'bg-[var(--primary)] text-[var(--primary-foreground)] shadow-xs'
                  : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              Editor
            </button>
            <button
              type="button"
              onClick={() => setViewMode('preview')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold transition-all ${
                viewMode === 'preview'
                  ? 'bg-[var(--primary)] text-[var(--primary-foreground)] shadow-xs'
                  : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              Live Preview
            </button>
            <button
              type="button"
              onClick={() => setViewMode('split')}
              className={`hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold transition-all ${
                viewMode === 'split'
                  ? 'bg-[var(--primary)] text-[var(--primary-foreground)] shadow-xs'
                  : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
              Split View
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 text-xs bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg">
            {error}
          </div>
        )}

        <div className={viewMode === 'split' ? 'grid grid-cols-1 lg:grid-cols-12 gap-6 items-start' : 'space-y-6'}>
          {/* Editor Column */}
          {(viewMode === 'editor' || viewMode === 'split') && (
            <div className={viewMode === 'split' ? 'lg:col-span-6 xl:col-span-5 space-y-6' : 'max-w-4xl mx-auto space-y-6'}>
              {/* Page Setup Configuration */}
              <Card>
                <CardHeader>
                  <CardTitle>Page Dimensions & Layout</CardTitle>
                  <CardDescription>Configure standard paper sizes, orientations, and margins</CardDescription>
                </CardHeader>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Input
                      label="Document Title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Annual Audit Report"
                      required
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Input
                      label="Subtitle or Scope"
                      value={subtitle}
                      onChange={(e) => setSubtitle(e.target.value)}
                      placeholder="e.g. Operations & Finance"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-[var(--foreground)] tracking-wide block mb-1.5">
                      Page Size
                    </label>
                    <select
                      value={pageSize}
                      onChange={(e) => setPageSize(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-md bg-[var(--surface)] text-[var(--foreground)] border border-[var(--border)] focus:outline-none"
                    >
                      <option value="A4">A4 (Standard 210 x 297 mm)</option>
                      <option value="A5">A5 (Compact 148 x 210 mm)</option>
                      <option value="Letter">US Letter (8.5 x 11 in)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-[var(--foreground)] tracking-wide block mb-1.5">
                      Orientation
                    </label>
                    <select
                      value={orientation}
                      onChange={(e) => setOrientation(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-md bg-[var(--surface)] text-[var(--foreground)] border border-[var(--border)] focus:outline-none"
                    >
                      <option value="portrait">Portrait</option>
                      <option value="landscape">Landscape</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-[var(--foreground)] tracking-wide block mb-1.5">
                      Margin
                    </label>
                    <select
                      value={margin}
                      onChange={(e) => setMargin(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-md bg-[var(--surface)] text-[var(--foreground)] border border-[var(--border)] focus:outline-none"
                    >
                      <option value="normal">Normal (0.5 in)</option>
                      <option value="compact">Compact (0.3 in)</option>
                      <option value="wide">Wide (0.8 in)</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-4 pt-6">
                    <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                      <input
                        type="checkbox"
                        checked={includeHeader}
                        onChange={(e) => setIncludeHeader(e.target.checked)}
                        className="rounded border-[var(--border)]"
                      />
                      Header
                    </label>
                    <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                      <input
                        type="checkbox"
                        checked={includeFooter}
                        onChange={(e) => setIncludeFooter(e.target.checked)}
                        className="rounded border-[var(--border)]"
                      />
                      Footer
                    </label>
                    <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                      <input
                        type="checkbox"
                        checked={includePageNumbers}
                        onChange={(e) => setIncludePageNumbers(e.target.checked)}
                        className="rounded border-[var(--border)]"
                      />
                      Page Numbers
                    </label>
                  </div>
                </div>
              </Card>

              {/* Dynamic Content Builder */}
              <Card>
                <div className="flex items-center justify-between pb-3 border-b border-[var(--border)] mb-4">
                  <div>
                    <CardTitle>Document Sections</CardTitle>
                    <CardDescription>Assemble structured blocks of text, data, and tables</CardDescription>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    <Button size="sm" variant="outline" onClick={() => addSection('heading')} className="text-xs">
                      <Heading className="w-3.5 h-3.5 mr-1" />
                      Heading
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => addSection('paragraph')} className="text-xs">
                      <AlignLeft className="w-3.5 h-3.5 mr-1" />
                      Text
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => addSection('key_value')} className="text-xs">
                      <ListFilter className="w-3.5 h-3.5 mr-1" />
                      Key-Value
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => addSection('table')} className="text-xs">
                      <TableIcon className="w-3.5 h-3.5 mr-1" />
                      Table
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  {sections.map((sec, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-lg bg-[var(--surface-secondary)] border border-[var(--border)] space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
                          Section {idx + 1}: {sec.type.replace('_', ' ')}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeSection(idx)}
                          className="h-6 w-6 text-red-500 hover:text-red-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>

                      {sec.type === 'heading' && (
                        <Input
                          placeholder="Heading text"
                          value={sec.title || ''}
                          onChange={(e) => updateSectionField(idx, 'title', e.target.value)}
                        />
                      )}

                      {sec.type === 'paragraph' && (
                        <textarea
                          rows={3}
                          placeholder="Paragraph content..."
                          value={sec.content || ''}
                          onChange={(e) => updateSectionField(idx, 'content', e.target.value)}
                          className="w-full px-3 py-2 text-xs rounded-md bg-[var(--surface)] text-[var(--foreground)] border border-[var(--border)] focus:outline-none"
                        />
                      )}

                      {sec.type === 'key_value' && (
                        <div className="space-y-2">
                          <p className="text-[11px] text-[var(--muted-foreground)]">
                            Pairs (one line per pair in format: Label: Value)
                          </p>
                          <textarea
                            rows={3}
                            value={(sec.pairs || []).map((p) => `${p.key}: ${p.value}`).join('\n')}
                            onChange={(e) => {
                              const pairs = e.target.value
                                .split('\n')
                                .filter((l) => l.includes(':'))
                                .map((l) => {
                                  const [k, ...rest] = l.split(':');
                                  return { key: k.trim(), value: rest.join(':').trim() };
                                });
                              updateSectionField(idx, 'pairs', pairs);
                            }}
                            className="w-full px-3 py-2 text-xs font-mono rounded-md bg-[var(--surface)] text-[var(--foreground)] border border-[var(--border)] focus:outline-none"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </Card>

              {/* Generate Actions */}
              <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full sm:w-auto"
                  onClick={() => handleGenerate(true)}
                  isLoading={isGenerating}
                >
                  <Eye className="w-3.5 h-3.5 mr-1" />
                  Compile & Preview PDF
                </Button>

                <Button
                  type="button"
                  variant="default"
                  className="w-full sm:w-auto"
                  onClick={() => handleGenerate(false)}
                  isLoading={isGenerating}
                >
                  <Download className="w-3.5 h-3.5 mr-1" />
                  Download Generated PDF
                </Button>
              </div>
            </div>
          )}

          {/* Live Preview Column */}
          {(viewMode === 'preview' || viewMode === 'split') && (
            <div className={viewMode === 'split' ? 'lg:col-span-6 xl:col-span-7 sticky top-4 self-start' : 'max-w-4xl mx-auto w-full'}>
              <DocumentPreviewContainer
                title="Live Document Preview"
                documentNumber={createdDocNumber || 'DRAFT'}
                documentId={createdDocId || undefined}
              >
                <GeneralDocPreview
                  title={title}
                  subtitle={subtitle}
                  pageSize={pageSize}
                  orientation={orientation}
                  margin={margin}
                  includeHeader={includeHeader}
                  includeFooter={includeFooter}
                  includePageNumbers={includePageNumbers}
                  sections={sections}
                  business={businessProfile}
                  documentNumber={createdDocNumber || 'DOC-DRAFT'}
                />
              </DocumentPreviewContainer>
            </div>
          )}
        </div>
      </div>

      <PDFViewerModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        documentId={createdDocId}
        documentNumber={createdDocNumber}
        documentType="general"
        isDraft={false}
      />
    </div>
  );
}
