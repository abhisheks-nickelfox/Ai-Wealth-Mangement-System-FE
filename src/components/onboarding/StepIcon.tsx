// StepIcon — matches the Figma "StepIconBase" design (24px)
// Current:   purple circle with double-ring shadow + white inner dot
// Completed: purple circle with white checkmark
// Upcoming:  white circle with gray border + gray inner dot

interface StepIconProps {
  state: 'current' | 'completed' | 'upcoming';
  size?: number;
}

export default function StepIcon({ state, size = 24 }: StepIconProps) {
  const dotSize = Math.round(size * 0.33);

  if (state === 'completed') {
    return (
      <div
        style={{ width: size, height: size }}
        className="rounded-xl bg-[#7F56D9] flex items-center justify-center shrink-0"
      >
        <svg width={size * 0.5} height={size * 0.5} viewBox="0 0 12 12" fill="none">
          <path
            d="M2 6l3 3 5-5"
            stroke="#fff"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    );
  }

  if (state === 'current') {
    return (
      <div
        style={{
          width: size,
          height: size,
          boxShadow: '0 0 0 2px #fff, 0 0 0 4px #9E77ED',
        }}
        className="rounded-xl bg-[#7F56D9] flex items-center justify-center shrink-0"
      >
        <div
          style={{ width: dotSize, height: dotSize }}
          className="rounded-full bg-white"
        />
      </div>
    );
  }

  // upcoming
  return (
    <div
      style={{ width: size, height: size }}
      className="rounded-xl border-[1.5px] border-[#E9EAEB] bg-white flex items-center justify-center shrink-0"
    >
      <div
        style={{ width: dotSize, height: dotSize }}
        className="rounded-full bg-[#D5D7DA]"
      />
    </div>
  );
}
