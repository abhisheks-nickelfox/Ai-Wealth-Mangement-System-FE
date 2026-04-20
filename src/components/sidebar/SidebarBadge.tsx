export type BadgeVariant = 'gray' | 'brand' | 'blue' | 'success' | 'error' | 'warning';

interface SidebarBadgeProps {
  count: number;
  variant?: BadgeVariant;
}

const variantClasses: Record<BadgeVariant, string> = {
  gray:    'bg-gray-100 text-gray-600',
  brand:   'bg-brand-100 text-brand-700',
  blue:    'bg-blue-100 text-blue-700',
  success: 'bg-success-100 text-success-700',
  error:   'bg-error-100 text-error-700',
  warning: 'bg-warning-100 text-warning-700',
};

export default function SidebarBadge({ count, variant = 'gray' }: SidebarBadgeProps) {
  return (
    <span
      className={`min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-semibold flex items-center justify-center leading-none ${variantClasses[variant]}`}
    >
      {count}
    </span>
  );
}
