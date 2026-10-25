'use client';

import React from 'react';
import { WorkflowNode } from '@/types';
import { Trash2, X, Settings2, Sliders } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ConfigPanelProps {
  node: WorkflowNode | null;
  onUpdateNode: (updated: WorkflowNode) => void;
  onDeleteNode: (nodeId: string) => void;
  onClose: () => void;
}

export function WorkflowConfigPanel({
  node,
  onUpdateNode,
  onDeleteNode,
  onClose,
}: ConfigPanelProps) {
  if (!node) {
    return (
      <div className="w-80 h-full border-l border-[var(--border)] bg-[var(--card)] p-6 flex flex-col items-center justify-center text-center text-xs text-[var(--muted-foreground)]">
        <Settings2 className="w-8 h-8 opacity-40 mb-2" />
        <p className="font-semibold text-[var(--foreground)]">No Step Selected</p>
        <p className="mt-1">Click any node on the canvas to configure its settings and data mappings.</p>
      </div>
    );
  }

  const data = node.data || {};

  const handleDataChange = (key: string, value: any) => {
    onUpdateNode({
      ...node,
      data: {
        ...data,
        [key]: value,
      },
    });
  };

  const handleLabelChange = (newLabel: string) => {
    onUpdateNode({
      ...node,
      label: newLabel,
    });
  };

  return (
    <div className="w-80 h-full border-l border-[var(--border)] bg-[var(--card)] flex flex-col text-xs select-none">
      {/* Header */}
      <div className="p-3.5 border-b border-[var(--border)] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-neutral-400" />
          <span className="font-bold text-xs uppercase tracking-wider text-[var(--foreground)]">
            Step Configuration
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-md text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--surface)]"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content Form */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Step Label */}
        <div>
          <label className="text-[11px] font-semibold text-[var(--muted-foreground)] block mb-1">
            Step Label
          </label>
          <Input
            value={node.label}
            onChange={(e) => handleLabelChange(e.target.value)}
            className="h-8 text-xs bg-[var(--background)]"
          />
        </div>

        {/* Node Type Metadata */}
        <div className="p-2.5 rounded-lg bg-[var(--surface)] border border-[var(--border)] space-y-1">
          <div className="flex justify-between text-[11px]">
            <span className="text-[var(--muted-foreground)]">Node Type:</span>
            <span className="font-mono font-semibold">{node.type}</span>
          </div>
          <div className="flex justify-between text-[11px]">
            <span className="text-[var(--muted-foreground)]">Node ID:</span>
            <span className="font-mono text-neutral-500">{node.id}</span>
          </div>
        </div>

        {/* Specific Configuration based on node type */}
        {node.type === 'condition' && (
          <div className="space-y-3 pt-2 border-t border-[var(--border)]">
            <span className="font-semibold text-xs text-[var(--foreground)] block">
              Condition Rules
            </span>

            <div>
              <label className="text-[11px] text-[var(--muted-foreground)] block mb-1">
                Context Field Name
              </label>
              <Input
                value={data.field || ''}
                onChange={(e) => handleDataChange('field', e.target.value)}
                placeholder="e.g. totalAmount or isPaid"
                className="h-8 text-xs"
              />
            </div>

            <div>
              <label className="text-[11px] text-[var(--muted-foreground)] block mb-1">
                Comparison Operator
              </label>
              <select
                value={data.operator || 'equals'}
                onChange={(e) => handleDataChange('operator', e.target.value)}
                className="w-full h-8 rounded-md border border-[var(--input)] bg-[var(--background)] px-2.5 text-xs text-[var(--foreground)]"
              >
                <option value="equals">Equals (==)</option>
                <option value="not_equals">Not Equals (!=)</option>
                <option value="greater_than">Greater Than (&gt;)</option>
                <option value="less_than">Less Than (&lt;)</option>
                <option value="contains">Contains Text</option>
                <option value="is_empty">Is Empty</option>
                <option value="is_not_empty">Is Not Empty</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] text-[var(--muted-foreground)] block mb-1">
                Expected Value
              </label>
              <Input
                value={data.value || ''}
                onChange={(e) => handleDataChange('value', e.target.value)}
                placeholder="e.g. 1000 or true"
                className="h-8 text-xs"
              />
            </div>

            <p className="text-[11px] text-neutral-400 bg-neutral-900/60 p-2 rounded border border-neutral-800">
              When true, workflow routes through the <strong className="text-emerald-400">True</strong> edge.
              Otherwise, it routes through the <strong className="text-amber-400">False</strong> edge.
            </p>
          </div>
        )}

        {node.type === 'validate_fields' && (
          <div className="space-y-3 pt-2 border-t border-[var(--border)]">
            <span className="font-semibold text-xs text-[var(--foreground)] block">
              Required Fields
            </span>
            <p className="text-[11px] text-[var(--muted-foreground)]">
              Comma-separated field names that must be present in execution data.
            </p>
            <Input
              value={(data.requiredFields || []).join(', ')}
              onChange={(e) =>
                handleDataChange(
                  'requiredFields',
                  e.target.value.split(',').map((s) => s.trim()).filter(Boolean)
                )
              }
              placeholder="e.g. customerName, totalAmount, issueDate"
              className="h-8 text-xs"
            />
          </div>
        )}

        {node.type === 'delay' && (
          <div className="space-y-3 pt-2 border-t border-[var(--border)]">
            <span className="font-semibold text-xs text-[var(--foreground)] block">
              Delay Duration
            </span>
            <div>
              <label className="text-[11px] text-[var(--muted-foreground)] block mb-1">
                Seconds (max 10s)
              </label>
              <Input
                type="number"
                min="1"
                max="10"
                value={data.seconds || 2}
                onChange={(e) => handleDataChange('seconds', parseFloat(e.target.value) || 1)}
                className="h-8 text-xs"
              />
            </div>
          </div>
        )}

        {node.type === 'log_note' && (
          <div className="space-y-3 pt-2 border-t border-[var(--border)]">
            <span className="font-semibold text-xs text-[var(--foreground)] block">
              Audit Note
            </span>
            <textarea
              value={data.note || ''}
              onChange={(e) => handleDataChange('note', e.target.value)}
              placeholder="Record note in execution logs..."
              className="w-full h-20 p-2.5 rounded-lg border border-[var(--input)] bg-[var(--background)] text-xs text-[var(--foreground)] focus:outline-none"
            />
          </div>
        )}

        {node.type === 'generate_receipt' && (
          <div className="space-y-3 pt-2 border-t border-[var(--border)]">
            <span className="font-semibold text-xs text-[var(--foreground)] block">
              Receipt Defaults
            </span>
            <div>
              <label className="text-[11px] text-[var(--muted-foreground)] block mb-1">
                Currency
              </label>
              <Input
                value={data.currency || 'USD'}
                onChange={(e) => handleDataChange('currency', e.target.value)}
                placeholder="USD"
                className="h-8 text-xs"
              />
            </div>
          </div>
        )}

        {node.type === 'generate_invoice' && (
          <div className="space-y-3 pt-2 border-t border-[var(--border)]">
            <span className="font-semibold text-xs text-[var(--foreground)] block">
              Invoice Defaults
            </span>
            <div>
              <label className="text-[11px] text-[var(--muted-foreground)] block mb-1">
                Payment Terms
              </label>
              <Input
                value={data.paymentTerms || 'Net 30'}
                onChange={(e) => handleDataChange('paymentTerms', e.target.value)}
                placeholder="Net 30"
                className="h-8 text-xs"
              />
            </div>
          </div>
        )}

        {node.type === 'generate_pdf' && (
          <div className="space-y-3 pt-2 border-t border-[var(--border)]">
            <span className="font-semibold text-xs text-[var(--foreground)] block">
              PDF Document Settings
            </span>
            <div>
              <label className="text-[11px] text-[var(--muted-foreground)] block mb-1">
                Orientation
              </label>
              <select
                value={data.orientation || 'portrait'}
                onChange={(e) => handleDataChange('orientation', e.target.value)}
                className="w-full h-8 rounded-md border border-[var(--input)] bg-[var(--background)] px-2.5 text-xs text-[var(--foreground)]"
              >
                <option value="portrait">Portrait</option>
                <option value="landscape">Landscape</option>
              </select>
            </div>
          </div>
        )}
        {node.type === 'approval' && (
          <div className="space-y-3 pt-2 border-t border-[var(--border)]">
            <span className="font-semibold text-xs text-[var(--foreground)] block">
              Approval Requirements
            </span>
            <div>
              <label className="text-[11px] text-[var(--muted-foreground)] block mb-1">
                Approval Prompt / Reason
              </label>
              <Input
                value={data.prompt || ''}
                onChange={(e) => handleDataChange('prompt', e.target.value)}
                placeholder="e.g. Document exceeds $5,000 threshold"
                className="h-8 text-xs"
              />
            </div>
            <div>
              <label className="text-[11px] text-[var(--muted-foreground)] block mb-1">
                Required Role
              </label>
              <select
                value={data.requiredRole || 'admin'}
                onChange={(e) => handleDataChange('requiredRole', e.target.value)}
                className="w-full h-8 rounded-md border border-[var(--input)] bg-[var(--background)] px-2.5 text-xs text-[var(--foreground)]"
              >
                <option value="member">Any Member</option>
                <option value="admin">Admin Only</option>
                <option value="owner">Workspace Owner</option>
              </select>
            </div>
            <p className="text-[11px] text-amber-400/90 bg-amber-950/20 p-2 rounded border border-amber-900/30">
              Workflow will pause in <strong>WAITING_APPROVAL</strong> state until an authorized workspace member approves or rejects it.
            </p>
          </div>
        )}

        {node.type === 'sub_workflow' && (
          <div className="space-y-3 pt-2 border-t border-[var(--border)]">
            <span className="font-semibold text-xs text-[var(--foreground)] block">
              Sub-Workflow Invocation
            </span>
            <div>
              <label className="text-[11px] text-[var(--muted-foreground)] block mb-1">
                Target Workflow ID
              </label>
              <Input
                value={data.workflowId || ''}
                onChange={(e) => handleDataChange('workflowId', e.target.value)}
                placeholder="Paste Target Workflow UUID"
                className="h-8 text-xs font-mono"
              />
            </div>
            <p className="text-[11px] text-neutral-400">
              Executes the target workflow synchronously with current execution context.
            </p>
          </div>
        )}

        {node.type === 'parallel' && (
          <div className="space-y-3 pt-2 border-t border-[var(--border)]">
            <span className="font-semibold text-xs text-[var(--foreground)] block">
              Parallel Execution
            </span>
            <p className="text-[11px] text-neutral-400 bg-neutral-900/60 p-2.5 rounded border border-neutral-800 leading-relaxed">
              All outgoing connections from this node will execute in parallel goroutines concurrently.
            </p>
          </div>
        )}

        {node.type === 'transform_data' && (
          <div className="space-y-3 pt-2 border-t border-[var(--border)]">
            <span className="font-semibold text-xs text-[var(--foreground)] block">
              Data Field Transformation
            </span>
            <div>
              <label className="text-[11px] text-[var(--muted-foreground)] block mb-1">
                JSON Mappings (key-value)
              </label>
              <textarea
                value={typeof data.mappings === 'string' ? data.mappings : JSON.stringify(data.mappings || {}, null, 2)}
                onChange={(e) => {
                  try {
                    handleDataChange('mappings', JSON.parse(e.target.value));
                  } catch {
                    handleDataChange('mappings', e.target.value);
                  }
                }}
                rows={4}
                placeholder={'{\n  "outputField": "inputField"\n}'}
                className="w-full p-2 rounded-lg border border-[var(--input)] bg-[var(--background)] font-mono text-[11px] text-[var(--foreground)] focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* Retry & Fault Tolerance Settings */}
        {node.type !== 'trigger' && node.type !== 'scheduled' && node.type !== 'webhook' && (
          <div className="space-y-3 pt-3 border-t border-[var(--border)]">
            <span className="font-semibold text-xs text-[var(--foreground)] block">
              Retry & Fault Tolerance
            </span>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-[var(--muted-foreground)] block mb-1">
                  Max Retries
                </label>
                <Input
                  type="number"
                  min="0"
                  max="5"
                  value={data.retryPolicy?.maxAttempts !== undefined ? data.retryPolicy.maxAttempts : 3}
                  onChange={(e) =>
                    handleDataChange('retryPolicy', {
                      ...(data.retryPolicy || {}),
                      maxAttempts: parseInt(e.target.value, 10) || 0,
                    })
                  }
                  className="h-7 text-xs"
                />
              </div>
              <div>
                <label className="text-[10px] text-[var(--muted-foreground)] block mb-1">
                  Initial Delay (ms)
                </label>
                <Input
                  type="number"
                  min="100"
                  step="100"
                  value={data.retryPolicy?.initialBackoffMs !== undefined ? data.retryPolicy.initialBackoffMs : 500}
                  onChange={(e) =>
                    handleDataChange('retryPolicy', {
                      ...(data.retryPolicy || {}),
                      initialBackoffMs: parseInt(e.target.value, 10) || 500,
                    })
                  }
                  className="h-7 text-xs"
                />
              </div>
            </div>
            <p className="text-[10px] text-neutral-500">
              Uses exponential backoff with jitter on network/transient failures.
            </p>
          </div>
        )}
      </div>

      {/* Delete Action Footer */}
      <div className="p-3 border-t border-[var(--border)] bg-[var(--surface)]">
        <Button
          variant="outline"
          onClick={() => onDeleteNode(node.id)}
          className="w-full h-8 text-xs text-red-400 border-red-900/40 hover:bg-red-950/20"
        >
          <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Remove Step
        </Button>
      </div>
    </div>
  );
}
