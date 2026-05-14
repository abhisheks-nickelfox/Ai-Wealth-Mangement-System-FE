export interface DonutSegment {
  label: string;
  count: number;
  color: string;
}

interface DonutChartProps {
  segments:          DonutSegment[];
  total:             number;
  size?:             number;
  centerLabel?:      string;
  selectedLabel?:    string;
  onSegmentClick?:   (label: string) => void;
}

export function DonutChart({
  segments,
  total,
  size = 180,
  centerLabel = 'Tasks',
  selectedLabel,
  onSegmentClick,
}: DonutChartProps) {
  const cx          = size / 2;
  const cy          = size / 2;
  const r           = 65;
  const strokeWidth = 26;
  const circumference = 2 * Math.PI * r;
  // 2° gap between segments — consistent visual separation independent of ring size
  const GAP_DEG = 0.9;
  const GAP_LEN = (GAP_DEG / 360) * circumference;

  // Pre-compute geometry so nothing is mutated inside JSX
  type SegGeometry = {
    seg:        DonutSegment;
    dashArray:  string;
    dashOffset: string;
  };
  const segGeometry: SegGeometry[] = [];
  let acc = 0;
  for (const seg of segments) {
    const fullLen   = (seg.count / total) * circumference;
    const drawnLen  = Math.max(0, fullLen - GAP_LEN);
    segGeometry.push({
      seg,
      dashArray:  `${drawnLen.toFixed(2)} ${(circumference - drawnLen).toFixed(2)}`,
      dashOffset: (circumference - acc).toFixed(2),
    });
    acc += fullLen;
  }

  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} className="shrink-0">
      <g transform={`rotate(-90 ${cx} ${cy})`}>
        {segGeometry.map(({ seg, dashArray, dashOffset }) => {
          const isSelected = selectedLabel === seg.label;
          const sw         = isSelected ? strokeWidth + 4 : strokeWidth;

          return (
            <circle
              key={seg.label}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={seg.color}
              strokeWidth={sw}
              strokeDasharray={dashArray}
              strokeDashoffset={dashOffset}
              strokeLinecap="butt"
              style={{
                cursor:  onSegmentClick ? 'pointer' : 'default',
                opacity: selectedLabel && !isSelected ? 0.45 : 1,
                transition: 'opacity 0.15s, stroke-width 0.15s',
              }}
              onClick={() => onSegmentClick?.(seg.label)}
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
