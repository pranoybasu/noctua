import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { installWebhook } from "@/lib/github";
import { supabaseAdmin } from "@/lib/supabase";

const DEMO_MODE = process.env.DEMO_MODE === "true";

export async function POST(req: Request) {
  if (DEMO_MODE) {
    return NextResponse.json({ id: "demo-repo-id", webhookId: 0 });
  }

  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { full_name, github_repo_id, default_branch } = await req.json();
    const [owner, repo] = full_name.split("/");

    const webhookUrl = `${process.env.NEXTAUTH_URL}/api/webhook/github`;
    const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET!;

    const webhookId = await installWebhook(
      session.accessToken,
      owner,
      repo,
      webhookUrl,
      webhookSecret
    );

    const { data, error } = await supabaseAdmin
      .from("repos")
      .upsert(
        {
          user_id: session.userId,
          full_name,
          github_repo_id,
          webhook_id: webhookId,
          default_branch: default_branch ?? "main",
          review_persona: "balanced",
          is_active: true,
        },
        { onConflict: "github_repo_id" }
      )
      .select("id")
      .single();

    if (error) throw error;

    return NextResponse.json({ id: data.id, webhookId });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Connection failed";
    console.error("Repo connect error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
