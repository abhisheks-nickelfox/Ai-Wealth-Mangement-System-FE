import { useState } from 'react';
import { ChevronDown, ChevronUp } from '@untitled-ui/icons-react';
import NavItem, { type NavItemProps } from './NavItem';

export interface SubItem extends Omit<NavItemProps, 'depth'> {
  id: string;
}

interface ExpandableNavItemProps {
  label: string;
  icon?: React.ReactNode;
  items: SubItem[];
  defaultOpen?: boolean;
  activeItemId?: string;
  onItemClick?: (id: string) => void;
}

export default function ExpandableNavItem({
  label,
  icon,
  items,
  defaultOpen = false,
  activeItemId,
  onItemClick,
}: ExpandableNavItemProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div>
      {/* Parent row */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-left text-gray-600 hover:bg-gray-50 hover:text-gray-700 transition-colors"
      >
        {icon && (
          <span className="shrink-0 text-gray-400">{icon}</span>
        )}
        <span className="flex-1 text-[15px] font-semibold text-gray-600 whitespace-nowrap">
          {label}
        </span>
        <span className="shrink-0 text-gray-400">
          {open
            ? <ChevronUp width={16} height={16} />
            : <ChevronDown width={16} height={16} />
          }
        </span>
      </button>

      {/* Children */}
      {open && (
        <div className="mt-0.5 ml-2 flex flex-col">
          {items.map((item) => (
            <NavItem
              key={item.id}
              label={item.label}
              icon={item.icon}
              active={item.id === activeItemId}
              bold={item.bold || item.id === activeItemId}
              badge={item.badge}
              depth={1}
              onClick={() => onItemClick?.(item.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
