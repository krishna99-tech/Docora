'use client';

import React from 'react';
import { WorkflowNode, WorkflowEdge } from '@/types';
import {
  ArrowDown,
  ChevronDown,
  ChevronUp,
  Trash2,
  Settings,
  Plus,
  Play,
  FileText,
  Receipt,
  FileSpreadsheet,
  Split,
  Clock,
  CheckCircle,
  Database,
  Sliders,
  Archive,
  AlertTriangle,
  Send,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface StepListProps {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string) => void;
  onDeleteNode: (nodeId: string) => void;
  onReorderStep: (index: number, direction: 'up' | 'down') => void;
}

const getNodeIcon = (type: string) => {
  switch (type) {
    case 'trigger':
    case 'start':
    case 'manual':
      return Play;
    case 'scheduled':
      return Clock;
    case 'webhook':
      return Zap;
    case 'generate_receipt':
      return Receipt;
    case 'generate_invoice':
      return FileText;
    case 'generate_pdf':
      return FileSpreadsheet;
    case 'condition':
      return Split;
    case 'approval':
      return CheckCircle;
    case 'create_zip':
      return Archive;
    case 'delay':
      return Clock;
    case 'log_note':
      return Send;
    case 'stop':
      return AlertTriangle;
    default:
      return Sliders;
  }
};

export function WorkflowStepList({
  nodes,
  edges,
  selectedNodeId,
  onSelectNode,
  onDeleteNode,
  onReorderStep,
}: StepListProps) {
  if (nodes.length === 0) {
    return (
      <div className="flex-1 p-12 text-center text-xs text-[var(--muted-foreground)] flex flex-col items-center justify-center">
        <p className="font-semibold text-sm text-[var(--foreground)]">No Steps in Workflow</p>
        <p className="mt-1">Add nodes from the library to build your execution pipeline.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 max-w-3xl mx-auto w-full space-y-3">
      {nodes.map((node, idx) => {
        const Icon = getNodeIcon(node.type);
        const isSelected = node.id === selectedNodeId;
        const outgoing = edges.filter((e) => e.source === node.id);

        return (
          <div key={node.id} className="space-y-2">
            <div
              onClick={() => onSelectNode(node.id)}
              className={`p-3.5 rounded-xl border bg-[var(--card)] transition-all cursor-pointer flex items-center justify-between gap-3 ${
                isSelected
                  ? 'border-white ring-2 ring-white/10 shadow-lg'
                  : 'border-[var(--border)] hover:border-neutral-500'
              }`}
            >
              {/* Order number & Icon */}
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-neutral-900 border border-neutral-800 text-[11px] font-mono text-neutral-400 flex items-center justify-center font-bold">
                  {idx + 1}
                </span>

                <div className="p-2 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-300">
                  <Icon className="w-4 h-4" />
                </div>

                <div>
                  <div className="text-xs font-bold text-[var(--foreground)]">{node.label}</div>
                  <div className="text-[10px] text-neutral-500 uppercase tracking-wider font-mono">
                    {node.type}
                  </div>
                </div>
              </div>

              {/* Actions & Ordering */}
              <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                <button
                  disabled={idx === 0}
                  onClick={() => onReorderStep(idx, 'up')}
                  title="Move Up"
                  className="p-1.5 rounded-md text-[var(--muted-foreground)] hover:text-white hover:bg-[var(--surface)] disabled:opacity-30 disabled:pointer-events-none"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
                <button
                  disabled={idx === nodes.length - 1}
                  onClick={() => onReorderStep(idx, 'down')}
                  title="Move Down"
                  className="p-1.5 rounded-md text-[var(--muted-foreground)] hover:text-white hover:bg-[var(--surface)] disabled:opacity-30 disabled:pointer-events-none"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onSelectNode(node.id)}
                  title="Configure"
                  className="p-1.5 rounded-md text-[var(--muted-foreground)] hover:text-white hover:bg-[var(--surface)]"
                >
                  <Settings className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDeleteNode(node.id)}
                  title="Delete"
                  className="p-1.5 rounded-md text-red-400 hover:text-red-300 hover:bg-red-950/20"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Connecting arrow indicator between steps */}
            {idx < nodes.length - 1 && (
              <div className="flex justify-center">
                <ArrowDown className="w-4 h-4 text-neutral-600" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
