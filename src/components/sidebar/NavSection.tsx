interface NavSectionProps {
  heading: string;
  children: React.ReactNode;
}

export default function NavSection({ heading, children }: NavSectionProps) {
  return (
    <div className="mb-3">
      <p className="text-[11px] font-bold text-gray-400 tracking-[0.06em] uppercase px-3 py-1.5">
        {heading}
      </p>
      <div className="flex flex-col gap-0.5">
        {children}
      </div>
    </div>
  );
}
