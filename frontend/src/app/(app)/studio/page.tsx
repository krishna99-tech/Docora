'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Receipt,
  FileSpreadsheet,
  FileText,
  Palette,
  ArrowRight,
  Layers,
  CheckCircle2,
  Sliders,
  Settings2,
  Eye,
  FilePlus2,
  Zap,
} from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function DocumentStudioHubPage() {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'finance' | 'reports' | 'custom'>('all');

  const studioModes = [
    {
      id: 'general-pdf',
      title: 'Custom Document Designer',
      description: 'Build structured business reports, contracts, executive summaries, and multi-section PDFs.',
      icon: FileText,
      badge: 'Advanced Studio',
      href: '/pdf-generator',
      features: ['Multi-section layout builder', 'Dynamic tables & key-value grids', 'Custom headers & page numbers', 'Split-screen live preview'],
      category: 'reports',
    },
    {
      id: 'invoice-studio',
      title: 'Invoice Studio',
      description: 'Generate client invoices with line items, tax computations, discount logic, and payment terms.',
      icon: FileSpreadsheet,
      badge: 'Finance Standard',
      href: '/invoices/new',
      features: ['Automated subtotal & VAT', 'Customer directory sync', 'Dual currency format', 'One-click PDF dispatch'],
      category: 'finance',
    },
    {
      id: 'receipt-studio',
      title: 'Receipt Studio',
      description: 'Issue verified payment receipts with payment method badges, transaction hashes, and signature lines.',
      icon: Receipt,
      badge: 'Instant Generation',
      href: '/receipts/new',
      features: ['Cash, card, and crypto methods', 'Instant customer receipting', 'Cryptographic verification stamp', 'Print-optimized layout'],
      category: 'finance',
    },
    {
      id: 'templates-studio',
      title: 'Template Presets & Styling',
      description: 'Create and customize reusable templates with company branding, logos, and custom color accents.',
      icon: Palette,
      badge: 'Branding Engine',
      href: '/templates',
      features: ['Minimalist black & white themes', 'Reusable placeholder tags', 'Version control & cloning', 'Workspace-wide sharing'],
      category: 'custom',
    },
  ];

  const filteredModes = studioModes.filter(
    (m) => selectedCategory === 'all' || m.category === selectedCategory
  );

  return (
    <div className="flex-1 flex flex-col">
      <Header
        title="Document Studio"
        description="Professional document authoring, styling presets, and PDF generation suites"
      />

      <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto w-full">
        {/* Banner Hero */}
        <div className="p-6 sm:p-8 rounded-2xl border border-[var(--border)] bg-gradient-to-r from-[var(--surface-secondary)] to-[var(--background)] flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xs">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)]">
                <Sparkles className="w-4 h-4" />
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
                Document Studio 2.0
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-[var(--foreground)]">
              Author, Style & Generate Professional PDFs
            </h1>
            <p className="text-xs sm:text-sm text-[var(--muted-foreground)] leading-relaxed">
              Choose an authoring engine suited for your document type. From pixel-precise general business reports to automated financial statements and branded templates.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link href="/pdf-generator">
              <Button size="lg" className="font-semibold shadow-xs">
                Launch General Designer
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 text-xs">
          {(['all', 'finance', 'reports', 'custom'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-full font-semibold transition-colors capitalize ${
                selectedCategory === cat
                  ? 'bg-[var(--primary)] text-[var(--primary-foreground)]'
                  : 'bg-[var(--surface-secondary)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] border border-[var(--border)]'
              }`}
            >
              {cat === 'all' ? 'All Document Studios' : cat}
            </button>
          ))}
        </div>

        {/* Studio Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredModes.map((mode) => {
            const Icon = mode.icon;
            return (
              <Card
                key={mode.id}
                className="group border-[var(--border)] hover:border-[var(--foreground)]/40 transition-all flex flex-col justify-between"
              >
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)] flex items-center justify-center text-[var(--foreground)] group-hover:scale-105 transition-transform">
                      <Icon className="w-5 h-5" />
                    </div>
                    <Badge variant="outline" className="text-[10px] font-mono font-medium">
                      {mode.badge}
                    </Badge>
                  </div>

                  <div className="space-y-1.5">
                    <h2 className="text-base font-bold text-[var(--foreground)]">{mode.title}</h2>
                    <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
                      {mode.description}
                    </p>
                  </div>

                  {/* Capabilities List */}
                  <div className="pt-2 border-t border-[var(--border)]/60 space-y-1.5">
                    <div className="text-[11px] font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                      Included Capabilities
                    </div>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-[var(--foreground)]">
                      {mode.features.map((feat, idx) => (
                        <li key={idx} className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span className="truncate">{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="p-4 bg-[var(--surface-secondary)]/50 border-t border-[var(--border)] flex items-center justify-end">
                  <Link href={mode.href} className="w-full sm:w-auto">
                    <Button variant="default" size="sm" className="w-full sm:w-auto text-xs font-semibold">
                      Open Studio <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </Button>
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Quick Tips & Workflow Integration */}
        <div className="p-4 sm:p-6 rounded-xl border border-[var(--border)] bg-[var(--surface-secondary)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[var(--background)] border border-[var(--border)] flex items-center justify-center text-[var(--foreground)] shrink-0">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-[var(--foreground)]">Automate Studio Generation</div>
              <div className="text-[11px] text-[var(--muted-foreground)]">
                Connect any template to automated triggers, webhook payloads, or scheduled batch jobs.
              </div>
            </div>
          </div>
          <Link href="/workflows/new" className="shrink-0">
            <Button variant="outline" size="sm" className="text-xs">
              Create Automation Workflow
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
