'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAuth } from '@/app/providers';
import {
  ArrowRight,
  ShieldCheck,
  FileText,
  Sparkles,
  QrCode,
  Layers,
  CheckCircle2,
  Clock,
  ChevronRight,
  Split,
  Maximize2,
  TrendingUp,
  Workflow,
  Search,
  Filter,
} from 'lucide-react';
import { BackgroundGrid } from './background-grid';

export function LandingHero() {
  const { user } = useAuth();

  return (
    <section className="relative pt-28 pb-20 md:pt-36 md:pb-28 overflow-hidden">
      {/* Background Dot Matrix with Radial Vignette */}
      <BackgroundGrid variant="dots" size={28} glow="subtle" fade="radial" opacity={0.8} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Hero Copy with Motion */}
        <div className="text-center max-w-3xl mx-auto space-y-6">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-neutral-100 dark:bg-neutral-800/80 text-neutral-800 dark:text-neutral-200 border border-neutral-200/80 dark:border-neutral-700/60 shadow-2xs"
          >
            <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>DocAutomate 2.0 &bull; Every Document. One Powerful Platform.</span>
          </motion.div>

          {/* Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: [0.21, 0.47, 0.32, 0.98] }}
            className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-neutral-950 dark:text-white leading-[1.12]"
          >
            Your Documents. Your Workflow.{' '}
            <span className="text-neutral-500 dark:text-neutral-400">One Platform.</span>
          </motion.h1>

          {/* Supporting text */}
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2, ease: [0.21, 0.47, 0.32, 0.98] }}
            className="text-base sm:text-lg text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto leading-relaxed font-normal"
          >
            Create, process, automate, verify, and manage documents effortlessly.
            DocAutomate brings every document operation together in one powerful workspace.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3, ease: [0.21, 0.47, 0.32, 0.98] }}
            className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4"
          >
            <Link
              href={user ? '/dashboard' : '/register'}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-sm bg-neutral-950 text-white dark:bg-white dark:text-neutral-950 hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-all shadow-md hover:shadow-lg active:scale-[0.98]"
            >
              {user ? 'Open Workspace' : 'Get Started Free'}
              <ArrowRight className="w-4 h-4" />
            </Link>

            <a
              href="#demo"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-sm bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/70 transition-all active:scale-[0.98]"
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              Try Live Playground
            </a>
          </motion.div>

          {/* Trust Statement */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="text-xs text-neutral-500 dark:text-neutral-400 pt-1 font-medium"
          >
            Everything you need to manage documents, built into one platform.
          </motion.p>
        </div>

        {/* Hero Visual: Interactive SaaS Dashboard Component with Motion */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.35, ease: [0.21, 0.47, 0.32, 0.98] }}
          className="mt-14 max-w-5xl mx-auto"
        >
          <div className="relative rounded-2xl bg-neutral-950/5 dark:bg-white/5 p-2 sm:p-3 ring-1 ring-neutral-200/80 dark:ring-neutral-800 shadow-2xl backdrop-blur-xs">
            <div className="rounded-xl bg-white dark:bg-[#111111] border border-neutral-200/90 dark:border-neutral-800 overflow-hidden text-neutral-900 dark:text-neutral-100">
              {/* Fake Dashboard Topbar */}
              <div className="px-4 py-3 bg-neutral-50 dark:bg-neutral-900/60 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-400/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/80" />
                  </div>
                  <span className="font-mono text-[11px] text-neutral-400 hidden sm:inline">
                    docautomate.internal/workspace/overview
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-500 text-[11px]">
                    <Search className="w-3 h-3" />
                    <span className="hidden sm:inline">Quick search documents...</span>
                    <kbd className="font-mono text-[9px] bg-neutral-100 dark:bg-neutral-700 px-1 rounded ml-1">
                      ⌘K
                    </kbd>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    Live Engine
                  </span>
                </div>
              </div>

              {/* Fake Dashboard Inner Grid */}
              <div className="p-4 sm:p-6 space-y-6">
                {/* 3 Metric Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                  <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900/40 border border-neutral-200/80 dark:border-neutral-800/80 space-y-1">
                    <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 font-medium">
                      <span>Total Documents</span>
                      <FileText className="w-4 h-4 text-blue-500" />
                    </div>
                    <div className="text-2xl font-black tracking-tight">1,284</div>
                    <div className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-semibold">
                      <TrendingUp className="w-3 h-3" /> +14.2% this month
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900/40 border border-neutral-200/80 dark:border-neutral-800/80 space-y-1">
                    <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 font-medium">
                      <span>Integrity & Verification</span>
                      <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    </div>
                    <div className="text-2xl font-black tracking-tight">99.8%</div>
                    <div className="text-[11px] text-neutral-500 dark:text-neutral-400 font-mono">
                      SHA-256 Validated
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900/40 border border-neutral-200/80 dark:border-neutral-800/80 space-y-1">
                    <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 font-medium">
                      <span>Automated Workflows</span>
                      <Workflow className="w-4 h-4 text-amber-500" />
                    </div>
                    <div className="text-2xl font-black tracking-tight">14 Active</div>
                    <div className="text-[11px] text-neutral-500 dark:text-neutral-400 font-medium">
                      124 runs completed today
                    </div>
                  </div>
                </div>

                {/* Quick Utility Tool Shortcuts & Recent Documents Table */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
                  {/* Recent Documents Table (8 Cols) */}
                  <div className="lg:col-span-8 rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
                    <div className="p-3 bg-neutral-50/70 dark:bg-neutral-900/40 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                        Recent Document Operations
                      </span>
                      <span className="text-[11px] text-neutral-400 font-mono">4 of 1,284</span>
                    </div>

                    <div className="divide-y divide-neutral-100 dark:divide-neutral-800/60 text-xs">
                      {/* Row 1 */}
                      <div className="p-3 flex items-center justify-between hover:bg-neutral-50/50 dark:hover:bg-neutral-900/30 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-mono font-bold text-[10px]">
                            INV
                          </div>
                          <div>
                            <div className="font-semibold text-neutral-900 dark:text-white">
                              INV-2026-0042 &bull; Enterprise SaaS Annual
                            </div>
                            <div className="text-[11px] text-neutral-400">
                              Issued to Acme Global &bull; USD $14,250.00
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            Verified QR
                          </span>
                        </div>
                      </div>

                      {/* Row 2 */}
                      <div className="p-3 flex items-center justify-between hover:bg-neutral-50/50 dark:hover:bg-neutral-900/30 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-mono font-bold text-[10px]">
                            PDF
                          </div>
                          <div>
                            <div className="font-semibold text-neutral-900 dark:text-white">
                              Q4 Operational Audit & Milestone Deliverables
                            </div>
                            <div className="text-[11px] text-neutral-400">
                              Generated via Chromium Engine &bull; 4 Pages
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                            Finalized
                          </span>
                        </div>
                      </div>

                      {/* Row 3 */}
                      <div className="p-3 flex items-center justify-between hover:bg-neutral-50/50 dark:hover:bg-neutral-900/30 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center font-mono font-bold text-[10px]">
                            WF
                          </div>
                          <div>
                            <div className="font-semibold text-neutral-900 dark:text-white">
                              Vendor Agreement Auto-Approval
                            </div>
                            <div className="text-[11px] text-neutral-400">
                              Stage 2: CFO Signature Pending
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                            In Review
                          </span>
                        </div>
                      </div>

                      {/* Row 4 */}
                      <div className="p-3 flex items-center justify-between hover:bg-neutral-50/50 dark:hover:bg-neutral-900/30 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center font-mono font-bold text-[10px]">
                            REC
                          </div>
                          <div>
                            <div className="font-semibold text-neutral-900 dark:text-white">
                              RCP-2026-0891 &bull; Hardware Logistics
                            </div>
                            <div className="text-[11px] text-neutral-400">
                              Paid in full &bull; USD $3,420.00
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            SHA-256 Valid
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Sidebar Quick Action Utilities (4 Cols) */}
                  <div className="lg:col-span-4 rounded-xl border border-neutral-200 dark:border-neutral-800 p-4 bg-neutral-50/50 dark:bg-neutral-900/30 space-y-3">
                    <div className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                      PDF Utility Toolkit
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2.5 rounded-lg bg-white dark:bg-neutral-800/70 border border-neutral-200 dark:border-neutral-700/80 flex flex-col gap-1 hover:border-neutral-400 transition-colors cursor-pointer">
                        <Layers className="w-4 h-4 text-neutral-700 dark:text-neutral-300" />
                        <span className="font-semibold text-[11px]">Merge PDFs</span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-white dark:bg-neutral-800/70 border border-neutral-200 dark:border-neutral-700/80 flex flex-col gap-1 hover:border-neutral-400 transition-colors cursor-pointer">
                        <Split className="w-4 h-4 text-neutral-700 dark:text-neutral-300" />
                        <span className="font-semibold text-[11px]">Split Pages</span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-white dark:bg-neutral-800/70 border border-neutral-200 dark:border-neutral-700/80 flex flex-col gap-1 hover:border-neutral-400 transition-colors cursor-pointer">
                        <Maximize2 className="w-4 h-4 text-neutral-700 dark:text-neutral-300" />
                        <span className="font-semibold text-[11px]">Compress</span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-white dark:bg-neutral-800/70 border border-neutral-200 dark:border-neutral-700/80 flex flex-col gap-1 hover:border-neutral-400 transition-colors cursor-pointer">
                        <QrCode className="w-4 h-4 text-neutral-700 dark:text-neutral-300" />
                        <span className="font-semibold text-[11px]">Verify QR</span>
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[11px] leading-relaxed flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>Security isolation active. Audit trail recorded on immutable ledger.</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

