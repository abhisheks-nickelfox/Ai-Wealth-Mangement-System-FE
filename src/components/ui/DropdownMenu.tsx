import type { ReactNode } from 'react';

export interface DropdownMenuItem {
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  variant?: 'default' | 'danger';
}

interface DropdownMenuProps {
  open: boolean;
  onClose: () => void;
  items: DropdownMenuItem[];
  align?: 'left' | 'right';
}

export default function DropdownMenu({
  open,
  onClose,
  items,
  align = 'right',
}: DropdownMenuProps) {
  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        className={`absolute top-full mt-1.5 z-50 rounded-[10px] border border-[#e5e7eb] shadow-lg py-1.5 px-1.5 min-w-[160px] bg-white ${
          align === 'right' ? 'right-0' : 'left-0'
        }`}
      >
        {items.map((item, i) => (
          <button
            key={i}
            type="button"
            onClick={item.onClick}
            className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[13px] hover:bg-[#f3f4f6] transition-colors ${
              item.variant === 'danger' ? 'text-red-600' : 'text-[#0f172a]'
            }`}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </div>
    </>
  );
}
