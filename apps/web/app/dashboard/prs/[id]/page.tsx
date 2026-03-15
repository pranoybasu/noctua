import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { notFound } from "next/navigation";
import { PRDetailClient } from "./detail-client";
import { DEMO_PRS } from "@/lib/demo-data";

const DEMO_MODE = process.env.DEMO_MODE === "true";

interface Props {
  params: { id: string };
}

export default async function PRDetailPage({ params }: Props) {
  if (DEMO_MODE) {
    const pr = DEMO_PRS.find((p) => p.id === params.id);
    if (!pr) notFound();
    return <PRDetailClient pr={pr} />;
  }

  const session = await getServerSession(authOptions);
  if (!session) return null;

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
    notFound();
  }

  const feedItem = {
    ...pr,
    repo_full_name: pr.repos.full_name,
    review_persona: pr.repos.review_persona,
  };

  return <PRDetailClient pr={feedItem} />;
}
