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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layout className="w-4 h-4 text-[var(--foreground)]" />
            <CardTitle>Layout & Alignment Settings</CardTitle>
          </div>
          <div className="flex items-center gap-1.5">
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Layout Style Preset */}
        <div>
          <label className="text-xs font-semibold text-[var(--foreground)] block mb-2">
            Layout Style
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => update('preset', 'modern')}
              className={`p-2.5 text-left rounded-md border text-xs flex flex-col gap-1 transition-all ${
                config.preset === 'modern'
                  ? 'border-[var(--foreground)] bg-[var(--foreground)] text-[var(--background)] font-medium shadow-sm'
                  : 'border-[var(--border)] bg-[var(--surface-secondary)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Modern</span>
            </button>

            <button
              type="button"
              onClick={() => update('preset', 'classic')}
              className={`p-2.5 text-left rounded-md border text-xs flex flex-col gap-1 transition-all ${
                config.preset === 'classic'
                  ? 'border-[var(--foreground)] bg-[var(--foreground)] text-[var(--background)] font-medium shadow-sm'
                  : 'border-[var(--border)] bg-[var(--surface-secondary)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
              <span>Classic</span>
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
              className={`p-2.5 text-left rounded-md border text-xs flex flex-col gap-1 transition-all ${
                config.preset === 'thermal'
                  ? 'border-[var(--foreground)] bg-[var(--foreground)] text-[var(--background)] font-medium shadow-sm'
                  : 'border-[var(--border)] bg-[var(--surface-secondary)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>POS Roll</span>
            </button>
          </div>
        </div>

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
              className="w-full px-2.5 py-2 text-xs rounded-md bg-[var(--surface-secondary)] text-[var(--foreground)] border border-[var(--border)] focus:outline-none"
            >
              <option value="A4">A4 (210×297mm)</option>
              <option value="Letter">US Letter</option>
              <option value="Thermal80">80mm POS Roll</option>
            </select>

            <select
              value={config.orientation}
              disabled={config.preset === 'thermal'}
              onChange={(e) => update('orientation', e.target.value as any)}
              className="w-full px-2.5 py-2 text-xs rounded-md bg-[var(--surface-secondary)] text-[var(--foreground)] border border-[var(--border)] focus:outline-none"
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
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => update('headerAlignment', 'split')}
              className={`p-2 text-center rounded-md border text-xs flex items-center justify-center gap-1.5 transition-all ${
                config.headerAlignment === 'split'
                  ? 'border-[var(--foreground)] bg-[var(--foreground)] text-[var(--background)] font-medium shadow-sm'
                  : 'border-[var(--border)] bg-[var(--surface-secondary)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
              <span>Split</span>
            </button>

            <button
              type="button"
              onClick={() => update('headerAlignment', 'center')}
              className={`p-2 text-center rounded-md border text-xs flex items-center justify-center gap-1.5 transition-all ${
                config.headerAlignment === 'center'
                  ? 'border-[var(--foreground)] bg-[var(--foreground)] text-[var(--background)] font-medium shadow-sm'
                  : 'border-[var(--border)] bg-[var(--surface-secondary)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
              }`}
            >
              <AlignCenter className="w-3.5 h-3.5" />
              <span>Center</span>
            </button>

            <button
              type="button"
              onClick={() => update('headerAlignment', 'left')}
              className={`p-2 text-center rounded-md border text-xs flex items-center justify-center gap-1.5 transition-all ${
                config.headerAlignment === 'left'
                  ? 'border-[var(--foreground)] bg-[var(--foreground)] text-[var(--background)] font-medium shadow-sm'
                  : 'border-[var(--border)] bg-[var(--surface-secondary)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
              }`}
            >
              <AlignLeft className="w-3.5 h-3.5" />
              <span>Left</span>
            </button>
          </div>
        </div>
      </div>
    </Card>
  );
}
