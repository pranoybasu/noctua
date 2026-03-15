import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { StatCard } from "@/components/stat-card";
import { ScoreGauge } from "@/components/score-gauge";
import { DEMO_STATS, DEMO_PRS, DEMO_TEAM } from "@/lib/demo-data";
import { cn, scoreBg, statusColor, formatDate } from "@/lib/utils";
import Link from "next/link";
import {
  GitPullRequest,
  Shield,
  Eye,
  TrendingUp,
  ArrowRight,
  Users,
} from "lucide-react";

const DEMO_MODE = process.env.DEMO_MODE === "true";

async function getDashboardStats(userId: string) {
  const { data: repos } = await supabaseAdmin
    .from("repos")
    .select("id")
    .eq("user_id", userId)
    .eq("is_active", true);

  const repoIds = repos?.map((r) => r.id) ?? [];
  if (repoIds.length === 0) {
    return { total_prs: 0, avg_score: 0, security_catches: 0, repos_watched: 0, score_delta: 0, pr_delta: 0 };
  }

  const { data: prs } = await supabaseAdmin
    .from("pull_requests")
    .select("quality_score, security_issues, created_at")
    .in("repo_id", repoIds);

  const allPrs = prs ?? [];
  const donePrs = allPrs.filter((p) => p.quality_score !== null);
  const avgScore = donePrs.length
    ? Math.round(donePrs.reduce((s, p) => s + (p.quality_score ?? 0), 0) / donePrs.length)
    : 0;

  const securityCatches = allPrs.reduce((total, p) => {
    const issues = p.security_issues as unknown[];
    return total + (Array.isArray(issues) ? issues.length : 0);
  }, 0);

  return {
    total_prs: allPrs.length,
    avg_score: avgScore,
    security_catches: securityCatches,
    repos_watched: repoIds.length,
    score_delta: 0,
    pr_delta: 0,
  };
}

export default async function DashboardPage() {
  let stats;
  let recentPrs: typeof DEMO_PRS = [];
  let topContributors: typeof DEMO_TEAM = [];

  if (DEMO_MODE) {
    stats = DEMO_STATS;
    recentPrs = DEMO_PRS.slice(0, 5);
    topContributors = DEMO_TEAM.slice(0, 3);
  } else {
    const session = await getServerSession(authOptions);
    if (!session) return null;
    stats = await getDashboardStats(session.userId);
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-lg font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Overview of your PR intelligence across all connected repos.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="PRs reviewed"
          value={stats.total_prs}
          delta={stats.pr_delta > 0 ? `+${stats.pr_delta} this week` : undefined}
          deltaType="up"
        />
        <StatCard
          label="Avg quality score"
          value={stats.avg_score}
          delta={stats.score_delta > 0 ? `+${stats.score_delta} pts` : undefined}
          deltaType="up"
        />
        <StatCard
          label="Security catches"
          value={stats.security_catches}
          delta="all time"
          deltaType="neutral"
        />
        <StatCard
          label="Repos watched"
          value={stats.repos_watched}
          delta="active"
          deltaType="neutral"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quality Score Gauge */}
        <div className="rounded-lg border bg-card p-6 flex flex-col items-center justify-center">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-4">
            Overall Quality
          </p>
          <ScoreGauge score={stats.avg_score} size={160} />
          <div className="mt-4 text-center">
            <p className="text-xs text-muted-foreground">
              {stats.avg_score >= 80
                ? "Your code quality is excellent"
                : stats.avg_score >= 60
                ? "Room for improvement"
                : "Needs attention"}
            </p>
          </div>
        </div>

        {/* Recent PRs */}
        <div className="lg:col-span-2 rounded-lg border bg-card">
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2">
              <GitPullRequest className="w-4 h-4 text-noctua-purple" />
              <p className="text-sm font-medium">Recent Pull Requests</p>
            </div>
            <Link
              href="/dashboard/prs"
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
            >
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {recentPrs.length > 0 ? (
            <div className="divide-y">
              {recentPrs.map((pr) => (
                <Link
                  key={pr.id}
                  href={`/dashboard/prs/${pr.id}`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="w-6 h-6 rounded-full bg-noctua-purple-light dark:bg-noctua-purple-dark flex items-center justify-center text-[9px] font-semibold text-noctua-indigo dark:text-noctua-lavender flex-shrink-0">
                    {pr.author?.[0]?.toUpperCase() ?? "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{pr.title}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {pr.repo_full_name} &middot; {pr.author} &middot; {formatDate(pr.created_at)}
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
                        "text-xs px-2 py-0.5 rounded-full flex-shrink-0",
                        statusColor(pr.status)
                      )}
                    >
                      {pr.status}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-sm text-muted-foreground">
              <GitPullRequest className="w-8 h-8 mx-auto mb-2 opacity-30" />
              No PRs yet. Connect a repo and open a pull request.
            </div>
          )}
        </div>
      </div>

      {/* Top Contributors */}
      {topContributors.length > 0 && (
        <div className="rounded-lg border bg-card">
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-noctua-purple" />
              <p className="text-sm font-medium">Top Contributors</p>
            </div>
            <Link
              href="/dashboard/team"
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
            >
              Full leaderboard <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x">
            {topContributors.map((member, i) => (
              <div key={member.author} className="p-4 flex items-center gap-3">
                <span className="w-7 h-7 rounded-full bg-noctua-purple-light dark:bg-noctua-purple-dark flex items-center justify-center text-xs font-bold text-noctua-indigo dark:text-noctua-lavender flex-shrink-0">
                  {["🥇", "🥈", "🥉"][i]}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{member.author}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {member.pr_count} PRs &middot; {member.total_security_issues} issues caught
                  </p>
                </div>
                <span
                  className={cn(
                    "text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0",
                    scoreBg(Math.round(member.avg_quality_score))
                  )}
                >
                  {Math.round(member.avg_quality_score)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
