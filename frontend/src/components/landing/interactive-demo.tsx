'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  FileText,
  ArrowRight,
  Code2,
  Eye,
  RotateCcw,
  CheckCircle2,
  Layers,
  Table as TableIcon,
  Heading,
  Copy,
  Check,
  Zap,
} from 'lucide-react';
import { markdownToSections, extractTitleMetadata } from '@/lib/markdown-pdf';
import { GeneralDocPreview } from '@/components/preview/general-doc-preview';
import { FadeIn } from './motion-wrapper';
import { BackgroundGrid } from './background-grid';

interface Preset {
  id: string;
  name: string;
  badge: string;
  title: string;
  subtitle: string;
  markdown: string;
}

const PRESETS: Preset[] = [
  {
    id: 'executive',
    name: 'Executive Brief',
    badge: 'Operations',
    title: 'DocAutomate Platform Architecture',
    subtitle: 'Confidential Technical Overview & Core Module Specifications',
    markdown: `# DocAutomate Platform Architecture
Confidential Technical Overview & Core Module Specifications

## 1. Executive Summary
DocAutomate is a Document Operations Platform designed to streamline document creation, high-throughput PDF generation, automated approval workflows, and cryptographic verification within a unified environment.

---

## 2. Platform Infrastructure & Technology Stack
- **Platform Name**: DocAutomate Enterprise
- **Core Engine**: Go (Gin Framework) & PostgreSQL
- **Frontend Stack**: Next.js 16, React 19, TypeScript, Tailwind CSS
- **PDF Renderer**: Headless Chromium (Chromedp)
- **Integrity Level**: SHA-256 with Embedded QR Codes

---

## 3. Core Modules Performance Matrix
| Engine Module | Core Capability | Throughput | Target SLA |
| --- | --- | --- | --- |
| Document Studio | Visual & Markdown PDF Compilation | 450 docs/sec | 99.99% |
| Batch Utilities | Merge, Split, Compress & Extract | 1.2 GB/min | 99.95% |
| Verification | SHA-256 On-chain / QR Proof | Instant | 100.0% |
| Workflow Automation | Event-driven Multi-tier Approvals | 2,500 tasks/min | 99.99% |

---

## 4. Key Security & Compliance Guarantees
- **Data Encryption**: AES-256-GCM at rest, TLS 1.3 in transit.
- **Audit Trails**: Immutable append-only log ledger for all document state changes.
- **Granular RBAC**: Role-based access control with scoped token generation.`,
  },
  {
    id: 'statement',
    name: 'Billing Statement',
    badge: 'Finance',
    title: 'Enterprise Billing & Service Statement',
    subtitle: 'Invoice Ref: INV-2026-08942 • Billing Period: October 2026',
    markdown: `# Enterprise Billing & Service Statement
Invoice Ref: INV-2026-08942 • Billing Period: October 2026

## 1. Account Details
- **Customer**: Acme Global Technologies Inc.
- **Account ID**: ACME-CORP-9921
- **Issued Date**: October 25, 2026
- **Due Date**: November 15, 2026
- **Payment Status**: Pending Authorization

---

## 2. Monthly Service Summary
| Service Description | Qty | Rate | Subtotal |
| --- | --- | --- | --- |
| DocAutomate Enterprise License (Dedicated Cluster) | 1 | $1,200.00 | $1,200.00 |
| PDF Headless Processing Units (500k renders) | 5 | $90.00 | $450.00 |
| High-Speed Webhook & Workflow Automations | 1 | $250.00 | $250.00 |
| Cryptographic Integrity Ledger Signatures | 12,400 | $0.01 | $124.00 |

---

## 3. Payment Instructions & Wire Transfer
- **Bank**: JPMorgan Chase Bank, N.A.
- **Routing (ABA)**: 021000021
- **Account Number**: **** **** 4892
- **Wire Reference**: INV-2026-08942`,
  },
  {
    id: 'audit',
    name: 'Security Audit',
    badge: 'Compliance',
    title: 'SOC-2 Type II Compliance & Integrity Certificate',
    subtitle: 'Cryptographically Verified Independent Audit Assessment',
    markdown: `# SOC-2 Type II Compliance & Integrity Certificate
Cryptographically Verified Independent Audit Assessment

## 1. Compliance Evaluation Summary
This certificate validates that DocAutomate Document Operations Platform has fulfilled all Trust Services Criteria for Security, Availability, and Confidentiality.

---

## 2. Audit Specifications
- **Assessing Body**: CyberTrust Global Assurance LLC
- **Audit Standard**: AICPA SOC-2 Type II (2026 Revision)
- **Scope Period**: November 1, 2025 to October 31, 2026
- **Audit Result**: Clean Opinion (Zero Exceptions Noted)

---

## 3. Cryptographic Verification Hash
| Layer | Verification Standard | Hash Digest / Proof | Status |
| --- | --- | --- | --- |
| Document Digest | SHA-256 | e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855 | Validated |
| Seal Authority | Ed25519 Root Key | 8a1f49b7c8d20914e6e87f2b1c4a5d3f9e0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c | Confirmed |
| Tamper Check | Continuous Merkle Tree | Block #1,492,034 Verified | Secure |`,
  },
];

