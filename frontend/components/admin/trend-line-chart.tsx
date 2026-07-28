'use client';

import { useState } from 'react';

interface TrendPoint {
  date: string;
  count: number;
}

interface TrendLineChartProps {
  data: TrendPoint[];
  color?: string;
  label: string;
}

const WIDTH = 320;
const HEIGHT = 120;
const PADDING_X = 8;
const PADDING_TOP = 12;
const PADDING_BOTTOM = 20;

function formatShortDate(isoDate: string): string {
  const date = new Date(`${isoDate}T00:00:00`);
  return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
}

export function TrendLineChart({ data, color = '#2563eb', label }: TrendLineChartProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  if (data.length === 0) {
    return <p className="text-sm text-slate-400">Veri yok.</p>;
  }

  const maxCount = Math.max(1, ...data.map((point) => point.count));
  const plotWidth = WIDTH - PADDING_X * 2;
  const plotHeight = HEIGHT - PADDING_TOP - PADDING_BOTTOM;
  const stepX = data.length > 1 ? plotWidth / (data.length - 1) : 0;

  const points = data.map((point, index) => ({
    x: PADDING_X + index * stepX,
    y: PADDING_TOP + plotHeight - (point.count / maxCount) * plotHeight,
    ...point,
  }));

  const linePath = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
    .join(' ');

  const lastPoint = points[points.length - 1];
  const hovered = hoverIndex !== null ? points[hoverIndex] : null;

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full"
        role="img"
        aria-label={`${label} — son ${data.length} gün trendi`}
      >
        {[0, 0.5, 1].map((fraction) => {
          const y = PADDING_TOP + plotHeight * fraction;
          return (
            <line
              key={fraction}
              x1={PADDING_X}
              x2={WIDTH - PADDING_X}
              y1={y}
              y2={y}
              stroke="#e2e8f0"
              strokeWidth={1}
            />
          );
        })}

        <path d={linePath} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" />

        <circle cx={lastPoint.x} cy={lastPoint.y} r={4} fill={color} />
        <text
          x={Math.min(lastPoint.x, WIDTH - 24)}
          y={Math.max(lastPoint.y - 8, 10)}
          fontSize={11}
          fontWeight={600}
          textAnchor="end"
          fill="#0f172a"
        >
          {lastPoint.count}
        </text>

        {hovered && (
          <>
            <line
              x1={hovered.x}
              x2={hovered.x}
              y1={PADDING_TOP}
              y2={PADDING_TOP + plotHeight}
              stroke="#94a3b8"
              strokeWidth={1}
              strokeDasharray="2,2"
            />
            <circle cx={hovered.x} cy={hovered.y} r={4} fill="#0f172a" />
          </>
        )}

        {points.map((point, index) => (
          <rect
            key={point.date}
            x={point.x - stepX / 2}
            y={0}
            width={stepX || plotWidth}
            height={HEIGHT}
            fill="transparent"
            onMouseEnter={() => setHoverIndex(index)}
            onMouseLeave={() => setHoverIndex(null)}
          />
        ))}
      </svg>

      {hovered && (
        <div
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-full rounded-md bg-slate-900 px-2 py-1 text-xs text-white shadow-card"
          style={{
            left: `${(hovered.x / WIDTH) * 100}%`,
            top: `${(hovered.y / HEIGHT) * 100}%`,
          }}
        >
          {formatShortDate(hovered.date)} · {hovered.count}
        </div>
      )}
    </div>
  );
}
