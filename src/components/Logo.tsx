"use client";

import { cn } from '@/lib/utils';

type LogoProps = {
  className?: string;
};

export function Logo({ className }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <svg
        width="32"
        height="32"
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="logo-gradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="hsl(var(--primary))" />
            <stop offset="100%" stopColor="hsl(var(--accent))" />
          </linearGradient>
        </defs>
        <rect x="4" y="4" width="24" height="24" rx="5" fill="currentColor" opacity="0.1" />
        <path
          d="M10 8H22"
          stroke="url(#logo-gradient)"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M12.5 12V6.5"
          stroke="url(#logo-gradient)"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M19.5 12V6.5"
          stroke="url(#logo-gradient)"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M12 19L15 22L21 16"
          stroke="url(#logo-gradient)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
