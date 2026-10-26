'use client';

import React from 'react';
import {
  Play,
  FileText,
  Receipt,
  FileSpreadsheet,
  Split,
  Clock,
  CheckCircle,
  Database,
  Filter,
  CheckSquare,
  Repeat,
  Sliders,
  Archive,
  AlertTriangle,
  Send,
  Zap,
  GitBranch,
  GitFork,
  ChevronLeft,
  ChevronRight,
  Plus,
} from 'lucide-react';

export interface NodeDefinition {
  type: string;
  label: string;
  category: 'Triggers' | 'Documents' | 'Data Processing' | 'Logic' | 'Utilities';
  icon: any;
  description: string;
  defaultData: Record<string, any>;
}

export const AVAILABLE_NODES: NodeDefinition[] = [
  // Triggers
  {
    type: 'trigger',
    label: 'Manual Trigger',
    category: 'Triggers',
    icon: Play,
    description: 'Triggered manually by a user or test run.',
    defaultData: {},
  },
  {
    type: 'scheduled',
    label: 'Scheduled Clock',
    category: 'Triggers',
    icon: Clock,
    description: 'Runs on a recurring schedule (hourly, daily, weekly).',
    defaultData: { frequency: 'daily' },
  },
  {
    type: 'webhook',
    label: 'Inbound Webhook',
    category: 'Triggers',
    icon: Zap,
    description: 'Triggered when an external service calls webhook URL.',
    defaultData: {},
  },

  // Document Nodes
  {
    type: 'generate_receipt',
    label: 'Generate Receipt',
    category: 'Documents',
    icon: Receipt,
    description: 'Generates a branded payment receipt PDF.',
    defaultData: { currency: 'USD' },
  },
  {
    type: 'generate_invoice',
    label: 'Generate Invoice',
    category: 'Documents',
    icon: FileText,
    description: 'Generates an itemized commercial invoice PDF.',
    defaultData: { paymentTerms: 'Net 30' },
  },
  {
    type: 'generate_pdf',
    label: 'General PDF Document',
    category: 'Documents',
    icon: FileSpreadsheet,
    description: 'Generates structured report with headings and tables.',
    defaultData: { orientation: 'portrait' },
  },
  {
    type: 'create_zip',
    label: 'Create ZIP Archive',
    category: 'Documents',
    icon: Archive,
    description: 'Compiles all generated PDFs into a single ZIP archive.',
    defaultData: {},
  },

  // Data Processing
  {
    type: 'validate_fields',
    label: 'Validate Fields',
    category: 'Data Processing',
    icon: CheckSquare,
    description: 'Ensures required keys are present in context.',
    defaultData: { requiredFields: ['customerName'] },
  },
  {
    type: 'parse_csv',
    label: 'Parse CSV Data',
    category: 'Data Processing',
    icon: Database,
    description: 'Parses raw CSV string into structured array records.',
    defaultData: {},
  },
  {
    type: 'parse_json',
    label: 'Parse JSON Data',
    category: 'Data Processing',
    icon: Database,
    description: 'Parses payload JSON into accessible variables.',
    defaultData: {},
  },
  {
    type: 'transform_data',
    label: 'Transform & Map Fields',
    category: 'Data Processing',
    icon: Sliders,
    description: 'Renames, maps, or formats data fields.',
    defaultData: { mappings: {} },
  },
  {
    type: 'filter_records',
    label: 'Filter Records',
    category: 'Data Processing',
    icon: Filter,
    description: 'Filters record items based on matching criteria.',
    defaultData: {},
  },

  // Logic & Conditions
  {
    type: 'condition',
    label: 'If / Else Branch',
    category: 'Logic',
    icon: Split,
    description: 'Evaluates condition and routes to True or False edge.',
    defaultData: { field: 'totalAmount', operator: 'greater_than', value: '100' },
  },
  {
    type: 'approval',
    label: 'Executive Approval',
    category: 'Logic',
    icon: CheckCircle,
    description: 'Pauses workflow until an authorized user reviews it.',
    defaultData: { prompt: 'Requires executive review' },
  },
  {
    type: 'sub_workflow',
    label: 'Sub-Workflow',
    category: 'Logic',
    icon: GitBranch,
    description: 'Invokes another published workflow as a modular reusable component.',
    defaultData: { workflowId: '' },
  },
  {
    type: 'parallel',
    label: 'Parallel Branch',
    category: 'Logic',
    icon: GitFork,
    description: 'Forks execution across multiple parallel branches concurrently.',
    defaultData: {},
  },

  // Utilities
  {
    type: 'delay',
    label: 'Delay Step',
    category: 'Utilities',
    icon: Clock,
    description: 'Pauses execution for a specified number of seconds.',
    defaultData: { seconds: 2 },
  },
  {
    type: 'log_note',
    label: 'Audit Log Note',
    category: 'Utilities',
    icon: Send,
    description: 'Records a structured note in the execution trail.',
    defaultData: { note: 'Workflow milestone reached' },
  },
  {
    type: 'stop',
    label: 'Stop Execution',
    category: 'Utilities',
    icon: AlertTriangle,
    description: 'Terminates execution early with a custom status.',
    defaultData: {},
  },
];

