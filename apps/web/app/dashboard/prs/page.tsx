"use client";

import { useEffect, useState, useCallback } from "react";
import { PRCard } from "@/components/pr-card";
import { useRealtimePRs } from "@/hooks/use-realtime";
import type { PRFeedItem } from "@noctua/types";
import { Loader2 } from "lucide-react";

type FilterStatus = "all" | "done" | "analyzing" | "failed";

export default function PRsPage() {
  const [prs, setPrs] = useState<PRFeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterStatus>("all");

  useEffect(() => {
    fetch("/api/prs")
      .then((r) => r.json())
      .then((data) => {
        setPrs(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleRealtimeUpdate = useCallback(
    (updated: Partial<PRFeedItem> & { id: string }) => {
      setPrs((prev) =>
        prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p))
      );
    },
    []
  );

  useRealtimePRs(handleRealtimeUpdate);

  const filtered =
    filter === "all" ? prs : prs.filter((p) => p.status === filter);

  const filters: { label: string; value: FilterStatus }[] = [
    { label: "All", value: "all" },
    { label: "Done", value: "done" },
    { label: "Analyzing", value: "analyzing" },
    { label: "Failed", value: "failed" },
  ];

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Pull Requests</h1>
          <p className="text-sm text-muted-foreground">
            {prs.length} PR{prs.length !== 1 ? "s" : ""} across all repos
          </p>
        </div>
        <div className="flex gap-1">
          {filters.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                filter === f.value
                  ? "bg-noctua-purple-light text-noctua-indigo border-noctua-lavender dark:bg-noctua-purple-dark dark:text-noctua-lavender dark:border-noctua-purple"
                  : "text-muted-foreground border-border hover:bg-muted"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground text-sm">
          {filter === "all"
            ? "No PRs yet. Connect a repo and open a pull request."
            : `No ${filter} PRs.`}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((pr) => (
            <PRCard key={pr.id} pr={pr} />
          ))}
        </div>
      )}
    </div>
  );
}
