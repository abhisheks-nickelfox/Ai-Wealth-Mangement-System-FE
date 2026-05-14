interface SectionLabelProps {
  children: React.ReactNode;
  className?: string;
}

export default function SectionLabel({ children, className = '' }: SectionLabelProps) {
  return (
    <p className={`text-[11px] font-semibold uppercase tracking-wider text-[#A4A7AE] ${className}`}>
      {children}
    </p>
  );
}
