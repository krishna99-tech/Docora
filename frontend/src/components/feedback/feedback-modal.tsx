'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Star,
  Bug,
  Lightbulb,
  MessageSquare,
  ThumbsUp,
  Send,
  CheckCircle2,
  Paperclip,
  Smile,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { STORAGE_KEYS } from '@/constants';

export type FeedbackCategory = 'bug' | 'feature' | 'rating' | 'general';

export interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultCategory?: FeedbackCategory;
  context?: {
    page?: string;
    workflowId?: string;
    documentId?: string;
  };
  onSubmitSuccess?: (data: FeedbackPayload) => void;
}

export interface FeedbackPayload {
  category: FeedbackCategory;
  rating?: number;
  title: string;
  description: string;
  email?: string;
  page?: string;
  userAgent?: string;
  submittedAt: string;
}

const CATEGORIES = [
  {
    id: 'bug' as FeedbackCategory,
    label: 'Report Bug',
    icon: Bug,
    description: 'Something broken or unexpected',
    color: 'text-rose-500 bg-rose-500/10 border-rose-500/20',
  },
  {
    id: 'feature' as FeedbackCategory,
    label: 'Idea / Feature',
    icon: Lightbulb,
    description: 'Suggest a feature or improvement',
    color: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
  },
  {
    id: 'rating' as FeedbackCategory,
    label: 'Rating & CSAT',
    icon: Star,
    description: 'Rate your overall experience',
    color: 'text-sky-500 bg-sky-500/10 border-sky-500/20',
  },
  {
    id: 'general' as FeedbackCategory,
    label: 'General',
    icon: MessageSquare,
    description: 'Feedback, questions, or praise',
    color: 'text-purple-500 bg-purple-500/10 border-purple-500/20',
  },
];

