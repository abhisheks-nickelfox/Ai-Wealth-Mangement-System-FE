interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
  className?: string;
}

export default function EmptyState({ icon, title, description, action, className = '' }: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center gap-1 text-center ${className}`}>
      {icon && (
        <div className="w-12 h-12 flex items-center justify-center mb-2">
          {icon}
        </div>
      )}
      <p className="text-[15px] font-semibold text-[#181D27]">{title}</p>
      {description && (
        <p className="text-[13px] text-[#717680] mt-1">{description}</p>
      )}
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="mt-4 text-[13px] font-semibold text-[#7F56D9] hover:text-[#6941C6] transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
