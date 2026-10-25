'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { DryRunResponse, WorkflowDefinition } from '@/types';
import { Play, CheckCircle2, XCircle, Clock, AlertCircle } from 'lucide-react';

interface DryRunModalProps {
  isOpen: boolean;
  onClose: () => void;
  workflowId?: string;
  definition: WorkflowDefinition;
}

export function WorkflowDryRunModal({
  isOpen,
  onClose,
  workflowId,
  definition,
}: DryRunModalProps) {
  const [sampleInputStr, setSampleInputStr] = useState(
    JSON.stringify(
      {
        customerName: 'Acme Global Inc.',
        totalAmount: 1250,
        currency: 'USD',
        isPaid: true,
      },
      null,
      2
    )
  );

  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<DryRunResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRunTest = async () => {
    setError(null);
    setResult(null);

    let parsedInput = {};
    try {
      parsedInput = JSON.parse(sampleInputStr);
    } catch (e: any) {
      setError('Invalid JSON in sample input: ' + e.message);
      return;
    }

    setRunning(true);
    try {
      const res = await api.dryRunWorkflow({
        definition,
        sampleInput: parsedInput,
      });
      setResult(res);
    } catch (err: any) {
      setError(err.message || 'Dry run simulation failed');
    } finally {
      setRunning(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Test Workflow (Dry Run)">
      <div className="space-y-4 py-2 text-xs">
        <p className="text-[11px] text-[var(--muted-foreground)]">
          Execute this workflow in-memory with sample payload. Validates conditions, required fields, and data mappings without creating permanent documents.
        </p>

        {/* Sample Input Editor */}
        <div>
          <label className="text-xs font-semibold text-[var(--foreground)] block mb-1">
            Sample Input Context (JSON)
          </label>
          <textarea
            value={sampleInputStr}
            onChange={(e) => setSampleInputStr(e.target.value)}
            rows={5}
            className="w-full font-mono text-[11px] p-2.5 rounded-lg border border-[var(--input)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none"
          />
        </div>

        {error && (
          <div className="p-2.5 rounded-lg bg-red-950/20 border border-red-900/50 text-red-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Results Panel */}
        {result && (
          <div className="space-y-3 pt-2 border-t border-[var(--border)]">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs">Simulation Results</span>
              <span
                className={`px-2 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                  result.success
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                    : 'bg-red-950 text-red-400 border border-red-800'
                }`}
              >
                {result.success ? 'Passed' : 'Failed'} ({result.durationMs}ms)
              </span>
            </div>

            {/* Steps Breakdown */}
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {result.stepResults.map((step, idx) => (
                <div
                  key={step.nodeId || idx}
                  className="p-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] flex items-center justify-between text-[11px]"
                >
                  <div className="flex items-center gap-2">
                    {step.status === 'completed' ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5 text-red-400" />
                    )}
                    <span className="font-semibold">{step.nodeLabel || step.nodeType}</span>
                    <span className="text-[10px] text-neutral-500 font-mono">({step.durationMs}ms)</span>
                  </div>
                  {step.errorMessage && (
                    <span className="text-red-400 text-[10px] truncate max-w-[140px]">
                      {step.errorMessage}
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Execution Logs */}
            {result.logs && result.logs.length > 0 && (
              <div>
                <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider block mb-1">
                  Simulation Trail
                </span>
                <div className="p-2 rounded bg-neutral-950 border border-neutral-900 font-mono text-[10px] text-neutral-400 space-y-0.5 max-h-24 overflow-y-auto">
                  {result.logs.map((log, i) => (
                    <div key={i}>{log}</div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-2 pt-3 border-t border-[var(--border)]">
          <Button variant="outline" onClick={onClose} className="text-xs">
            Close
          </Button>
          <Button
            onClick={handleRunTest}
            disabled={running}
            className="text-xs bg-white text-black hover:bg-neutral-200 font-semibold"
          >
            <Play className="w-3 h-3 mr-1.5" />
            {running ? 'Simulating...' : 'Run Dry Test'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
