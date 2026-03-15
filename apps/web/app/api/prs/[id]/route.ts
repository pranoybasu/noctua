import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { DEMO_PRS } from "@/lib/demo-data";

const DEMO_MODE = process.env.DEMO_MODE === "true";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  if (DEMO_MODE) {
    const pr = DEMO_PRS.find((p) => p.id === params.id);
    if (!pr) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(pr);
  }

  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: pr } = await supabaseAdmin
    .from("pull_requests")
    .select(
      `
      *,
      repos!inner (
        full_name,
        review_persona,
        user_id
      )
    `
    )
    .eq("id", params.id)
    .single();

  if (!pr || pr.repos.user_id !== session.userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    ...pr,
    repo_full_name: pr.repos.full_name,
    review_persona: pr.repos.review_persona,
  });
}
