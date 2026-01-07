
"use client";

import React from 'react';

export default function Logo({ className }: { className?: string }) {
  return (
    <svg 
        width="80" 
        height="80" 
        viewBox="0 0 100 100" 
        xmlns="http://www.w3.org/2000/svg"
        className={className}
    >
      <rect x="0" y="0" width="100" height="100" rx="22" ry="22" fill="black" />
      <defs>
        <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{stopColor:"#8B5CF6", stopOpacity:1}} />
          <stop offset="100%" style={{stopColor:"#C084FC", stopOpacity:1}} />
        </linearGradient>
      </defs>
      <g fill="none" stroke="url(#logoGradient)" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
        
        {/* Inner shape with checkmark cutout */}
        <path d="
          M 31 30 
          H 69 
          C 72.3137 30 75 32.6863 75 36 
          V 41 
          H 25 
          V 36 
          C 25 32.6863 27.6863 30 31 30 Z

          M 25 47
          V 69
          C 25 72.3137 27.6863 75 31 75
          H 69
          C 72.3137 75 75 72.3137 75 69
          V 47
          H 60 L 48 62 L 40 54 H 25 Z
        " fill="url(#logoGradient)" stroke="none"/>
        
      </g>
    </svg>
  );
}
