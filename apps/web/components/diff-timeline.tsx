import type { DiffSegment } from "@noctua/types";

const SEGMENT_COLORS = {
  safe: "bg-score-high",
  warn: "bg-score-mid",
  critical: "bg-score-low",
};

interface DiffTimelineProps {
  segments: DiffSegment[];
  height?: number;
}

export function DiffTimeline({ segments, height = 8 }: DiffTimelineProps) {
  if (!segments || segments.length === 0) return null;

  return (
    <div
      className="flex rounded-full overflow-hidden gap-[1px] w-full"
      style={{ height }}
    >
      {segments.map((seg, i) => (
        <div
          key={i}
          className={`${SEGMENT_COLORS[seg.color as keyof typeof SEGMENT_COLORS] ?? "bg-muted"} transition-all duration-300`}
          style={{ flex: seg.pct }}
          title={`${seg.pct}% ${seg.color}`}
        />
      ))}
    </div>
  );
}
