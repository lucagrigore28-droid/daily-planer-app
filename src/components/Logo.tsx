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
        <rect x="5" y="5" width="22" height="22" rx="4" stroke="currentColor" strokeWidth="2"/>
        <path d="M12 9V7M20 9V7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <rect x="9" y="12" width="14" height="12" rx="2" stroke="currentColor" strokeWidth="2"/>
        <path d="M13 18L15.5 20.5L19 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </div>
  );
}
