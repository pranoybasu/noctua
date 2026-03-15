"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { DiffTimeline } from "./diff-timeline";
import { cn, formatDate, scoreBg, statusColor, personaEmoji } from "@/lib/utils";
import type { PRFeedItem } from "@noctua/types";

interface PRCardProps {
  pr: PRFeedItem;
}

export function PRCard({ pr }: PRCardProps) {
  const hasCritical = pr.security_issues?.some(
    (i) => i.severity === "critical"
  );
  const isLive = pr.status === "analyzing";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <Link
        href={`/dashboard/prs/${pr.id}`}
        className={cn(
          "block rounded-lg border p-3.5 transition-colors hover:border-muted-foreground/30",
          isLive && "border-blue-400/50",
          hasCritical && !isLive && "border-red-400/50"
        )}
      >
        <div className="flex items-start gap-2.5">
          <div className="w-6 h-6 rounded-full bg-noctua-purple-light dark:bg-noctua-purple-dark flex items-center justify-center text-[9px] font-semibold text-noctua-indigo dark:text-noctua-lavender mt-0.5 flex-shrink-0">
            {pr.author?.[0]?.toUpperCase() ?? "?"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium leading-snug truncate">
              {pr.title}
            </p>
          </div>
          {pr.status === "done" && pr.quality_score !== null ? (
            <span
              className={cn(
                "text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0",
                scoreBg(pr.quality_score)
              )}
            >
              {pr.quality_score}
            </span>
          ) : (
            <span
              className={cn(
                "text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0",
                statusColor(pr.status),
                isLive && "animate-pulse-slow"
              )}
            >
              {isLive ? "···" : pr.status}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 mt-2 ml-[34px] flex-wrap">
          <span className="text-[10px] px-1.5 py-0.5 rounded-full border text-muted-foreground">
            {pr.author}
          </span>
          {pr.persona_used && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full border text-muted-foreground">
              {personaEmoji(pr.persona_used)} {pr.persona_used}
            </span>
          )}
          {hasCritical && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full border border-red-300 text-red-600 dark:border-red-800 dark:text-red-400">
              security issue
            </span>
          )}
          <span className="text-[10px] text-muted-foreground ml-auto">
            {formatDate(pr.created_at)}
          </span>
        </div>

        {pr.diff_segments && pr.diff_segments.length > 0 && (
          <div className="mt-2 ml-[34px]">
            <DiffTimeline segments={pr.diff_segments} height={4} />
          </div>
        )}

        {pr.ai_summary && pr.status === "done" && (
          <div className="mt-2 ml-[34px] text-[11px] text-muted-foreground bg-muted/50 rounded px-2.5 py-2 border-l-2 border-noctua-purple leading-relaxed line-clamp-2">
            {pr.ai_summary}
          </div>
        )}
      </Link>
    </motion.div>
  );
}
