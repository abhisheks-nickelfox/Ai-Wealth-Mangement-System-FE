const SKILL_PALETTE = [
  'bg-[#DDD6FE] border-[#DDD6FE] text-[#6D28D9]',  // brand/purple  — /200 bg · /200 border · /700 text
  'bg-[#EFF6FF] border-[#BFDBFE] text-[#1D4ED8]',  // blue          — /50 · /200 · /700
  'bg-[#EEF2FF] border-[#C7D2FE] text-[#4338CA]',  // indigo        — /50 · /200 · /700
];

export function skillBadgeClass(label: string): string {
  let h = 0;
  for (let i = 0; i < label.length; i++) {
    h = (h * 31 + label.charCodeAt(i)) & 0xffffffff;
  }
  return SKILL_PALETTE[Math.abs(h) % SKILL_PALETTE.length];
}

interface SkillBadgeProps {
  label: string;
}

export default function SkillBadge({ label }: SkillBadgeProps) {
  return (
    <span className={`inline-flex items-center border text-xs font-medium px-2 py-0.5 rounded-full ${skillBadgeClass(label)}`}>
      {label}
    </span>
  );
}
