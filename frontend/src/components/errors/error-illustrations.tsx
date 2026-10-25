'use client';

import React from 'react';

interface IllustrationProps {
  className?: string;
}

// 404: Missing document / broken file path
export function Illustration404({ className = 'w-48 h-48' }: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 240 240"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <circle cx="120" cy="120" r="100" fill="currentColor" fillOpacity="0.03" />
      {/* Background Document Ghost */}
      <rect
        x="65"
        y="50"
        width="110"
        height="140"
        rx="12"
        stroke="currentColor"
        strokeWidth="2"
        strokeDasharray="6 6"
        strokeOpacity="0.3"
      />
      {/* Foreground Folded Document */}
      <path
        d="M75 60 H140 L165 85 V180 H75 Z"
        fill="currentColor"
        fillOpacity="0.05"
        stroke="currentColor"
        strokeWidth="2.5"
      />
      {/* Dog-ear fold */}
      <path
        d="M140 60 V85 H165"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      {/* Document Text Lines */}
      <line x1="90" y1="105" x2="150" y2="105" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeOpacity="0.7" />
      <line x1="90" y1="125" x2="135" y2="125" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeOpacity="0.7" />
      <line x1="90" y1="145" x2="120" y2="145" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeOpacity="0.4" />
      {/* Broken path / Search indicator */}
      <circle cx="150" cy="155" r="24" fill="var(--card)" stroke="currentColor" strokeWidth="2.5" />
      <path d="M142 147 L158 163 M158 147 L142 163" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

// 500: Failed document processing server / engine gear break
export function Illustration500({ className = 'w-48 h-48' }: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 240 240"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <circle cx="120" cy="120" r="100" fill="currentColor" fillOpacity="0.03" />
      {/* Server Rack Body */}
      <rect
        x="60"
        y="60"
        width="120"
        height="50"
        rx="8"
        stroke="currentColor"
        strokeWidth="2.5"
        fill="currentColor"
        fillOpacity="0.05"
      />
      <circle cx="80" cy="85" r="4" fill="currentColor" />
      <circle cx="95" cy="85" r="4" fill="currentColor" fillOpacity="0.4" />
      <line x1="120" y1="85" x2="160" y2="85" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />

      <rect
        x="60"
        y="125"
        width="120"
        height="50"
        rx="8"
        stroke="currentColor"
        strokeWidth="2.5"
        fill="currentColor"
        fillOpacity="0.05"
      />
      <circle cx="80" cy="150" r="4" fill="currentColor" fillOpacity="0.4" />
      <circle cx="95" cy="150" r="4" fill="currentColor" />
      <line x1="120" y1="150" x2="160" y2="150" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />

      {/* Lightning bolt / error burst in center */}
      <circle cx="120" cy="120" r="28" fill="var(--card)" stroke="currentColor" strokeWidth="2" />
      <path
        d="M123 104 L111 122 H124 L117 136 L131 118 H118 Z"
        fill="currentColor"
      />
    </svg>
  );
}

// 403: Forbidden / Secure vault with locked document
export function Illustration403({ className = 'w-48 h-48' }: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 240 240"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <circle cx="120" cy="120" r="100" fill="currentColor" fillOpacity="0.03" />
      {/* Document Background */}
      <rect
        x="75"
        y="50"
        width="90"
        height="120"
        rx="10"
        stroke="currentColor"
        strokeWidth="2"
        strokeOpacity="0.4"
        fill="currentColor"
        fillOpacity="0.03"
      />
      {/* Padlock Body */}
      <rect
        x="85"
        y="110"
        width="70"
        height="55"
        rx="8"
        fill="currentColor"
        fillOpacity="0.08"
        stroke="currentColor"
        strokeWidth="2.5"
      />
      {/* Padlock Shackle */}
      <path
        d="M100 110 V90 C100 79 109 70 120 70 C131 70 140 79 140 90 V110"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* Keyhole */}
      <circle cx="120" cy="132" r="5" fill="currentColor" />
      <path d="M120 137 V147" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

