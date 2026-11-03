'use client';

import React from 'react';
import Link from 'next/link';

interface DocoraLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showWordmark?: boolean;
}

export function DocoraLogo({
  className = '',
  size = 'md',
  showWordmark = true,
}: DocoraLogoProps) {
  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
  };

  const textSizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
  };

  return (
    <Link
      href="/"
      className={`inline-flex items-center gap-2.5 font-bold tracking-tight select-none transition-opacity hover:opacity-90 ${className}`}
      aria-label="DocAutomate Home"
    >
      <div
        className={`${iconSizes[size]} relative rounded-lg bg-gradient-to-br from-neutral-900 to-neutral-800 dark:from-white dark:to-neutral-200 text-white dark:text-neutral-900 flex items-center justify-center shadow-xs border border-neutral-700/20 dark:border-white/20`}
      >
        {/* Document Fold Vector SVG */}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-4 h-4 text-current"
        >
          <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="9" y1="13" x2="15" y2="13" />
          <line x1="9" y1="17" x2="13" y2="17" />
        </svg>
      </div>

      {showWordmark && (
        <span
          className={`${textSizes[size]} font-black tracking-tight text-neutral-950 dark:text-white font-sans flex items-center`}
        >
          DocAutomate
        </span>
      )}
    </Link>
  );
}

