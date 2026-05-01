import type { ReactNode } from 'react';
import { Trash01 } from '@untitled-ui/icons-react';

interface ConfirmDeleteModalProps {
  open: boolean;
  isDeleting: boolean;
  title: string;
  description: ReactNode;
  onConfirm: () => void;
  onClose: () => void;
}

export default function ConfirmDeleteModal({
  open,
  isDeleting,
  title,
  description,
  onConfirm,
  onClose,
}: ConfirmDeleteModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-delete-title"
    >
      <div
        className="bg-white rounded-2xl p-6 w-[420px] shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col items-center text-center gap-4">
          <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
            <Trash01 width={24} height={24} className="text-red-600" aria-hidden="true" />
          </div>

          <div>
            <h2
              id="confirm-delete-title"
              className="text-[17px] font-bold text-[#0f172a]"
            >
              {title}
            </h2>
            <p className="text-sm text-[#6b7280] mt-2 leading-relaxed">
              {description}
            </p>
          </div>

          <div className="flex items-center gap-3 w-full mt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={isDeleting}
              className="flex-1 py-2.5 rounded-lg border border-[#D0D5DD] bg-white text-sm font-semibold text-[#344054] hover:bg-[#F9FAFB] transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isDeleting}
              className="flex-1 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-sm font-semibold text-white transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isDeleting ? (
                <>
                  <span
                    className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"
                    aria-hidden="true"
                  />
                  Deleting…
                </>
              ) : (
                title
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
