interface TabOption<T extends string> {
  value: T;
  label: string;
}

interface TabToggleProps<T extends string> {
  options: [TabOption<T>, TabOption<T>];
  value: T;
  onChange: (v: T) => void;
  className?: string;
}

export default function TabToggle<T extends string>({
  options,
  value,
  onChange,
  className = '',
}: TabToggleProps<T>) {
  return (
    <div className={`flex items-center gap-1 shrink-0 ${className}`}>
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`px-3 py-1.5 text-[13px] font-semibold rounded-lg transition-colors ${
            value === opt.value
              ? 'border border-[#D0D5DD] bg-white text-[#181D27] shadow-sm'
              : 'text-[#717680] hover:text-[#414651]'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
