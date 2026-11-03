'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  FolderOpen,
  Layers,
  LayoutTemplate,
  Workflow,
  ShieldCheck,
  Search,
  CheckCircle2,
  Download,
  Eye,
  FileText,
  Split,
  Maximize2,
  RotateCw,
  QrCode,
  ArrowRight,
  Filter,
  Plus,
  Play,
  Lock,
  GitBranch,
} from 'lucide-react';

export function LandingProductShowcase() {
  const [activeTab, setActiveTab] = useState<
    'library' | 'pdftools' | 'templates' | 'workflows' | 'verification'
  >('library');

  const tabs = [
    { id: 'library', label: 'Document Library', icon: FolderOpen },
    { id: 'pdftools', label: 'PDF Utilities', icon: Layers },
    { id: 'templates', label: 'Templates', icon: LayoutTemplate },
    { id: 'workflows', label: 'Workflows', icon: Workflow },
    { id: 'verification', label: 'Verification Portal', icon: ShieldCheck },
  ] as const;

  return (
    <section id="showcase" className="py-20 md:py-28 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-[#0c0c0c]/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
            Interactive Workspace
          </div>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-neutral-950 dark:text-white">
            One Workspace. Complete Control.
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400 text-sm sm:text-base leading-relaxed">
            Switch seamlessly between your documents, PDF utilities, automation graphs, and cryptographic verification scanner.
          </p>
        </div>

        {/* Tab Navigation Pill Bar */}
        <div className="mt-10 flex items-center justify-center">
          <div className="inline-flex p-1.5 rounded-xl bg-neutral-200/80 dark:bg-neutral-800/80 border border-neutral-300/60 dark:border-neutral-700/60 overflow-x-auto max-w-full gap-1 shadow-inner">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-150 ${
                    isActive
                      ? 'bg-white dark:bg-neutral-900 text-neutral-950 dark:text-white shadow-xs'
                      : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Dynamic Showcase Display Container */}
        <div className="mt-8 max-w-5xl mx-auto rounded-2xl bg-white dark:bg-[#111111] border border-neutral-200 dark:border-neutral-800 p-4 sm:p-7 shadow-xl">
          {/* Tab 1: Document Library */}
          {activeTab === 'library' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-200 dark:border-neutral-800">
                <div>
                  <h3 className="text-base font-bold text-neutral-950 dark:text-white">
                    Master Document Library
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    Search and filter invoices, receipts, and custom statements across all categories
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700">
                    <Search className="w-3.5 h-3.5" />
                    <span>Filter by name, tags, or customer...</span>
                  </div>
                  <Link
                    href="/documents"
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                  >
                    Open Vault
                  </Link>
                </div>
              </div>

              {/* Table Mockup */}
              <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden text-xs">
                <table className="w-full border-collapse text-left">
                  <thead className="bg-neutral-50 dark:bg-neutral-900/60 border-b border-neutral-200 dark:border-neutral-800 text-neutral-500 font-semibold text-[11px] uppercase tracking-wider">
                    <tr>
                      <th className="py-2.5 px-3.5">Document Number</th>
                      <th className="py-2.5 px-3.5">Type & Customer</th>
                      <th className="py-2.5 px-3.5">Total Amount</th>
                      <th className="py-2.5 px-3.5">Integrity & Status</th>
                      <th className="py-2.5 px-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/60 font-medium">
                    <tr className="hover:bg-neutral-50/50 dark:hover:bg-neutral-900/30">
                      <td className="py-3 px-3.5 font-mono font-bold text-neutral-900 dark:text-white">
                        #INV-2026-0819
                      </td>
                      <td className="py-3 px-3.5">
                        <div className="font-semibold text-neutral-900 dark:text-white">Commercial Invoice</div>
                        <div className="text-[11px] text-neutral-400">Vertex Cloud Systems Ltd</div>
                      </td>
                      <td className="py-3 px-3.5 font-mono font-semibold">$18,450.00 USD</td>
                      <td className="py-3 px-3.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          Finalized &bull; QR Verified
                        </span>
                      </td>
                      <td className="py-3 px-3.5 text-right">
                        <span className="text-neutral-500 hover:text-neutral-900 dark:hover:text-white font-mono text-[11px] cursor-pointer">
                          View PDF &rarr;
                        </span>
                      </td>
                    </tr>

                    <tr className="hover:bg-neutral-50/50 dark:hover:bg-neutral-900/30">
                      <td className="py-3 px-3.5 font-mono font-bold text-neutral-900 dark:text-white">
                        #RCP-2026-0241
                      </td>
                      <td className="py-3 px-3.5">
                        <div className="font-semibold text-neutral-900 dark:text-white">Tax Receipt</div>
                        <div className="text-[11px] text-neutral-400">Northstar Logistics Group</div>
                      </td>
                      <td className="py-3 px-3.5 font-mono font-semibold">$3,200.00 USD</td>
                      <td className="py-3 px-3.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                          Paid in Full
                        </span>
                      </td>
                      <td className="py-3 px-3.5 text-right">
                        <span className="text-neutral-500 hover:text-neutral-900 dark:hover:text-white font-mono text-[11px] cursor-pointer">
                          View PDF &rarr;
                        </span>
                      </td>
                    </tr>

                    <tr className="hover:bg-neutral-50/50 dark:hover:bg-neutral-900/30">
                      <td className="py-3 px-3.5 font-mono font-bold text-neutral-900 dark:text-white">
                        #DOC-2026-0012
                      </td>
                      <td className="py-3 px-3.5">
                        <div className="font-semibold text-neutral-900 dark:text-white">Quarterly Executive Report</div>
                        <div className="text-[11px] text-neutral-400">Internal Operations &bull; 4 Pages</div>
                      </td>
                      <td className="py-3 px-3.5 font-mono font-semibold">—</td>
                      <td className="py-3 px-3.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                          Compiled PDF
                        </span>
                      </td>
                      <td className="py-3 px-3.5 text-right">
                        <span className="text-neutral-500 hover:text-neutral-900 dark:hover:text-white font-mono text-[11px] cursor-pointer">
                          View PDF &rarr;
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab 2: PDF Utilities */}
          {activeTab === 'pdftools' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-neutral-200 dark:border-neutral-800">
                <div>
                  <h3 className="text-base font-bold text-neutral-950 dark:text-white">
                    High-Performance PDF Toolkit
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    Process, optimize, and transform multi-page PDF documents locally with high throughput
                  </p>
                </div>
                <Link
                  href="/pdf-tools"
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 self-start sm:self-auto"
                >
                  Launch Tools
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900/40 border border-neutral-200 dark:border-neutral-800 space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div className="font-bold text-neutral-900 dark:text-white">Merge Documents</div>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                    Concatenate multiple statements and annexures into one file.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900/40 border border-neutral-200 dark:border-neutral-800 space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                    <Split className="w-4 h-4" />
                  </div>
                  <div className="font-bold text-neutral-900 dark:text-white">Split & Extract</div>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                    Isolate individual pages, contracts, or custom page subsets.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900/40 border border-neutral-200 dark:border-neutral-800 space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <Maximize2 className="w-4 h-4" />
                  </div>
                  <div className="font-bold text-neutral-900 dark:text-white">Compress Payload</div>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                    Downsample heavy embedded images without text degradation.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900/40 border border-neutral-200 dark:border-neutral-800 space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                    <RotateCw className="w-4 h-4" />
                  </div>
                  <div className="font-bold text-neutral-900 dark:text-white">Rotate & Stamp</div>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                    Correct page orientations and embed confidentiality stamps.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Reusable Templates */}
          {activeTab === 'templates' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-neutral-200 dark:border-neutral-800">
                <div>
                  <h3 className="text-base font-bold text-neutral-950 dark:text-white">
                    Verified Document Templates
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    Pre-configured accounting, operational, and commercial designs
                  </p>
                </div>
                <Link
                  href="/templates"
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 self-start sm:self-auto"
                >
                  Browse All Templates
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/40 space-y-3">
                  <div className="h-28 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 p-2.5 space-y-1.5 shadow-xs">
                    <div className="h-3 w-1/3 bg-neutral-200 dark:bg-neutral-700 rounded" />
                    <div className="h-2 w-2/3 bg-neutral-100 dark:bg-neutral-800 rounded" />
                    <div className="h-8 w-full bg-neutral-100 dark:bg-neutral-800 rounded border border-neutral-200 dark:border-neutral-700 mt-2" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-neutral-900 dark:text-white">
                      Modern Commercial Invoice
                    </div>
                    <div className="text-[11px] text-neutral-500">Standard GST & VAT compliant layout</div>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/40 space-y-3">
                  <div className="h-28 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 p-2.5 space-y-1.5 shadow-xs">
                    <div className="flex justify-between">
                      <div className="h-3 w-1/4 bg-neutral-200 dark:bg-neutral-700 rounded" />
                      <div className="h-3 w-1/5 bg-neutral-300 dark:bg-neutral-600 rounded" />
                    </div>
                    <div className="h-6 w-full bg-neutral-100 dark:bg-neutral-800 rounded mt-3" />
                    <div className="h-2 w-1/2 bg-neutral-100 dark:bg-neutral-800 rounded" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-neutral-900 dark:text-white">
                      Executive Summary & Audit Report
                    </div>
                    <div className="text-[11px] text-neutral-500">Multi-page table & KPI grid layout</div>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/40 space-y-3">
                  <div className="h-28 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 p-2.5 space-y-1.5 shadow-xs">
                    <div className="h-3 w-1/3 bg-neutral-200 dark:bg-neutral-700 rounded" />
                    <div className="grid grid-cols-2 gap-1 mt-2">
                      <div className="h-6 bg-neutral-100 dark:bg-neutral-800 rounded" />
                      <div className="h-6 bg-neutral-100 dark:bg-neutral-800 rounded" />
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-neutral-900 dark:text-white">
                      Instant Receipt & Settlement Voucher
                    </div>
                    <div className="text-[11px] text-neutral-500">Includes embedded QR code verification</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 4: Workflows */}
          {activeTab === 'workflows' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-neutral-200 dark:border-neutral-800">
                <div>
                  <h3 className="text-base font-bold text-neutral-950 dark:text-white">
                    Visual Document Automation Engine
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    Connect trigger events, approval gates, PDF generation, and external webhooks
                  </p>
                </div>
                <Link
                  href="/workflows"
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 self-start sm:self-auto"
                >
                  Configure Workflows
                </Link>
              </div>

              {/* Workflow Visual Flow */}
              <div className="p-6 rounded-xl bg-neutral-50 dark:bg-neutral-900/40 border border-neutral-200 dark:border-neutral-800 flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-medium">
                {/* Node 1 */}
                <div className="p-3.5 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-xs w-full md:w-48 text-center space-y-1">
                  <div className="text-[10px] uppercase tracking-wider text-neutral-400 font-bold">1. Trigger</div>
                  <div className="font-bold text-neutral-900 dark:text-white">New Deal Closed</div>
                  <div className="text-[11px] text-neutral-500">API Webhook Received</div>
                </div>

                <ArrowRight className="w-4 h-4 text-neutral-400 hidden md:block shrink-0" />

                {/* Node 2 */}
                <div className="p-3.5 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-xs w-full md:w-48 text-center space-y-1">
                  <div className="text-[10px] uppercase tracking-wider text-amber-500 font-bold">2. Approval Gate</div>
                  <div className="font-bold text-neutral-900 dark:text-white">Finance Sign-Off</div>
                  <div className="text-[11px] text-neutral-500">Threshold &gt; $5,000 USD</div>
                </div>

                <ArrowRight className="w-4 h-4 text-neutral-400 hidden md:block shrink-0" />

                {/* Node 3 */}
                <div className="p-3.5 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-xs w-full md:w-48 text-center space-y-1">
                  <div className="text-[10px] uppercase tracking-wider text-blue-500 font-bold">3. PDF Engine</div>
                  <div className="font-bold text-neutral-900 dark:text-white">Chromium Render</div>
                  <div className="text-[11px] text-neutral-500">Embed QR & SHA-256</div>
                </div>

                <ArrowRight className="w-4 h-4 text-neutral-400 hidden md:block shrink-0" />

                {/* Node 4 */}
                <div className="p-3.5 rounded-xl bg-white dark:bg-neutral-800 border border-emerald-500/40 shadow-xs w-full md:w-48 text-center space-y-1 bg-emerald-500/5">
                  <div className="text-[10px] uppercase tracking-wider text-emerald-500 font-bold">4. Final Dispatch</div>
                  <div className="font-bold text-neutral-900 dark:text-white">Secure Link Sent</div>
                  <div className="text-[11px] text-emerald-600 dark:text-emerald-400">Vault Archived</div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 5: Verification Portal */}
          {activeTab === 'verification' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-neutral-200 dark:border-neutral-800">
                <div>
                  <h3 className="text-base font-bold text-neutral-950 dark:text-white">
                    Cryptographic Document Verification
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    Public zero-knowledge portal confirming file authenticity and tamper immunity
                  </p>
                </div>
                <Link
                  href="/verification"
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 self-start sm:self-auto"
                >
                  Verify Document
                </Link>
              </div>

              <div className="p-5 rounded-xl bg-neutral-50 dark:bg-neutral-900/40 border border-neutral-200 dark:border-neutral-800 grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
                <div className="md:col-span-4 flex flex-col items-center justify-center p-4 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-xs text-center space-y-2">
                  <div className="w-24 h-24 p-2 bg-neutral-100 dark:bg-neutral-700 rounded-lg flex items-center justify-center">
                    <QrCode className="w-18 h-18 text-neutral-900 dark:text-white" />
                  </div>
                  <span className="text-[11px] font-mono text-neutral-500">Scan QR Code on PDF</span>
                </div>

                <div className="md:col-span-8 space-y-3 text-xs">
                  <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span className="font-semibold">Cryptographically Verified &bull; Official Original Record</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                    <div className="p-2 rounded bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
                      <div className="text-neutral-400 uppercase text-[9px]">Document ID</div>
                      <div className="font-bold text-neutral-900 dark:text-white">#DOC-2026-0819</div>
                    </div>
                    <div className="p-2 rounded bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
                      <div className="text-neutral-400 uppercase text-[9px]">Issuer Identity</div>
                      <div className="font-bold text-neutral-900 dark:text-white">DocAutomate Verified Org</div>
                    </div>
                    <div className="p-2 rounded bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 col-span-2 truncate">
                      <div className="text-neutral-400 uppercase text-[9px]">SHA-256 Digest</div>
                      <div className="text-neutral-700 dark:text-neutral-300 text-[10px]">
                        e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

