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
      <defs>
        <linearGradient id="instaGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{stopColor:"#FF9900", stopOpacity:1}} />
          <stop offset="50%" style={{stopColor:"#FF0066", stopOpacity:1}} />
          <stop offset="100%" style={{stopColor:"#CC00CC", stopOpacity:1}} />
        </linearGradient>
      </defs>

      <g fill="none" stroke="url(#instaGradient)" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
        
        <rect x="5" y="5" width="90" height="90" rx="22" ry="22" />

        <rect x="25" y="30" width="50" height="45" rx="6" ry="6" />

        <line x1="25" y1="44" x2="75" y2="44" />

        <line x1="38" y1="24" x2="38" y2="36" />
        <line x1="62" y1="24" x2="62" y2="36" />

        <polyline points="40 58 48 66 60 52" />
        
      </g>
    </svg>
  );
}