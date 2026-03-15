import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { listUserRepos } from "@/lib/github";
import { supabaseAdmin } from "@/lib/supabase";
import { DEMO_REPOS } from "@/lib/demo-data";

const DEMO_MODE = process.env.DEMO_MODE === "true";

export async function GET() {
  if (DEMO_MODE) {
    return NextResponse.json(DEMO_REPOS);
  }

  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [ghRepos, { data: connectedRepos }] = await Promise.all([
      listUserRepos(session.accessToken),
      supabaseAdmin
        .from("repos")
        .select("full_name, github_repo_id, review_persona, is_active, id")
        .eq("user_id", session.userId),
    ]);

    const connectedMap = new Map(
      (connectedRepos ?? []).map((r) => [r.full_name, r])
    );

    const repos = ghRepos.map((r) => {
      const connected = connectedMap.get(r.full_name);
      return {
        ...r,
        connected: !!connected?.is_active,
        noctua_repo_id: connected?.id ?? null,
        review_persona: connected?.review_persona ?? "balanced",
      };
    });

    return NextResponse.json(repos);
  } catch (err) {
    console.error("Failed to list repos:", err);
    return NextResponse.json(
      { error: "Failed to fetch repos" },
      { status: 500 }
    );
  }
}