export function FeedbackModal({
  isOpen,
  onClose,
  defaultCategory = 'feature',
  context,
  onSubmitSuccess,
}: FeedbackModalProps) {
  const [category, setCategory] = useState<FeedbackCategory>(defaultCategory);
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [ticketId, setTicketId] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Initialize email from logged-in user if available
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const rawUser = localStorage.getItem(STORAGE_KEYS.USER);
        if (rawUser) {
          const user = JSON.parse(rawUser);
          if (user.email) setEmail(user.email);
        }
      } catch {
        // Fallback
      }
    }
  }, [isOpen]);

  useEffect(() => {
    if (defaultCategory) setCategory(defaultCategory);
  }, [defaultCategory]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setError('Please provide feedback details.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Simulate API submission / dispatch
      await new Promise((resolve) => setTimeout(resolve, 600));

      const payload: FeedbackPayload = {
        category,
        rating: category === 'rating' ? rating : undefined,
        title: title.trim() || `${category.toUpperCase()} feedback`,
        description: description.trim(),
        email: email.trim() || undefined,
        page: context?.page || (typeof window !== 'undefined' ? window.location.pathname : undefined),
        userAgent: typeof window !== 'undefined' ? navigator.userAgent : undefined,
        submittedAt: new Date().toISOString(),
      };

      // Store in local storage for feedback tracking
      if (typeof window !== 'undefined') {
        const existing = JSON.parse(localStorage.getItem('docora_feedback_submissions') || '[]');
        const refId = `DOC-${Math.floor(100000 + Math.random() * 900000)}`;
        setTicketId(refId);
        localStorage.setItem(
          'docora_feedback_submissions',
          JSON.stringify([{ refId, ...payload }, ...existing].slice(0, 50))
        );
      }

      setIsSubmitted(true);
      onSubmitSuccess?.(payload);
    } catch {
      setError('Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setIsSubmitted(false);
    setTitle('');
    setDescription('');
    setRating(5);
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg bg-[var(--surface,#ffffff)] border border-[var(--border,#e5e5e5)] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border,#e5e5e5)] bg-[var(--surface-secondary,#fafafa)]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[var(--brand-from,#0066ff)]/10 text-[var(--brand-from,#0066ff)]">
              <Smile className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-[var(--foreground,#111111)]">
                Share Your Feedback
              </h3>
              <p className="text-xs text-[var(--muted-foreground,#737373)]">
                Help us improve Docora
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1.5 rounded-lg text-[var(--muted-foreground,#737373)] hover:text-[var(--foreground,#111111)] hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {isSubmitted ? (
            <div className="py-8 text-center flex flex-col items-center animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-600 mb-4 shadow-sm">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <h4 className="text-xl font-bold text-[var(--foreground,#111111)] mb-1">
                Thank You for Your Feedback!
              </h4>
              <p className="text-sm text-[var(--muted-foreground,#737373)] max-w-xs mb-4">
                Your response has been recorded. Our engineering & product team reviews every single submission.
              </p>
              {ticketId && (
                <div className="px-3 py-1.5 rounded-lg bg-[var(--surface-secondary,#f7f7f7)] border border-[var(--border,#e5e5e5)] text-xs font-mono text-[var(--foreground,#111111)] mb-6">
                  Reference: <span className="font-bold">{ticketId}</span>
                </div>
              )}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2 text-xs font-medium rounded-xl border border-[var(--border,#e5e5e5)] hover:bg-[var(--surface-hover,#f1f1f1)] text-[var(--foreground,#111111)] transition-colors"
                >
                  Send another note
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-[var(--brand-from,#0066ff)] hover:opacity-90 text-white shadow-sm transition-all"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Category Selector */}
              <div>
                <label className="block text-xs font-semibold text-[var(--muted-foreground,#737373)] mb-2 uppercase tracking-wider">
                  Category
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {CATEGORIES.map((cat) => {
                    const CatIcon = cat.icon;
                    const isSelected = category === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setCategory(cat.id)}
                        className={`flex flex-col items-center text-center p-3 rounded-xl border transition-all text-xs font-medium ${
                          isSelected
                            ? 'border-[var(--brand-from,#0066ff)] bg-[var(--brand-subtle,rgba(0,102,255,0.08))] text-[var(--brand-from,#0066ff)] shadow-xs ring-1 ring-[var(--brand-from,#0066ff)]'
                            : 'border-[var(--border,#e5e5e5)] bg-[var(--surface,#ffffff)] hover:bg-[var(--surface-hover,#f1f1f1)] text-[var(--muted-foreground,#737373)]'
                        }`}
                      >
                        <CatIcon className="w-5 h-5 mb-1.5" />
                        <span>{cat.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Star Rating for 'rating' category or optional on others */}
              {(category === 'rating' || category === 'general') && (
                <div className="p-3.5 rounded-xl bg-[var(--surface-secondary,#fafafa)] border border-[var(--border,#e5e5e5)] text-center">
                  <div className="text-xs font-medium text-[var(--muted-foreground,#737373)] mb-1.5">
                    How would you rate your experience?
                  </div>
                  <div className="flex justify-center items-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        aria-label={`Rate ${star} out of 5 stars`}
                        className="p-1 rounded-md transition-transform hover:scale-110 focus:outline-hidden"
                      >
                        <Star
                          className={`w-6 h-6 transition-colors ${
                            star <= (hoverRating || rating)
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-neutral-300 dark:text-neutral-600'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                  <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 mt-1 inline-block">
                    {rating === 5
                      ? '5/5 - Outstanding!'
                      : rating === 4
                      ? '4/5 - Very Good'
                      : rating === 3
                      ? '3/5 - Average'
                      : rating === 2
                      ? '2/5 - Needs Work'
                      : '1/5 - Poor'}
                  </span>
                </div>
              )}

              {/* Title / Subject */}
              <div>
                <label className="block text-xs font-semibold text-[var(--foreground,#111111)] mb-1">
                  Subject <span className="text-[var(--muted-foreground,#737373)] font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={
                    category === 'bug'
                      ? 'e.g., PDF generation failed on page 3'
                      : category === 'feature'
                      ? 'e.g., Export invoices to CSV'
                      : 'Brief summary'
                  }
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-[var(--border,#e5e5e5)] bg-[var(--surface,#ffffff)] text-[var(--foreground,#111111)] placeholder:text-[var(--muted-foreground,#737373)] focus:outline-hidden focus:ring-2 focus:ring-[var(--brand-from,#0066ff)] transition-all"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-[var(--foreground,#111111)] mb-1">
                  Details <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={
                    category === 'bug'
                      ? 'What happened? What were you doing? Any error codes shown?'
                      : category === 'feature'
                      ? 'What problem would this solve for your workflow?'
                      : 'Tell us how we can make Docora better for you...'
                  }
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[var(--border,#e5e5e5)] bg-[var(--surface,#ffffff)] text-[var(--foreground,#111111)] placeholder:text-[var(--muted-foreground,#737373)] focus:outline-hidden focus:ring-2 focus:ring-[var(--brand-from,#0066ff)] transition-all resize-y"
                />
              </div>

              {/* Email Contact */}
              <div>
                <label className="block text-xs font-semibold text-[var(--foreground,#111111)] mb-1">
                  Your Email <span className="text-[var(--muted-foreground,#737373)] font-normal">(for follow up)</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-[var(--border,#e5e5e5)] bg-[var(--surface,#ffffff)] text-[var(--foreground,#111111)] placeholder:text-[var(--muted-foreground,#737373)] focus:outline-hidden focus:ring-2 focus:ring-[var(--brand-from,#0066ff)] transition-all"
                />
              </div>

              {/* Context indicator */}
              {context?.page && (
                <div className="flex items-center gap-1.5 text-[11px] text-[var(--muted-foreground,#737373)] bg-[var(--surface-secondary,#fafafa)] px-3 py-1.5 rounded-lg border border-[var(--border,#e5e5e5)]">
                  <span>Submitting from page:</span>
                  <code className="font-mono text-neutral-800 dark:text-neutral-200">
                    {context.page}
                  </code>
                </div>
              )}

              {/* Error display */}
              {error && (
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Footer Actions */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-[var(--border,#e5e5e5)]">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-medium rounded-xl border border-[var(--border,#e5e5e5)] hover:bg-[var(--surface-hover,#f1f1f1)] text-[var(--foreground,#111111)] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold rounded-xl bg-[var(--brand-from,#0066ff)] hover:opacity-90 disabled:opacity-50 text-white shadow-sm transition-all"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      Submit Feedback
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
