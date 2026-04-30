import { Trash01, XClose } from '@untitled-ui/icons-react';

interface DeleteConfirmModalProps {
  open: boolean;
  title: string;
  description: React.ReactNode;
  deleting?: boolean;
  confirmLabel?: string;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function DeleteConfirmModal({
  open,
  title,
  description,
  deleting = false,
  confirmLabel = 'Delete',
  onCancel,
  onConfirm,
}: DeleteConfirmModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/50" onClick={deleting ? undefined : onCancel} />
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl">
        <div className="px-6 pt-6 pb-4">
          <div className="mb-4 flex items-start justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#FEF3F2]">
              <Trash01 width={20} height={20} className="text-[#D92D20]" />
            </div>
            <button
              type="button"
              onClick={onCancel}
              disabled={deleting}
              className="rounded-lg p-1 text-[#717680] hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <XClose width={18} height={18} />
            </button>
          </div>

          <h2 className="text-lg font-semibold text-[#181D27]">{title}</h2>
          <div className="mt-2 text-sm leading-6 text-[#535862]">
            {description}
          </div>
        </div>

        <div className="flex items-center gap-3 border-t border-[#E9EAEB] px-6 py-4">
          <button
            type="button"
            onClick={onCancel}
            disabled={deleting}
            className="flex-1 rounded-lg border border-[#D5D7DA] bg-white px-4 py-2.5 text-sm font-semibold text-[#414651] transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={deleting}
            className="flex-1 rounded-lg bg-[#D92D20] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#B42318] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {deleting ? 'Deleting…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
