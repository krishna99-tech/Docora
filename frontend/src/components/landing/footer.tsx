'use client';

import React from 'react';
import Link from 'next/link';
import { DocoraLogo } from './docora-logo';
import {
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

export function LandingFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-[#070707] text-neutral-600 dark:text-neutral-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand Info (2 Cols on Desktop) */}
          <div className="col-span-2 space-y-4">
            <DocoraLogo size="md" />

            <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-sm leading-relaxed">
              DocAutomate is an all-in-one Document Operations Platform designed to simplify document creation, PDF processing, workflow automation, secure sharing, verification, and centralized document management.
            </p>

            <div className="flex items-center gap-3 pt-2 text-neutral-500 dark:text-neutral-400">
              <a
                href="#gh-placeholder"
                aria-label="GitHub Repository"
                className="p-2 rounded-lg bg-neutral-200/60 dark:bg-neutral-800 hover:text-neutral-950 dark:hover:text-white transition-colors"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                </svg>
              </a>
              <a
                href="#tw-placeholder"
                aria-label="Twitter / X Profile"
                className="p-2 rounded-lg bg-neutral-200/60 dark:bg-neutral-800 hover:text-neutral-950 dark:hover:text-white transition-colors"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              <a
                href="#li-placeholder"
                aria-label="LinkedIn Profile"
                className="p-2 rounded-lg bg-neutral-200/60 dark:bg-neutral-800 hover:text-neutral-950 dark:hover:text-white transition-colors"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                </svg>
              </a>
            </div>

            <div className="pt-2 flex items-center gap-2 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>All Systems Operational &bull; Production v2.0</span>
            </div>
          </div>

          {/* Col 1: Product */}
          <div className="space-y-3">
            <div className="font-bold uppercase tracking-wider text-neutral-900 dark:text-white text-[11px]">
              Product
            </div>
            <ul className="space-y-2">
              <li>
                <a href="#capabilities" className="hover:text-neutral-950 dark:hover:text-white transition-colors">
                  Features
                </a>
              </li>
              <li>
                <Link href="/pdf-tools" className="hover:text-neutral-950 dark:hover:text-white transition-colors">
                  PDF Tools
                </Link>
              </li>
              <li>
                <Link href="/pdf-generator" className="hover:text-neutral-950 dark:hover:text-white transition-colors">
                  PDF Generator
                </Link>
              </li>
              <li>
                <Link href="/workflows" className="hover:text-neutral-950 dark:hover:text-white transition-colors">
                  Workflows
                </Link>
              </li>
              <li>
                <a href="#pricing" className="hover:text-neutral-950 dark:hover:text-white transition-colors">
                  Pricing Plans
                </a>
              </li>
            </ul>
          </div>

          {/* Col 2: Solutions */}
          <div className="space-y-3">
            <div className="font-bold uppercase tracking-wider text-neutral-900 dark:text-white text-[11px]">
              Solutions
            </div>
            <ul className="space-y-2">
              <li>
                <a href="#use-cases" className="hover:text-neutral-950 dark:hover:text-white transition-colors">
                  Small Businesses
                </a>
              </li>
              <li>
                <a href="#use-cases" className="hover:text-neutral-950 dark:hover:text-white transition-colors">
                  Finance Teams
                </a>
              </li>
              <li>
                <a href="#use-cases" className="hover:text-neutral-950 dark:hover:text-white transition-colors">
                  Freelancers
                </a>
              </li>
              <li>
                <a href="#use-cases" className="hover:text-neutral-950 dark:hover:text-white transition-colors">
                  Enterprises
                </a>
              </li>
            </ul>
          </div>

          {/* Col 3: Resources & Company */}
          <div className="space-y-3">
            <div className="font-bold uppercase tracking-wider text-neutral-900 dark:text-white text-[11px]">
              Resources & Legal
            </div>
            <ul className="space-y-2">
              <li>
                <Link href="/developer" className="hover:text-neutral-950 dark:hover:text-white transition-colors">
                  Documentation & API
                </Link>
              </li>
              <li>
                <Link href="/verification" className="hover:text-neutral-950 dark:hover:text-white transition-colors">
                  Verification Portal
                </Link>
              </li>
              <li>
                <a href="#faq" className="hover:text-neutral-950 dark:hover:text-white transition-colors">
                  Help Center & FAQs
                </a>
              </li>
              <li>
                <Link href="/login" className="hover:text-neutral-950 dark:hover:text-white transition-colors">
                  Sign In
                </Link>
              </li>
              <li>
                <span className="text-neutral-400 dark:text-neutral-500 cursor-default">
                  Privacy &amp; Terms
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="pt-12 mt-12 border-t border-neutral-200 dark:border-neutral-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-neutral-400">
          <div>
            &copy; {currentYear} DocAutomate Platform. All rights reserved.
          </div>
          <div className="flex items-center gap-4">
            <span>Every Document. One Powerful Platform.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
