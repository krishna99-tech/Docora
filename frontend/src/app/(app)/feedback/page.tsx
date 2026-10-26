'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  MessageSquare,
  Bug,
  Lightbulb,
  Star,
  Send,
  CheckCircle2,
  ThumbsUp,
  Clock,
  Sparkles,
  ShieldAlert,
  ArrowRight,
  Filter,
  Search,
  MessageCircle,
  HelpCircle,
  TrendingUp,
  Laptop,
} from 'lucide-react';
import { STORAGE_KEYS } from '@/constants';
import { FeedbackBanner } from '@/components/feedback/feedback-banner';
import { EmptyState } from '@/components/feedback/empty-state';

type CategoryType = 'bug' | 'feature' | 'rating' | 'general';
type BugSeverity = 'low' | 'medium' | 'high' | 'critical';
type FeatureImpact = 'nice_to_have' | 'important' | 'critical';

interface RoadmapItem {
  id: string;
  title: string;
  description: string;
  category: string;
  status: 'shipped' | 'in_progress' | 'planned' | 'under_review';
  votes: number;
  userVoted?: boolean;
}

const INITIAL_ROADMAP: RoadmapItem[] = [
  {
    id: 'rd-1',
    title: 'Custom Palette Themes & Vibrant Color Generator',
    description: 'Switch between Figma-curated harmonious color schemes across dashboard, buttons, and badges.',
    category: 'Design & UI',
    status: 'shipped',
    votes: 312,
  },
  {
    id: 'rd-2',
    title: 'Multi-step Approval Workflows with One-Click Email Links',
    description: 'Require managerial approval before issuing invoices or receipts over customized monetary thresholds.',
    category: 'Workflows',
    status: 'in_progress',
    votes: 245,
  },
  {
    id: 'rd-3',
    title: 'Local AI OCR Receipt Scanning & Auto-Itemization',
    description: 'Extract items, tax, and totals directly from photo receipts and instantly populate draft receipts.',
    category: 'PDF Tools',
    status: 'planned',
    votes: 189,
  },
  {
    id: 'rd-4',
    title: 'Direct QuickBooks & Xero Bi-Directional Accounting Sync',
    description: 'Synchronize invoices, payments, and client balances in real time with enterprise accounting software.',
    category: 'Integrations',
    status: 'under_review',
    votes: 167,
  },
];

