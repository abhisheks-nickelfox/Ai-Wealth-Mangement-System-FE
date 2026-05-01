interface EmptyStateProps {
  title: string;
  subtitle?: string;
  action?: { label: string; onClick: () => void };
}

export default function EmptyState({ title, subtitle, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <p className="text-[14px] font-semibold text-[#414651]">{title}</p>
      {subtitle && <p className="text-[13px] text-[#717680]">{subtitle}</p>}
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="px-4 py-2 rounded-lg bg-[#7F56D9] text-white text-[13px] font-semibold hover:bg-[#6941C6] transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
