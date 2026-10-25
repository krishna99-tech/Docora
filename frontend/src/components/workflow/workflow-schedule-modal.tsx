'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { WorkflowSchedule } from '@/types';
import { Clock, CheckCircle2, AlertCircle } from 'lucide-react';

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  workflowId: string;
}

export function WorkflowScheduleModal({
  isOpen,
  onClose,
  workflowId,
}: ScheduleModalProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [frequency, setFrequency] = useState<'hourly' | 'daily' | 'weekly' | 'monthly' | 'cron'>('daily');
  const [timezone, setTimezone] = useState('UTC');
  const [cronExpression, setCronExpression] = useState('0 9 * * *');
  const [isActive, setIsActive] = useState(true);
  const [schedule, setSchedule] = useState<WorkflowSchedule | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && workflowId) {
      loadSchedule();
    }
  }, [isOpen, workflowId]);

  const loadSchedule = async () => {
    setLoading(true);
    try {
      const res = await api.getWorkflowSchedule(workflowId);
      if (res) {
        setSchedule(res);
        setFrequency(res.frequency);
        setTimezone(res.timezone || 'UTC');
        setCronExpression(res.cronExpression || '0 9 * * *');
        setIsActive(res.isActive);
      }
    } catch {}
    setLoading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const res = await api.saveWorkflowSchedule(workflowId, {
        frequency,
        timezone,
        cronExpression,
        isActive,
      });
      setSchedule(res);
      setMessage('Schedule saved successfully!');
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Configure Recurring Execution Schedule">
      <form onSubmit={handleSave} className="space-y-4 py-2 text-xs">
        <p className="text-[11px] text-[var(--muted-foreground)]">
          Automatically trigger this document pipeline on a recurring schedule. The Go scheduler evaluates due workflows every 30 seconds.
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

        {/* Frequency */}
        <div>
          <label className="text-xs font-semibold text-[var(--foreground)] block mb-1">
            Execution Frequency *
          </label>
          <select
            value={frequency}
            onChange={(e) => setFrequency(e.target.value as any)}
            className="w-full h-8 rounded-md border border-[var(--input)] bg-[var(--background)] px-2.5 text-xs text-[var(--foreground)]"
          >
            <option value="hourly">Every Hour</option>
            <option value="daily">Daily (Every 24 hours)</option>
            <option value="weekly">Weekly (Every 7 days)</option>
            <option value="monthly">Monthly (Every 30 days)</option>
            <option value="cron">Custom Cron Expression</option>
          </select>
        </div>

        {/* Custom Cron */}
        {frequency === 'cron' && (
          <div>
            <label className="text-xs font-semibold text-[var(--foreground)] block mb-1">
              Cron Expression
            </label>
            <input
              type="text"
              value={cronExpression}
              onChange={(e) => setCronExpression(e.target.value)}
              placeholder="e.g. 0 9 * * 1 (Every Monday at 9am)"
              className="w-full h-8 px-2.5 rounded-md border border-[var(--input)] bg-[var(--background)] font-mono text-xs"
            />
          </div>
        )}

        {/* Timezone */}
        <div>
          <label className="text-xs font-semibold text-[var(--foreground)] block mb-1">
            Timezone
          </label>
          <select
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className="w-full h-8 rounded-md border border-[var(--input)] bg-[var(--background)] px-2.5 text-xs text-[var(--foreground)]"
          >
            <option value="UTC">UTC (Coordinated Universal Time)</option>
            <option value="America/New_York">America/New_York (EST/EDT)</option>
            <option value="America/Los_Angeles">America/Los_Angeles (PST/PDT)</option>
            <option value="Europe/London">Europe/London (GMT/BST)</option>
            <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
            <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
          </select>
        </div>

        {/* Active Status Toggle */}
        <div className="flex items-center gap-2 pt-1">
          <input
            type="checkbox"
            id="schedActive"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="rounded border-[var(--input)]"
          />
          <label htmlFor="schedActive" className="font-semibold text-xs cursor-pointer">
            Enable recurring schedule execution
          </label>
        </div>

        {schedule?.nextRunAt && (
          <div className="p-2.5 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-[11px] text-[var(--muted-foreground)]">
            <span className="font-semibold text-[var(--foreground)]">Next Estimated Run:</span>{' '}
            {new Date(schedule.nextRunAt).toLocaleString()}
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end gap-2 pt-3 border-t border-[var(--border)]">
          <Button type="button" variant="outline" onClick={onClose} className="text-xs">
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={saving}
            className="text-xs bg-white text-black hover:bg-neutral-200 font-semibold"
          >
            <Clock className="w-3.5 h-3.5 mr-1" />
            {saving ? 'Saving...' : 'Save Schedule'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