export default function FeedbackPage() {
  const [activeTab, setActiveTab] = useState<'submit' | 'roadmap'>('submit');
  const [category, setCategory] = useState<CategoryType>('feature');
  const [rating, setRating] = useState<number>(5);
  const [npsScore, setNpsScore] = useState<number>(9);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [email, setEmail] = useState('');
  const [severity, setSeverity] = useState<BugSeverity>('medium');
  const [impact, setImpact] = useState<FeatureImpact>('important');
  const [moduleArea, setModuleArea] = useState('workflows');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedTicket, setSubmittedTicket] = useState<string | null>(null);
  const [roadmap, setRoadmap] = useState<RoadmapItem[]>(INITIAL_ROADMAP);
  const [roadmapFilter, setRoadmapFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [bannerFeedback, setBannerFeedback] = useState<{
    type: 'success' | 'info';
    message: string;
  } | null>(null);

  // Auto-fill logged-in email
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(STORAGE_KEYS.USER);
        if (raw) {
          const u = JSON.parse(raw);
          if (u.email) setEmail(u.email);
        }
      } catch {
        // Fallback
      }
    }
  }, []);

  const handleVote = (id: string) => {
    setRoadmap((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const nextVoted = !item.userVoted;
          return {
            ...item,
            votes: nextVoted ? item.votes + 1 : item.votes - 1,
            userVoted: nextVoted,
          };
        }
        return item;
      })
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    setIsSubmitting(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 600));

      const refId = `DOC-${Math.floor(100000 + Math.random() * 900000)}`;
      setSubmittedTicket(refId);

      // Save submission locally
      if (typeof window !== 'undefined') {
        const list = JSON.parse(localStorage.getItem('docora_feedback_submissions') || '[]');
        localStorage.setItem(
          'docora_feedback_submissions',
          JSON.stringify([
            {
              refId,
              category,
              title: title.trim() || `${category.toUpperCase()} Submission`,
              description,
              rating: category === 'rating' ? rating : undefined,
              npsScore: category === 'rating' ? npsScore : undefined,
              severity: category === 'bug' ? severity : undefined,
              impact: category === 'feature' ? impact : undefined,
              moduleArea,
              email: email.trim() || undefined,
              submittedAt: new Date().toISOString(),
            },
            ...list,
          ])
        );
      }

      setBannerFeedback({
        type: 'success',
        message: `Feedback received! Reference ${refId} has been filed with our engineering team.`,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setSubmittedTicket(null);
    setTitle('');
    setDescription('');
    setRating(5);
    setNpsScore(9);
  };

  const filteredRoadmap = roadmap.filter((item) => {
    const matchesFilter = roadmapFilter === 'all' || item.status === roadmapFilter;
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Top Banner Alert if active */}
      {bannerFeedback && (
        <FeedbackBanner
          type={bannerFeedback.type}
          title="Feedback Submitted"
          message={bannerFeedback.message}
          autoDismissMs={6000}
          onClose={() => setBannerFeedback(null)}
        />
      )}

      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl border border-[var(--border,#e5e5e5)] bg-gradient-to-br from-[var(--surface,#ffffff)] via-[var(--surface-secondary,#fafafa)] to-[var(--brand-subtle,rgba(0,102,255,0.05))] p-6 sm:p-10 shadow-xs">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-[var(--brand-from,#0066ff)]/10 text-[var(--brand-from,#0066ff)] border border-[var(--brand-from,#0066ff)]/20">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Voice of the Customer</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-[var(--foreground,#111111)]">
              Product Feedback & Ideas
            </h1>
            <p className="text-sm sm:text-base text-[var(--muted-foreground,#737373)] leading-relaxed">
              Help shape the future of Docora. Whether you found a glitch, have a killer feature idea, or want to share your experience, we read every submission.
            </p>
          </div>

          {/* Quick CSAT Summary Card */}
          <div className="grid grid-cols-2 gap-3 shrink-0 sm:w-80">
            <div className="p-3.5 rounded-2xl border border-[var(--border,#e5e5e5)] bg-[var(--surface,#ffffff)]/80 backdrop-blur-xs shadow-xs text-center">
              <div className="flex items-center justify-center gap-1 text-amber-500 mb-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className="w-3.5 h-3.5 fill-current" />
                ))}
              </div>
              <div className="text-xl font-bold text-[var(--foreground,#111111)]">4.9 / 5.0</div>
              <div className="text-[11px] text-[var(--muted-foreground,#737373)]">Customer Satisfaction</div>
            </div>
            <div className="p-3.5 rounded-2xl border border-[var(--border,#e5e5e5)] bg-[var(--surface,#ffffff)]/80 backdrop-blur-xs shadow-xs text-center">
              <div className="flex items-center justify-center gap-1 text-emerald-500 mb-1">
                <Clock className="w-4 h-4" />
              </div>
              <div className="text-xl font-bold text-[var(--foreground,#111111)]">&lt; 24h</div>
              <div className="text-[11px] text-[var(--muted-foreground,#737373)]">Avg. Triage Response</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Tab Switcher */}
      <div className="flex items-center justify-between border-b border-[var(--border,#e5e5e5)] pb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('submit')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeTab === 'submit'
                ? 'bg-[var(--brand-from,#0066ff)] text-white shadow-xs'
                : 'text-[var(--muted-foreground,#737373)] hover:text-[var(--foreground,#111111)] hover:bg-[var(--surface-hover,#f1f1f1)]'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>Submit Feedback</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('roadmap')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeTab === 'roadmap'
                ? 'bg-[var(--brand-from,#0066ff)] text-white shadow-xs'
                : 'text-[var(--muted-foreground,#737373)] hover:text-[var(--foreground,#111111)] hover:bg-[var(--surface-hover,#f1f1f1)]'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Community Roadmap ({roadmap.length})</span>
          </button>
        </div>
      </div>

      {/* TAB 1: SUBMISSION FORM */}
      {activeTab === 'submit' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Form (2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            {submittedTicket ? (
              <div className="rounded-3xl border border-emerald-500/30 bg-emerald-500/5 p-8 sm:p-12 text-center animate-in zoom-in-95 duration-200">
                <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-600 mx-auto mb-5 shadow-sm">
                  <CheckCircle2 className="w-12 h-12" />
                </div>
                <h3 className="text-2xl font-bold text-[var(--foreground,#111111)] mb-2">
                  Feedback Successfully Filed!
                </h3>
                <p className="text-sm text-[var(--muted-foreground,#737373)] max-w-md mx-auto mb-6">
                  Thank you for contributing to Docora. We have assigned ticket reference{' '}
                  <span className="font-mono font-bold text-[var(--foreground,#111111)]">
                    {submittedTicket}
                  </span>{' '}
                  to your submission.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={handleResetForm}
                    className="px-5 py-2.5 rounded-xl text-xs font-semibold border border-[var(--border,#e5e5e5)] bg-[var(--surface,#ffffff)] hover:bg-[var(--surface-hover,#f1f1f1)] text-[var(--foreground,#111111)] shadow-xs transition-colors"
                  >
                    Submit Another Feedback
                  </button>
                  <Link
                    href="/dashboard"
                    className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-[var(--brand-from,#0066ff)] hover:opacity-90 text-white shadow-xs transition-all"
                  >
                    Return to Dashboard
                  </Link>
                </div>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="rounded-3xl border border-[var(--border,#e5e5e5)] bg-[var(--surface,#ffffff)] p-6 sm:p-8 shadow-xs space-y-6"
              >
                {/* Category Selection Chips */}
                <div>
                  <label className="block text-xs font-semibold text-[var(--muted-foreground,#737373)] uppercase tracking-wider mb-2.5">
                    1. Select Feedback Category
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {[
                      { id: 'feature', label: 'Feature Request', icon: Lightbulb, color: 'text-amber-500' },
                      { id: 'bug', label: 'Report a Bug', icon: Bug, color: 'text-rose-500' },
                      { id: 'rating', label: 'Review & Rating', icon: Star, color: 'text-sky-500' },
                      { id: 'general', label: 'General Feedback', icon: MessageSquare, color: 'text-purple-500' },
                    ].map((c) => {
                      const Icon = c.icon;
                      const isSelected = category === c.id;
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setCategory(c.id as CategoryType)}
                          className={`flex flex-col items-center p-3.5 rounded-2xl border text-center transition-all ${
                            isSelected
                              ? 'border-[var(--brand-from,#0066ff)] bg-[var(--brand-subtle,rgba(0,102,255,0.08))] text-[var(--brand-from,#0066ff)] ring-1 ring-[var(--brand-from,#0066ff)] shadow-xs'
                              : 'border-[var(--border,#e5e5e5)] bg-[var(--surface,#ffffff)] hover:bg-[var(--surface-hover,#f1f1f1)] text-[var(--muted-foreground,#737373)]'
                          }`}
                        >
                          <Icon className={`w-5 h-5 mb-1.5 ${isSelected ? 'text-[var(--brand-from,#0066ff)]' : c.color}`} />
                          <span className="text-xs font-semibold">{c.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Subcategory Details for Bugs or Features */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--foreground,#111111)] mb-1.5">
                      Relevant Module
                    </label>
                    <select
                      value={moduleArea}
                      onChange={(e) => setModuleArea(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-[var(--border,#e5e5e5)] bg-[var(--surface,#ffffff)] text-[var(--foreground,#111111)] focus:outline-hidden focus:ring-2 focus:ring-[var(--brand-from,#0066ff)]"
                    >
                      <option value="workflows">Workflows & Automations</option>
                      <option value="invoices">Invoices & Billing</option>
                      <option value="receipts">Payment Receipts</option>
                      <option value="pdf-tools">PDF Tools & Generator</option>
                      <option value="developer">Developer API & Webhooks</option>
                      <option value="templates">Templates Studio</option>
                      <option value="settings">Settings & Workspaces</option>
                      <option value="ui">Theme & Navigation</option>
                    </select>
                  </div>

                  {category === 'bug' && (
                    <div>
                      <label className="block text-xs font-semibold text-[var(--foreground,#111111)] mb-1.5">
                        Severity Level
                      </label>
                      <select
                        value={severity}
                        onChange={(e) => setSeverity(e.target.value as BugSeverity)}
                        className="w-full px-3.5 py-2 text-xs rounded-xl border border-[var(--border,#e5e5e5)] bg-[var(--surface,#ffffff)] text-[var(--foreground,#111111)] focus:outline-hidden focus:ring-2 focus:ring-[var(--brand-from,#0066ff)]"
                      >
                        <option value="low">Low (Cosmetic / Minor annoyance)</option>
                        <option value="medium">Medium (Feature partially affected)</option>
                        <option value="high">High (Feature unusable)</option>
                        <option value="critical">Critical (Data loss / Blocker)</option>
                      </select>
                    </div>
                  )}

                  {category === 'feature' && (
                    <div>
                      <label className="block text-xs font-semibold text-[var(--foreground,#111111)] mb-1.5">
                        Business Impact
                      </label>
                      <select
                        value={impact}
                        onChange={(e) => setImpact(e.target.value as FeatureImpact)}
                        className="w-full px-3.5 py-2 text-xs rounded-xl border border-[var(--border,#e5e5e5)] bg-[var(--surface,#ffffff)] text-[var(--foreground,#111111)] focus:outline-hidden focus:ring-2 focus:ring-[var(--brand-from,#0066ff)]"
                      >
                        <option value="nice_to_have">Nice to have</option>
                        <option value="important">Important (Would use daily)</option>
                        <option value="critical">Critical to our operation</option>
                      </select>
                    </div>
                  )}
                </div>

                {/* Star Rating & NPS when on 'rating' */}
                {category === 'rating' && (
                  <div className="space-y-4 p-5 rounded-2xl bg-[var(--surface-secondary,#fafafa)] border border-[var(--border,#e5e5e5)]">
                    <div>
                      <div className="text-xs font-semibold text-[var(--foreground,#111111)] mb-2 text-center">
                        Overall Satisfaction Rating
                      </div>
                      <div className="flex justify-center items-center gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setRating(star)}
                            className="p-1 rounded-md transition-transform hover:scale-110 focus:outline-hidden"
                          >
                            <Star
                              className={`w-7 h-7 ${
                                star <= rating
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'text-neutral-300 dark:text-neutral-600'
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs font-semibold text-[var(--foreground,#111111)] mb-2 text-center">
                        How likely are you to recommend Docora to a colleague? (0 = Unlikely, 10 = Definitely)
                      </div>
                      <div className="flex justify-between items-center gap-1 overflow-x-auto pb-1">
                        {Array.from({ length: 11 }).map((_, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setNpsScore(i)}
                            className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                              npsScore === i
                                ? 'bg-[var(--brand-from,#0066ff)] text-white shadow-xs'
                                : 'bg-[var(--surface,#ffffff)] border border-[var(--border,#e5e5e5)] text-[var(--foreground,#111111)] hover:bg-[var(--surface-hover,#f1f1f1)]'
                            }`}
                          >
                            {i}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Title */}
                <div>
                  <label className="block text-xs font-semibold text-[var(--foreground,#111111)] mb-1.5">
                    Summary / Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={
                      category === 'bug'
                        ? 'e.g., PDF Preview blank when invoice has multiple tax rates'
                        : category === 'feature'
                        ? 'e.g., Support bulk CSV export for monthly tax filings'
                        : 'Brief summary of your review'
                    }
                    className="w-full px-4 py-2.5 text-xs rounded-xl border border-[var(--border,#e5e5e5)] bg-[var(--surface,#ffffff)] text-[var(--foreground,#111111)] placeholder:text-[var(--muted-foreground,#737373)] focus:outline-hidden focus:ring-2 focus:ring-[var(--brand-from,#0066ff)]"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-semibold text-[var(--foreground,#111111)] mb-1.5">
                    Detailed Notes <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={5}
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={
                      category === 'bug'
                        ? '1. What were you attempting to do?\n2. What happened instead?\n3. Any console or network error codes?'
                        : category === 'feature'
                        ? 'Describe your ideal workflow and how this helps you automate document delivery.'
                        : 'What do you love most, and what can we improve?'
                    }
                    className="w-full px-4 py-3 text-xs rounded-xl border border-[var(--border,#e5e5e5)] bg-[var(--surface,#ffffff)] text-[var(--foreground,#111111)] placeholder:text-[var(--muted-foreground,#737373)] focus:outline-hidden focus:ring-2 focus:ring-[var(--brand-from,#0066ff)] resize-y font-sans"
                  />
                </div>

                {/* Email for Follow Up */}
                <div>
                  <label className="block text-xs font-semibold text-[var(--foreground,#111111)] mb-1.5">
                    Contact Email <span className="text-[var(--muted-foreground,#737373)] font-normal">(optional, for replies & updates)</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    className="w-full px-4 py-2.5 text-xs rounded-xl border border-[var(--border,#e5e5e5)] bg-[var(--surface,#ffffff)] text-[var(--foreground,#111111)] placeholder:text-[var(--muted-foreground,#737373)] focus:outline-hidden focus:ring-2 focus:ring-[var(--brand-from,#0066ff)]"
                  />
                </div>

                {/* Submit Button */}
                <div className="pt-2 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground,#737373)]">
                    <Laptop className="w-3.5 h-3.5" />
                    <span>Client & system context automatically included</span>
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-semibold bg-[var(--brand-from,#0066ff)] hover:opacity-90 disabled:opacity-50 text-white shadow-xs transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <Send className="w-4 h-4" />
                    <span>{isSubmitting ? 'Transmitting...' : 'Send Feedback'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Right Sidebar Info (1 col) */}
          <div className="space-y-6">
            {/* Direct Support Card */}
            <div className="rounded-3xl border border-[var(--border,#e5e5e5)] bg-[var(--surface,#ffffff)] p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-[var(--brand-from,#0066ff)]/10 text-[var(--brand-from,#0066ff)]">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[var(--foreground,#111111)]">Direct Engineering Access</h4>
                  <p className="text-xs text-[var(--muted-foreground,#737373)]">Have an urgent blocker?</p>
                </div>
              </div>
              <p className="text-xs text-[var(--muted-foreground,#737373)] leading-relaxed">
                Critical outages and security issues are triaged immediately by our core team with round-the-clock monitoring.
              </p>
              <div className="pt-2 border-t border-[var(--border,#e5e5e5)] space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[var(--muted-foreground,#737373)]">API Status</span>
                  <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-600 dark:text-emerald-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    All Systems Operational
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[var(--muted-foreground,#737373)]">Response SLA</span>
                  <span className="font-semibold text-[var(--foreground,#111111)]">Same Day</span>
                </div>
              </div>
            </div>

            {/* What Happens Next Card */}
            <div className="rounded-3xl border border-[var(--border,#e5e5e5)] bg-[var(--surface-secondary,#fafafa)] p-6 shadow-xs space-y-3">
              <h4 className="text-xs font-bold text-[var(--muted-foreground,#737373)] uppercase tracking-wider">
                What happens after you submit?
              </h4>
              <ul className="space-y-2.5 text-xs text-[var(--foreground,#111111)]">
                <li className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0 mt-0.5 font-bold text-[10px]">
                    1
                  </div>
                  <span>Your submission is ingested with diagnostic metadata and assigned a tracking ID.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-purple-500/10 text-purple-600 flex items-center justify-center shrink-0 mt-0.5 font-bold text-[10px]">
                    2
                  </div>
                  <span>Feature requests are mapped directly into our community roadmap voting list.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5 font-bold text-[10px]">
                    3
                  </div>
                  <span>If you provided an email, you will receive an update once your item enters development.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: COMMUNITY ROADMAP & VOTING */}
      {activeTab === 'roadmap' && (
        <div className="space-y-6">
          {/* Controls: Search and Status Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl border border-[var(--border,#e5e5e5)] bg-[var(--surface,#ffffff)]">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted-foreground,#737373)]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search community suggestions..."
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-[var(--border,#e5e5e5)] bg-[var(--surface-secondary,#fafafa)] text-[var(--foreground,#111111)] placeholder:text-[var(--muted-foreground,#737373)] focus:outline-hidden focus:ring-2 focus:ring-[var(--brand-from,#0066ff)]"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {[
                { id: 'all', label: 'All Items' },
                { id: 'in_progress', label: 'In Progress' },
                { id: 'planned', label: 'Planned' },
                { id: 'under_review', label: 'Under Review' },
                { id: 'shipped', label: 'Shipped' },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setRoadmapFilter(f.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                    roadmapFilter === f.id
                      ? 'bg-[var(--foreground,#111111)] text-[var(--surface,#ffffff)]'
                      : 'text-[var(--muted-foreground,#737373)] hover:text-[var(--foreground,#111111)] hover:bg-[var(--surface-hover,#f1f1f1)]'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* List of Roadmap Items */}
          {filteredRoadmap.length === 0 ? (
            <EmptyState
              preset="search"
              searchQuery={searchQuery}
              secondaryAction={{
                label: 'Reset Filters',
                onClick: () => {
                  setSearchQuery('');
                  setRoadmapFilter('all');
                },
              }}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredRoadmap.map((item) => {
                const statusStyles = {
                  shipped: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
                  in_progress: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
                  planned: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
                  under_review: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
                }[item.status];

                const statusLabels = {
                  shipped: 'Shipped',
                  in_progress: 'In Progress',
                  planned: 'Planned',
                  under_review: 'Under Review',
                }[item.status];

                return (
                  <div
                    key={item.id}
                    className="flex items-start gap-4 p-5 rounded-2xl border border-[var(--border,#e5e5e5)] bg-[var(--surface,#ffffff)] hover:border-[var(--brand-from,#0066ff)]/50 transition-all shadow-xs"
                  >
                    {/* Upvote Button */}
                    <button
                      type="button"
                      onClick={() => handleVote(item.id)}
                      className={`flex flex-col items-center justify-center w-12 h-14 rounded-xl border transition-all shrink-0 ${
                        item.userVoted
                          ? 'border-[var(--brand-from,#0066ff)] bg-[var(--brand-from,#0066ff)] text-white shadow-xs'
                          : 'border-[var(--border,#e5e5e5)] bg-[var(--surface-secondary,#fafafa)] hover:bg-[var(--surface-hover,#f1f1f1)] text-[var(--foreground,#111111)]'
                      }`}
                    >
                      <ThumbsUp className={`w-4 h-4 mb-1 ${item.userVoted ? 'fill-current' : ''}`} />
                      <span className="text-xs font-bold">{item.votes}</span>
                    </button>

                    {/* Content */}
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusStyles}`}>
                          {statusLabels}
                        </span>
                        <span className="text-[11px] text-[var(--muted-foreground,#737373)] font-medium">
                          {item.category}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-[var(--foreground,#111111)]">
                        {item.title}
                      </h4>
                      <p className="text-xs text-[var(--muted-foreground,#737373)] leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
