import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { X } from '@untitled-ui/icons-react';

interface SlideOverProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  width?: string;
}

export default function SlideOver({
  open,
  onClose,
  title,
  subtitle,
  children,
  width = 'max-w-md',
}: SlideOverProps) {
  // Lock body scroll while open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/30 transition-opacity duration-300 ${
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Panel */}
      <div
        className={`fixed inset-y-0 right-0 z-50 flex flex-col bg-white shadow-2xl transition-transform duration-300 ease-in-out w-full ${width} ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-[#E9EAEB] shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-[#181D27]">{title}</h2>
            {subtitle && <p className="text-sm text-[#535862] mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#717680] hover:text-[#414651] hover:bg-[#F9FAFB] transition-colors ml-4 shrink-0"
          >
            <X width={20} height={20} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {children}
        </div>
      </div>
    </>
  );
}
