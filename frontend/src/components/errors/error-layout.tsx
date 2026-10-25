'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Home,
  RotateCcw,
  FileText,
  Workflow,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ActionConfig {
  label: string;
  onClick?: () => void;
  href?: string;
  icon?: any;
}

interface ErrorLayoutProps {
  statusCode: string;
  badgeLabel?: string;
  title: string;
  description: string;
  illustration: React.ReactNode;
  primaryAction?: ActionConfig;
  secondaryAction?: ActionConfig;
  diagnosticDetails?: string | Record<string, any>;
  showQuickLinks?: boolean;
}

export function ErrorLayout({
  statusCode,
  badgeLabel = 'Error',
  title,
  description,
  illustration,
  primaryAction,
  secondaryAction,
  diagnosticDetails,
  showQuickLinks = true,
}: ErrorLayoutProps) {
  const router = useRouter();
  const [showDiagnostics, setShowDiagnostics] = useState(false);

  const handleSafeBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/dashboard');
    }
  };

  const defaultPrimary: ActionConfig = {
    label: 'Go to Dashboard',
    href: '/dashboard',
    icon: Home,
  };

  const defaultSecondary: ActionConfig = {
    label: 'Go Back',
    onClick: handleSafeBack,
    icon: ArrowLeft,
  };

  const finalPrimary: ActionConfig = primaryAction || defaultPrimary;
  const finalSecondary: ActionConfig = secondaryAction || defaultSecondary;

  const PrimaryIcon = finalPrimary.icon || Home;
  const SecondaryIcon = finalSecondary.icon || ArrowLeft;

  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center px-4 sm:px-6 py-12 text-center select-none">
      <div className="max-w-xl w-full flex flex-col items-center">
        {/* Subtle Illustration Container with floating animation */}
        <div className="mb-6 relative flex items-center justify-center text-[var(--foreground)] motion-safe:animate-pulse">
          {illustration}
        </div>

        {/* Status Code & Badge */}
        <div className="flex items-center gap-2.5 mb-3">
          <span className="font-mono text-3xl sm:text-4xl font-extrabold tracking-tight text-[var(--foreground)]">
            {statusCode}
          </span>
          <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[var(--surface)] text-[var(--muted-foreground)] border border-[var(--border)] font-mono">
            {badgeLabel}
          </span>
        </div>

        {/* Title */}
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--foreground)] mb-2">
          {title}
        </h1>

        {/* Description */}
        <p className="text-xs sm:text-sm text-[var(--muted-foreground)] leading-relaxed max-w-md mb-8">
          {description}
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          {finalPrimary.href ? (
            <Link href={finalPrimary.href} className="w-full sm:w-auto">
              <Button className="w-full sm:w-auto bg-white text-black hover:bg-neutral-200 text-xs font-semibold h-10 px-5 shadow-sm">
                <PrimaryIcon className="w-4 h-4 mr-2" />
                {finalPrimary.label}
              </Button>
            </Link>
          ) : (
            <Button
              onClick={finalPrimary.onClick}
              className="w-full sm:w-auto bg-white text-black hover:bg-neutral-200 text-xs font-semibold h-10 px-5 shadow-sm"
            >
              <PrimaryIcon className="w-4 h-4 mr-2" />
              {finalPrimary.label}
            </Button>
          )}

          {finalSecondary.href ? (
            <Link href={finalSecondary.href} className="w-full sm:w-auto">
              <Button
                variant="outline"
                className="w-full sm:w-auto text-xs font-semibold h-10 px-5 border-[var(--border)] hover:bg-[var(--surface)]"
              >
                <SecondaryIcon className="w-4 h-4 mr-2" />
                {finalSecondary.label}
              </Button>
            </Link>
          ) : (
            <Button
              variant="outline"
              onClick={finalSecondary.onClick}
              className="w-full sm:w-auto text-xs font-semibold h-10 px-5 border-[var(--border)] hover:bg-[var(--surface)]"
            >
              <SecondaryIcon className="w-4 h-4 mr-2" />
              {finalSecondary.label}
            </Button>
          )}
        </div>

        {/* Sanitized Diagnostic Info Drawer */}
        {diagnosticDetails && (
          <div className="w-full mt-8 pt-6 border-t border-[var(--border)] text-left">
            <button
              onClick={() => setShowDiagnostics(!showDiagnostics)}
              className="w-full flex items-center justify-between text-[11px] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors py-1"
            >
              <span className="flex items-center gap-1.5 font-mono">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Technical Trace Details</span>
              </span>
              {showDiagnostics ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>

            {showDiagnostics && (
              <div className="mt-2 p-3 rounded-xl bg-neutral-950 border border-neutral-900 font-mono text-[10px] text-neutral-300 overflow-x-auto max-h-36">
                {typeof diagnosticDetails === 'string' ? (
                  <div>{diagnosticDetails}</div>
                ) : (
                  <pre>{JSON.stringify(diagnosticDetails, null, 2)}</pre>
                )}
              </div>
            )}
          </div>
        )}

        {/* Quick Links Footer */}
        {showQuickLinks && (
          <div className="mt-10 pt-6 border-t border-[var(--border)] flex items-center justify-center gap-6 text-xs text-[var(--muted-foreground)]">
            <Link href="/documents" className="hover:text-white transition-colors flex items-center gap-1">
              <FileText className="w-3 h-3" /> Documents
            </Link>
            <span>•</span>
            <Link href="/workflows" className="hover:text-white transition-colors flex items-center gap-1">
              <Workflow className="w-3 h-3" /> Workflows
            </Link>
            <span>•</span>
            <Link href="/templates" className="hover:text-white transition-colors flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Templates
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
