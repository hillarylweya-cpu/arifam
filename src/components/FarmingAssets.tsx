import React from 'react';

export const Tractor = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 100 60" className={className} fill="currentColor">
    {/* Body */}
    <rect x="20" y="20" width="50" height="25" rx="4" />
    <rect x="10" y="30" width="20" height="15" rx="2" />
    {/* Cabin */}
    <path d="M40 20 L45 5 L65 5 L70 20 Z" fillOpacity="0.8" />
    <rect x="45" y="8" width="20" height="10" fill="white" fillOpacity="0.4" />
    {/* Wheels */}
    <circle cx="25" cy="45" r="10" fill="#333" />
    <circle cx="25" cy="45" r="4" fill="#666" />
    <circle cx="75" cy="40" r="15" fill="#333" />
    <circle cx="75" cy="40" r="6" fill="#666" />
    {/* Exhaust */}
    <rect x="35" y="10" width="4" height="10" fill="#555" />
  </svg>
);

export const Harvester = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 120 70" className={className} fill="currentColor">
    {/* Main Body */}
    <rect x="30" y="15" width="70" height="35" rx="5" />
    {/* Header (Front part) */}
    <rect x="5" y="40" width="30" height="15" rx="2" fill="#555" />
    <circle cx="15" cy="47" r="8" fill="#444" fillOpacity="0.5" />
    {/* Cabin */}
    <path d="M70 15 L75 2 L95 2 L100 15 Z" fillOpacity="0.9" />
    <rect x="75" y="5" width="20" height="8" fill="white" fillOpacity="0.3" />
    {/* Wheels */}
    <circle cx="45" cy="55" r="12" fill="#222" />
    <circle cx="45" cy="55" r="5" fill="#555" />
    <circle cx="95" cy="55" r="12" fill="#222" />
    <circle cx="95" cy="55" r="5" fill="#555" />
    {/* Grain Tank */}
    <path d="M40 15 Q65 0 90 15" fillOpacity="0.6" />
  </svg>
);

export const Farmer = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 40 60" className={className} fill="currentColor">
    {/* Head & Hat */}
    <circle cx="20" cy="15" r="8" />
    <path d="M5 15 Q20 5 35 15" stroke="currentColor" strokeWidth="4" fill="none" />
    {/* Body */}
    <rect x="12" y="25" width="16" height="25" rx="4" />
    {/* Arms */}
    <rect x="6" y="28" width="6" height="15" rx="2" transform="rotate(-10 6 28)" />
    <rect x="28" y="28" width="6" height="15" rx="2" transform="rotate(10 28 28)" />
    {/* Legs */}
    <rect x="13" y="50" width="6" height="10" />
    <rect x="21" y="50" width="6" height="10" />
  </svg>
);
