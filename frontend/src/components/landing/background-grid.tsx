'use client';

import React from 'react';

export type GridVariant = 'dots' | 'squares' | 'crosshair' | 'blueprint' | 'mesh' | 'stripes';

interface BackgroundGridProps {
  variant?: GridVariant;
  className?: string;
  fade?: 'radial' | 'top-bottom' | 'bottom' | 'none';
  size?: number;
  glow?: 'blue' | 'purple' | 'amber' | 'emerald' | 'subtle' | 'mixed' | 'none';
  opacity?: number;
}

/**
 * High-performance SVG Background Grid component tailored for SaaS landing pages.
 * Supports distinct visual motifs per section (Linear-style squares, dots, technical crosshairs, blueprints).
 */
export function BackgroundGrid({
  variant = 'squares',
  className = '',
  fade = 'radial',
  size = 32,
  glow = 'none',
  opacity = 0.9,
}: BackgroundGridProps) {
  const maskStyles = {
    radial: {
      WebkitMaskImage: 'radial-gradient(ellipse 95% 85% at 50% 50%, #000 70%, transparent 100%)',
      maskImage: 'radial-gradient(ellipse 95% 85% at 50% 50%, #000 70%, transparent 100%)',
    },
    'top-bottom': {
      WebkitMaskImage: 'linear-gradient(to bottom, transparent, #000 10%, #000 90%, transparent)',
      maskImage: 'linear-gradient(to bottom, transparent, #000 10%, #000 90%, transparent)',
    },
    bottom: {
      WebkitMaskImage: 'linear-gradient(to bottom, #000 75%, transparent 100%)',
      maskImage: 'linear-gradient(to bottom, #000 75%, transparent 100%)',
    },
    none: {},
  };

  const glowColors = {
    blue: 'from-blue-500/30 via-cyan-500/20 to-transparent dark:from-blue-500/15 dark:via-cyan-500/10',
    purple: 'from-purple-500/30 via-pink-500/20 to-transparent dark:from-purple-500/15 dark:via-pink-500/10',
    amber: 'from-amber-500/30 via-orange-500/20 to-transparent dark:from-amber-500/15 dark:via-orange-500/10',
    emerald: 'from-emerald-500/30 via-teal-500/20 to-transparent dark:from-emerald-500/15 dark:via-teal-500/10',
    subtle: 'from-neutral-300/80 via-neutral-200/50 to-transparent dark:from-neutral-800/40 dark:via-neutral-900/20',
    none: '',
  };

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 z-0 overflow-hidden ${className}`}
    >
      {/* Optional Central Radial Glow Accent */}
      {glow !== 'none' && glow !== 'mixed' && (
        <div
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[750px] h-[450px] bg-gradient-to-tr ${glowColors[glow]} rounded-full blur-3xl mix-blend-multiply dark:mix-blend-normal`}
        />
      )}

      {/* Multi-Orb Aurora Mixed Gradient Accent - calibrated for vivid white theme watercolor diffusion & dark theme emission */}
      {glow === 'mixed' && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none mix-blend-multiply dark:mix-blend-normal opacity-90 dark:opacity-100">
          {/* Top-left Blue / Cyan Orb (Create) */}
          <div className="absolute -top-24 -left-20 w-[600px] h-[450px] bg-blue-400/40 dark:bg-blue-600/20 rounded-full blur-[100px]" />
          {/* Top-right Purple / Violet Orb (Process) */}
          <div className="absolute top-10 -right-20 w-[550px] h-[450px] bg-purple-400/40 dark:bg-purple-600/20 rounded-full blur-[100px]" />
          {/* Center Amber / Orange Glow (Automate) */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[400px] bg-amber-400/35 dark:bg-amber-600/15 rounded-full blur-[90px]" />
          {/* Bottom-left Emerald Orb (Verify) */}
          <div className="absolute -bottom-24 left-1/4 w-[500px] h-[400px] bg-emerald-400/35 dark:bg-emerald-600/15 rounded-full blur-[90px]" />
          {/* Bottom-right Rose Orb (Manage) */}
          <div className="absolute -bottom-20 right-10 w-[500px] h-[400px] bg-rose-400/35 dark:bg-rose-600/15 rounded-full blur-[90px]" />
        </div>
      )}

      {/* Grid Pattern with Vignette Fade Mask */}
      <div
        className="absolute inset-0 w-full h-full"
        style={{
          opacity,
          ...maskStyles[fade],
        }}
      >
        {variant === 'dots' && (
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern
                id="pattern-dots"
                x="0"
                y="0"
                width={size}
                height={size}
                patternUnits="userSpaceOnUse"
              >
                <circle
                  cx={size / 2}
                  cy={size / 2}
                  r="1.8"
                  className="fill-neutral-400/90 dark:fill-white/30"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#pattern-dots)" />
          </svg>
        )}

        {variant === 'squares' && (
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern
                id="pattern-squares"
                x="0"
                y="0"
                width={size}
                height={size}
                patternUnits="userSpaceOnUse"
              >
                <path
                  d={`M ${size} 0 L 0 0 0 ${size}`}
                  fill="none"
                  className="stroke-neutral-300 dark:stroke-white/[0.14]"
                  strokeWidth="1.2"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#pattern-squares)" />
          </svg>
        )}

        {variant === 'crosshair' && (
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern
                id="pattern-crosshair"
                x="0"
                y="0"
                width={size}
                height={size}
                patternUnits="userSpaceOnUse"
              >
                {/* Plus crosshair at pattern origin */}
                <path
                  d={`M ${size / 2 - 5} ${size / 2} L ${size / 2 + 5} ${size / 2} M ${size / 2} ${size / 2 - 5} L ${size / 2} ${size / 2 + 5}`}
                  className="stroke-neutral-400 dark:stroke-white/35"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#pattern-crosshair)" />
          </svg>
        )}

        {variant === 'blueprint' && (
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              {/* Minor grid */}
              <pattern
                id="pattern-minor"
                width={size / 4}
                height={size / 4}
                patternUnits="userSpaceOnUse"
              >
                <path
                  d={`M ${size / 4} 0 L 0 0 0 ${size / 4}`}
                  fill="none"
                  className="stroke-neutral-200/90 dark:stroke-white/[0.08]"
                  strokeWidth="0.8"
                />
              </pattern>
              {/* Major grid */}
              <pattern
                id="pattern-blueprint"
                width={size}
                height={size}
                patternUnits="userSpaceOnUse"
              >
                <rect width={size} height={size} fill="url(#pattern-minor)" />
                <path
                  d={`M ${size} 0 L 0 0 0 ${size}`}
                  fill="none"
                  className="stroke-neutral-300 dark:stroke-white/[0.22]"
                  strokeWidth="1.2"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#pattern-blueprint)" />
          </svg>
        )}

        {variant === 'mesh' && (
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern
                id="pattern-mesh"
                width={size}
                height={size}
                patternUnits="userSpaceOnUse"
              >
                {/* Diagonal isometric criss-cross */}
                <path
                  d={`M 0 0 L ${size} ${size} M ${size} 0 L 0 ${size}`}
                  fill="none"
                  className="stroke-neutral-300 dark:stroke-white/[0.14]"
                  strokeWidth="1"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#pattern-mesh)" />
          </svg>
        )}

        {variant === 'stripes' && (
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern
                id="pattern-stripes"
                width={size}
                height={size}
                patternTransform="rotate(45)"
                patternUnits="userSpaceOnUse"
              >
                <line
                  x1="0"
                  y1="0"
                  x2="0"
                  y2={size}
                  className="stroke-neutral-300 dark:stroke-white/[0.14]"
                  strokeWidth="1.2"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#pattern-stripes)" />
          </svg>
        )}
      </div>
    </div>
  );
}

