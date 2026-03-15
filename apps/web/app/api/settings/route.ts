import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { DEMO_REPOS } from "@/lib/demo-data";

const DEMO_MODE = process.env.DEMO_MODE === "true";

export async function GET() {
  if (DEMO_MODE) {
    return NextResponse.json(DEMO_REPOS.filter((r) => r.connected));
  }

  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data } = await supabaseAdmin
    .from("repos")
    .select("id, full_name, review_persona, is_active, default_branch")
    .eq("user_id", session.userId)
    .eq("is_active", true);

  return NextResponse.json(data ?? []);
}

export async function PATCH(req: Request) {
  if (DEMO_MODE) {
    return NextResponse.json({ ok: true });
  }

  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { repo_id, review_persona } = await req.json();

  const validPersonas = ["strict", "mentor", "fast", "balanced"];
  if (!validPersonas.includes(review_persona)) {
    return NextResponse.json({ error: "Invalid persona" }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from("repos")
    .update({ review_persona, updated_at: new Date().toISOString() })
    .eq("id", repo_id)
    .eq("user_id", session.userId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
