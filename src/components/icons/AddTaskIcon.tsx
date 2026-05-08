interface IconProps {
  width?: number;
  height?: number;
  className?: string;
  color?: string;
}

export default function AddTaskIcon({ width = 20, height = 20, className = '', color = 'currentColor' }: IconProps) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <circle cx="10" cy="10" r="8.5" stroke={color} strokeWidth="1.5" strokeDasharray="3.5 2.5" />
      <path d="M10 6.5V13.5M6.5 10H13.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
