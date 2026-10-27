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
  Printer,
  ChevronUp,
  ChevronDown,
  X,
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

  const moveSection = (idx: number, direction: 'up' | 'down') => {
    if (direction === 'up' && idx === 0) return;
    if (direction === 'down' && idx === sections.length - 1) return;
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    const updated = [...sections];
    const temp = updated[idx];
    updated[idx] = updated[targetIdx];
    updated[targetIdx] = temp;
    setSections(updated);
  };

  const updateSectionField = (idx: number, field: string, val: any) => {
    const updated = [...sections];
    (updated[idx] as any)[field] = val;
    setSections(updated);
  };

  // Table manipulation helpers
  const updateTableHeader = (sectionIdx: number, headerIdx: number, value: string) => {
    const updated = [...sections];
    const sec = { ...updated[sectionIdx] };
    const headers = [...(sec.headers || [])];
    headers[headerIdx] = value;
    sec.headers = headers;
    updated[sectionIdx] = sec;
    setSections(updated);
  };

  const addTableColumn = (sectionIdx: number) => {
    const updated = [...sections];
    const sec = { ...updated[sectionIdx] };
    const headers = [...(sec.headers || [])];
    const newColName = `Col ${headers.length + 1}`;
    headers.push(newColName);
    sec.headers = headers;
    sec.rows = (sec.rows || []).map((row) => [...row, '']);
    updated[sectionIdx] = sec;
    setSections(updated);
  };

  const removeTableColumn = (sectionIdx: number, headerIdx: number) => {
    const updated = [...sections];
    const sec = { ...updated[sectionIdx] };
    if ((sec.headers || []).length <= 1) return;
    sec.headers = (sec.headers || []).filter((_, i) => i !== headerIdx);
    sec.rows = (sec.rows || []).map((row) => row.filter((_, i) => i !== headerIdx));
    updated[sectionIdx] = sec;
    setSections(updated);
  };

  const updateTableCell = (sectionIdx: number, rowIdx: number, colIdx: number, value: string) => {
    const updated = [...sections];
    const sec = { ...updated[sectionIdx] };
    const rows = (sec.rows || []).map((r) => [...r]);
    if (!rows[rowIdx]) {
      rows[rowIdx] = Array((sec.headers || []).length).fill('');
    }
    rows[rowIdx][colIdx] = value;
    sec.rows = rows;
    updated[sectionIdx] = sec;
    setSections(updated);
  };

  const addTableRow = (sectionIdx: number) => {
    const updated = [...sections];
    const sec = { ...updated[sectionIdx] };
    const colCount = (sec.headers || []).length || 1;
    const newRow = Array(colCount).fill('');
    sec.rows = [...(sec.rows || []), newRow];
    updated[sectionIdx] = sec;
    setSections(updated);
  };

  const removeTableRow = (sectionIdx: number, rowIdx: number) => {
    const updated = [...sections];
    const sec = { ...updated[sectionIdx] };
    sec.rows = (sec.rows || []).filter((_, i) => i !== rowIdx);
    updated[sectionIdx] = sec;
    setSections(updated);
  };

  // Key-Value manipulation helpers
  const addKeyValuePair = (sectionIdx: number) => {
    const updated = [...sections];
    const sec = { ...updated[sectionIdx] };
    sec.pairs = [...(sec.pairs || []), { key: '', value: '' }];
    updated[sectionIdx] = sec;
    setSections(updated);
  };

  const updateKeyValuePair = (sectionIdx: number, pairIdx: number, field: 'key' | 'value', val: string) => {
    const updated = [...sections];
    const sec = { ...updated[sectionIdx] };
    const pairs = (sec.pairs || []).map((p) => ({ ...p }));
    if (pairs[pairIdx]) {
      pairs[pairIdx][field] = val;
    }
    sec.pairs = pairs;
    updated[sectionIdx] = sec;
    setSections(updated);
  };

  const removeKeyValuePair = (sectionIdx: number, pairIdx: number) => {
    const updated = [...sections];
    const sec = { ...updated[sectionIdx] };
    sec.pairs = (sec.pairs || []).filter((_, i) => i !== pairIdx);
    updated[sectionIdx] = sec;
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
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
                            Section {idx + 1}: {sec.type.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            disabled={idx === 0}
                            onClick={() => moveSection(idx, 'up')}
                            className="h-6 w-6 text-[var(--muted-foreground)] hover:text-[var(--foreground)] disabled:opacity-30"
                            title="Move section up"
                          >
                            <ChevronUp className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            disabled={idx === sections.length - 1}
                            onClick={() => moveSection(idx, 'down')}
                            className="h-6 w-6 text-[var(--muted-foreground)] hover:text-[var(--foreground)] disabled:opacity-30"
                            title="Move section down"
                          >
                            <ChevronDown className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeSection(idx)}
                            className="h-6 w-6 text-red-500 hover:text-red-600"
                            title="Delete section"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>

                      {sec.type === 'heading' && (
                        <div className="space-y-1">
                          <label className="text-[11px] font-medium text-[var(--muted-foreground)]">Heading Title</label>
                          <Input
                            placeholder="e.g. 1. Financial Performance"
                            value={sec.title || ''}
                            onChange={(e) => updateSectionField(idx, 'title', e.target.value)}
                          />
                        </div>
                      )}

                      {sec.type === 'paragraph' && (
                        <div className="space-y-1">
                          <label className="text-[11px] font-medium text-[var(--muted-foreground)]">Paragraph Content</label>
                          <textarea
                            rows={3}
                            placeholder="Enter detailed paragraph content..."
                            value={sec.content || ''}
                            onChange={(e) => updateSectionField(idx, 'content', e.target.value)}
                            className="w-full px-3 py-2 text-xs rounded-md bg-[var(--surface)] text-[var(--foreground)] border border-[var(--border)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                          />
                        </div>
                      )}

                      {sec.type === 'key_value' && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-medium text-[var(--muted-foreground)]">
                              Key-Value Pairs ({sec.pairs?.length || 0})
                            </span>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="h-6 text-[10px] px-2"
                              onClick={() => addKeyValuePair(idx)}
                            >
                              <Plus className="w-3 h-3 mr-1" />
                              Add Pair
                            </Button>
                          </div>

                          <div className="space-y-2">
                            {(sec.pairs || []).map((pair, pIdx) => (
                              <div key={pIdx} className="flex items-center gap-2">
                                <input
                                  type="text"
                                  className="w-1/3 px-2 py-1.5 text-xs rounded border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                                  placeholder="Key / Label"
                                  value={pair.key}
                                  onChange={(e) => updateKeyValuePair(idx, pIdx, 'key', e.target.value)}
                                />
                                <span className="text-xs text-[var(--muted-foreground)]">:</span>
                                <input
                                  type="text"
                                  className="flex-1 px-2 py-1.5 text-xs rounded border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                                  placeholder="Value"
                                  value={pair.value}
                                  onChange={(e) => updateKeyValuePair(idx, pIdx, 'value', e.target.value)}
                                />
                                {(sec.pairs || []).length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => removeKeyValuePair(idx, pIdx)}
                                    className="p-1 text-[var(--muted-foreground)] hover:text-red-500 rounded transition-colors"
                                    title="Remove pair"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {sec.type === 'table' && (
                        <div className="space-y-3">
                          {/* Column Headers Section */}
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-[11px] font-medium text-[var(--muted-foreground)]">
                              <span>Columns / Table Headers ({(sec.headers || []).length})</span>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="h-6 text-[10px] px-2"
                                onClick={() => addTableColumn(idx)}
                              >
                                <Plus className="w-3 h-3 mr-1" />
                                Add Column
                              </Button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {(sec.headers || []).map((h, hIdx) => (
                                <div
                                  key={hIdx}
                                  className="flex items-center gap-1.5 bg-[var(--surface)] border border-[var(--border)] rounded px-2.5 py-1 shadow-2xs"
                                >
                                  <input
                                    className="bg-transparent text-xs font-semibold focus:outline-none w-24 sm:w-28 text-[var(--foreground)]"
                                    value={h}
                                    onChange={(e) => updateTableHeader(idx, hIdx, e.target.value)}
                                    placeholder={`Col ${hIdx + 1}`}
                                  />
                                  {(sec.headers || []).length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() => removeTableColumn(idx, hIdx)}
                                      className="text-red-500 hover:text-red-700 hover:bg-red-500/10 p-0.5 rounded transition-colors ml-1"
                                      title={`Remove column "${h || `Col ${hIdx + 1}`}"`}
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Table Rows & Cells Section */}
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-[11px] font-medium text-[var(--muted-foreground)]">
                              <span>Rows Data ({(sec.rows || []).length} rows)</span>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="h-6 text-[10px] px-2"
                                onClick={() => addTableRow(idx)}
                              >
                                <Plus className="w-3 h-3 mr-1" />
                                Add Row
                              </Button>
                            </div>

                            <div className="overflow-x-auto rounded border border-[var(--border)] bg-[var(--surface)]">
                              <table className="w-full text-xs">
                                <thead>
                                  <tr className="border-b border-[var(--border)] bg-[var(--surface-secondary)]">
                                    {(sec.headers || []).map((h, hIdx) => (
                                      <th
                                        key={hIdx}
                                        className="py-2 px-2.5 text-left font-semibold text-[11px] text-[var(--muted-foreground)]"
                                      >
                                        <div className="flex items-center justify-between gap-1">
                                          <span className="truncate">{h || `Col ${hIdx + 1}`}</span>
                                          {(sec.headers || []).length > 1 && (
                                            <button
                                              type="button"
                                              onClick={() => removeTableColumn(idx, hIdx)}
                                              className="text-[var(--muted-foreground)] hover:text-red-500 p-0.5 rounded transition-colors"
                                              title={`Delete column "${h || `Col ${hIdx + 1}`}"`}
                                            >
                                              <X className="w-3 h-3" />
                                            </button>
                                          )}
                                        </div>
                                      </th>
                                    ))}
                                    <th className="py-2 px-2.5 w-10 text-center text-[10px] text-[var(--muted-foreground)] uppercase">
                                      Action
                                    </th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {(sec.rows || []).map((row, rIdx) => (
                                    <tr key={rIdx} className="border-b border-[var(--border)]/50 last:border-b-0 hover:bg-[var(--surface-secondary)]/40 transition-colors">
                                      {(sec.headers || []).map((_, cIdx) => (
                                        <td key={cIdx} className="p-1">
                                          <input
                                            type="text"
                                            className="w-full px-2 py-1 text-xs bg-transparent border border-transparent focus:border-[var(--primary)] focus:bg-[var(--surface)] rounded transition-all text-[var(--foreground)]"
                                            placeholder={`Row ${rIdx + 1}, Col ${cIdx + 1}`}
                                            value={row[cIdx] || ''}
                                            onChange={(e) => updateTableCell(idx, rIdx, cIdx, e.target.value)}
                                          />
                                        </td>
                                      ))}
                                      <td className="p-1 text-center">
                                        <button
                                          type="button"
                                          onClick={() => removeTableRow(idx, rIdx)}
                                          className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-500/10 rounded transition-colors"
                                          title={`Delete Row ${rIdx + 1}`}
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
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
                  onClick={() => window.print()}
                >
                  <Printer className="w-3.5 h-3.5 mr-1" />
                  Direct Print
                </Button>

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
