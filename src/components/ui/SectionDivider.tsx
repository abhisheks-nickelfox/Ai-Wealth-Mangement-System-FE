interface SectionDividerProps {
  title: string;
  subtitle?: string;
}

export default function SectionDivider({ title, subtitle }: SectionDividerProps) {
  return (
    <div className="py-3 border-b border-[#E9EAEB]">
      <h3 className="text-sm font-semibold text-[#181D27]">{title}</h3>
      {subtitle && <p className="text-sm text-[#535862] mt-0.5">{subtitle}</p>}
    </div>
  );
}
