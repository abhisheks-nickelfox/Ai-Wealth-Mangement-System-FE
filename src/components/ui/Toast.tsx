import { useEffect } from 'react';
import { CheckCircle, X } from '@untitled-ui/icons-react';

interface ToastProps {
  message: string;
  subtitle?: string;
  onClose: () => void;
  duration?: number;
}

export default function Toast({ message, subtitle, onClose, duration = 4000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-start gap-3 bg-white border border-[#ABEFC6] rounded-xl shadow-lg px-4 py-3.5 min-w-[420px] max-w-lg">
      <div className="shrink-0 mt-0.5">
        <div className="w-8 h-8 rounded-full bg-[#ECFDF3] flex items-center justify-center">
          <CheckCircle width={16} height={16} className="text-[#067647]" />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-[#181D27] leading-5">{message}</p>
        {subtitle && (
          <p className="text-sm text-[#535862] leading-5 mt-0.5">{subtitle}</p>
        )}
      </div>
      <button
        onClick={onClose}
        className="shrink-0 text-[#717680] hover:text-[#414651] transition-colors mt-0.5"
      >
        <X width={16} height={16} />
      </button>
    </div>
  );
}
