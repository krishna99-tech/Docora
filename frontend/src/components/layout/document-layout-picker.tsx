'use client';

import React from 'react';
import { Layout, AlignLeft, AlignCenter, Columns, FileText, Smartphone } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export interface DocumentLayoutConfig {
  preset: 'modern' | 'classic' | 'thermal';
  pageSize: 'A4' | 'Letter' | 'Thermal80';
  orientation: 'portrait' | 'landscape';
  headerAlignment: 'split' | 'center' | 'left';
  tableDensity: 'comfortable' | 'compact';
}

interface DocumentLayoutPickerProps {
  config: DocumentLayoutConfig;
  onChange: (updated: DocumentLayoutConfig) => void;
}

export function DocumentLayoutPicker({ config, onChange }: DocumentLayoutPickerProps) {
  const update = (field: keyof DocumentLayoutConfig, value: any) => {
    onChange({
      ...config,
      [field]: value,
    });
  };

  return (
    <Card className="border border-[var(--border)] bg-[var(--surface)]">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Layout className="w-4 h-4 text-[var(--foreground)] shrink-0" />
            <CardTitle>Layout & Alignment Settings</CardTitle>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[var(--surface-secondary)] border border-[var(--border)] text-[var(--muted-foreground)]">
              {config.pageSize}
            </span>
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[var(--surface-secondary)] border border-[var(--border)] text-[var(--muted-foreground)]">
              {config.orientation}
            </span>
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[var(--surface-secondary)] border border-[var(--border)] text-[var(--muted-foreground)]">
              {config.headerAlignment}
            </span>
          </div>
        </div>
        <CardDescription>
          Customize page geometry, header arrangement, and alignment for PDF generation
        </CardDescription>
      </CardHeader>

      <div className="space-y-4">
        {/* Layout Style Preset - Full Width Row */}
        <div>
          <label className="text-xs font-semibold text-[var(--foreground)] block mb-2">
            Layout Style
          </label>
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => update('preset', 'modern')}
              className={`p-2.5 rounded-lg border text-xs flex items-center justify-center gap-2 font-medium transition-all cursor-pointer min-w-0 ${
                config.preset === 'modern'
                  ? 'border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-foreground)] shadow-xs'
                  : 'border-[var(--border)] bg-[var(--surface-secondary)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)]'
              }`}
            >
              <FileText className="w-4 h-4 shrink-0" />
              <span className="truncate font-semibold">Modern</span>
            </button>

            <button
              type="button"
              onClick={() => update('preset', 'classic')}
              className={`p-2.5 rounded-lg border text-xs flex items-center justify-center gap-2 font-medium transition-all cursor-pointer min-w-0 ${
                config.preset === 'classic'
                  ? 'border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-foreground)] shadow-xs'
                  : 'border-[var(--border)] bg-[var(--surface-secondary)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)]'
              }`}
            >
              <Columns className="w-4 h-4 shrink-0" />
              <span className="truncate font-semibold">Classic</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onChange({
                  ...config,
                  preset: 'thermal',
                  pageSize: 'Thermal80',
                  orientation: 'portrait',
                  headerAlignment: 'center',
                });
              }}
              className={`p-2.5 rounded-lg border text-xs flex items-center justify-center gap-2 font-medium transition-all cursor-pointer min-w-0 ${
                config.preset === 'thermal'
                  ? 'border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-foreground)] shadow-xs'
                  : 'border-[var(--border)] bg-[var(--surface-secondary)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)]'
              }`}
            >
              <Smartphone className="w-4 h-4 shrink-0" />
              <span className="truncate font-semibold">POS Roll</span>
            </button>
          </div>
        </div>

        {/* Paper Size & Orientation + Header Alignment */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          {/* Paper Size & Orientation */}
          <div>
            <label className="text-xs font-semibold text-[var(--foreground)] block mb-2">
              Paper Size & Orientation
            </label>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={config.pageSize}
                disabled={config.preset === 'thermal'}
                onChange={(e) => update('pageSize', e.target.value as any)}
                className="w-full px-2.5 py-2 text-xs rounded-lg bg-[var(--surface-secondary)] text-[var(--foreground)] border border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-ring)] focus:border-transparent transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="A4">A4 (210×297)</option>
                <option value="Letter">US Letter</option>
                <option value="Thermal80">80mm POS</option>
              </select>

              <select
                value={config.orientation}
                disabled={config.preset === 'thermal'}
                onChange={(e) => update('orientation', e.target.value as any)}
                className="w-full px-2.5 py-2 text-xs rounded-lg bg-[var(--surface-secondary)] text-[var(--foreground)] border border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-ring)] focus:border-transparent transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="portrait">Portrait</option>
                <option value="landscape">Landscape</option>
              </select>
            </div>
          </div>

          {/* Header Alignment */}
          <div>
            <label className="text-xs font-semibold text-[var(--foreground)] block mb-2">
              Header Alignment
            </label>
            <div className="grid grid-cols-3 gap-1 bg-[var(--surface-secondary)] p-1 rounded-lg border border-[var(--border)]">
              <button
                type="button"
                onClick={() => update('headerAlignment', 'split')}
                className={`py-1.5 px-2 rounded-md text-xs flex items-center justify-center gap-1 font-medium transition-all cursor-pointer min-w-0 ${
                  config.headerAlignment === 'split'
                    ? 'bg-[var(--primary)] text-[var(--primary-foreground)] shadow-xs font-semibold'
                    : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                }`}
              >
                <Columns className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Split</span>
              </button>

              <button
                type="button"
                onClick={() => update('headerAlignment', 'center')}
                className={`py-1.5 px-2 rounded-md text-xs flex items-center justify-center gap-1 font-medium transition-all cursor-pointer min-w-0 ${
                  config.headerAlignment === 'center'
                    ? 'bg-[var(--primary)] text-[var(--primary-foreground)] shadow-xs font-semibold'
                    : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                }`}
              >
                <AlignCenter className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Center</span>
              </button>

              <button
                type="button"
                onClick={() => update('headerAlignment', 'left')}
                className={`py-1.5 px-2 rounded-md text-xs flex items-center justify-center gap-1 font-medium transition-all cursor-pointer min-w-0 ${
                  config.headerAlignment === 'left'
                    ? 'bg-[var(--primary)] text-[var(--primary-foreground)] shadow-xs font-semibold'
                    : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                }`}
              >
                <AlignLeft className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Left</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
