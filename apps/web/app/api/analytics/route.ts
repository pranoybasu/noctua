import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { DEMO_ANALYTICS } from "@/lib/demo-data";

const DEMO_MODE = process.env.DEMO_MODE === "true";

export async function GET() {
  if (DEMO_MODE) {
    return NextResponse.json(DEMO_ANALYTICS);
  }

  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: repos } = await supabaseAdmin
    .from("repos")
    .select("id")
    .eq("user_id", session.userId);

  const repoIds = repos?.map((r) => r.id) ?? [];
  if (repoIds.length === 0) {
    return NextResponse.json({
      scoreTrend: [],
      securityTrend: [],
      prVolume: [],
    });
  }

  const { data: prs } = await supabaseAdmin
    .from("pull_requests")
    .select("quality_score, security_issues, created_at, status")
    .in("repo_id", repoIds)
    .eq("status", "done")
    .order("created_at", { ascending: true });

  const allPrs = prs ?? [];

  const dateGroups = new Map<
    string,
    { scores: number[]; securityCount: number; prCount: number }
  >();

  for (const pr of allPrs) {
    const date = new Date(pr.created_at).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });

    if (!dateGroups.has(date)) {
      dateGroups.set(date, { scores: [], securityCount: 0, prCount: 0 });
    }

    const group = dateGroups.get(date)!;
    group.prCount++;

    if (pr.quality_score !== null) {
      group.scores.push(pr.quality_score);
    }

    const issues = pr.security_issues as unknown[];
    if (Array.isArray(issues)) {
      group.securityCount += issues.length;
    }
  }

  const scoreTrend: { date: string; score: number }[] = [];
  const securityTrend: { date: string; issues: number }[] = [];
  const prVolume: { date: string; count: number }[] = [];

  for (const [date, group] of dateGroups) {
    const avgScore = group.scores.length
      ? Math.round(
          group.scores.reduce((a, b) => a + b, 0) / group.scores.length
        )
      : 0;

    scoreTrend.push({ date, score: avgScore });
    securityTrend.push({ date, issues: group.securityCount });
    prVolume.push({ date, count: group.prCount });
  }

  return NextResponse.json({ scoreTrend, securityTrend, prVolume });
}
