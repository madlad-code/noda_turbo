// apps/web/components/ui/CircularProgress.tsx
"use client";

import React from 'react';
import { cn } from '@/lib/utils';

interface CircularProgressProps {
  percentage: number; // 0-100
  size?: number; // diameter in px
  strokeWidth?: number; // stroke width in px
  primaryColor?: string; // Tailwind class, e.g., 'text-brand-accent'
  secondaryColor?: string; // Tailwind class, e.g., 'text-gray-700'
  textColor?: string; // Tailwind class for the percentage text
}

const CircularProgress: React.FC<CircularProgressProps> = ({
  percentage,
  size = 80,
  strokeWidth = 8,
  primaryColor = 'text-brand-accent', // Default to accent color
  secondaryColor = 'text-gray-700',
  textColor = 'text-text-light',
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        {/* Background circle */}
        <circle
          className={cn(secondaryColor)}
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        {/* Progress circle */}
        <circle
          className={cn(primaryColor)}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
      <span className={cn('absolute text-lg font-bold', textColor)}>
        {Math.round(percentage)}%
      </span>
    </div>
  );
};

export default CircularProgress;