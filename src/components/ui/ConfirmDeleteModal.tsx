import type { ReactNode } from 'react';
import DeleteConfirmModal from './DeleteConfirmModal';

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
  return (
    <DeleteConfirmModal
      open={open}
      title={title}
      description={description}
      deleting={isDeleting}
      confirmLabel={title}
      onConfirm={onConfirm}
      onCancel={onClose}
    />
  );
}
