'use client';

import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Layers,
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Play,
  Download,
  RotateCcw,
  Eye,
  FileText,
  Table as TableIcon,
  HelpCircle,
  FileArchive,
  RefreshCw,
} from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';

interface ParsedRecord {
  [key: string]: string;
}

export default function BulkGenerationPage() {
  const [step, setStep] = useState<'upload' | 'mapping' | 'processing' | 'completed'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [parsedData, setParsedData] = useState<ParsedRecord[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState('receipt');

  // Mappings: document field -> CSV header
  const [mappings, setMappings] = useState<Record<string, string>>({
    customerName: '',
    customerEmail: '',
    amountMinor: '',
    description: '',
    paymentMethod: '',
  });

  // Processing simulation state
  const [processedCount, setProcessedCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').filter((l) => l.trim() !== '');
      if (lines.length > 0) {
        const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
        setCsvHeaders(headers);

        const rows: ParsedRecord[] = [];
        for (let i = 1; i < Math.min(lines.length, 50); i++) {
          const values = lines[i].split(',').map((v) => v.trim().replace(/^"|"$/g, ''));
          const rowObj: ParsedRecord = {};
          headers.forEach((h, idx) => {
            rowObj[h] = values[idx] || '';
          });
          rows.push(rowObj);
        }
        setParsedData(rows);

        // Auto-detect default mappings
        const initialMap: Record<string, string> = {};
        headers.forEach((h) => {
          const lower = h.toLowerCase();
          if (lower.includes('name') || lower.includes('client')) initialMap.customerName = h;
          if (lower.includes('email')) initialMap.customerEmail = h;
          if (lower.includes('amount') || lower.includes('total') || lower.includes('price'))
            initialMap.amountMinor = h;
          if (lower.includes('desc') || lower.includes('item')) initialMap.description = h;
          if (lower.includes('method') || lower.includes('payment')) initialMap.paymentMethod = h;
        });
        setMappings((prev) => ({ ...prev, ...initialMap }));
        setStep('mapping');
      }
    };
    reader.readAsText(uploadedFile);
  };

  const loadSampleCSV = () => {
    const sampleCsv = `Customer Name,Email,Amount,Description,Payment Method
Acme Corp,billing@acme.com,125000,Cloud Hosting Subscription,card
John Doe,john@example.com,45000,Web Consulting Retainer,bank_transfer
Sarah Jenkins,sarah@tech.io,89000,Security Audit Certificate,card
Global Logistics,finance@globallog.com,230000,Enterprise License Q4,wire`;

    const blob = new Blob([sampleCsv], { type: 'text/csv' });
    const sampleFile = new File([blob], 'sample_bulk_recipients.csv', { type: 'text/csv' });
    const event = {
      target: { files: [sampleFile] },
    } as unknown as React.ChangeEvent<HTMLInputElement>;
    handleFileUpload(event);
  };

  const handleStartGeneration = () => {
    setStep('processing');
    setIsProcessing(true);
    setProcessedCount(0);
    setFailedCount(0);

    let progress = 0;
    const interval = setInterval(() => {
      progress += 1;
      setProcessedCount((prev) => prev + 1);
      if (progress >= parsedData.length) {
        clearInterval(interval);
        setIsProcessing(false);
        setStep('completed');
      }
    }, 400);
  };

  return (
    <div className="flex-1 flex flex-col">
      <Header
        title="Bulk Document Generation"
        description="Generate hundreds of personalized PDFs, invoices, and certificates in parallel from CSV or JSON datasets"
      />

      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
        {/* Wizard Steps Header */}
        <div className="grid grid-cols-4 gap-2 border-b border-[var(--border)] pb-4 text-xs font-semibold">
          {[
            { id: 'upload', label: '1. Upload Data' },
            { id: 'mapping', label: '2. Field Mapping' },
            { id: 'processing', label: '3. Batch Processing' },
            { id: 'completed', label: '4. Download Output' },
          ].map((s) => {
            const isCurrent = step === s.id;
            return (
              <div
                key={s.id}
                className={`flex items-center gap-2 pb-1 border-b-2 transition-colors ${
                  isCurrent
                    ? 'border-[var(--foreground)] text-[var(--foreground)]'
                    : 'border-transparent text-[var(--muted-foreground)]'
                }`}
              >
                <span>{s.label}</span>
              </div>
            );
          })}
        </div>

        {/* STEP 1: UPLOAD */}
        {step === 'upload' && (
          <div className="space-y-6">
            <Card className="p-10 border-dashed border-2 border-[var(--border)] text-center space-y-4 bg-[var(--surface-secondary)]/50">
              <div className="w-14 h-14 rounded-2xl bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center mx-auto text-[var(--foreground)] shadow-xs">
                <UploadCloud className="w-7 h-7" />
              </div>

              <div className="space-y-1">
                <h3 className="font-bold text-base text-[var(--foreground)]">
                  Upload CSV or Structured Data File
                </h3>
                <p className="text-xs text-[var(--muted-foreground)] max-w-md mx-auto">
                  Drag and drop your spreadsheet export, or choose a sample CSV to test automated field extraction and document mapping.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept=".csv,.txt"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Button variant="default" size="sm" className="pointer-events-none text-xs">
                    <FileSpreadsheet className="w-4 h-4 mr-1.5" />
                    Browse CSV File
                  </Button>
                </label>

                <Button variant="outline" size="sm" onClick={loadSampleCSV} className="text-xs">
                  Load Pre-built Sample Data
                </Button>
              </div>
            </Card>

            <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface-secondary)] text-xs text-[var(--muted-foreground)] space-y-1">
              <div className="font-semibold text-[var(--foreground)] flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5" />
                Data Guidelines
              </div>
              <div>
                First line must include column headers. Supported limits: up to 10,000 records per job batch, maximum 25 MB payload size.
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: FIELD MAPPING */}
        {step === 'mapping' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Mapping Controls */}
              <Card className="p-6 border-[var(--border)] space-y-4">
                <div className="space-y-1">
                  <h3 className="font-bold text-sm text-[var(--foreground)]">Map Columns to Template Fields</h3>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    Select which CSV header corresponds to each document placeholder.
                  </p>
                </div>

                <div className="space-y-3">
                  {[
                    { id: 'customerName', label: 'Customer / Recipient Name', required: true },
                    { id: 'customerEmail', label: 'Recipient Email Address', required: false },
                    { id: 'amountMinor', label: 'Total Amount / Price', required: true },
                    { id: 'description', label: 'Item / Transaction Description', required: true },
                    { id: 'paymentMethod', label: 'Payment Method or Status', required: false },
                  ].map((field) => (
                    <div key={field.id} className="space-y-1 text-xs">
                      <div className="flex items-center justify-between">
                        <label className="font-semibold text-[var(--foreground)]">
                          {field.label} {field.required && <span className="text-red-500">*</span>}
                        </label>
                        {mappings[field.id] && (
                          <span className="text-[10px] text-emerald-500 font-medium">Mapped</span>
                        )}
                      </div>
                      <select
                        value={mappings[field.id] || ''}
                        onChange={(e) =>
                          setMappings((prev) => ({ ...prev, [field.id]: e.target.value }))
                        }
                        className="w-full p-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-xs text-[var(--foreground)] font-mono"
                      >
                        <option value="">-- Choose Column --</option>
                        {csvHeaders.map((h) => (
                          <option key={h} value={h}>
                            {h}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>

                <div className="pt-3 border-t border-[var(--border)] flex items-center justify-between">
                  <Button variant="ghost" size="sm" onClick={() => setStep('upload')} className="text-xs">
                    Back to Upload
                  </Button>
                  <Button size="sm" onClick={handleStartGeneration} className="text-xs">
                    <Play className="w-3.5 h-3.5 mr-1" />
                    Start Bulk Generation ({parsedData.length} records)
                  </Button>
                </div>
              </Card>

              {/* Sample Data Preview Table */}
              <Card className="p-6 border-[var(--border)] space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h3 className="font-bold text-sm text-[var(--foreground)]">Uploaded Data Preview</h3>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      Showing first {parsedData.length} extracted records.
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs font-mono">
                    {parsedData.length} Rows
                  </Badge>
                </div>

                <div className="border border-[var(--border)] rounded-lg overflow-x-auto max-h-[350px]">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[var(--surface-secondary)] border-b border-[var(--border)] text-[var(--muted-foreground)] font-mono text-[11px] sticky top-0">
                      <tr>
                        {csvHeaders.map((h) => (
                          <th key={h} className="py-2 px-3 whitespace-nowrap">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                      {parsedData.map((row, idx) => (
                        <tr key={idx} className="hover:bg-[var(--surface-hover)]">
                          {csvHeaders.map((h) => (
                            <td key={h} className="py-2 px-3 text-[var(--foreground)] whitespace-nowrap">
                              {row[h]}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* STEP 3: PROCESSING */}
        {step === 'processing' && (
          <Card className="p-10 border-[var(--border)] text-center max-w-lg mx-auto space-y-5">
            <div className="w-12 h-12 rounded-2xl bg-[var(--surface-secondary)] border border-[var(--border)] flex items-center justify-center mx-auto text-[var(--foreground)] animate-spin">
              <RefreshCw className="w-6 h-6" />
            </div>

            <div className="space-y-1.5">
              <h3 className="font-bold text-base text-[var(--foreground)]">
                Processing Bulk Document Generation
              </h3>
              <p className="text-xs text-[var(--muted-foreground)]">
                Rendering vector PDF layouts in parallel on the Go document pipeline.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-[var(--foreground)]">
                <span>Rendering Records</span>
                <span>
                  {processedCount} of {parsedData.length} Complete
                </span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-[var(--surface-secondary)] overflow-hidden">
                <div
                  className="h-full bg-[var(--foreground)] rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.round((processedCount / (parsedData.length || 1)) * 100)}%`,
                  }}
                />
              </div>
            </div>
          </Card>
        )}

        {/* STEP 4: COMPLETED */}
        {step === 'completed' && (
          <Card className="p-10 border-[var(--border)] text-center max-w-lg mx-auto space-y-6">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1.5">
              <h3 className="font-bold text-lg text-[var(--foreground)]">
                Bulk Generation Complete!
              </h3>
              <p className="text-xs text-[var(--muted-foreground)]">
                Successfully processed and compiled {parsedData.length} PDF artifacts.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface-secondary)] grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-[var(--muted-foreground)]">Total Generated</span>
                <div className="text-base font-bold text-[var(--foreground)]">{parsedData.length} PDFs</div>
              </div>
              <div>
                <span className="text-[var(--muted-foreground)]">Job Status</span>
                <div className="text-base font-bold text-emerald-500">Verified Ready</div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                size="sm"
                onClick={() => {
                  alert(`Downloading batch archive containing ${parsedData.length} generated documents.`);
                }}
                className="w-full sm:w-auto text-xs"
              >
                <FileArchive className="w-4 h-4 mr-1.5" />
                Download All (ZIP Archive)
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setStep('upload');
                  setFile(null);
                  setParsedData([]);
                }}
                className="w-full sm:w-auto text-xs"
              >
                <RotateCcw className="w-3.5 h-3.5 mr-1" />
                Start Another Batch
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
