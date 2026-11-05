'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAuth } from '@/app/providers';
import { ArrowRight, Sparkles } from 'lucide-react';
import { FadeIn } from './motion-wrapper';
import { BackgroundGrid } from './background-grid';

export function LandingCTA() {
  const { user } = useAuth();

  return (
    <section className="relative py-20 md:py-28 border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0a0a0a] overflow-hidden">
      {/* Background Squares Matrix with Multi-Color Mixed Aurora Glow */}
      <BackgroundGrid variant="squares" size={40} glow="mixed" fade="radial" opacity={0.85} />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <FadeIn direction="up">
          <div className="rounded-3xl bg-neutral-950 text-white dark:bg-[#141414] dark:border dark:border-neutral-800 p-8 sm:p-14 text-center space-y-6 shadow-2xl relative">
            {/* Ambient Mixed Aurora Outer Glow Halo */}
            <div
              aria-hidden="true"
              className="absolute -inset-[1.5px] rounded-[26px] bg-gradient-to-r from-blue-500 via-purple-500 via-emerald-500 via-amber-500 to-rose-500 opacity-40 blur-sm pointer-events-none -z-10"
            />

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
                href="#demo"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl font-bold text-xs sm:text-sm bg-transparent border border-white/20 text-white hover:bg-white/10 transition-all active:scale-[0.98]"
              >
                Try Live Playground
              </a>
            </div>

            <div className="text-[11px] text-neutral-400 pt-2 font-mono">
              No credit card required &bull; Free instant access
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
