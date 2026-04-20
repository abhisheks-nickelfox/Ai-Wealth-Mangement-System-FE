interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  id?: string;
  className?: string;
}

export default function Checkbox({ checked, onChange, label, id, className = '' }: CheckboxProps) {
  const checkboxId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <label
      htmlFor={checkboxId}
      className={`inline-flex items-center gap-2 cursor-pointer select-none ${className}`}
    >
      <input
        type="checkbox"
        id={checkboxId}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 rounded border-[#D5D7DA] accent-[#7F56D9] cursor-pointer"
      />
      {label && <span className="text-sm text-gray-600">{label}</span>}
    </label>
  );
}
