"use client";

import { useState } from "react";
import { CodeDnaRadar } from "./code-dna-radar";
import { cn, scoreBg } from "@/lib/utils";
import type { TeamMember } from "@noctua/types";
import { ChevronDown, Trophy, Shield, Fingerprint } from "lucide-react";

interface TeamLeaderboardProps {
  members: TeamMember[];
}

export function TeamLeaderboard({ members }: TeamLeaderboardProps) {
  const [expandedAuthor, setExpandedAuthor] = useState<string | null>(null);

  const ranked = [...members].sort(
    (a, b) => b.avg_quality_score - a.avg_quality_score
  );

  return (
    <div className="space-y-2">
      {ranked.map((m, idx) => {
        const rank = idx + 1;
        const expanded = expandedAuthor === m.author;

        return (
          <div key={m.author} className="rounded-lg border bg-card">
            <button
              onClick={() =>
                setExpandedAuthor(expanded ? null : m.author)
              }
              className="w-full flex items-center gap-3 p-3 text-left hover:bg-muted/50 transition-colors rounded-lg"
            >
              <span className="w-7 h-7 rounded-full bg-noctua-purple-light dark:bg-noctua-purple-dark flex items-center justify-center text-xs font-bold text-noctua-indigo dark:text-noctua-lavender flex-shrink-0">
                {rank <= 3 ? ["🥇", "🥈", "🥉"][rank - 1] : rank}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{m.author}</p>
                <p className="text-[10px] text-muted-foreground">
                  {m.pr_count} PR{m.pr_count !== 1 ? "s" : ""} reviewed
                </p>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Score</p>
                  <span
                    className={cn(
                      "text-sm font-semibold px-2 py-0.5 rounded-full",
                      scoreBg(Math.round(m.avg_quality_score))
                    )}
                  >
                    {Math.round(m.avg_quality_score)}
                  </span>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Shield className="w-3 h-3" /> Issues
                  </p>
                  <p className="text-sm font-medium">
                    {m.total_security_issues}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Preflight</p>
                  <p className="text-sm font-medium">
                    {Math.round(m.preflight_pass_rate * 100)}%
                  </p>
                </div>
                <ChevronDown
                  className={cn(
                    "w-4 h-4 text-muted-foreground transition-transform",
                    expanded && "rotate-180"
                  )}
                />
              </div>
            </button>

            {expanded && (
              <div className="border-t px-4 py-3">
                <div className="flex items-center gap-1.5 mb-2 text-xs text-muted-foreground">
                  <Fingerprint className="w-3.5 h-3.5" />
                  Code DNA Profile
                </div>
                <div className="flex justify-center">
                  <CodeDnaRadar
                    dna={{
                      avg_line_length: m.avg_line_length,
                      comment_ratio: m.avg_comment_ratio,
                      avg_nesting_depth: m.avg_nesting_depth,
                      uses_type_hints: m.type_hints_ratio > 0.5,
                      snake_case_score: m.naming_score,
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        );
      })}

      {members.length === 0 && (
        <div className="text-center py-12 text-muted-foreground text-sm">
          No team data yet. Connect a repo and open some PRs.
        </div>
      )}
    </div>
  );
}
