"use client";

import Link from "next/link";
import { ScoreGauge } from "@/components/score-gauge";
import { DiffTimeline } from "@/components/diff-timeline";
import { CodeDnaRadar } from "@/components/code-dna-radar";
import { personaEmoji, statusColor, cn } from "@/lib/utils";
import {
  ArrowLeft,
  ExternalLink,
  Shield,
  Lightbulb,
  Fingerprint,
  GitPullRequest,
} from "lucide-react";

interface PRDetailClientProps {
  pr: Record<string, any>;
}

export function PRDetailClient({ pr }: PRDetailClientProps) {
  const securityIssues = (pr.security_issues as any[]) ?? [];
  const suggestions = (pr.suggestions as any[]) ?? [];
  const codeDna = pr.code_dna as Record<string, any> | null;
  const diffSegments = (pr.diff_segments as any[]) ?? [];

  return (
    <div className="p-6 max-w-4xl space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/prs"
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1">
          <h1 className="text-lg font-semibold">{pr.title}</h1>
          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
            <GitPullRequest className="w-3 h-3" />
            <span>{pr.repo_full_name}</span>
            <span>#{pr.pr_number}</span>
            <span>by {pr.author}</span>
            {pr.persona_used && (
              <span className="px-1.5 py-0.5 rounded-full border">
                {personaEmoji(pr.persona_used)} {pr.persona_used}
              </span>
            )}
            <span className={cn("px-1.5 py-0.5 rounded-full", statusColor(pr.status))}>
              {pr.status}
            </span>
          </div>
        </div>
        {pr.github_pr_url && (
          <a
            href={pr.github_pr_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
          >
            View on GitHub <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>

      {diffSegments.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground mb-1.5">
            Diff Timeline
          </p>
          <DiffTimeline segments={diffSegments} height={10} />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {pr.quality_score !== null && (
          <div className="rounded-lg border bg-card p-4 flex flex-col items-center justify-center">
            <ScoreGauge score={pr.quality_score} size={140} />
            <p className="text-xs text-muted-foreground mt-2">Quality Score</p>
          </div>
        )}

        <div className="md:col-span-2 rounded-lg border bg-card p-4">
          <p className="text-xs text-muted-foreground mb-2">AI Summary</p>
          <p className="text-sm leading-relaxed">
            {pr.ai_summary ?? "No summary available."}
          </p>
        </div>
      </div>

      {securityIssues.length > 0 && (
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-1.5 mb-3">
            <Shield className="w-4 h-4 text-score-low" />
            <p className="text-sm font-medium">
              Security Issues ({securityIssues.length})
            </p>
          </div>
          <div className="space-y-2">
            {securityIssues.map((iss, i) => (
              <div
                key={i}
                className={cn(
                  "flex items-start gap-3 p-2.5 rounded-md text-xs",
                  iss.severity === "critical"
                    ? "bg-red-50 dark:bg-red-950/30"
                    : iss.severity === "high"
                    ? "bg-amber-50 dark:bg-amber-950/30"
                    : "bg-muted/50"
                )}
              >
                <span
                  className={cn(
                    "px-1.5 py-0.5 rounded font-medium uppercase text-[10px]",
                    iss.severity === "critical"
                      ? "bg-red-200 text-red-800 dark:bg-red-900 dark:text-red-300"
                      : iss.severity === "high"
                      ? "bg-amber-200 text-amber-800 dark:bg-amber-900 dark:text-amber-300"
                      : "bg-gray-200 text-gray-700"
                  )}
                >
                  {iss.severity}
                </span>
                <div>
                  <p className="font-medium">{iss.rule}</p>
                  <p className="text-muted-foreground mt-0.5">
                    Line {iss.line}:{" "}
                    <code className="bg-muted px-1 rounded text-[10px]">
                      {iss.snippet}
                    </code>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {suggestions.length > 0 && (
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-1.5 mb-3">
            <Lightbulb className="w-4 h-4 text-score-mid" />
            <p className="text-sm font-medium">
              Suggestions ({suggestions.length})
            </p>
          </div>
          <div className="space-y-1.5">
            {suggestions.map((s, i) => (
              <div
                key={i}
                className="flex items-start gap-2 text-xs p-2 rounded-md bg-muted/30"
              >
                <span className="text-muted-foreground flex-shrink-0">
                  {s.line > 0 ? `L${s.line}` : "\u2014"}
                </span>
                <p>{s.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {codeDna && Object.keys(codeDna).length > 0 && (
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-1.5 mb-3">
            <Fingerprint className="w-4 h-4 text-noctua-purple" />
            <p className="text-sm font-medium">
              Code DNA — {pr.author}
            </p>
          </div>
          <div className="flex justify-center">
            <CodeDnaRadar
              dna={{
                avg_line_length: codeDna.avg_line_length ?? 0,
                comment_ratio: codeDna.comment_ratio ?? 0,
                avg_nesting_depth: codeDna.avg_nesting_depth ?? 0,
                uses_type_hints: codeDna.uses_type_hints ?? false,
                snake_case_score: codeDna.snake_case_score ?? 0,
              }}
              size={300}
            />
          </div>
        </div>
      )}
    </div>
  );
}
