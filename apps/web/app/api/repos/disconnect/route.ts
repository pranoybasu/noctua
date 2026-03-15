import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { removeWebhook } from "@/lib/github";
import { supabaseAdmin } from "@/lib/supabase";

const DEMO_MODE = process.env.DEMO_MODE === "true";

export async function POST(req: Request) {
  if (DEMO_MODE) {
    return NextResponse.json({ ok: true });
  }

  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { repo_id } = await req.json();

    const { data: repo } = await supabaseAdmin
      .from("repos")
      .select("full_name, webhook_id")
      .eq("id", repo_id)
      .eq("user_id", session.userId)
      .single();

    if (!repo) {
      return NextResponse.json({ error: "Repo not found" }, { status: 404 });
    }

    if (repo.webhook_id) {
      const [owner, repoName] = repo.full_name.split("/");
      try {
        await removeWebhook(
          session.accessToken,
          owner,
          repoName,
          repo.webhook_id
        );
      } catch {
        // Webhook may have been manually deleted — continue with deactivation
      }
    }

    await supabaseAdmin
      .from("repos")
      .update({ is_active: false, webhook_id: null })
      .eq("id", repo_id);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Repo disconnect error:", err);
    return NextResponse.json(
      { error: "Disconnection failed" },
      { status: 500 }
    );
  }
}
