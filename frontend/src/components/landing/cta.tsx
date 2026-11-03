'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/app/providers';
import { ArrowRight, Sparkles } from 'lucide-react';

export function LandingCTA() {
  const { user } = useAuth();

  return (
    <section className="py-20 md:py-28 border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0a0a0a] relative overflow-hidden">
      {/* Background Subtle Radial Glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-30 dark:opacity-20 -z-10"
      >
        <div className="w-[600px] h-[300px] bg-gradient-to-r from-neutral-200 via-neutral-100 to-transparent dark:from-neutral-800 dark:via-neutral-900 rounded-full blur-3xl" />
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-neutral-950 text-white dark:bg-[#141414] dark:border dark:border-neutral-800 p-8 sm:p-14 text-center space-y-6 shadow-2xl relative">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-white/90 border border-white/15">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Start Building in Seconds</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight max-w-2xl mx-auto">
            Ready to Simplify Your Document Operations?
          </h2>

          <p className="text-sm sm:text-base text-neutral-300 dark:text-neutral-400 max-w-xl mx-auto leading-relaxed">
            Bring document creation, processing, automation, and management into one powerful workspace.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <Link
              href={user ? '/dashboard' : '/register'}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl font-bold text-xs sm:text-sm bg-white text-neutral-950 hover:bg-neutral-100 transition-all shadow-md active:scale-[0.98]"
            >
              {user ? 'Open Workspace' : 'Get Started Free'}
              <ArrowRight className="w-4 h-4" />
            </Link>

            <a
              href="#capabilities"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl font-bold text-xs sm:text-sm bg-transparent border border-white/20 text-white hover:bg-white/10 transition-all active:scale-[0.98]"
            >
              Explore Platform
            </a>
          </div>

          <div className="text-[11px] text-neutral-400 pt-2 font-mono">
            No credit card required &bull; Free instant access
          </div>
        </div>
      </div>
    </section>
  );
}

