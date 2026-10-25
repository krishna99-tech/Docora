'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { Database, FileSpreadsheet, Play, CheckCircle2, AlertCircle } from 'lucide-react';

interface BulkModalProps {
  isOpen: boolean;
  onClose: () => void;
  workflowId: string;
}

export function WorkflowBulkModal({
  isOpen,
  onClose,
  workflowId,
}: BulkModalProps) {
  const [csvText, setCsvText] = useState(
    `customerName,totalAmount,currency\nAcme Corp,500,USD\nGlobex Systems,1200,USD\nStark Industries,3400,USD`
  );
  const [createZip, setCreateZip] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleRunBulk = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    try {
      const res = await api.bulkExecuteWorkflow(workflowId, {
        csvData: csvText,
        createZip,
      });

      setMessage(`Batch execution queued successfully! (Execution ID: ${res.id})`);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Bulk Document Generation">
      <form onSubmit={handleRunBulk} className="space-y-4 py-2 text-xs">
        <p className="text-[11px] text-[var(--muted-foreground)]">
          Paste CSV records to generate individual documents for each row in batch mode. The backend worker runs the pipeline asynchronously.
        </p>

        {message && (
          <div
            className={`p-2.5 rounded-lg border text-xs flex items-center gap-2 ${
              message.includes('Error')
                ? 'bg-red-950/20 border-red-900/50 text-red-400'
                : 'bg-emerald-950/20 border-emerald-900/50 text-emerald-400'
            }`}
          >
            {message.includes('Error') ? (
              <AlertCircle className="w-4 h-4 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            )}
            <span>{message}</span>
          </div>
        )}

        <div>
          <label className="text-xs font-semibold text-[var(--foreground)] block mb-1">
            CSV Records (First row must be column headers)
          </label>
          <textarea
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            rows={6}
            className="w-full font-mono text-[11px] p-2.5 rounded-lg border border-[var(--input)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none"
            placeholder="customerName,totalAmount,currency..."
            required
          />
        </div>

        <div className="flex items-center gap-2 pt-1">
          <input
            type="checkbox"
            id="bulkZip"
            checked={createZip}
            onChange={(e) => setCreateZip(e.target.checked)}
            className="rounded border-[var(--input)]"
          />
          <label htmlFor="bulkZip" className="font-semibold text-xs cursor-pointer">
            Archive all generated output documents into a downloadable ZIP bundle
          </label>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-[var(--border)]">
          <Button type="button" variant="outline" onClick={onClose} className="text-xs">
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={submitting}
            className="text-xs bg-white text-black hover:bg-neutral-200 font-semibold"
          >
            <Play className="w-3 h-3 mr-1.5" />
            {submitting ? 'Queuing Batch...' : 'Start Bulk Processing'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
