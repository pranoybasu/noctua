import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { supabaseAdmin } from "@/lib/supabase";
import { isDuplicate } from "@/lib/redis";

function verifySignature(payload: string, signature: string | null): boolean {
  if (!signature) return false;
  const secret = process.env.GITHUB_WEBHOOK_SECRET!;
  const expected =
    "sha256=" + createHmac("sha256", secret).update(payload).digest("hex");
  try {
    return timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expected)
    );
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  const raw = await req.text();
  const sig = req.headers.get("x-hub-signature-256");

  if (!verifySignature(raw, sig)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const event = req.headers.get("x-github-event");
  const body = JSON.parse(raw);

  if (event === "ping") {
    return NextResponse.json({ ok: true, msg: "pong" });
  }

  if (
    event !== "pull_request" ||
    !["opened", "synchronize", "reopened"].includes(body.action)
  ) {
    return NextResponse.json({ ok: true, msg: "ignored" });
  }

  const repoFullName: string = body.repository.full_name;
  const prNumber: number = body.pull_request.number;

  const duplicate = await isDuplicate(repoFullName, prNumber).catch(() => false);
  if (duplicate) {
    return NextResponse.json({ ok: true, msg: "already processing" });
  }

  const { data: repo } = await supabaseAdmin
    .from("repos")
    .select("id, review_persona")
    .eq("full_name", repoFullName)
    .eq("is_active", true)
    .single();

  if (!repo) {
    return NextResponse.json({ ok: true, msg: "repo not connected" });
  }

  const pr = body.pull_request;

  const { data: prRow } = await supabaseAdmin
    .from("pull_requests")
    .upsert(
      {
        repo_id: repo.id,
        pr_number: prNumber,
        title: pr.title,
        author: pr.user.login,
        author_avatar: pr.user.avatar_url,
        base_branch: pr.base.ref,
        head_branch: pr.head.ref,
        diff_url: pr.diff_url,
        github_pr_url: pr.html_url,
        status: "analyzing",
      },
      { onConflict: "repo_id,pr_number" }
    )
    .select("id")
    .single();

  const engineUrl = process.env.ENGINE_URL;
  if (engineUrl && prRow) {
    const jobPayload = {
      pr_id: prRow.id,
      pr_number: prNumber,
      repo: repoFullName,
      repo_id: repo.id,
      diff_url: pr.diff_url,
      title: pr.title,
      author: pr.user.login,
      author_avatar: pr.user.avatar_url,
      base_branch: pr.base.ref,
      head_branch: pr.head.ref,
      github_pr_url: pr.html_url,
      token: pr.head?.repo?.owner?.login ? "" : "",
      persona: repo.review_persona,
    };

    fetch(`${engineUrl}/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(jobPayload),
    }).catch((err) => {
      console.error("Engine dispatch failed:", err);
    });
  }

  return NextResponse.json({ ok: true, pr_id: prRow?.id });
}
