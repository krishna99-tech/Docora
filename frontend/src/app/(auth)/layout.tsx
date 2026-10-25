'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ShieldCheck,
  FileText,
  Zap,
  Lock,
  CheckCircle2,
  Users,
  Workflow,
  Wrench,
  KeyRound,
  MailCheck,
} from 'lucide-react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isRegister = pathname?.includes('/register');
  const isForgotPassword = pathname?.includes('/forgot-password');
  const isVerifyOtp = pathname?.includes('/verify-otp');
  const isResetPassword = pathname?.includes('/reset-password');

  // Dynamic content tailored for each auth route
  let showcaseContent = {
    badgeIcon: Lock,
    badgeText: 'Enterprise Workspace Access',
    title: 'Welcome back to your Document Operations hub.',
    description:
      'Access your verified invoices, process PDF jobs in parallel, and manage approvals across all your multi-tenant workspaces.',
    cardFilename: 'REC-2026-0842.pdf',
    cardBadgeIcon: CheckCircle2,
    cardBadgeText: 'SESSION SECURED',
    cardBadgeColor: 'text-sky-400 bg-sky-950/60 border-sky-800/60',
    cardProgressWidth: 'w-full',
    cardStatus: 'Workspace: Production Active',
    cardStat: 'Multi-Tenant RBAC Active',
    feature1Icon: Users,
    feature1Title: 'Workspace Permissions',
    feature1Desc: 'Granular owner, admin, editor, and viewer roles.',
    feature2Icon: Workflow,
    feature2Title: 'Workflow Automation',
    feature2Desc: 'Review and approve multi-step pipeline actions.',
  };

  if (isRegister) {
    showcaseContent = {
      badgeIcon: Zap,
      badgeText: 'Start in Seconds',
      title: 'Create, process, verify, and automate digital documents.',
      description:
        'From pixel-perfect receipts and invoices to cryptographic SHA-256 byte integrity checks and PDF manipulation utilities.',
      cardFilename: 'INV-2026-0001.pdf',
      cardBadgeIcon: ShieldCheck,
      cardBadgeText: 'SHA-256 VERIFIED',
      cardBadgeColor: 'text-emerald-400 bg-emerald-950/60 border-emerald-800/60',
      cardProgressWidth: 'w-3/4',
      cardStatus: 'Status: Finalized & Immutable',
      cardStat: '100% Binary Accuracy',
      feature1Icon: Lock,
      feature1Title: 'Zero-Trust Verification',
      feature1Desc: 'Cryptographic hash checking on stored PDF binaries.',
      feature2Icon: Wrench,
      feature2Title: 'Native PDF Utilities',
      feature2Desc: 'Merge, split, compress, watermark, and reorder.',
    };
  } else if (isForgotPassword) {
    showcaseContent = {
      badgeIcon: KeyRound,
      badgeText: 'Account Recovery',
      title: 'Zero-friction recovery for your workspace credentials.',
      description:
        'Protected by cryptographic time-limited tokens and enterprise rate-limiting to ensure your organization stays safe.',
      cardFilename: 'AUTH-RESET-TOKEN.tmp',
      cardBadgeIcon: CheckCircle2,
      cardBadgeText: 'TOKEN GENERATED',
      cardBadgeColor: 'text-amber-400 bg-amber-950/60 border-amber-800/60',
      cardProgressWidth: 'w-1/2',
      cardStatus: 'Status: Awaiting Email Verification',
      cardStat: '15m Expiration Window',
      feature1Icon: Lock,
      feature1Title: 'Token Hashing',
      feature1Desc: 'One-time recovery secrets stored with SHA-256 digests.',
      feature2Icon: Users,
      feature2Title: 'Session Revocation',
      feature2Desc: 'Existing sessions revoked upon successful password reset.',
    };
  } else if (isVerifyOtp) {
    showcaseContent = {
      badgeIcon: MailCheck,
      badgeText: 'Two-Factor Authentication',
      title: 'One-time code email verification.',
      description:
        'Ensuring only authorized team members can access invoices, business profiles, and cryptographic verification keys.',
      cardFilename: 'EMAIL-OTP-CHALLENGE',
      cardBadgeIcon: ShieldCheck,
      cardBadgeText: '6-DIGIT CODE ACTIVE',
      cardBadgeColor: 'text-indigo-400 bg-indigo-950/60 border-indigo-800/60',
      cardProgressWidth: 'w-5/6',
      cardStatus: 'Delivery: Direct In-Memory Dispatch',
      cardStat: 'Rate-Limited Protection',
      feature1Icon: Lock,
      feature1Title: 'Anti-Brute Force',
      feature1Desc: 'IP and token-based rate limits protect against attacks.',
      feature2Icon: Zap,
      feature2Title: 'Instant Verification',
      feature2Desc: 'Fast verification and automatic credential update.',
    };
  } else if (isResetPassword) {
    showcaseContent = {
      badgeIcon: Lock,
      badgeText: 'Credential Security',
      title: 'Set a strong, new password for your account.',
      description:
        'Keep your customer data, business profiles, and immutable document records fully protected behind modern cryptography.',
      cardFilename: 'CREDENTIAL-VAULT',
      cardBadgeIcon: ShieldCheck,
      cardBadgeText: 'SALTED BCRYPT',
      cardBadgeColor: 'text-emerald-400 bg-emerald-950/60 border-emerald-800/60',
      cardProgressWidth: 'w-full',
      cardStatus: 'Status: Setting New Security Key',
      cardStat: 'End-to-End Cryptography',
      feature1Icon: Lock,
      feature1Title: 'Bcrypt Hashing',
      feature1Desc: 'Zero plaintext passwords in storage or database.',
      feature2Icon: Workflow,
      feature2Title: 'Workspace Access',
      feature2Desc: 'Automatic re-authentication to all assigned workspaces.',
    };
  }

  const BadgeIcon = showcaseContent.badgeIcon;
  const CardBadgeIcon = showcaseContent.cardBadgeIcon;
  const Feature1Icon = showcaseContent.feature1Icon;
  const Feature2Icon = showcaseContent.feature2Icon;

  return (
    <div className="min-h-screen w-full grid grid-cols-1 lg:grid-cols-2 bg-[var(--background)]">
      {/* LEFT PANEL: Dynamic SaaS Product Showcase (Desktop only) */}
      <div className="hidden lg:flex flex-col justify-between p-12 bg-neutral-950 text-neutral-100 border-r border-neutral-800 relative overflow-hidden select-none">
        {/* Subtle geometric dot grid */}
        <div className="absolute inset-0 bg-[radial-gradient(#262626_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />

        {/* Brand Header */}
        <div className="relative z-10 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-white text-black flex items-center justify-center font-black text-sm tracking-tight shadow-md group-hover:bg-neutral-200 transition-colors">
              D
            </div>
            <div>
              <div className="font-extrabold text-base tracking-tight text-white">DOCORA</div>
              <div className="text-[10px] text-neutral-400 uppercase tracking-widest font-semibold">
                Document Operations
              </div>
            </div>
          </Link>

          <span className="text-xs font-mono text-neutral-400 bg-neutral-900 border border-neutral-800 px-2.5 py-1 rounded-full">
            v1.0.0
          </span>
        </div>

        {/* Showcase Core Feature Highlights */}
        <div className="relative z-10 my-auto max-w-lg space-y-8 transition-all duration-300">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-300 mb-4">
              <BadgeIcon className="w-3.5 h-3.5 text-neutral-200" />
              <span>{showcaseContent.badgeText}</span>
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-white leading-tight">
              {showcaseContent.title}
            </h2>
            <p className="text-sm text-neutral-400 mt-3 leading-relaxed">
              {showcaseContent.description}
            </p>
          </div>

          {/* Interactive Document Card Snippet */}
          <div className="border border-neutral-800 bg-neutral-900/60 rounded-2xl p-5 backdrop-blur-sm space-y-3 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-mono text-neutral-300">
                <FileText className="w-4 h-4 text-neutral-400" />
                <span>{showcaseContent.cardFilename}</span>
              </div>
              <span
                className={`inline-flex items-center gap-1 text-[10px] font-semibold font-mono border px-2 py-0.5 rounded-full ${showcaseContent.cardBadgeColor}`}
              >
                <CardBadgeIcon className="w-3 h-3" /> {showcaseContent.cardBadgeText}
              </span>
            </div>

            <div className="h-1.5 w-full bg-neutral-800 rounded-full overflow-hidden">
              <div className={`h-full bg-white rounded-full ${showcaseContent.cardProgressWidth}`} />
            </div>

            <div className="flex justify-between items-center text-[11px] text-neutral-400 pt-1 font-mono">
              <span>{showcaseContent.cardStatus}</span>
              <span>{showcaseContent.cardStat}</span>
            </div>
          </div>

          {/* Value Props Bullet Grid */}
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-semibold text-white">
                <Feature1Icon className="w-3.5 h-3.5 text-neutral-400" />
                <span>{showcaseContent.feature1Title}</span>
              </div>
              <p className="text-[11px] text-neutral-400">{showcaseContent.feature1Desc}</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-semibold text-white">
                <Feature2Icon className="w-3.5 h-3.5 text-neutral-400" />
                <span>{showcaseContent.feature2Title}</span>
              </div>
              <p className="text-[11px] text-neutral-400">{showcaseContent.feature2Desc}</p>
            </div>
          </div>
        </div>

        {/* Bottom Trust Line */}
        <div className="relative z-10 flex items-center justify-between text-xs text-neutral-400 border-t border-neutral-800/80 pt-6">
          <span>&copy; 2026 Docora Platform</span>
          <span className="font-mono text-[11px]">Strict Workspace Isolation</span>
        </div>
      </div>

      {/* RIGHT PANEL: Auth Form Viewport */}
      <div className="flex flex-col justify-between p-6 sm:p-12 lg:p-16">
        {/* Mobile-only compact logo */}
        <div className="flex lg:hidden items-center justify-between pb-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] flex items-center justify-center font-black text-sm">
              D
            </div>
            <span className="font-bold text-sm tracking-tight text-[var(--foreground)]">DOCORA</span>
          </Link>
        </div>

        <div className="w-full max-w-md mx-auto my-auto py-8">
          {children}
        </div>

        <div className="text-center text-xs text-[var(--muted-foreground)] pt-6">
          Protected by enterprise session revocation & HMAC rate-limiting.
        </div>
      </div>
    </div>
  );
}
