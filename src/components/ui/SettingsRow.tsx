import { HelpCircle } from '@untitled-ui/icons-react';

interface SettingsRowProps {
  label: string;
  /** Secondary description below the label. Also aliased as `sublabel`. */
  sub?: string;
  sublabel?: string;
  required?: boolean;
  helpText?: string;
  /** Extra right padding applied to the inner flex row (used to align with a fixed-width side panel). */
  rightPad?: number;
  children: React.ReactNode;
}

export default function SettingsRow({
  label,
  sub,
  sublabel,
  required,
  helpText,
  rightPad,
  children,
}: SettingsRowProps) {
  const description = sub ?? sublabel;
  return (
    <div className="border-b border-[#E9EAEB]">
      <div className="flex gap-8 py-5" style={rightPad ? { paddingRight: rightPad } : undefined}>
        <div className="w-[280px] shrink-0">
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-medium text-[#414651]">
              {label}
              {required && <span className="text-[#717680] ml-0.5">*</span>}
            </p>
            {helpText && <HelpCircle width={14} height={14} className="text-[#9DA4AE] shrink-0" />}
          </div>
          {description && <p className="text-sm text-[#717680] mt-0.5 leading-snug">{description}</p>}
        </div>
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </div>
  );
}
