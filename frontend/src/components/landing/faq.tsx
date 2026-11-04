'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { FadeIn } from './motion-wrapper';

export function LandingFAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: 'What is DocAutomate?',
      a: 'DocAutomate is an all-in-one Document Operations Platform that enables individuals and organizations to create, process, automate, verify, share, and manage professional documents from a single unified workspace.',
    },
    {
      q: 'What types of documents can I create?',
      a: 'You can create commercial invoices, cash receipts, quotations, cost estimates, payment vouchers, and general business statements. The built-in PDF Generator also supports custom Markdown (.md) documents and modular section layouts.',
    },
    {
      q: 'Can I edit and process existing PDFs?',
      a: 'Yes. DocAutomate includes a suite of high-speed PDF tools that let you merge multiple PDFs into one, split documents by page ranges, compress file payloads, rotate orientations, extract select pages, and stamp watermarks.',
    },
    {
      q: 'Can I securely share documents?',
      a: 'Yes. Instead of insecure email attachments, DocAutomate generates time-bounded sharing links with optional password protection and view count monitoring. You can revoke access to any link immediately with one click.',
    },
    {
      q: 'How does document verification work?',
      a: 'Every finalized document is assigned a unique cryptographic SHA-256 hash fingerprint and a scannable QR code. Anyone with the document can scan the QR code or visit the public verification portal to confirm issuance authenticity and verify that the content has not been altered.',
    },
    {
      q: 'Does DocAutomate support workflow automation?',
      a: 'Yes. DocAutomate features a visual workflow builder where you can define triggers, conditional validation gates, multi-stage approval thresholds, automatic PDF compilation, and webhook dispatches upon document status changes.',
    },
    {
      q: 'Can multiple team members use DocAutomate?',
      a: 'Yes. DocAutomate supports multi-tenant workspaces with role-based access control (Owner, Admin, Editor, and Viewer). Team members can collaborate while maintaining strict data isolation across departments.',
    },
    {
      q: 'Is DocAutomate suitable for businesses?',
      a: 'DocAutomate is designed for small businesses, accounting teams, professional services firms, and growing enterprises. It enforces strict integer arithmetic for financial figures, automated sequential document numbering, and complete chronological audit logging.',
    },
  ];

  const toggleFAQ = (idx: number) => {
    setOpenIndex((prev) => (prev === idx ? null : idx));
  };

  return (
    <section id="faq" className="py-20 md:py-28 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-[#0c0c0c]/50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <FadeIn direction="up" className="text-center space-y-3 mb-14">
          <div className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
            Answers & Clarifications
          </div>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-neutral-950 dark:text-white">
            Frequently Asked Questions
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400 text-sm leading-relaxed">
            Everything you need to know about DocAutomate’s document operations platform.
          </p>
        </FadeIn>

        {/* Accordion List */}
        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <FadeIn key={idx} delay={idx * 0.04} direction="up" distance={12}>
                <div className="rounded-2xl bg-white dark:bg-[#121212] border border-neutral-200 dark:border-neutral-800/90 overflow-hidden transition-colors shadow-2xs">
                  <button
                    type="button"
                    onClick={() => toggleFAQ(idx)}
                    className="w-full p-5 text-left flex items-center justify-between gap-4 font-bold text-sm text-neutral-900 dark:text-white hover:text-neutral-950 dark:hover:text-white transition-colors"
                    aria-expanded={isOpen}
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-neutral-400 shrink-0 transition-transform duration-200 ${
                        isOpen ? 'rotate-180 text-neutral-900 dark:text-white' : ''
                      }`}
                    />
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: 'easeInOut' }}
                        className="overflow-hidden"
                      >
                        <div className="px-5 pb-5 pt-1 text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed border-t border-neutral-100 dark:border-neutral-800/60">
                          {faq.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </FadeIn>
            );
          })}
        </div>
      </div>
    </section>
  );
}