interface NodeLibraryProps {
  onAddNode: (type: string, label: string, defaultData: Record<string, any>) => void;
}

export function WorkflowNodeLibrary({ onAddNode }: NodeLibraryProps) {
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const [selectedCat, setSelectedCat] = React.useState<string>('All');

  const categories = ['All', 'Triggers', 'Documents', 'Data', 'Logic', 'Utilities'];

  const filteredNodes = AVAILABLE_NODES.filter((n) => {
    const matchesSearch =
      n.label.toLowerCase().includes(search.toLowerCase()) ||
      n.description.toLowerCase().includes(search.toLowerCase());
    const matchesCat =
      selectedCat === 'All' ||
      n.category === selectedCat ||
      (selectedCat === 'Data' && n.category === 'Data Processing');
    return matchesSearch && matchesCat;
  });

  if (isCollapsed) {
    return (
      <div className="flex flex-col items-center h-full bg-[var(--card)] border-r border-[var(--border)] w-12 shrink-0 py-3 select-none">
        <button
          onClick={() => setIsCollapsed(false)}
          title="Expand Node Library"
          className="p-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-hover)] text-[var(--foreground)] transition-colors cursor-pointer"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
        <div className="mt-8 [writing-mode:vertical-rl] rotate-180 text-[10px] font-bold uppercase tracking-widest text-[var(--muted-foreground)] flex items-center gap-2">
          <span>Node Library</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[var(--card)] border-r border-[var(--border)] w-72 shrink-0 select-none">
      {/* Header */}
      <div className="p-3.5 border-b border-[var(--border)]">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
            Node Library
          </h3>
          <button
            onClick={() => setIsCollapsed(true)}
            title="Collapse Library"
            className="p-1 rounded-md text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--surface)] transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search steps..."
          className="w-full h-8 px-2.5 text-xs rounded-md bg-[var(--background)] border border-[var(--input)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:border-neutral-500"
        />
      </div>

      {/* Category Pills */}
      <div className="p-2 border-b border-[var(--border)] flex gap-1 overflow-x-auto scrollbar-none text-[10px]">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCat(cat)}
            className={`px-2.5 py-1 rounded-md whitespace-nowrap transition-all cursor-pointer ${
              selectedCat === cat
                ? 'bg-[var(--brand-from)] text-white font-semibold shadow-xs'
                : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--surface)]'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Node Items */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {filteredNodes.map((item) => {
          const Icon = item.icon;
          const catStyle = (() => {
            switch (item.category) {
              case 'Triggers':
                return {
                  badge: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
                  icon: 'bg-amber-500/10 border-amber-500/30 text-amber-500 group-hover:bg-amber-500 group-hover:text-white',
                };
              case 'Documents':
                return {
                  badge: 'text-sky-500 bg-sky-500/10 border-sky-500/20',
                  icon: 'bg-sky-500/10 border-sky-500/30 text-sky-500 group-hover:bg-sky-500 group-hover:text-white',
                };
              case 'Data Processing':
                return {
                  badge: 'text-teal-500 bg-teal-500/10 border-teal-500/20',
                  icon: 'bg-teal-500/10 border-teal-500/30 text-teal-500 group-hover:bg-teal-500 group-hover:text-white',
                };
              case 'Logic':
                return {
                  badge: 'text-purple-500 bg-purple-500/10 border-purple-500/20',
                  icon: 'bg-purple-500/10 border-purple-500/30 text-purple-500 group-hover:bg-purple-500 group-hover:text-white',
                };
              case 'Utilities':
              default:
                return {
                  badge: 'text-rose-500 bg-rose-500/10 border-rose-500/20',
                  icon: 'bg-rose-500/10 border-rose-500/30 text-rose-500 group-hover:bg-rose-500 group-hover:text-white',
                };
            }
          })();

          return (
            <div
              key={item.type}
              onClick={() => onAddNode(item.type, item.label, item.defaultData)}
              className="group p-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] hover:bg-[var(--surface)] hover:border-[var(--brand-from)] cursor-pointer transition-all flex items-start gap-2.5 shadow-xs hover:shadow-sm"
            >
              <div className={`p-2 rounded-lg border transition-all duration-200 ${catStyle.icon}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[var(--foreground)] truncate group-hover:text-[var(--brand-from)] transition-colors">
                    {item.label}
                  </span>
                  <span className={`text-[9px] uppercase tracking-wider font-mono px-1.5 py-0.5 rounded border ${catStyle.badge}`}>
                    {item.category.slice(0, 4)}
                  </span>
                </div>
                <p className="text-[11px] text-[var(--muted-foreground)] line-clamp-2 mt-0.5 leading-snug">
                  {item.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
