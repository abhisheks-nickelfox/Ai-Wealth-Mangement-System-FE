interface CountBadgeProps {
  count: number;
  className?: string;
}

export default function CountBadge({ count, className = '' }: CountBadgeProps) {
  return (
    <span
      className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1 rounded-full bg-[#F4F3FF] text-[10px] font-bold text-[#7F56D9] ${className}`}
    >
      {count}
    </span>
  );
}
