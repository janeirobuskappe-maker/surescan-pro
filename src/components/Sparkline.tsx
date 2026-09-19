"use client";

export function Sparkline({
  points,
  width = 260,
  height = 64,
  color = "#35ffb2",
}: {
  points: number[];
  width?: number;
  height?: number;
  color?: string;
}) {
  if (points.length < 2) {
    return (
      <div
        className="grid w-full place-items-center rounded-lg border border-edge bg-black/30 text-[10px] text-slate-600"
        style={{ height }}
      >
        En attente de données…
      </div>
    );
  }
  const max = Math.max(...points, 1);
  const min = 0;
  const stepX = width / (points.length - 1);
  const y = (v: number) => height - 6 - ((v - min) / (max - min || 1)) * (height - 14);
  const path = points
    .map((v, i) => `${i === 0 ? "M" : "L"} ${(i * stepX).toFixed(1)} ${y(v).toFixed(1)}`)
    .join(" ");
  const area = `${path} L ${width} ${height} L 0 ${height} Z`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className="overflow-visible w-full"
      style={{ height }}
    >
      <defs>
        <linearGradient id="sparkfill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#sparkfill)" vectorEffect="non-scaling-stroke" />
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth="1.8"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      <circle cx={width} cy={y(points[points.length - 1])} r="3" fill={color} />
    </svg>
  );
}
