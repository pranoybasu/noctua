import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { DEMO_PRS } from "@/lib/demo-data";

const DEMO_MODE = process.env.DEMO_MODE === "true";

export async function GET() {
  if (DEMO_MODE) {
    return NextResponse.json(DEMO_PRS);
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
    return NextResponse.json([]);
  }

  const { data, error } = await supabaseAdmin
    .from("pr_feed")
    .select("*")
    .eq("user_id", session.userId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error("PR feed error:", error);
    return NextResponse.json([], { status: 200 });
  }

  return NextResponse.json(data ?? []);
}
