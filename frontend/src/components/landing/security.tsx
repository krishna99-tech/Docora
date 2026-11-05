'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  ShieldCheck,
  Lock,
  UserCheck,
  FileKey,
  QrCode,
  History,
  CheckCircle2,
} from 'lucide-react';
import { FadeIn, StaggerContainer, StaggerItem } from './motion-wrapper';
import { BackgroundGrid } from './background-grid';

export function LandingSecurity() {
  const securityFeatures = [
    {
      title: 'Workspace Data Isolation',
      description:
        'Tenant documents, customer profiles, and custom templates are strictly separated at the database boundary.',
      icon: Lock,
    },
    {
      title: 'Role-Based Access Control',
      description:
        'Grant granular permissions across Owner, Admin, Editor, and Viewer tiers to prevent unauthorized modifications.',
      icon: UserCheck,
    },
    {
      title: 'Controlled Sharing Links',
      description:
        'Distribute documents via time-limited URLs equipped with optional password protection and instant revocation.',
      icon: FileKey,
    },
    {
      title: 'SHA-256 Integrity Checks',
      description:
        'Compute unique cryptographic digests for each compiled document to detect file tampering immediately.',
      icon: ShieldCheck,
    },
    {
      title: 'Direct QR Verification',
      description:
        'Embed scannable barcodes so external third parties can confirm issuance authenticity without workspace access.',
      icon: QrCode,
    },
    {
      title: 'Activity & Audit Logging',
      description:
        'Chronologically record all document creation, editing, downloading, and sharing events with complete timestamps.',
      icon: History,
    },
  ];

  return (
    <section id="security" className="relative py-20 md:py-28 border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0a0a0a] overflow-hidden">
      {/* Cryptographic Isometric Mesh with Emerald Glow */}
      <BackgroundGrid variant="mesh" size={32} glow="emerald" fade="radial" opacity={0.75} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <FadeIn direction="up" className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
            <ShieldCheck className="w-3.5 h-3.5" />
            Security & Integrity Architecture
          </div>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-neutral-950 dark:text-white">
            Your Documents Deserve Better Security.
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400 text-sm sm:text-base leading-relaxed">
            Protect your documents with controlled access, secure sharing, and reliable verification mechanisms.
          </p>
        </FadeIn>

        {/* 6 Security Highlights Grid */}
        <StaggerContainer className="mt-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {securityFeatures.map((sec, idx) => {
            const Icon = sec.icon;
            return (
              <StaggerItem key={idx}>
                <motion.div
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  className="h-full p-6 rounded-2xl bg-neutral-50/70 dark:bg-neutral-900/40 border border-neutral-200 dark:border-neutral-800/80 space-y-3 hover:border-neutral-400 dark:hover:border-neutral-700 transition-colors shadow-2xs"
                >
                  <div className="w-10 h-10 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center text-neutral-900 dark:text-white shadow-xs">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-neutral-950 dark:text-white">
                    {sec.title}
                  </h3>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                    {sec.description}
                  </p>
                </motion.div>
              </StaggerItem>
            );
          })}
        </StaggerContainer>
      </div>
    </section>
  );
}
