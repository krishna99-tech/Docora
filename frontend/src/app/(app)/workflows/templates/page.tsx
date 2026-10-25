'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Layers,
  ArrowLeft,
  Search,
  Sparkles,
  ArrowRight,
  Play,
  Clock,
  Zap,
  CheckCircle2,
  FileSpreadsheet,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Header } from '@/components/layout/header';
import { TablePagination } from '@/components/ui/table-pagination';
import { api } from '@/lib/api';
import { WorkflowTemplate } from '@/types';

export default function WorkflowTemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [page, setPage] = useState(1);
  const pageSize = 6;

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const res = await api.getWorkflowTemplates();
      if (Array.isArray(res)) {
        setTemplates(res);
      }
    } catch {}
    setLoading(false);
  };

  const categories = [
    'All',
    'Finance',
    'Billing',
    'Sales',
    'Reporting',
    'Bulk Processing',
    'Integration',
    'Routing',
    'Archiving',
    'Compliance',
    'Utilities',
    'Education',
  ];

  const filtered = templates.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase());
    const matchesCat = categoryFilter === 'All' || t.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  const paginatedTemplates = filtered.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.ceil(filtered.length / pageSize);

  return (
    <div className="flex-1 flex flex-col">
      <Header
        title="Workflow Templates"
        description="Choose from 15 pre-built production workflows to jumpstart your document automation"
        backHref="/workflows"
        action={{
          label: 'Start from Scratch',
          href: '/workflows/new',
          variant: 'outline',
        }}
      />

      <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 max-w-7xl mx-auto w-full">
        {/* Search & Category Filter Pills */}
      <div className="space-y-3">
        <div className="relative max-w-md">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search templates by name, keywords..."
            className="pl-9 h-8 text-xs bg-[var(--background)]"
          />
        </div>

        <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-1 text-xs">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap text-xs transition-colors ${
                categoryFilter === cat
                  ? 'bg-white text-black font-semibold'
                  : 'bg-[var(--card)] text-[var(--muted-foreground)] border border-[var(--border)] hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Templates Grid */}
      {loading ? (
        <div className="p-12 text-center text-xs text-[var(--muted-foreground)] border border-[var(--border)] rounded-2xl">
          Loading templates library...
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center text-xs text-[var(--muted-foreground)] border border-dashed border-[var(--border)] rounded-2xl">
          No templates match your search criteria.
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedTemplates.map((tpl) => (
              <div
                key={tpl.id}
                className="border border-[var(--border)] rounded-2xl bg-[var(--card)] p-5 shadow-sm flex flex-col justify-between hover:border-neutral-500 transition-all group"
              >
                <div>
                  {/* Header Badge */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[var(--surface)] text-[var(--foreground)] border border-[var(--border)]">
                      {tpl.category}
                    </span>
                    <span className="text-[10px] text-neutral-500 font-mono uppercase">
                      {tpl.triggerType}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <h3 className="font-bold text-sm tracking-tight text-[var(--foreground)] group-hover:text-white transition-colors">
                    {tpl.name}
                  </h3>
                  <p className="text-xs text-[var(--muted-foreground)] mt-1.5 mb-4 line-clamp-2 leading-relaxed">
                    {tpl.description}
                  </p>

                  {/* Steps Mini Flow Preview */}
                  <div className="p-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] mb-4 space-y-1.5">
                    <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                      Pipeline Steps ({tpl.definition?.nodes?.length || 0})
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {(tpl.definition?.nodes || []).map((node, i) => (
                        <React.Fragment key={node.id}>
                          <span className="px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-[10px] font-mono text-neutral-300">
                            {node.label}
                          </span>
                          {i < (tpl.definition?.nodes?.length || 0) - 1 && (
                            <span className="text-neutral-600 text-xs">→</span>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>

                  {/* Required Inputs */}
                  {tpl.requiredInputs && tpl.requiredInputs.length > 0 && (
                    <div className="text-[11px] text-[var(--muted-foreground)] flex items-center gap-1.5 font-mono mb-2">
                      <span className="text-neutral-500">Inputs:</span>
                      <span className="text-neutral-300">{tpl.requiredInputs.join(', ')}</span>
                    </div>
                  )}
                </div>

                {/* Action Button */}
                <div className="pt-3 border-t border-[var(--border)] flex justify-end">
                  <Link href={`/workflows/new?template=${tpl.id}`} className="w-full">
                    <Button className="w-full text-xs h-8 bg-white text-black hover:bg-neutral-200 font-semibold flex items-center justify-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" /> Use Template
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {filtered.length > pageSize && (
            <TablePagination
              page={page}
              totalPages={totalPages}
              totalItems={filtered.length}
              pageSize={pageSize}
              onPageChange={setPage}
              itemName="templates"
            />
          )}
        </div>
      )}
    </div>
  </div>
  );
}
