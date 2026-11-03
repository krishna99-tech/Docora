'use client';

import React from 'react';
import {
  Building2,
  Briefcase,
  UserCheck,
  Sliders,
  FileCheck,
  TrendingUp,
} from 'lucide-react';

export function LandingUseCases() {
  const useCases = [
    {
      title: 'Small Businesses',
      summary: 'Professional invoicing and customer statements',
      description:
        'Deliver branded invoices, tax receipts, and payment vouchers in seconds without expensive legacy accounting subscriptions.',
      icon: Building2,
    },
    {
      title: 'Finance & Accounting',
      summary: 'Strict audit trails and multi-currency ledgers',
      description:
        'Enforce sequential numbering rules, calculate integer minor-unit financial figures safely, and trace complete creation histories.',
      icon: Briefcase,
    },
    {
      title: 'Freelancers & Solo Pros',
      summary: 'Effortless client billing and settlement',
      description:
        'Send sleek, customizable invoices with instant PDF download links and QR payment proof directly from your browser.',
      icon: UserCheck,
    },
    {
      title: 'Operations Teams',
      summary: 'Batch document processing & transformation',
      description:
        'Merge supporting attachments, extract critical clauses, compress file payloads, and rotate scanned documents with zero hassle.',
      icon: Sliders,
    },
    {
      title: 'Professional Services',
      summary: 'Confidential statements & authenticated reports',
      description:
        'Share sensitive client deliverables protected with password expiration dates and verifiable SHA-256 integrity proofs.',
      icon: FileCheck,
    },
    {
      title: 'Growing Organizations',
      summary: 'Cross-functional workspace collaboration',
      description:
        'Scale across multiple business branches with isolated databases, role permissions, automation webhooks, and REST API access.',
      icon: TrendingUp,
    },
  ];

  return (
    <section id="use-cases" className="py-20 md:py-28 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-[#0c0c0c]/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
            Tailored Solutions
          </div>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-neutral-950 dark:text-white">
            Built for Every Document Workflow.
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400 text-sm sm:text-base leading-relaxed">
            Whether you are issuing your first customer receipt or managing tens of thousands of automated PDF compilations, DocAutomate scales with your needs.
          </p>
        </div>

        {/* 6 Use Case Cards */}
        <div className="mt-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {useCases.map((uc, idx) => {
            const Icon = uc.icon;
            return (
              <div
                key={idx}
                className="rounded-2xl bg-white dark:bg-[#121212] border border-neutral-200 dark:border-neutral-800 p-6 flex flex-col justify-between hover:border-neutral-400 dark:hover:border-neutral-600 transition-colors shadow-2xs"
              >
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-900 dark:text-white">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-neutral-950 dark:text-white">
                      {uc.title}
                    </h3>
                    <div className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 mt-0.5">
                      {uc.summary}
                    </div>
                  </div>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                    {uc.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

