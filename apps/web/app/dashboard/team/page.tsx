"use client";

import { useEffect, useState } from "react";
import { TeamLeaderboard } from "@/components/team-leaderboard";
import type { TeamMember } from "@noctua/types";
import { Loader2, Trophy } from "lucide-react";

export default function TeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/team")
      .then((r) => r.json())
      .then((data) => {
        setMembers(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="p-6 space-y-4">
      <div>
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-noctua-purple" />
          <h1 className="text-lg font-semibold">Team Clarity Leaderboard</h1>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Contributors ranked by average quality score. Click any author to see
          their Code DNA profile.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <TeamLeaderboard members={members} />
      )}
    </div>
  );
}
