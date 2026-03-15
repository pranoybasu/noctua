import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { DEMO_TEAM } from "@/lib/demo-data";

const DEMO_MODE = process.env.DEMO_MODE === "true";

export async function GET() {
  if (DEMO_MODE) {
    return NextResponse.json(DEMO_TEAM);
  }

  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabaseAdmin
    .from("leaderboard")
    .select("*")
    .eq("user_id", session.userId)
    .order("avg_quality_score", { ascending: false });

  if (error) {
    console.error("Team stats error:", error);
    return NextResponse.json([]);
  }

  return NextResponse.json(data ?? []);
}
