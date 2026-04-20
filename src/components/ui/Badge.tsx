import React from 'react';

type BadgeVariant = 'gray' | 'brand' | 'blue' | 'success' | 'error' | 'warning' | 'orange';
type BadgeSize = 'sm' | 'md';

interface BadgeProps {
  variant?: BadgeVariant;
  size?: BadgeSize;
  children: React.ReactNode;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  gray:    'bg-gray-50 border border-gray-200 text-gray-700',
  brand:   'bg-[#F9F5FF] border border-[#E9D7FE] text-[#6941C6]',
  blue:    'bg-[#EFF8FF] border border-[#B2DDFF] text-[#175CD3]',
  success: 'bg-[#ECFDF3] border border-[#ABEFC6] text-[#067647]',
  error:   'bg-error-50 border border-error-200 text-error-700',
  warning: 'bg-[#FFFAEB] border border-[#FEDF89] text-[#B54708]',
  orange:  'bg-orange-50 border border-orange-200 text-orange-700',
};

const sizeClasses: Record<BadgeSize, string> = {
  sm: 'text-[10px] px-1.5 py-0.5',
  md: 'text-xs px-2 py-0.5',
};

export default function Badge({
  variant = 'gray',
  size = 'md',
  children,
  className = '',
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center font-medium rounded-full ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
    >
      {children}
    </span>
  );
}
