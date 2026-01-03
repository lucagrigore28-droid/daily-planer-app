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
        className="text-primary"
      >
        <defs>
            <linearGradient id="logo-gradient" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                <stop stopColor="#FDB84A"/>
                <stop offset="1" stopColor="#D74C9D"/>
            </linearGradient>
        </defs>
        <rect x="4" y="4" width="24" height="24" rx="6" stroke="url(#logo-gradient)" strokeWidth="2.5"/>
        <path d="M10 8V6M22 8V6" stroke="url(#logo-gradient)" strokeWidth="2.5" strokeLinecap="round"/>
        <rect x="8" y="12" width="16" height="12" rx="2" stroke="url(#logo-gradient)" strokeWidth="2.5"/>
        <path d="M12 18L15 21L20 15" stroke="url(#logo-gradient)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </div>
  );
}