// 401: Authentication Required / Keycard session expired
export function Illustration401({ className = 'w-48 h-48' }: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 240 240"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <circle cx="120" cy="120" r="100" fill="currentColor" fillOpacity="0.03" />
      {/* ID Badge Card */}
      <rect
        x="65"
        y="65"
        width="110"
        height="130"
        rx="12"
        stroke="currentColor"
        strokeWidth="2.5"
        fill="currentColor"
        fillOpacity="0.05"
      />
      {/* Lanyard Clip */}
      <rect x="105" y="55" width="30" height="15" rx="4" stroke="currentColor" strokeWidth="2" />
      <circle cx="120" cy="62" r="3" fill="currentColor" />
      {/* User Avatar Silhouette */}
      <circle cx="120" cy="105" r="16" stroke="currentColor" strokeWidth="2.5" />
      <path d="M96 142 C96 130 107 125 120 125 C133 125 144 130 144 142" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      {/* Key badge indicator */}
      <circle cx="150" cy="165" r="18" fill="var(--card)" stroke="currentColor" strokeWidth="2.5" />
      <path d="M145 165 H155 M152 165 V170" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

// 503: Service Unavailable / Maintenance tools
export function Illustration503({ className = 'w-48 h-48' }: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 240 240"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <circle cx="120" cy="120" r="100" fill="currentColor" fillOpacity="0.03" />
      {/* Server Rack Body */}
      <rect
        x="65"
        y="75"
        width="110"
        height="90"
        rx="10"
        stroke="currentColor"
        strokeWidth="2.5"
        fill="currentColor"
        fillOpacity="0.05"
      />
      <line x1="65" y1="120" x2="175" y2="120" stroke="currentColor" strokeWidth="2" />
      {/* Server Status Lights */}
      <circle cx="85" cy="98" r="4" fill="currentColor" />
      <circle cx="100" cy="98" r="4" fill="currentColor" fillOpacity="0.3" />
      <circle cx="85" cy="142" r="4" fill="currentColor" fillOpacity="0.3" />
      <circle cx="100" cy="142" r="4" fill="currentColor" />

      {/* Maintenance Wrench Tool */}
      <path
        d="M140 135 L175 170 M165 125 C160 120 152 120 147 125 L135 137 C130 142 130 150 135 155 L145 165"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

// 408: Request Timeout / Clock with processing document
export function Illustration408({ className = 'w-48 h-48' }: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 240 240"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <circle cx="120" cy="120" r="100" fill="currentColor" fillOpacity="0.03" />
      {/* Clock Face */}
      <circle
        cx="120"
        cy="120"
        r="60"
        stroke="currentColor"
        strokeWidth="2.5"
        fill="currentColor"
        fillOpacity="0.05"
      />
      {/* Clock Hands showing elapsed time */}
      <line x1="120" y1="120" x2="120" y2="85" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <line x1="120" y1="120" x2="150" y2="135" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="120" cy="120" r="4" fill="currentColor" />
      {/* Hour ticks */}
      <circle cx="120" cy="68" r="2.5" fill="currentColor" />
      <circle cx="172" cy="120" r="2.5" fill="currentColor" />
      <circle cx="120" cy="172" r="2.5" fill="currentColor" />
      <circle cx="68" cy="120" r="2.5" fill="currentColor" />
    </svg>
  );
}

// Network Error: Connection Lost / Severed Link
export function IllustrationNetworkError({ className = 'w-48 h-48' }: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 240 240"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <circle cx="120" cy="120" r="100" fill="currentColor" fillOpacity="0.03" />
      {/* Offline WiFi Wave Arcs */}
      <path
        d="M60 85 C95 55 145 55 180 85"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeOpacity="0.3"
      />
      <path
        d="M80 110 C105 88 135 88 160 110"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeOpacity="0.5"
      />
      <path
        d="M100 135 C112 124 128 124 140 135"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle cx="120" cy="160" r="6" fill="currentColor" />
      {/* Slash Line indicating disconnect */}
      <line x1="60" y1="60" x2="180" y2="180" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

// 429: Too Many Requests / Hourglass rate limiter
export function Illustration429({ className = 'w-48 h-48' }: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 240 240"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <circle cx="120" cy="120" r="100" fill="currentColor" fillOpacity="0.03" />
      {/* Hourglass Frame */}
      <path
        d="M80 60 H160 V80 L130 120 L160 160 V180 H80 V160 L110 120 L80 80 Z"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinejoin="round"
        fill="currentColor"
        fillOpacity="0.05"
      />
      {/* Falling Sand Flow */}
      <line x1="120" y1="120" x2="120" y2="155" stroke="currentColor" strokeWidth="2.5" strokeDasharray="3 3" />
      {/* Sand Reservoir Top & Bottom */}
      <path d="M95 75 H145 L135 90 H105 Z" fill="currentColor" fillOpacity="0.6" />
      <path d="M100 170 H140 L130 160 H110 Z" fill="currentColor" fillOpacity="0.6" />
    </svg>
  );
}

// Maintenance Page: Scheduled repair
export function IllustrationMaintenance({ className = 'w-48 h-48' }: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 240 240"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <circle cx="120" cy="120" r="100" fill="currentColor" fillOpacity="0.03" />
      {/* Robot Head / System Node */}
      <rect
        x="70"
        y="75"
        width="100"
        height="85"
        rx="16"
        stroke="currentColor"
        strokeWidth="2.5"
        fill="currentColor"
        fillOpacity="0.05"
      />
      {/* Antenna */}
      <line x1="120" y1="75" x2="120" y2="55" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="120" cy="50" r="5" fill="currentColor" />
      {/* Eyes */}
      <circle cx="95" cy="110" r="7" fill="currentColor" />
      <circle cx="145" cy="110" r="7" fill="currentColor" />
      {/* Maintenance mouth gear */}
      <line x1="95" y1="135" x2="145" y2="135" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      {/* Cones / gears */}
      <circle cx="170" cy="165" r="18" fill="var(--card)" stroke="currentColor" strokeWidth="2" />
      <path d="M165 160 L175 170 M175 160 L165 170" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
