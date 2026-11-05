'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  FilePlus2,
  SlidersHorizontal,
  GitBranch,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';
import { FadeIn, StaggerContainer, StaggerItem } from './motion-wrapper';
import { BackgroundGrid } from './background-grid';

export function LandingHowItWorks() {
  const steps = [
    {
      number: '01',
      title: 'Create',
      summary: 'Start with a template or design from scratch',
      description:
        'Select from verified financial layouts, design dynamic sections, or import Markdown directly. Real-time preview updates on every keystroke.',
      icon: FilePlus2,
      accentBg: 'bg-blue-600 text-white shadow-blue-500/25',
      iconColor: 'text-blue-500 dark:text-blue-400',
    },
    {
      number: '02',
      title: 'Process',
      summary: 'Edit, organize, and optimize your document',
      description:
        'Merge supporting attachments, extract critical pages, compress file sizes, and apply security watermarks and continuous pagination.',
      icon: SlidersHorizontal,
      accentBg: 'bg-purple-600 text-white shadow-purple-500/25',
      iconColor: 'text-purple-500 dark:text-purple-400',
    },
    {
      number: '03',
      title: 'Automate',
      summary: 'Configure approvals and execution workflows',
      description:
        'Set up automated validation rules, route through executive sign-offs, and trigger webhook events automatically upon finalization.',
      icon: GitBranch,
      accentBg: 'bg-amber-600 text-white shadow-amber-500/25',
      iconColor: 'text-amber-500 dark:text-amber-400',
    },
    {
      number: '04',
      title: 'Share & Verify',
      summary: 'Securely distribute with cryptographic proof',
      description:
        'Deliver password-protected links with automatic expiration. Recipients scan the embedded QR code to verify authenticity via SHA-256 integrity.',
      icon: ShieldCheck,
      accentBg: 'bg-emerald-600 text-white shadow-emerald-500/25',
      iconColor: 'text-emerald-500 dark:text-emerald-400',
    },
  ];

  return (
    <section id="how-it-works" className="relative py-20 md:py-28 border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0a0a0a] overflow-hidden">
      {/* Blueprint Subgrid Pattern */}
      <BackgroundGrid variant="blueprint" size={48} fade="radial" opacity={0.7} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <FadeIn direction="up" className="text-center max-w-2xl mx-auto space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
            Workflow Architecture
          </div>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-neutral-950 dark:text-white">
            From Creation to Completion.
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400 text-sm sm:text-base leading-relaxed">
            A continuous, four-stage operational pipeline engineered to eliminate fragmented tools and manual errors.
          </p>
        </FadeIn>

        {/* 4-Step Process Timeline */}
        <div className="mt-16 relative">
          {/* Desktop Connecting Mixed Gradient Track */}
          <div
            aria-hidden="true"
            className="hidden lg:block absolute top-7 left-14 right-14 h-1 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 via-amber-500 to-emerald-500 opacity-70 z-0 shadow-xs"
          />

          <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative z-10">
            {steps.map((step, idx) => {
              const Icon = step.icon;
              return (
                <StaggerItem key={step.number}>
                  <motion.div
                    whileHover={{ y: -4, transition: { duration: 0.2 } }}
                    className="h-full rounded-2xl bg-white/80 dark:bg-neutral-900/50 backdrop-blur-xs border border-neutral-200/90 dark:border-neutral-800/80 p-6 flex flex-col justify-between hover:border-neutral-400 dark:hover:border-neutral-700 transition-colors shadow-xs hover:shadow-md"
                  >
                    <div className="space-y-4">
                      {/* Step badge & icon */}
                      <div className="flex items-center justify-between">
                        <div className={`w-12 h-12 rounded-xl ${step.accentBg} flex items-center justify-center font-black text-sm shadow-md`}>
                          {step.number}
                        </div>
                        <div className={`w-9 h-9 rounded-lg bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center ${step.iconColor}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                      </div>

                      <div>
                        <h3 className="text-base font-bold text-neutral-950 dark:text-white">
                          {step.title}
                        </h3>
                        <div className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 mt-0.5">
                          {step.summary}
                        </div>
                      </div>

                      <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                        {step.description}
                      </p>
                    </div>

                    {idx < steps.length - 1 && (
                      <div className="pt-4 mt-4 border-t border-neutral-200/60 dark:border-neutral-800/60 flex items-center text-[11px] font-semibold text-neutral-400 lg:hidden">
                        <span>Next: {steps[idx + 1].title}</span>
                        <ArrowRight className="w-3 h-3 ml-1" />
                      </div>
                    )}
                  </motion.div>
                </StaggerItem>
              );
            })}
          </StaggerContainer>
        </div>
      </div>
    </section>
  );
}
