'use client';

import React from 'react';
import { LandingNavbar } from '@/components/landing/navbar';
import { LandingHero } from '@/components/landing/hero';
import { LandingCapabilities } from '@/components/landing/capabilities';
import { LandingHowItWorks } from '@/components/landing/how-it-works';
import { LandingProductShowcase } from '@/components/landing/product-showcase';
import { LandingSecurity } from '@/components/landing/security';
import { LandingUseCases } from '@/components/landing/use-cases';
import { LandingPricing } from '@/components/landing/pricing';
import { LandingFAQ } from '@/components/landing/faq';
import { LandingCTA } from '@/components/landing/cta';
import { LandingFooter } from '@/components/landing/footer';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-[#09090b] text-neutral-900 dark:text-neutral-100 flex flex-col font-sans selection:bg-neutral-900 selection:text-white dark:selection:bg-white dark:selection:text-neutral-950">
      {/* Sticky Responsive Navigation Bar */}
      <LandingNavbar />

      {/* Main Landing Sections */}
      <main className="flex-1">
        {/* 1. Hero Section with Live SaaS Dashboard Preview */}
        <LandingHero />

        {/* 2. Platform Capabilities (Create, Process, Automate, Verify, Share, Manage) */}
        <LandingCapabilities />

        {/* 3. How It Works (4-Step Timeline Architecture) */}
        <LandingHowItWorks />

        {/* 4. Product Showcase (Interactive Tabs: Library, PDF Tools, Templates, Workflows, Verification) */}
        <LandingProductShowcase />

        {/* 5. Security & Verification Architecture */}
        <LandingSecurity />

        {/* 6. Tailored Industry Use Cases */}
        <LandingUseCases />

        {/* 7. Simple, Transparent Pricing Plans */}
        <LandingPricing />

        {/* 8. Frequently Asked Questions (Accessible Accordion) */}
        <LandingFAQ />

        {/* 9. High-Impact Closing CTA */}
        <LandingCTA />
      </main>

      {/* Footer */}
      <LandingFooter />
    </div>
  );
}
