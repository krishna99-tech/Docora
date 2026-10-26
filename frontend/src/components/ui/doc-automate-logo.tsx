'use client';

import React from 'react';

export interface DocAutomateLogoProps {
  variant?: 'icon' | 'horizontal' | 'stacked';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
  className?: string;
  showTagline?: boolean;
  theme?: 'auto' | 'light' | 'dark';
}

/**
 * DocAutomate Brand Logo Component
 * High-fidelity vector SVG rendering the DocAutomate logo in icon, horizontal, or stacked form.
 */
export function DocAutomateLogo({
  variant = 'horizontal',
  size = 'md',
  className = '',
  showTagline = true,
  theme = 'auto',
}: DocAutomateLogoProps) {
  // Preset dimension mappings
  const getDimensions = () => {
    if (typeof size === 'number') {
      if (variant === 'icon') return { width: size, height: size };
      if (variant === 'horizontal') return { width: size * 4.16, height: size };
      return { width: size, height: size };
    }

    switch (size) {
      case 'xs':
        return variant === 'icon'
          ? { width: 20, height: 20 }
          : variant === 'horizontal'
          ? { width: 120, height: 28 }
          : { width: 80, height: 80 };
      case 'sm':
        return variant === 'icon'
          ? { width: 28, height: 28 }
          : variant === 'horizontal'
          ? { width: 150, height: 36 }
          : { width: 120, height: 120 };
      case 'lg':
        return variant === 'icon'
          ? { width: 48, height: 48 }
          : variant === 'horizontal'
          ? { width: 220, height: 52 }
          : { width: 240, height: 240 };
      case 'xl':
        return variant === 'icon'
          ? { width: 64, height: 64 }
          : variant === 'horizontal'
          ? { width: 280, height: 68 }
          : { width: 320, height: 320 };
      case 'md':
      default:
        return variant === 'icon'
          ? { width: 36, height: 36 }
          : variant === 'horizontal'
          ? { width: 180, height: 42 }
          : { width: 180, height: 180 };
    }
  };

  const dims = getDimensions();
  const idPrefix = React.useId().replace(/:/g, '');

  // Text color resolution
  const docTextColorClass =
    theme === 'dark'
      ? 'fill-white'
      : theme === 'light'
      ? 'fill-[#0B0F19]'
      : 'fill-[var(--foreground,#0B0F19)]';

  const taglineColorClass =
    theme === 'dark'
      ? 'fill-[#94A3B8]'
      : theme === 'light'
      ? 'fill-[#475569]'
      : 'fill-[var(--muted-foreground,#475569)]';

  // SVG Definitions shared across variants
  const renderDefs = () => (
    <defs>
      {/* Document Main Body Gradient */}
      <linearGradient id={`${idPrefix}-docGrad`} x1="10%" y1="0%" x2="40%" y2="100%">
        <stop offset="0%" stopColor="#0066FF" />
        <stop offset="30%" stopColor="#0080FF" />
        <stop offset="70%" stopColor="#00A6FF" />
        <stop offset="100%" stopColor="#00C8FF" />
      </linearGradient>

      {/* Top-Right Fold Crease Shadow */}
      <linearGradient id={`${idPrefix}-foldShadow`} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#00359E" stopOpacity="0.65" />
        <stop offset="100%" stopColor="#002166" stopOpacity="0" />
      </linearGradient>

      {/* Top-Right Fold Flap Gradient */}
      <linearGradient id={`${idPrefix}-foldFlap`} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FFFFFF" />
        <stop offset="45%" stopColor="#E0F2FE" />
        <stop offset="100%" stopColor="#38BDF8" />
      </linearGradient>

      {/* Bottom Left Curl Gradient */}
      <linearGradient id={`${idPrefix}-curlGrad`} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#004AD9" />
        <stop offset="100%" stopColor="#002E94" />
      </linearGradient>

      {/* 8-Tooth Gear Gradient */}
      <linearGradient id={`${idPrefix}-gearGrad`} x1="20%" y1="0%" x2="80%" y2="100%">
        <stop offset="0%" stopColor="#A855F7" />
        <stop offset="35%" stopColor="#8B5CF6" />
        <stop offset="70%" stopColor="#4F46E5" />
        <stop offset="100%" stopColor="#2563EB" />
      </linearGradient>

      {/* Automate Word Gradient */}
      <linearGradient id={`${idPrefix}-automateGrad`} x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#0062FF" />
        <stop offset="45%" stopColor="#2563EB" />
        <stop offset="80%" stopColor="#7C3AED" />
        <stop offset="100%" stopColor="#8B5CF6" />
      </linearGradient>

      {/* Floating Pixels Gradients */}
      <linearGradient id={`${idPrefix}-px1`} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#38BDF8" />
        <stop offset="100%" stopColor="#0284C7" />
      </linearGradient>
      <linearGradient id={`${idPrefix}-px2`} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#0099FF" />
        <stop offset="100%" stopColor="#0052FF" />
      </linearGradient>
      <linearGradient id={`${idPrefix}-px3`} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#0066FF" />
        <stop offset="100%" stopColor="#1D4ED8" />
      </linearGradient>
      <linearGradient id={`${idPrefix}-px4`} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#8B5CF6" />
        <stop offset="100%" stopColor="#6D28D9" />
      </linearGradient>
      <linearGradient id={`${idPrefix}-px5`} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#0066FF" />
        <stop offset="100%" stopColor="#003CB8" />
      </linearGradient>

      {/* Drop Shadows */}
      <filter id={`${idPrefix}-docShadow`} x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="5" stdDeviation="10" floodColor="#0040C1" floodOpacity="0.22" />
      </filter>
      <filter id={`${idPrefix}-gearShadow`} x="-30%" y="-30%" width="160%" height="160%">
        <feDropShadow dx="-2" dy="5" stdDeviation="7" floodColor="#0A1847" floodOpacity="0.32" />
      </filter>

      {/* Center Hole Mask for Gear */}
      <mask id={`${idPrefix}-gearMask`} maskUnits="userSpaceOnUse" x="200" y="160" width="300" height="300">
        <rect x="200" y="160" width="300" height="300" fill="#FFFFFF" />
        <circle cx="366" cy="326" r="28" fill="#000000" />
      </mask>
    </defs>
  );

  // Render Mark / Document Icon Elements
  const renderIconContent = (withShadow = true) => (
    <>
      {/* Document Sheet */}
      <g filter={withShadow ? `url(#${idPrefix}-docShadow)` : undefined}>
        <path
          d="
            M 190 74
            L 334 74
            L 404 144
            L 404 354
            A 26 26 0 0 1 378 380
            L 194 380
            A 26 26 0 0 1 168 354
            L 168 96
            A 22 22 0 0 1 190 74
            Z
          "
          fill={`url(#${idPrefix}-docGrad)`}
        />

        {/* Top-Right Fold Crease Shadow */}
        <path d="M 334 74 L 334 144 L 404 144 Z" fill={`url(#${idPrefix}-foldShadow)`} />

        {/* Top-Right Fold Flap */}
        <path
          d="
            M 334 74
            C 334 116 362 144 404 144
            L 334 144
            Z
          "
          fill={`url(#${idPrefix}-foldFlap)`}
        />

        {/* Bottom Left Inward Curl Accent */}
        <path
          d="
            M 168 286
            C 168 348 202 380 236 380
            L 194 380
            A 26 26 0 0 1 168 354
            Z
          "
          fill={`url(#${idPrefix}-curlGrad)`}
          opacity="0.9"
        />
      </g>

      {/* Horizontal Document Lines (Pills) */}
      <rect x="206" y="142" width="94" height="17" rx="8.5" fill="#FFFFFF" fillOpacity="0.92" />
      <rect x="206" y="180" width="148" height="17" rx="8.5" fill="#FFFFFF" fillOpacity="0.92" />
      <rect x="206" y="218" width="90" height="17" rx="8.5" fill="#FFFFFF" fillOpacity="0.92" />

      {/* Floating Digital Pixel Blocks */}
      <rect x="136" y="134" width="36" height="36" rx="7" fill={`url(#${idPrefix}-px1)`} />
      <rect x="92" y="166" width="26" height="26" rx="6" fill={`url(#${idPrefix}-px2)`} />
      <rect x="124" y="198" width="38" height="38" rx="7" fill={`url(#${idPrefix}-px3)`} />
      <rect x="92" y="246" width="26" height="26" rx="6" fill={`url(#${idPrefix}-px4)`} />
      <rect x="156" y="254" width="28" height="28" rx="6" fill={`url(#${idPrefix}-px5)`} />

      {/* 8-Tooth Mechanical Gear */}
      <g filter={withShadow ? `url(#${idPrefix}-gearShadow)` : undefined}>
        <g mask={`url(#${idPrefix}-gearMask)`} fill={`url(#${idPrefix}-gearGrad)`}>
          <rect x="352" y="242" width="28" height="168" rx="7" />
          <rect x="352" y="242" width="28" height="168" rx="7" transform="rotate(45 366 326)" />
          <rect x="352" y="242" width="28" height="168" rx="7" transform="rotate(90 366 326)" />
          <rect x="352" y="242" width="28" height="168" rx="7" transform="rotate(135 366 326)" />
          <circle cx="366" cy="326" r="62" />
        </g>
        <circle cx="366" cy="326" r="28" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeOpacity="0.3" />
      </g>
    </>
  );

  // Variant: Standalone Icon Mark
  if (variant === 'icon') {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 512 512"
        width={dims.width}
        height={dims.height}
        fill="none"
        className={`shrink-0 select-none ${className}`}
        aria-label="DocAutomate"
      >
        {renderDefs()}
        {renderIconContent(true)}
      </svg>
    );
  }

  // Variant: Stacked Logo (Icon on Top, Text Below)
  if (variant === 'stacked') {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 512 512"
        width={dims.width}
        height={dims.height}
        fill="none"
        className={`shrink-0 select-none ${className}`}
        aria-label="DocAutomate"
      >
        {renderDefs()}
        {/* Top Centered Icon */}
        <g transform="translate(68, -26) scale(0.74)">
          {renderIconContent(true)}
        </g>

        {/* Brand Name Typography */}
        <text
          x="256"
          y="375"
          textAnchor="middle"
          fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Inter', 'Outfit', sans-serif"
        >
          <tspan fontWeight="900" fontSize="52" className={docTextColorClass} letterSpacing="-0.03em">
            Doc
          </tspan>
          <tspan fontWeight="800" fontSize="52" fill={`url(#${idPrefix}-automateGrad)`} letterSpacing="-0.02em">
            Automate
          </tspan>
        </text>

        {/* Tagline */}
        {showTagline && (
          <text
            x="256"
            y="415"
            textAnchor="middle"
            fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Inter', 'Outfit', sans-serif"
            fontSize="16"
            fontWeight="500"
            className={taglineColorClass}
            letterSpacing="0.25em"
          >
            Create | Automate | Deliver
          </text>
        )}
      </svg>
    );
  }

  // Variant: Horizontal Brand (Default)
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={showTagline ? '0 0 500 120' : '0 0 500 90'}
      width={dims.width}
      height={dims.height}
      fill="none"
      className={`shrink-0 select-none ${className}`}
      aria-label="DocAutomate"
    >
      {renderDefs()}

      {/* Left Icon */}
      <g transform="translate(-16, -10) scale(0.28)">
        {renderIconContent(true)}
      </g>

      {/* Typography Right Side */}
      <g transform="translate(116, 18)">
        <text
          x="0"
          y="52"
          fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Inter', 'Outfit', sans-serif"
        >
          <tspan fontWeight="900" fontSize="48" className={docTextColorClass} letterSpacing="-0.03em">
            Doc
          </tspan>
          <tspan fontWeight="800" fontSize="48" fill={`url(#${idPrefix}-automateGrad)`} letterSpacing="-0.02em">
            Automate
          </tspan>
        </text>

        {showTagline && (
          <text
            x="2"
            y="82"
            fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Inter', 'Outfit', sans-serif"
            fontSize="13.5"
            fontWeight="500"
            className={taglineColorClass}
            letterSpacing="0.25em"
          >
            Create | Automate | Deliver
          </text>
        )}
      </g>
    </svg>
  );
}
