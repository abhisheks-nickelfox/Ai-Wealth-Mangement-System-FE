interface PanelFooterProps {
  onSave: () => void;
  onCancel: () => void;
  saving?: boolean;
  saveLabel?: string;
  secondaryAction?: { label: string; onClick: () => void };
  disabled?: boolean;
}

export default function PanelFooter({
  onSave,
  onCancel,
  saving = false,
  saveLabel = 'Save',
  secondaryAction,
  disabled = false,
}: PanelFooterProps) {
  return (
    <div className="flex items-center gap-3 pt-4 border-t border-[#E9EAEB]">
      <button
        type="button"
        onClick={onSave}
        disabled={saving || disabled}
        className="text-sm font-semibold text-[#344054] hover:text-[#181D27] transition-colors disabled:opacity-50"
      >
        {saving ? 'Saving…' : saveLabel}
      </button>
      <div className="ml-auto flex items-center gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2.5 rounded-lg border border-[#D5D7DA] bg-white text-sm font-semibold text-[#344054] hover:bg-[#F9FAFB] transition-colors"
        >
          Cancel
        </button>
        {secondaryAction && (
          <button
            type="button"
            onClick={secondaryAction.onClick}
            className="px-4 py-2.5 rounded-lg bg-[#7F56D9] text-white text-sm font-semibold hover:bg-[#6941C6] transition-colors"
          >
            {secondaryAction.label}
          </button>
        )}
      </div>
    </div>
  );
}
