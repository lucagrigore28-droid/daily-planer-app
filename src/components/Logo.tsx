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
          <linearGradient
            id="logo-gradient"
            x1="0"
            y1="0"
            x2="32"
            y2="32"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#FDB84A" />
            <stop offset="1" stopColor="#D74C9D" />
          </linearGradient>
        </defs>
        <path
          d="M9 5C6.79086 5 5 6.79086 5 9V23C5 25.2091 6.79086 27 9 27H23C25.2091 27 27 25.2091 27 23V9C27 6.79086 25.2091 5 23 5H9Z"
          stroke="url(#logo-gradient)"
          strokeWidth="2"
        />
        <path
          d="M10 5V7M16 5V7M22 5V7"
          stroke="url(#logo-gradient)"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M12.5 18.5L15.5 21.5L20.5 15.5"
          stroke="url(#logo-gradient)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
