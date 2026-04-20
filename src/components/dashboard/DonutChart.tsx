export interface DonutSegment {
  label: string;
  count: number;
  color: string;
}

interface DonutChartProps {
  segments: DonutSegment[];
  total: number;
  size?: number;
  centerLabel?: string;
}

export function DonutChart({ segments, total, size = 180, centerLabel = 'Tasks' }: DonutChartProps) {
  const cx = size / 2;
  const cy = size / 2;
  const r = 65;
  const strokeWidth = 26;
  const circumference = 2 * Math.PI * r;
  // 2° gap between segments — consistent visual separation independent of ring size
  const GAP_DEG = 0.9;
  const GAP_LEN = (GAP_DEG / 360) * circumference;
  let startOffset = 0;

  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} className="shrink-0">
      <g transform={`rotate(-90 ${cx} ${cy})`}>
        {segments.map((seg) => {
          const fullLen = (seg.count / total) * circumference;
          const drawnLen = Math.max(0, fullLen - GAP_LEN);
          const dashArray = `${drawnLen.toFixed(2)} ${(circumference - drawnLen).toFixed(2)}`;
          const dashOffset = (circumference - startOffset).toFixed(2);
          startOffset += fullLen;
          return (
            <circle
              key={seg.label}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={seg.color}
              strokeWidth={strokeWidth}
              strokeDasharray={dashArray}
              strokeDashoffset={dashOffset}
              strokeLinecap="butt"
            />
          );
        })}
      </g>
      <text
        x={cx}
        y={cy - 8}
        textAnchor="middle"
        fill="#101828"
        fontSize={28}
        fontWeight="700"
        fontFamily="Inter,sans-serif"
      >
        {total}
      </text>
      <text
        x={cx}
        y={cy + 10}
        textAnchor="middle"
        fill="#667085"
        fontSize={11}
        fontFamily="Inter,sans-serif"
      >
        {centerLabel}
      </text>
    </svg>
  );
}
