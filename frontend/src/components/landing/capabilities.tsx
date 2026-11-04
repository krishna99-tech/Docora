'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  FileText,
  Layers,
  Workflow,
  ShieldCheck,
  Share2,
  FolderOpen,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import { FadeIn, StaggerContainer, StaggerItem } from './motion-wrapper';

export function LandingCapabilities() {
  const capabilities = [
    {
      id: 'create',
      title: 'Create',
      tagline: 'Multi-type document engine',
      description:
        'Compile structured business invoices, tax receipts, quotations, estimates, and custom reports with pixel-perfect precision.',
      icon: FileText,
      accentColor: 'text-blue-500',
      bgColor: 'bg-blue-50 dark:bg-blue-950/30',
      features: [
        'Invoices, receipts, quotations, estimates, and general PDFs',
        'Visual section builder and direct Markdown (.md) input',
        'Real-time live preview with multi-page A4 sheet rendering',
        'Business branding, logos, and custom notes',
      ],
      href: '/pdf-generator',
    },
    {
      id: 'process',
      title: 'Process',
      tagline: 'High-speed PDF manipulation',
      description:
        'Reorganize and optimize existing documents without relying on fragile third-party desktop utilities.',
      icon: Layers,
      accentColor: 'text-purple-500',
      bgColor: 'bg-purple-50 dark:bg-purple-950/30',
      features: [
        'Merge multiple PDFs into a single unified binder',
        'Split documents by page ranges or extract key pages',
        'Lossless compression to reduce transmission payloads',
        'Rotate orientations, insert watermarks, and page numbers',
      ],
      href: '/pdf-tools',
    },
    {
      id: 'automate',
      title: 'Automate',
      tagline: 'Visual approval & lifecycle pipelines',
      description:
        'Eliminate manual handoffs. Connect triggers, approval thresholds, validation engines, and background tasks seamlessly.',
      icon: Workflow,
      accentColor: 'text-amber-500',
      bgColor: 'bg-amber-50 dark:bg-amber-950/30',
      features: [
        'Visual drag-and-drop workflow graph builder',
        'Configurable multi-stage review and approval rules',
        'Automatic document generation on database events',
        'Background job processing and webhook dispatch',
      ],
      href: '/workflows',
    },
    {
      id: 'verify',
      title: 'Verify',
      tagline: 'Cryptographic authenticity proof',
      description:
        'Ensure finalized documents cannot be tampered with. Instantly prove integrity to customers and compliance auditors.',
      icon: ShieldCheck,
      accentColor: 'text-emerald-500',
      bgColor: 'bg-emerald-50 dark:bg-emerald-950/30',
      features: [
        'SHA-256 cryptographic hash fingerprints for each file',
        'Scannable QR codes embedded directly onto finalized PDFs',
        'Public zero-knowledge verification web portal',
        'Immutable timestamps and issuer identity confirmation',
      ],
      href: '/verification',
    },
    {
      id: 'share',
      title: 'Share',
      tagline: 'Controlled external distribution',
      description:
        'Deliver documents with granular security controls, access revocation, and expiration dates instead of unencrypted email attachments.',
      icon: Share2,
      accentColor: 'text-indigo-500',
      bgColor: 'bg-indigo-50 dark:bg-indigo-950/30',
      features: [
        'Time-bounded expiring secure sharing links',
        'Optional password protection on external access',
        'Immediate one-click access permission revocation',
        'View count tracking and recipient access logs',
      ],
      href: '/documents',
    },
    {
      id: 'manage',
      title: 'Manage',
      tagline: 'Centralized enterprise document vault',
      description:
        'Organize your entire organization’s document estate in one searchable, tagged, and permission-isolated repository.',
      icon: FolderOpen,
      accentColor: 'text-rose-500',
      bgColor: 'bg-rose-50 dark:bg-rose-950/30',
      features: [
        'Fast keyword search with category and date filtering',
        'Multi-version document history and instant rollback',
        'Bulk batch operations across thousands of records',
        'Complete chronological user activity audit trail',
      ],
      href: '/documents',
    },
  ];

  return (
    <section id="capabilities" className="py-20 md:py-28 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-[#0c0c0c]/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <FadeIn direction="up" className="text-center max-w-3xl mx-auto space-y-4">
          <div className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
            Platform Capabilities
          </div>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-neutral-950 dark:text-white">
            Everything Your Documents Need.
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400 text-sm sm:text-base leading-relaxed">
            One platform to handle the complete document lifecycle — from initial composition and PDF transformation to automated approval routing, verification, and long-term storage.
          </p>
        </FadeIn>

        {/* 6 Capability Cards Grid */}
        <StaggerContainer className="mt-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {capabilities.map((cap) => {
            const Icon = cap.icon;
            return (
              <StaggerItem key={cap.id}>
                <motion.div
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  className="group relative h-full rounded-2xl bg-white dark:bg-[#121212] border border-neutral-200 dark:border-neutral-800/80 p-6 sm:p-7 flex flex-col justify-between hover:border-neutral-400 dark:hover:border-neutral-600 transition-colors shadow-xs hover:shadow-md"
                >
                  <div className="space-y-4">
                    {/* Icon & Title Header */}
                    <div className="flex items-center justify-between">
                      <div className={`w-10 h-10 rounded-xl ${cap.bgColor} flex items-center justify-center ${cap.accentColor}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-400">
                        {cap.id}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-lg font-bold text-neutral-950 dark:text-white">
                        {cap.title}
                      </h3>
                      <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mt-0.5">
                        {cap.tagline}
                      </p>
                    </div>

                    <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                      {cap.description}
                    </p>

                    {/* Bullet features */}
                    <ul className="pt-2 space-y-2 border-t border-neutral-100 dark:border-neutral-800/80">
                      {cap.features.map((feat, fIdx) => (
                        <li key={fIdx} className="flex items-start gap-2 text-[12px] text-neutral-700 dark:text-neutral-300">
                          <CheckCircle2 className="w-3.5 h-3.5 text-neutral-400 shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Explore link */}
                  <div className="pt-5 mt-4 border-t border-neutral-100 dark:border-neutral-800/80">
                    <Link
                      href={cap.href}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-900 dark:text-white hover:underline group-hover:translate-x-0.5 transition-transform"
                    >
                      Explore {cap.title} Module
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </motion.div>
              </StaggerItem>
            );
          })}
        </StaggerContainer>
      </div>
    </section>
  );
}

