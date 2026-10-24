'use client';

import React, { useState, useEffect } from 'react';
import {
  Wrench,
  Files,
  Minimize2,
  RotateCw,
  Stamp,
  Hash,
  Images,
  Info,
  Upload,
  Download,
  CheckCircle2,
  AlertCircle,
  Clock,
  Trash2,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type ToolType = 'merge' | 'compress' | 'rotate' | 'watermark' | 'page-numbers' | 'images-to-pdf' | 'metadata';

interface ToolConfig {
  id: ToolType;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const TOOLS: ToolConfig[] = [
  { id: 'merge', title: 'Merge PDFs', description: 'Combine multiple PDF documents into a single organized file.', icon: Files },
  { id: 'compress', title: 'Compress PDF', description: 'Optimize PDF file size while maintaining visual clarity.', icon: Minimize2 },
  { id: 'rotate', title: 'Rotate Pages', description: 'Rotate entire PDF or selected pages by 90°, 180°, or 270°.', icon: RotateCw },
  { id: 'watermark', title: 'Add Watermark', description: 'Apply a custom text watermark across document pages.', icon: Stamp },
  { id: 'page-numbers', title: 'Add Page Numbers', description: 'Insert sequential page numbers with custom positioning.', icon: Hash },
  { id: 'images-to-pdf', title: 'Images to PDF', description: 'Convert PNG, JPEG, and WebP images into a crisp PDF.', icon: Images },
  { id: 'metadata', title: 'PDF Metadata', description: 'Inspect page count, dimensions, creator, and security details.', icon: Info },
];

export default function PDFToolsPage() {
  const [activeTool, setActiveTool] = useState<ToolType>('merge');
  const [files, setFiles] = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultBlobUrl, setResultBlobUrl] = useState<string | null>(null);
  const [metadataInfo, setMetadataInfo] = useState<any | null>(null);
  const [resultFileName, setResultFileName] = useState<string>('processed.pdf');

  // Tool specific options
  const [watermarkText, setWatermarkText] = useState('CONFIDENTIAL');
  const [watermarkOpacity, setWatermarkOpacity] = useState('0.3');
  const [rotationAngle, setRotationAngle] = useState('90');
  const [pageNumbersPos, setPageNumbersPos] = useState('bottom-right');

  // Job history
  const [recentJobs, setRecentJobs] = useState<any[]>([]);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = () => {
    fetch('/api/v1/pdf-tools/jobs')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data)) setRecentJobs(data);
      })
      .catch(() => {});
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
      setError(null);
      setResultBlobUrl(null);
      setMetadataInfo(null);
    }
  };

  const handleProcess = async () => {
    if (files.length === 0) {
      setError('Please select at least one file');
      return;
    }

    setProcessing(true);
    setError(null);
    setResultBlobUrl(null);
    setMetadataInfo(null);

    const formData = new FormData();

    try {
      let endpoint = '';
      if (activeTool === 'merge') {
        if (files.length < 2) {
          throw new Error('Merge requires at least 2 PDF files');
        }
        files.forEach((f) => formData.append('files', f));
        endpoint = '/api/v1/pdf-tools/merge?download=true';
      } else if (activeTool === 'compress') {
        formData.append('file', files[0]);
        endpoint = '/api/v1/pdf-tools/compress?download=true';
      } else if (activeTool === 'rotate') {
        formData.append('file', files[0]);
        formData.append('angle', rotationAngle);
        endpoint = '/api/v1/pdf-tools/rotate';
      } else if (activeTool === 'watermark') {
        formData.append('file', files[0]);
        formData.append('text', watermarkText);
        formData.append('opacity', watermarkOpacity);
        endpoint = '/api/v1/pdf-tools/watermark';
      } else if (activeTool === 'page-numbers') {
        formData.append('file', files[0]);
        formData.append('position', pageNumbersPos);
        endpoint = '/api/v1/pdf-tools/page-numbers';
      } else if (activeTool === 'images-to-pdf') {
        files.forEach((f) => formData.append('images', f));
        endpoint = '/api/v1/pdf-tools/images-to-pdf';
      } else if (activeTool === 'metadata') {
        formData.append('file', files[0]);
        endpoint = '/api/v1/pdf-tools/metadata';
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Operation failed on server');
      }

      if (activeTool === 'metadata') {
        const meta = await res.json();
        setMetadataInfo(meta);
      } else {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        setResultBlobUrl(url);
        setResultFileName(`${activeTool}_${Date.now()}.pdf`);
      }

      fetchJobs();
    } catch (err: any) {
      setError(err.message || 'Processing failed');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 py-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border)]">
        <div>
          <div className="flex items-center gap-2">
            <Wrench className="w-5 h-5 text-[var(--foreground)]" />
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">PDF Utilities</h1>
          </div>
          <p className="text-xs sm:text-sm text-[var(--muted-foreground)] mt-1">
            Professional PDF manipulation and processing tools powered by Go.
          </p>
        </div>
      </div>

      {/* Tool Selector Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
        {TOOLS.map((t) => {
          const Icon = t.icon;
          const isActive = activeTool === t.id;
          return (
            <button
              key={t.id}
              onClick={() => {
                setActiveTool(t.id);
                setFiles([]);
                setError(null);
                setResultBlobUrl(null);
                setMetadataInfo(null);
              }}
              className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                isActive
                  ? 'bg-[var(--primary)] text-[var(--primary-foreground)] border-[var(--primary)] shadow-sm'
                  : 'bg-[var(--card)] hover:bg-[var(--surface-hover)] border-[var(--border)] text-[var(--foreground)]'
              }`}
            >
              <Icon className="w-5 h-5 mb-2" />
              <span className="text-xs font-semibold tracking-tight">{t.title}</span>
            </button>
          );
        })}
      </div>

      {/* Main Processing Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Tool Options & File Uploader */}
        <div className="lg:col-span-2 space-y-5">
          <div className="border border-[var(--border)] rounded-2xl bg-[var(--card)] p-5 sm:p-6 shadow-sm">
            <div className="mb-4">
              <h2 className="text-base font-bold text-[var(--foreground)]">
                {TOOLS.find((t) => t.id === activeTool)?.title}
              </h2>
              <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                {TOOLS.find((t) => t.id === activeTool)?.description}
              </p>
            </div>

            {/* Tool specific configurations */}
            {activeTool === 'watermark' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5 p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
                <div>
                  <label className="text-xs font-semibold block mb-1">Watermark Text</label>
                  <Input
                    value={watermarkText}
                    onChange={(e) => setWatermarkText(e.target.value)}
                    placeholder="e.g. CONFIDENTIAL, DRAFT"
                    className="h-9 text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold block mb-1">Opacity</label>
                  <select
                    value={watermarkOpacity}
                    onChange={(e) => setWatermarkOpacity(e.target.value)}
                    className="w-full h-9 rounded-md border border-[var(--input)] bg-[var(--background)] px-3 text-xs"
                  >
                    <option value="0.15">15% Subtle</option>
                    <option value="0.3">30% Standard</option>
                    <option value="0.5">50% Prominent</option>
                    <option value="0.7">70% Opaque</option>
                  </select>
                </div>
              </div>
            )}

            {activeTool === 'rotate' && (
              <div className="mb-5 p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
                <label className="text-xs font-semibold block mb-1.5">Clockwise Rotation Angle</label>
                <div className="grid grid-cols-3 gap-2">
                  {['90', '180', '270'].map((deg) => (
                    <button
                      key={deg}
                      type="button"
                      onClick={() => setRotationAngle(deg)}
                      className={`py-2 text-xs font-semibold rounded-lg border transition-colors ${
                        rotationAngle === deg
                          ? 'bg-[var(--primary)] text-[var(--primary-foreground)] border-[var(--primary)]'
                          : 'bg-[var(--background)] border-[var(--border)] hover:bg-[var(--surface-hover)]'
                      }`}
                    >
                      {deg}° Clockwise
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activeTool === 'page-numbers' && (
              <div className="mb-5 p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
                <label className="text-xs font-semibold block mb-1.5">Page Number Placement</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'bottom-right', label: 'Bottom Right' },
                    { id: 'bottom-center', label: 'Bottom Center' },
                    { id: 'top-right', label: 'Top Right' },
                  ].map((pos) => (
                    <button
                      key={pos.id}
                      type="button"
                      onClick={() => setPageNumbersPos(pos.id)}
                      className={`py-2 text-xs font-semibold rounded-lg border transition-colors ${
                        pageNumbersPos === pos.id
                          ? 'bg-[var(--primary)] text-[var(--primary-foreground)] border-[var(--primary)]'
                          : 'bg-[var(--background)] border-[var(--border)] hover:bg-[var(--surface-hover)]'
                      }`}
                    >
                      {pos.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Drag & Drop Upload Zone */}
            <div className="border-2 border-dashed border-[var(--border)] hover:border-[var(--primary)] rounded-xl p-6 sm:p-8 text-center transition-colors">
              <Upload className="w-8 h-8 text-[var(--muted-foreground)] mx-auto mb-2" />
              <div className="text-sm font-semibold text-[var(--foreground)]">
                {activeTool === 'images-to-pdf'
                  ? 'Select PNG, JPEG, or WebP images'
                  : activeTool === 'merge'
                  ? 'Select multiple PDF files to combine'
                  : 'Select a PDF document'}
              </div>
              <p className="text-xs text-[var(--muted-foreground)] mt-1 mb-4">
                Drag and drop files here or browse from your device
              </p>

              <label className="inline-flex items-center gap-2 cursor-pointer bg-[var(--surface)] hover:bg-[var(--surface-hover)] border border-[var(--border)] px-4 py-2 rounded-lg text-xs font-semibold transition-colors">
                <span>Choose Files</span>
                <input
                  type="file"
                  multiple={activeTool === 'merge' || activeTool === 'images-to-pdf'}
                  accept={activeTool === 'images-to-pdf' ? 'image/png,image/jpeg,image/webp' : 'application/pdf'}
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>

              {files.length > 0 && (
                <div className="mt-4 pt-4 border-t border-[var(--border)] text-left">
                  <div className="text-xs font-semibold text-[var(--muted-foreground)] mb-2">
                    Selected Files ({files.length}):
                  </div>
                  <ul className="space-y-1.5 text-xs">
                    {files.map((f, i) => (
                      <li
                        key={i}
                        className="flex items-center justify-between p-2 rounded bg-[var(--surface)] text-[var(--foreground)]"
                      >
                        <span className="truncate max-w-[280px] sm:max-w-md">{f.name}</span>
                        <span className="text-[11px] text-[var(--muted-foreground)] font-mono">
                          {(f.size / 1024).toFixed(1)} KB
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {error && (
              <div className="mt-4 p-3 rounded-lg bg-red-950/20 border border-red-900/50 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="mt-5 flex justify-end">
              <Button
                onClick={handleProcess}
                disabled={processing || files.length === 0}
                className="bg-[var(--primary)] text-[var(--primary-foreground)] text-xs font-semibold px-6"
              >
                {processing ? 'Processing...' : 'Run Operation'} <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </div>
          </div>

          {/* Result Output Area */}
          {(resultBlobUrl || metadataInfo) && (
            <div className="border border-[var(--border)] rounded-2xl bg-[var(--card)] p-5 sm:p-6 shadow-sm">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-[var(--border)]">
                <div className="flex items-center gap-2 text-sm font-bold text-emerald-500">
                  <CheckCircle2 className="w-4 h-4" /> Operation Completed
                </div>
                {resultBlobUrl && (
                  <a
                    href={resultBlobUrl}
                    download={resultFileName}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)]"
                  >
                    <Download className="w-3.5 h-3.5" /> Download Result
                  </a>
                )}
              </div>

              {metadataInfo && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-mono">
                  <div className="p-3 rounded-lg bg-[var(--surface)] border border-[var(--border)]">
                    <span className="text-neutral-500 block text-[10px] uppercase">Page Count</span>
                    <span className="font-bold text-sm">{metadataInfo.pageCount}</span>
                  </div>
                  <div className="p-3 rounded-lg bg-[var(--surface)] border border-[var(--border)]">
                    <span className="text-neutral-500 block text-[10px] uppercase">PDF Version</span>
                    <span className="font-bold text-sm">{metadataInfo.pdfVersion || '1.7'}</span>
                  </div>
                  <div className="p-3 rounded-lg bg-[var(--surface)] border border-[var(--border)]">
                    <span className="text-neutral-500 block text-[10px] uppercase">File Size</span>
                    <span className="font-bold text-sm">{(metadataInfo.fileSize / 1024).toFixed(1)} KB</span>
                  </div>
                  <div className="p-3 rounded-lg bg-[var(--surface)] border border-[var(--border)]">
                    <span className="text-neutral-500 block text-[10px] uppercase">Encrypted</span>
                    <span className="font-bold text-sm">{metadataInfo.isEncrypted ? 'Yes' : 'No'}</span>
                  </div>
                  <div className="p-3 rounded-lg bg-[var(--surface)] border border-[var(--border)]">
                    <span className="text-neutral-500 block text-[10px] uppercase">Creator</span>
                    <span className="font-bold text-sm truncate">{metadataInfo.creator || 'Standard'}</span>
                  </div>
                  <div className="p-3 rounded-lg bg-[var(--surface)] border border-[var(--border)]">
                    <span className="text-neutral-500 block text-[10px] uppercase">Title</span>
                    <span className="font-bold text-sm truncate">{metadataInfo.title || 'Untitled'}</span>
                  </div>
                </div>
              )}

              {resultBlobUrl && (
                <div className="mt-3 rounded-xl overflow-hidden border border-[var(--border)] h-[400px]">
                  <iframe src={resultBlobUrl} className="w-full h-full border-0" title="Result PDF Preview" />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Col: Recent PDF Processing Jobs */}
        <div className="border border-[var(--border)] rounded-2xl bg-[var(--card)] p-5 shadow-sm h-fit">
          <div className="flex items-center gap-2 mb-3 pb-3 border-b border-[var(--border)]">
            <Clock className="w-4 h-4 text-[var(--muted-foreground)]" />
            <h3 className="text-sm font-bold text-[var(--foreground)]">Recent Operations</h3>
          </div>

          {recentJobs.length === 0 ? (
            <div className="text-center py-8 text-xs text-[var(--muted-foreground)]">
              No recent background jobs. Run a tool to see execution history.
            </div>
          ) : (
            <ul className="space-y-2.5">
              {recentJobs.slice(0, 8).map((j: any) => (
                <li
                  key={j.id}
                  className="p-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-xs flex flex-col gap-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold uppercase tracking-wider text-[11px] text-[var(--foreground)]">
                      {j.jobType}
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                        j.status === 'completed'
                          ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-800/40'
                          : 'bg-neutral-800 text-neutral-400'
                      }`}
                    >
                      {j.status}
                    </span>
                  </div>
                  <div className="text-[11px] text-[var(--muted-foreground)] truncate">{j.outputFilename}</div>
                  <div className="text-[10px] text-neutral-500 font-mono">
                    {new Date(j.createdAt).toLocaleDateString()} {new Date(j.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
