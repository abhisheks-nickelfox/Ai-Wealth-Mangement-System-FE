function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) & 0xffffffff;
  }
  return Math.abs(h);
}

const PALETTE = [
  'bg-[#F9F5FF] border-[#E9D7FE] text-[#6941C6]',  // purple
  'bg-[#EFF8FF] border-[#B2DDFF] text-[#175CD3]',  // blue
  'bg-[#ECFDF3] border-[#ABEFC6] text-[#067647]',  // green
];

interface SkillBadgeProps {
  label: string;
}

export default function SkillBadge({ label }: SkillBadgeProps) {
  const cls = PALETTE[hashString(label) % PALETTE.length];
  return (
    <span className={`inline-flex items-center border text-xs font-medium px-2 py-0.5 rounded-full ${cls}`}>
      {label}
    </span>
  );
}