export function LandingInteractiveDemo() {
  const [activePreset, setActivePreset] = useState<string>('executive');
  const [markdown, setMarkdown] = useState<string>(PRESETS[0].markdown);
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<'split' | 'editor' | 'preview'>('split');

  const selectedPreset = useMemo(
    () => PRESETS.find((p) => p.id === activePreset) || PRESETS[0],
    [activePreset]
  );

  const { title, subtitle } = useMemo(() => {
    return extractTitleMetadata(markdown);
  }, [markdown]);

  const parsedSections = useMemo(() => {
    return markdownToSections(markdown);
  }, [markdown]);

  const handleSelectPreset = (preset: Preset) => {
    setActivePreset(preset.id);
    setMarkdown(preset.markdown);
  };

  const handleInsertSnippet = (snippet: string) => {
    setMarkdown((prev) => prev.trimEnd() + '\n\n' + snippet + '\n');
  };

  const handleCopyMarkdown = () => {
    navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section id="demo" className="py-10 sm:py-14 bg-neutral-50/70 dark:bg-[#070707] border-y border-neutral-200/80 dark:border-neutral-800/80 relative overflow-hidden">
      {/* Precision Crosshair Matrix Background */}
      <BackgroundGrid variant="crosshair" size={36} glow="amber" fade="radial" opacity={0.65} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Compact Section Header */}
        <FadeIn direction="up" className="text-center max-w-2xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-neutral-200/70 dark:bg-neutral-800/80 text-neutral-800 dark:text-neutral-200 border border-neutral-300/60 dark:border-neutral-700">
            <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
            <span>Interactive Playground</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-neutral-950 dark:text-white leading-tight">
            Write Markdown.{' '}
            <span className="text-neutral-500 dark:text-neutral-400">Compile Instant Pixel-Perfect PDFs.</span>
          </h2>

          <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 line-clamp-2">
            Experience our dual-engine document renderer right in your browser. Edit markdown, test dynamic tables, or switch between pre-built templates with instant single-page flip preview.
          </p>
        </FadeIn>

        {/* Compact Demo Controls Bar */}
        <FadeIn direction="up" delay={0.1} className="mt-6 mb-3 flex flex-wrap items-center justify-between gap-3 p-1.5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-2xs">
          {/* Preset Chips */}
          <div className="flex items-center gap-1 flex-wrap">
            <span className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 px-2.5 hidden sm:inline">
              Templates:
            </span>
            {PRESETS.map((preset) => {
              const isActive = activePreset === preset.id;
              return (
                <button
                  key={preset.id}
                  onClick={() => handleSelectPreset(preset)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-neutral-950 text-white dark:bg-white dark:text-neutral-950 shadow-2xs'
                      : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800'
                  }`}
                >
                  <span>{preset.name}</span>
                  <span
                    className={`text-[9px] px-1 py-0.2 rounded ${
                      isActive
                        ? 'bg-neutral-800 text-neutral-200 dark:bg-neutral-200 dark:text-neutral-800'
                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500'
                    }`}
                  >
                    {preset.badge}
                  </span>
                </button>
              );
            })}
          </div>

          {/* View Toggles & Actions */}
          <div className="flex items-center gap-2 ml-auto">
            {/* View Mode Buttons (Mobile & Desktop) */}
            <div className="flex items-center p-0.5 bg-neutral-100 dark:bg-neutral-800/80 rounded-lg text-xs font-medium">
              <button
                onClick={() => setViewMode('editor')}
                className={`flex items-center gap-1 px-2 py-1 rounded-md transition-all text-xs ${
                  viewMode === 'editor'
                    ? 'bg-white dark:bg-neutral-700 text-neutral-950 dark:text-white shadow-2xs'
                    : 'text-neutral-600 dark:text-neutral-400'
                }`}
              >
                <Code2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Editor</span>
              </button>
              <button
                onClick={() => setViewMode('split')}
                className={`hidden md:flex items-center gap-1 px-2.5 py-1 rounded-md transition-all text-xs ${
                  viewMode === 'split'
                    ? 'bg-white dark:bg-neutral-700 text-neutral-950 dark:text-white shadow-2xs'
                    : 'text-neutral-600 dark:text-neutral-400'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Split View</span>
              </button>
              <button
                onClick={() => setViewMode('preview')}
                className={`flex items-center gap-1 px-2 py-1 rounded-md transition-all text-xs ${
                  viewMode === 'preview'
                    ? 'bg-white dark:bg-neutral-700 text-neutral-950 dark:text-white shadow-2xs'
                    : 'text-neutral-600 dark:text-neutral-400'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Preview</span>
              </button>
            </div>

            {/* Launch Full Studio Link */}
            <Link
              href="/pdf-generator"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-neutral-950 text-white dark:bg-white dark:text-neutral-950 hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-all shadow-2xs"
            >
              <span>Full Studio</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </FadeIn>

        {/* Live Interactive Workspace Box with Compact Height */}
        <FadeIn direction="up" delay={0.2} className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-lg overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-12 h-[480px] sm:h-[500px]">
            {/* Left: Markdown Editor */}
            {(viewMode === 'split' || viewMode === 'editor') && (
              <div
                className={`flex flex-col h-full border-b md:border-b-0 md:border-r border-neutral-200 dark:border-neutral-800 ${
                  viewMode === 'split' ? 'md:col-span-5' : 'md:col-span-12'
                }`}
              >
                {/* Editor Header Bar */}
                <div className="flex items-center justify-between px-3 py-1.5 bg-neutral-50 dark:bg-neutral-900/80 border-b border-neutral-200 dark:border-neutral-800 text-xs">
                  <div className="flex items-center gap-1.5 font-mono text-neutral-500 dark:text-neutral-400 text-[11px]">
                    <Code2 className="w-3.5 h-3.5 text-neutral-700 dark:text-neutral-300" />
                    <span>markdown_input.md</span>
                  </div>

                  {/* Snippet Insertion Shortcuts */}
                  <div className="flex items-center gap-0.5">
                    <button
                      onClick={() => handleInsertSnippet('## New Section Title\nDetailed content goes here.')}
                      title="Insert Heading"
                      className="p-1 rounded hover:bg-neutral-200/60 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400 transition-colors"
                    >
                      <Heading className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleInsertSnippet('| Metric | Target | Status |\n| --- | --- | --- |\n| Throughput | 500 req/s | Active |\n| Uptime | 99.99% | Verified |')}
                      title="Insert Table"
                      className="p-1 rounded hover:bg-neutral-200/60 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400 transition-colors"
                    >
                      <TableIcon className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleInsertSnippet('- **Client**: Global Corp\n- **Status**: Operational')}
                      title="Insert Key-Value"
                      className="p-1 rounded hover:bg-neutral-200/60 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400 transition-colors"
                    >
                      <span className="text-[10px] font-bold font-mono">KV</span>
                    </button>
                    <button
                      onClick={handleCopyMarkdown}
                      title="Copy Markdown"
                      className="p-1 rounded hover:bg-neutral-200/60 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400 transition-colors ml-1"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => setMarkdown(selectedPreset.markdown)}
                      title="Reset to Preset"
                      className="p-1 rounded hover:bg-neutral-200/60 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400 transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Markdown Text Area */}
                <textarea
                  value={markdown}
                  onChange={(e) => setMarkdown(e.target.value)}
                  className="flex-1 w-full p-3 font-mono text-[11px] text-neutral-900 dark:text-neutral-100 bg-transparent resize-none focus:outline-hidden leading-relaxed"
                  placeholder="Type or paste Markdown here..."
                  spellCheck={false}
                />

                {/* Editor Footer Status */}
                <div className="px-3 py-1.5 bg-neutral-50 dark:bg-neutral-900/60 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between text-[10px] text-neutral-500 dark:text-neutral-400">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>Real-time Bi-Directional Parser</span>
                  </div>
                  <span>{parsedSections.length} Sections</span>
                </div>
              </div>
            )}

            {/* Right: Instant A4 Multi-Page Live Preview (Single Page Flip by Default) */}
            {(viewMode === 'split' || viewMode === 'preview') && (
              <div
                className={`flex flex-col h-full bg-neutral-100/70 dark:bg-[#0c0c0c] ${
                  viewMode === 'split' ? 'md:col-span-7' : 'md:col-span-12'
                }`}
              >
                {/* Preview Toolbar */}
                <div className="flex items-center justify-between px-3 py-1.5 bg-neutral-50/90 dark:bg-neutral-900/90 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800 text-xs">
                  <div className="flex items-center gap-2">
                    <Eye className="w-3.5 h-3.5 text-neutral-600 dark:text-neutral-400" />
                    <span className="font-semibold text-neutral-800 dark:text-neutral-200 text-xs">
                      Instant Live Compilation
                    </span>
                    <span className="px-1.5 py-0.2 rounded-full text-[9px] font-medium bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800/80">
                      Single-Page Flip
                    </span>
                  </div>

                  <div className="text-[10px] text-neutral-500 dark:text-neutral-400 font-mono">
                    A4 Portrait &bull; 0.5 in Margins
                  </div>
                </div>

                {/* Rendered Scaled Document Container */}
                <div className="flex-1 p-2 sm:p-3 overflow-y-auto overflow-x-auto flex justify-center items-start">
                  <div className="transform scale-[0.70] sm:scale-[0.76] origin-top transition-transform duration-200">
                    <GeneralDocPreview
                      title={title || selectedPreset.title}
                      subtitle={subtitle || selectedPreset.subtitle}
                      pageSize="A4"
                      orientation="portrait"
                      margin="normal"
                      includeHeader={true}
                      includeFooter={true}
                      includePageNumbers={true}
                      defaultPageViewMode="single"
                      sections={parsedSections}
                      documentNumber="DOC-2026-08942"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

