'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { WorkflowVersion } from '@/types';
import { History, RotateCcw, Check, Calendar } from 'lucide-react';

interface VersionModalProps {
  isOpen: boolean;
  onClose: () => void;
  workflowId: string;
  onRestored: () => void;
}

export function WorkflowVersionModal({
  isOpen,
  onClose,
  workflowId,
  onRestored,
}: VersionModalProps) {
  const [versions, setVersions] = useState<WorkflowVersion[]>([]);
  const [loading, setLoading] = useState(false);
  const [restoringVersion, setRestoringVersion] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen && workflowId) {
      loadVersions();
    }
  }, [isOpen, workflowId]);

  const loadVersions = async () => {
    setLoading(true);
    try {
      const res = await api.getWorkflowVersions(workflowId);
      if (Array.isArray(res)) {
        setVersions(res);
      }
    } catch {}
    setLoading(false);
  };

  const handleRestore = async (vNum: number) => {
    if (!confirm(`Are you sure you want to restore version ${vNum}? Current draft will be updated.`)) {
      return;
    }
    setRestoringVersion(vNum);
    try {
      await api.restoreWorkflowVersion(workflowId, vNum);
      onRestored();
      onClose();
    } catch (e: any) {
      alert(`Failed to restore: ${e.message}`);
    } finally {
      setRestoringVersion(null);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Workflow Version History">
      <div className="space-y-4 py-2 text-xs">
        <p className="text-[11px] text-[var(--muted-foreground)]">
          Audit previous revisions of this workflow pipeline. You can inspect snapshot timestamps and restore historical configurations.
        </p>

        {loading ? (
          <div className="p-8 text-center text-xs text-[var(--muted-foreground)]">
            Loading versions...
          </div>
        ) : versions.length === 0 ? (
          <div className="p-6 text-center text-xs text-[var(--muted-foreground)] border border-dashed border-[var(--border)] rounded-xl">
            No historical versions recorded yet.
          </div>
        ) : (
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {versions.map((ver, idx) => (
              <div
                key={ver.id}
                className="p-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] flex items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-[var(--foreground)]">
                      Version {ver.versionNumber}
                    </span>
                    {idx === 0 && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] bg-neutral-800 text-neutral-300 font-semibold uppercase">
                        Current
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-[var(--muted-foreground)] mt-0.5">
                    {ver.changeSummary || 'Workflow modification saved'}
                  </div>
                  <div className="text-[10px] text-neutral-500 font-mono flex items-center gap-1 mt-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(ver.createdAt).toLocaleString()}
                  </div>
                </div>

                {idx !== 0 && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRestore(ver.versionNumber)}
                    disabled={restoringVersion !== null}
                    className="text-xs h-7"
                  >
                    <RotateCcw className="w-3 h-3 mr-1" />
                    {restoringVersion === ver.versionNumber ? 'Restoring...' : 'Restore'}
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end pt-2 border-t border-[var(--border)]">
          <Button variant="outline" onClick={onClose} className="text-xs">
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}
