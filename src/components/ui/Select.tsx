const selectCls =
  'border border-[#D5D7DA] rounded-lg px-3 py-2.5 text-sm text-[#181D27] bg-white ' +
  'focus:outline-none focus:ring-2 focus:ring-[#9E77ED] focus:border-transparent w-full appearance-none pr-8';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  className?: string;
}

export default function Select({ children, className = '', ...props }: SelectProps) {
  return (
    <div className="relative">
      <select className={`${selectCls} ${className}`} {...props}>
        {children}
      </select>
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">▾</span>
    </div>
  );
}
