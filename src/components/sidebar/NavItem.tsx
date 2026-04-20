import type { BadgeVariant } from './SidebarBadge';
import SidebarBadge from './SidebarBadge';

export interface NavItemProps {
  label: string;
  icon?: React.ReactNode;
  active?: boolean;
  bold?: boolean;
  badge?: { count: number; variant?: BadgeVariant };
  depth?: number; // 0 = top-level, 1 = sub-item
  onClick?: () => void;
}

export default function NavItem({
  label,
  icon,
  active = false,
  bold = false,
  badge,
  depth = 0,
  onClick,
}: NavItemProps) {
  const isSubItem = depth > 0;

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2 rounded-md transition-colors text-left
        ${isSubItem ? 'py-1.5 px-3' : 'py-2 px-3'}
        ${active && !isSubItem ? 'bg-gray-200 text-gray-800' : ''}
        ${active && isSubItem  ? 'text-gray-900' : ''}
        ${!active ? 'text-gray-600 hover:bg-gray-50 hover:text-gray-700' : ''}
      `}
    >
      {/* Icon — only for top-level items */}
      {icon && (
        <span className={`shrink-0 ${active ? 'text-gray-700' : 'text-gray-400'}`}>
          {icon}
        </span>
      )}

      {/* Sub-item indent line */}
      {isSubItem && !icon && (
        <span className="w-3 shrink-0" />
      )}

      <span
        className={`flex-1 whitespace-nowrap text-[13px]
          ${bold || active ? 'font-semibold' : 'font-medium'}
          ${isSubItem ? 'text-gray-600' : 'text-[15px] font-semibold'}
          ${active && isSubItem ? 'text-gray-900 font-semibold' : ''}
        `}
      >
        {label}
      </span>

      {badge && <SidebarBadge count={badge.count} variant={badge.variant} />}
    </button>
  );
}
