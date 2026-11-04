'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Check, ArrowRight } from 'lucide-react';
import { FadeIn, StaggerContainer, StaggerItem } from './motion-wrapper';

export function LandingPricing() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

  const plans = [
    {
      name: 'Free',
      tagline: 'Essential document operations for individuals',
      price: '$0',
      period: 'forever free',
      highlighted: false,
      ctaLabel: 'Get Started Free',
      ctaHref: '/register',
      features: [
        'Basic document creation (invoices & receipts)',
        'Essential PDF utilities (merge & split)',
        'Up to 100 stored documents',
        'Direct browser printing & local PDF download',
        'Standard document management & search',
      ],
      plannedFeatures: [],
    },
    {
      name: 'Pro',
      tagline: 'Advanced PDF generator and workflow pipelines',
      price: billingCycle === 'annual' ? '$19' : '$24',
      period: 'per seat / month (placeholder)',
      highlighted: true,
      badge: 'Most Popular',
      ctaLabel: 'Start Pro Trial',
      ctaHref: '/register',
      features: [
        'Advanced multi-page PDF generator (.md + visual)',
        'Full PDF toolkit (compress, rotate, watermark)',
        'Custom business branding & logo upload',
        'Cryptographic QR & SHA-256 integrity proofs',
        'Time-bounded secure sharing links with passwords',
        'Unlimited document creation & storage',
      ],
      plannedFeatures: [
        'Workflow automation builder (Planned)',
        'Automated multi-stage approval gates (Planned)',
      ],
    },
    {
      name: 'Business',
      tagline: 'Multi-workspace governance and developer APIs',
      price: billingCycle === 'annual' ? '$49' : '$59',
      period: 'per seat / month (placeholder)',
      highlighted: false,
      ctaLabel: 'Contact Sales',
      ctaHref: '/register',
      features: [
        'Everything in Pro plan',
        'Multiple isolated workspaces for subsidiaries',
        'Role-based access control (Admin, Editor, Viewer)',
        'Complete chronological audit log export',
      ],
      plannedFeatures: [
        'Full REST API & Webhook dispatch (Planned)',
        'Custom SSO & SAML authentication (Planned)',
        'Dedicated SLA & enterprise support (Planned)',
      ],
    },
  ];

  return (
    <section id="pricing" className="py-20 md:py-28 border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0a0a0a]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <FadeIn direction="up" className="text-center max-w-2xl mx-auto space-y-4">
          <div className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
            Transparent Pricing
          </div>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-neutral-950 dark:text-white">
            Simple Plans. Powerful Document Operations.
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400 text-sm sm:text-base leading-relaxed">
            Start immediately with our free tier or upgrade as your organization’s document throughput scales.
          </p>

          {/* Monthly / Annual Toggle */}
          <div className="pt-2 flex items-center justify-center">
            <div className="inline-flex items-center p-1 rounded-xl bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700/80 text-xs">
              <button
                type="button"
                onClick={() => setBillingCycle('monthly')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  billingCycle === 'monthly'
                    ? 'bg-white dark:bg-neutral-900 text-neutral-950 dark:text-white shadow-xs'
                    : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white'
                }`}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle('annual')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  billingCycle === 'annual'
                    ? 'bg-white dark:bg-neutral-900 text-neutral-950 dark:text-white shadow-xs'
                    : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white'
                }`}
              >
                <span>Annual</span>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  Save 20%
                </span>
              </button>
            </div>
          </div>
        </FadeIn>

        {/* 3 Pricing Cards */}
        <StaggerContainer className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {plans.map((plan) => (
            <StaggerItem key={plan.name} className="h-full">
              <motion.div
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className={`relative h-full rounded-2xl p-6 sm:p-8 flex flex-col justify-between transition-colors ${
                  plan.highlighted
                    ? 'bg-neutral-950 text-white dark:bg-neutral-900 dark:text-white border-2 border-neutral-950 dark:border-white/30 shadow-xl'
                    : 'bg-white text-neutral-900 dark:bg-[#121212] dark:text-neutral-100 border border-neutral-200 dark:border-neutral-800 shadow-xs hover:border-neutral-400 dark:hover:border-neutral-600'
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-3.5 left-1/2 transform -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500 text-white shadow-xs">
                    {plan.badge}
                  </div>
                )}

                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-bold">{plan.name}</h3>
                    <p
                      className={`text-xs mt-1 leading-relaxed ${
                        plan.highlighted
                          ? 'text-neutral-300'
                          : 'text-neutral-500 dark:text-neutral-400'
                      }`}
                    >
                      {plan.tagline}
                    </p>
                  </div>

                  <div className="flex items-baseline gap-1.5">
                    <span className="text-4xl font-black tracking-tight">{plan.price}</span>
                    <span
                      className={`text-xs ${
                        plan.highlighted
                          ? 'text-neutral-400'
                          : 'text-neutral-500 dark:text-neutral-400'
                      }`}
                    >
                      {plan.period}
                    </span>
                  </div>

                  <div className="space-y-2.5 pt-4 border-t border-neutral-200/40 dark:border-neutral-800">
                    <div
                      className={`text-xs font-bold uppercase tracking-wider ${
                        plan.highlighted
                          ? 'text-neutral-300'
                          : 'text-neutral-500 dark:text-neutral-400'
                      }`}
                    >
                      Included Capabilities
                    </div>
                    <ul className="space-y-2 text-xs">
                      {plan.features.map((feat, fIdx) => (
                        <li key={fIdx} className="flex items-start gap-2">
                          <Check
                            className={`w-4 h-4 shrink-0 mt-0.5 ${
                              plan.highlighted ? 'text-emerald-400' : 'text-emerald-500'
                            }`}
                          />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>

                    {plan.plannedFeatures.length > 0 && (
                      <div className="pt-3 mt-3 border-t border-neutral-200/20 dark:border-neutral-800 space-y-2">
                        <div
                          className={`text-[10px] font-bold uppercase tracking-wider ${
                            plan.highlighted
                              ? 'text-neutral-400'
                              : 'text-neutral-400'
                          }`}
                        >
                          Upcoming Roadmap
                        </div>
                        <ul className="space-y-1.5 text-xs">
                          {plan.plannedFeatures.map((pFeat, pIdx) => (
                            <li
                              key={pIdx}
                              className={`flex items-start gap-2 italic ${
                                plan.highlighted
                                  ? 'text-neutral-400'
                                  : 'text-neutral-500 dark:text-neutral-400'
                              }`}
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 mt-1.5 shrink-0" />
                              <span>{pFeat}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-6 mt-6">
                  <Link
                    href={plan.ctaHref}
                    className={`w-full inline-flex items-center justify-center gap-1.5 py-3 rounded-xl text-xs font-bold transition-all shadow-xs ${
                      plan.highlighted
                        ? 'bg-white text-neutral-950 hover:bg-neutral-100 dark:bg-white dark:text-neutral-950'
                        : 'bg-neutral-950 text-white dark:bg-white dark:text-neutral-950 hover:bg-neutral-800 dark:hover:bg-neutral-100'
                    }`}
                  >
                    {plan.ctaLabel}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </motion.div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
