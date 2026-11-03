'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useAuth, useTheme } from '@/app/providers';
import { DocoraLogo } from './docora-logo';
import {
  ChevronDown,
  Menu,
  X,
  Sun,
  Moon,
  ArrowRight,
  FileText,
  Layers,
  Workflow,
  ShieldCheck,
  Share2,
  Sliders,
  CheckCircle2,
  FolderOpen,
  Briefcase,
  Building2,
  UserCheck,
  HelpCircle,
  FileCode,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

export function LandingNavbar() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Detect scroll to add frosted background
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 16);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Click outside listener for dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleDropdown = (name: string) => {
    setActiveDropdown((prev) => (prev === name ? null : name));
  };

  const closeDropdowns = () => {
    setActiveDropdown(null);
    setMobileMenuOpen(false);
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${
        isScrolled
          ? 'bg-white/85 dark:bg-[#0a0a0a]/85 backdrop-blur-md border-b border-neutral-200/80 dark:border-neutral-800/80 shadow-xs'
          : 'bg-transparent border-b border-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center gap-8">
          <DocoraLogo size="md" />

          {/* Desktop Navigation Links */}
          <nav
            ref={dropdownRef}
            className="hidden md:flex items-center gap-1 text-sm font-medium text-neutral-600 dark:text-neutral-300"
          >
            {/* Product Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => toggleDropdown('product')}
                onMouseEnter={() => setActiveDropdown('product')}
                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg transition-colors hover:text-neutral-950 dark:hover:text-white ${
                  activeDropdown === 'product'
                    ? 'text-neutral-950 dark:text-white bg-neutral-100 dark:bg-neutral-800/60'
                    : ''
                }`}
              >
                Product
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    activeDropdown === 'product' ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {activeDropdown === 'product' && (
                <div
                  onMouseLeave={() => setActiveDropdown(null)}
                  className="absolute top-full left-0 mt-2 w-80 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xl p-2.5 grid gap-1 animate-in fade-in zoom-in-95 duration-150"
                >
                  <Link
                    href="/invoices"
                    onClick={closeDropdowns}
                    className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800/70 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-neutral-900 dark:text-white text-xs">
                        Invoices & Receipts
                      </div>
                      <div className="text-[11px] text-neutral-500 dark:text-neutral-400">
                        Compile financial records and tax statements
                      </div>
                    </div>
                  </Link>

                  <Link
                    href="/pdf-generator"
                    onClick={closeDropdowns}
                    className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800/70 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                      <FileCode className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-neutral-900 dark:text-white text-xs">
                        PDF Generator
                      </div>
                      <div className="text-[11px] text-neutral-500 dark:text-neutral-400">
                        Markdown & visual builder with real-time compilation
                      </div>
                    </div>
                  </Link>

                  <Link
                    href="/pdf-tools"
                    onClick={closeDropdowns}
                    className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800/70 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                      <Layers className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-neutral-900 dark:text-white text-xs">
                        PDF Processing Tools
                      </div>
                      <div className="text-[11px] text-neutral-500 dark:text-neutral-400">
                        Merge, split, compress, watermark, and organize
                      </div>
                    </div>
                  </Link>

                  <Link
                    href="/workflows"
                    onClick={closeDropdowns}
                    className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800/70 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                      <Workflow className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-neutral-900 dark:text-white text-xs">
                        Workflow Engine
                      </div>
                      <div className="text-[11px] text-neutral-500 dark:text-neutral-400">
                        Visual approval routing and document dispatch
                      </div>
                    </div>
                  </Link>
                </div>
              )}
            </div>

            {/* Features Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => toggleDropdown('features')}
                onMouseEnter={() => setActiveDropdown('features')}
                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg transition-colors hover:text-neutral-950 dark:hover:text-white ${
                  activeDropdown === 'features'
                    ? 'text-neutral-950 dark:text-white bg-neutral-100 dark:bg-neutral-800/60'
                    : ''
                }`}
              >
                Features
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    activeDropdown === 'features' ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {activeDropdown === 'features' && (
                <div
                  onMouseLeave={() => setActiveDropdown(null)}
                  className="absolute top-full left-0 mt-2 w-96 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xl p-3 grid grid-cols-2 gap-1.5 animate-in fade-in zoom-in-95 duration-150"
                >
                  <a
                    href="#capabilities"
                    onClick={closeDropdowns}
                    className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800/70 transition-colors"
                  >
                    <div className="font-semibold text-neutral-900 dark:text-white text-xs flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-blue-500" /> Create
                    </div>
                    <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                      Multi-type generation
                    </div>
                  </a>

                  <a
                    href="#capabilities"
                    onClick={closeDropdowns}
                    className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800/70 transition-colors"
                  >
                    <div className="font-semibold text-neutral-900 dark:text-white text-xs flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-purple-500" /> Process
                    </div>
                    <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                      PDF manipulation tools
                    </div>
                  </a>

                  <a
                    href="#capabilities"
                    onClick={closeDropdowns}
                    className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800/70 transition-colors"
                  >
                    <div className="font-semibold text-neutral-900 dark:text-white text-xs flex items-center gap-1.5">
                      <Workflow className="w-3.5 h-3.5 text-amber-500" /> Automate
                    </div>
                    <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                      Approvals & workflows
                    </div>
                  </a>

                  <a
                    href="#capabilities"
                    onClick={closeDropdowns}
                    className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800/70 transition-colors"
                  >
                    <div className="font-semibold text-neutral-900 dark:text-white text-xs flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Verify
                    </div>
                    <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                      SHA-256 & QR verification
                    </div>
                  </a>

                  <a
                    href="#capabilities"
                    onClick={closeDropdowns}
                    className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800/70 transition-colors"
                  >
                    <div className="font-semibold text-neutral-900 dark:text-white text-xs flex items-center gap-1.5">
                      <Share2 className="w-3.5 h-3.5 text-indigo-500" /> Share
                    </div>
                    <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                      Expiring links & passwords
                    </div>
                  </a>

                  <a
                    href="#capabilities"
                    onClick={closeDropdowns}
                    className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800/70 transition-colors"
                  >
                    <div className="font-semibold text-neutral-900 dark:text-white text-xs flex items-center gap-1.5">
                      <FolderOpen className="w-3.5 h-3.5 text-rose-500" /> Manage
                    </div>
                    <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                      Centralized document vault
                    </div>
                  </a>
                </div>
              )}
            </div>

            {/* Solutions Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => toggleDropdown('solutions')}
                onMouseEnter={() => setActiveDropdown('solutions')}
                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg transition-colors hover:text-neutral-950 dark:hover:text-white ${
                  activeDropdown === 'solutions'
                    ? 'text-neutral-950 dark:text-white bg-neutral-100 dark:bg-neutral-800/60'
                    : ''
                }`}
              >
                Solutions
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    activeDropdown === 'solutions' ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {activeDropdown === 'solutions' && (
                <div
                  onMouseLeave={() => setActiveDropdown(null)}
                  className="absolute top-full left-0 mt-2 w-72 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xl p-2.5 grid gap-1 animate-in fade-in zoom-in-95 duration-150"
                >
                  <a
                    href="#use-cases"
                    onClick={closeDropdowns}
                    className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800/70 transition-colors text-xs font-medium text-neutral-900 dark:text-white"
                  >
                    <Building2 className="w-4 h-4 text-neutral-500" />
                    Small Businesses
                  </a>
                  <a
                    href="#use-cases"
                    onClick={closeDropdowns}
                    className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800/70 transition-colors text-xs font-medium text-neutral-900 dark:text-white"
                  >
                    <Briefcase className="w-4 h-4 text-neutral-500" />
                    Finance & Accounting
                  </a>
                  <a
                    href="#use-cases"
                    onClick={closeDropdowns}
                    className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800/70 transition-colors text-xs font-medium text-neutral-900 dark:text-white"
                  >
                    <UserCheck className="w-4 h-4 text-neutral-500" />
                    Freelancers & Solo Pros
                  </a>
                  <a
                    href="#use-cases"
                    onClick={closeDropdowns}
                    className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800/70 transition-colors text-xs font-medium text-neutral-900 dark:text-white"
                  >
                    <Sliders className="w-4 h-4 text-neutral-500" />
                    Operations Teams
                  </a>
                </div>
              )}
            </div>

            {/* Resources Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => toggleDropdown('resources')}
                onMouseEnter={() => setActiveDropdown('resources')}
                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg transition-colors hover:text-neutral-950 dark:hover:text-white ${
                  activeDropdown === 'resources'
                    ? 'text-neutral-950 dark:text-white bg-neutral-100 dark:bg-neutral-800/60'
                    : ''
                }`}
              >
                Resources
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    activeDropdown === 'resources' ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {activeDropdown === 'resources' && (
                <div
                  onMouseLeave={() => setActiveDropdown(null)}
                  className="absolute top-full left-0 mt-2 w-72 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xl p-2.5 grid gap-1 animate-in fade-in zoom-in-95 duration-150"
                >
                  <Link
                    href="/developer"
                    onClick={closeDropdowns}
                    className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800/70 transition-colors text-xs font-medium text-neutral-900 dark:text-white"
                  >
                    <FileCode className="w-4 h-4 text-neutral-500" />
                    API Documentation
                  </Link>
                  <Link
                    href="/verification"
                    onClick={closeDropdowns}
                    className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800/70 transition-colors text-xs font-medium text-neutral-900 dark:text-white"
                  >
                    <ShieldCheck className="w-4 h-4 text-neutral-500" />
                    Public Verification Portal
                  </Link>
                  <a
                    href="#faq"
                    onClick={closeDropdowns}
                    className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800/70 transition-colors text-xs font-medium text-neutral-900 dark:text-white"
                  >
                    <HelpCircle className="w-4 h-4 text-neutral-500" />
                    Help & FAQs
                  </a>
                </div>
              )}
            </div>

            {/* Pricing Direct Link */}
            <a
              href="#pricing"
              className="px-3 py-1.5 rounded-lg transition-colors hover:text-neutral-950 dark:hover:text-white"
            >
              Pricing
            </a>
          </nav>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Light / Dark Mode Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle visual theme"
            className="p-2 rounded-lg text-neutral-500 hover:text-neutral-950 dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* User Authentication Status */}
          {user ? (
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors shadow-xs"
            >
              Dashboard
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden sm:inline-flex px-3.5 py-1.5 text-xs font-semibold rounded-lg text-neutral-700 dark:text-neutral-300 hover:text-neutral-950 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800/70 transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors shadow-xs"
              >
                Get Started
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </>
          )}

          {/* Mobile Hamburger Toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            aria-label="Toggle mobile menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white dark:bg-neutral-950 border-b border-neutral-200 dark:border-neutral-800 px-4 pt-3 pb-6 space-y-3 animate-in slide-in-from-top-4 duration-200">
          <div className="grid gap-1 font-medium text-sm">
            <Link
              href="/dashboard"
              onClick={closeDropdowns}
              className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-900 dark:text-white"
            >
              Dashboard Workspace
            </Link>
            <Link
              href="/pdf-generator"
              onClick={closeDropdowns}
              className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-900 dark:text-white"
            >
              PDF Generator
            </Link>
            <Link
              href="/pdf-tools"
              onClick={closeDropdowns}
              className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-900 dark:text-white"
            >
              PDF Utilities
            </Link>
            <Link
              href="/workflows"
              onClick={closeDropdowns}
              className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-900 dark:text-white"
            >
              Workflow Automation
            </Link>
            <a
              href="#capabilities"
              onClick={closeDropdowns}
              className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-900 dark:text-white"
            >
              Platform Capabilities
            </a>
            <a
              href="#pricing"
              onClick={closeDropdowns}
              className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-900 dark:text-white"
            >
              Pricing Plans
            </a>
            <a
              href="#faq"
              onClick={closeDropdowns}
              className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-900 dark:text-white"
            >
              FAQs
            </a>
          </div>

          <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800 flex flex-col gap-2">
            {!user ? (
              <>
                <Link
                  href="/login"
                  onClick={closeDropdowns}
                  className="w-full text-center py-2 text-xs font-semibold rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-900 dark:text-white transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  onClick={closeDropdowns}
                  className="w-full text-center py-2 text-xs font-semibold rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors shadow-xs"
                >
                  Get Started Free
                </Link>
              </>
            ) : (
              <Link
                href="/dashboard"
                onClick={closeDropdowns}
                className="w-full text-center py-2 text-xs font-semibold rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors shadow-xs"
              >
                Go to Workspace Dashboard
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

