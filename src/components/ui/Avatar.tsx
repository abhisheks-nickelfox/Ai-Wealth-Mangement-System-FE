import React from 'react';

interface AvatarProps {
  src?: string;
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  online?: boolean;
  style?: React.CSSProperties;
  className?: string;
}

const sizeClasses = {
  xs: 'w-6 h-6 text-[9px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
};

const dotSizeClasses = {
  xs: 'w-1.5 h-1.5',
  sm: 'w-2 h-2',
  md: 'w-2.5 h-2.5',
  lg: 'w-3 h-3',
};

// Pastel backgrounds that match the original mock design
const AVATAR_BG = [
  '#CFCBDC', // lavender
  '#D6CFB7', // warm sand
  '#D7E3E8', // powder blue
  '#DADCD6', // sage
  '#E9DCBB', // warm yellow
  '#F0D4D4', // blush
  '#C8DFC8', // mint
  '#D4D8F0', // periwinkle
];

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) & 0xffffffff;
  }
  return Math.abs(h);
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

export default function Avatar({
  src,
  name,
  size = 'md',
  online,
  style,
  className = '',
}: AvatarProps) {
  const bg = style?.backgroundColor ?? AVATAR_BG[hashString(name) % AVATAR_BG.length];

  return (
    <div className={`relative shrink-0 ${className}`}>
      <div
        className={`${sizeClasses[size]} rounded-full border border-[rgba(0,0,0,0.08)] flex items-center justify-center overflow-hidden`}
        style={{ backgroundColor: bg, ...style }}
      >
        {src ? (
          <img src={src} alt={name} className="w-full h-full object-cover" />
        ) : (
          <span className="font-semibold text-[#4B4264]">{getInitials(name)}</span>
        )}
      </div>
      {online !== undefined && (
        <span
          className={`absolute bottom-0 right-0 ${dotSizeClasses[size]} bg-[#17B26A] rounded-full border-[1.5px] border-white`}
        />
      )}
    </div>
  );
}
