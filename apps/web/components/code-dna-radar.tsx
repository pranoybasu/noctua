"use client";

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
} from "recharts";
import type { CodeDNA } from "@noctua/types";

interface CodeDnaRadarProps {
  dna: CodeDNA;
  size?: number;
}

const DNA_LABELS: Record<string, string> = {
  clarity: "Clarity",
  comments: "Comments",
  nesting: "Nesting",
  types: "Type hints",
  naming: "Naming",
};

function normalizeForRadar(dna: CodeDNA) {
  return [
    {
      subject: DNA_LABELS.clarity,
      value: Math.min(100, Math.max(0, 100 - dna.avg_line_length)),
    },
    {
      subject: DNA_LABELS.comments,
      value: Math.min(100, dna.comment_ratio * 500),
    },
    {
      subject: DNA_LABELS.nesting,
      value: Math.min(100, Math.max(0, 100 - dna.avg_nesting_depth * 25)),
    },
    {
      subject: DNA_LABELS.types,
      value: dna.uses_type_hints ? 90 : 20,
    },
    {
      subject: DNA_LABELS.naming,
      value: dna.snake_case_score * 100,
    },
  ];
}

export function CodeDnaRadar({ dna, size = 260 }: CodeDnaRadarProps) {
  const data = normalizeForRadar(dna);

  return (
    <ResponsiveContainer width={size} height={size - 40}>
      <RadarChart data={data}>
        <PolarGrid stroke="hsl(var(--border))" />
        <PolarAngleAxis
          dataKey="subject"
          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
        />
        <Radar
          dataKey="value"
          fill="#534AB7"
          fillOpacity={0.15}
          stroke="#534AB7"
          strokeWidth={1.5}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
