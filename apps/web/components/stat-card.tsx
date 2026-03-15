import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  delta?: string;
  deltaType?: "up" | "down" | "neutral";
}

export function StatCard({ label, value, delta, deltaType = "neutral" }: StatCardProps) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1.5">
        {label}
      </p>
      <p className="text-2xl font-semibold">{value}</p>
      {delta && (
        <p
          className={cn(
            "text-xs mt-1",
            deltaType === "up" && "text-score-high",
            deltaType === "down" && "text-score-low",
            deltaType === "neutral" && "text-muted-foreground"
          )}
        >
          {deltaType === "up" && "↑ "}
          {deltaType === "down" && "↓ "}
          {delta}
        </p>
      )}
    </div>
  );
}
