interface DonutSegment {
  value: number;
  colorClassName: string;
}

interface DonutChartProps {
  segments: DonutSegment[];
  centerValue: number | string;
  centerLabel: string;
  size?: number;
  strokeWidth?: number;
}

export function DonutChart({
  segments,
  centerValue,
  centerLabel,
  size = 140,
  strokeWidth = 16,
}: DonutChartProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const total = segments.reduce((sum, segment) => sum + segment.value, 0) || 1;
  const center = size / 2;

  let offsetAccumulator = 0;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-slate-100"
        />
        {segments.map((segment, index) => {
          const segmentLength = (segment.value / total) * circumference;
          const dashArray = `${segmentLength} ${circumference - segmentLength}`;
          const dashOffset = -offsetAccumulator;
          offsetAccumulator += segmentLength;
          return (
            <circle
              key={index}
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth={strokeWidth}
              strokeDasharray={dashArray}
              strokeDashoffset={dashOffset}
              className={segment.colorClassName}
            />
          );
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-slate-900">{centerValue}</span>
        <span className="text-xs text-slate-500">{centerLabel}</span>
      </div>
    </div>
  );
}
