'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, FileText, Zap, Lock } from 'lucide-react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen w-full grid grid-cols-1 lg:grid-cols-2 bg-[var(--background)]">
      {/* LEFT PANEL: Premium SaaS Product Showcase (Desktop only) */}
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
        <div className="relative z-10 my-auto max-w-lg space-y-8">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-300 mb-4">
              <Zap className="w-3.5 h-3.5 text-neutral-200" />
              <span>Next-Gen Document Infrastructure</span>
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-white leading-tight">
              Create, process, verify, and automate digital documents.
            </h2>
            <p className="text-sm text-neutral-400 mt-3 leading-relaxed">
              From pixel-perfect receipts and invoices to cryptographic SHA-256 byte integrity checks and PDF manipulation utilities.
            </p>
          </div>

          {/* Interactive Document Card Snippet */}
          <div className="border border-neutral-800 bg-neutral-900/60 rounded-2xl p-5 backdrop-blur-sm space-y-3 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-mono text-neutral-300">
                <FileText className="w-4 h-4 text-neutral-400" />
                <span>INV-2026-0042.pdf</span>
              </div>
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded-full">
                <ShieldCheck className="w-3 h-3" /> SHA-256 VERIFIED
              </span>
            </div>

            <div className="h-1.5 w-full bg-neutral-800 rounded-full overflow-hidden">
              <div className="h-full bg-white w-3/4 rounded-full" />
            </div>

            <div className="flex justify-between items-center text-[11px] text-neutral-400 pt-1 font-mono">
              <span>Status: Finalized & Immutable</span>
              <span>100% Binary Accuracy</span>
            </div>
          </div>

          {/* Value Props Bullet Grid */}
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-semibold text-white">
                <Lock className="w-3.5 h-3.5 text-neutral-400" />
                <span>Zero-Trust Verification</span>
              </div>
              <p className="text-[11px] text-neutral-400">Cryptographic hash checking on stored PDF binaries.</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-semibold text-white">
                <FileText className="w-3.5 h-3.5 text-neutral-400" />
                <span>Native PDF Utilities</span>
              </div>
              <p className="text-[11px] text-neutral-400">Merge, split, compress, watermark, and reorder.</p>
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
