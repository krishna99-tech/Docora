'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { RefreshCw, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { ErrorLayout } from '@/components/errors/error-layout';
import { IllustrationMaintenance } from '@/components/errors/error-illustrations';

function MaintenanceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [checking, setChecking] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusType, setStatusType] = useState<'success' | 'info' | 'error' | null>(null);

  // Read estimated completion time ONLY if provided via query params or headers
  // Never invent an ETA
  const estimatedTime = searchParams?.get('eta') || searchParams?.get('estimated') || null;

  const handleCheckAvailability = async () => {
    setChecking(true);
    setStatusMessage(null);
    setStatusType(null);

    try {
      // Check service health
      const res = await fetch('/api/health', {
        method: 'GET',
        cache: 'no-store',
      });

      if (res.ok) {
        setStatusType('success');
        setStatusMessage('Services have returned online! Redirecting you to the dashboard...');
        setTimeout(() => {
          router.push('/dashboard');
        }, 1500);
      } else {
        setStatusType('info');
        setStatusMessage('Scheduled maintenance is still underway. Please check back shortly.');
      }
    } catch {
      setStatusType('info');
      setStatusMessage('Scheduled maintenance is still in progress. Please check back shortly.');
    } finally {
      setChecking(false);
    }
  };

  const descriptionText = estimatedTime
    ? `We are performing planned upgrades to our document-processing infrastructure. Estimated completion: ${estimatedTime}. We apologize for any temporary inconvenience.`
    : 'We are currently performing scheduled maintenance and routine system upgrades to improve the reliability and speed of our document engine. We will be back online shortly.';

  return (
    <div className="w-full flex flex-col items-center">
      <ErrorLayout
        statusCode="503"
        badgeLabel="Planned Maintenance"
        title="We'll Be Back Soon"
        description={descriptionText}
        illustration={<IllustrationMaintenance className="w-64 h-48 sm:w-72 sm:h-52" />}
        primaryAction={{
          label: checking ? 'Checking Status...' : 'Check Availability',
          onClick: handleCheckAvailability,
          icon: RefreshCw,
        }}
        secondaryAction={{
          label: 'Go to Dashboard',
          href: '/dashboard',
        }}
        showQuickLinks={false}
      />

      {/* ETA pill if provided */}
      {estimatedTime && (
        <div className="-mt-6 mb-8 inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[var(--border)] bg-[var(--surface)] text-xs text-[var(--foreground)] font-mono">
          <Clock className="w-3.5 h-3.5 text-neutral-400" />
          <span>Expected Return: <strong className="text-white">{estimatedTime}</strong></span>
        </div>
      )}

      {/* Live status check feedback banner */}
      {statusMessage && (
        <div
          className={`-mt-4 mb-8 max-w-md w-full mx-4 p-3.5 rounded-lg border text-xs flex items-center gap-2.5 transition-all animate-in fade-in slide-in-from-top-2 ${
            statusType === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : statusType === 'error'
              ? 'bg-red-500/10 border-red-500/30 text-red-300'
              : 'bg-neutral-900 border-neutral-700 text-neutral-300'
          }`}
        >
          {statusType === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-neutral-400 shrink-0" />
          )}
          <span>{statusMessage}</span>
        </div>
      )}
    </div>
  );
}

export default function MaintenancePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[85vh] flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-[var(--border)] border-t-[var(--foreground)] animate-spin" />
        </div>
      }
    >
      <MaintenanceContent />
    </Suspense>
  );
}
