"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { personaEmoji } from "@/lib/utils";
import { toast } from "sonner";
import {
  Settings as SettingsIcon,
  Loader2,
  Plus,
  Unplug,
  Check,
} from "lucide-react";
import type { ReviewPersona } from "@noctua/types";

interface ConnectedRepo {
  id: string;
  full_name: string;
  review_persona: ReviewPersona;
  is_active: boolean;
}

interface GithubRepo {
  id: number;
  full_name: string;
  name: string;
  owner: string;
  default_branch: string;
  connected: boolean;
  noctua_repo_id: string | null;
  review_persona: ReviewPersona;
}

const PERSONAS: { value: ReviewPersona; label: string; desc: string }[] = [
  { value: "strict", label: "Strict", desc: "Direct, calls out everything" },
  { value: "mentor", label: "Mentor", desc: "Warm, explains the why" },
  { value: "fast", label: "Fast", desc: "Blocks only critical issues" },
  { value: "balanced", label: "Balanced", desc: "Thorough but pragmatic" },
];

export default function SettingsPage() {
  const { data: session } = useSession();
  const [repos, setRepos] = useState<GithubRepo[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/repos")
      .then((r) => r.json())
      .then((data) => {
        setRepos(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const connectRepo = async (repo: GithubRepo) => {
    setActionLoading(repo.full_name);
    try {
      const res = await fetch("/api/repos/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: repo.full_name,
          github_repo_id: repo.id,
          default_branch: repo.default_branch,
        }),
      });
      if (res.ok) {
        setRepos((prev) =>
          prev.map((r) =>
            r.full_name === repo.full_name ? { ...r, connected: true } : r
          )
        );
        toast.success(`Connected ${repo.full_name}`);
      } else {
        toast.error("Failed to connect repo");
      }
    } finally {
      setActionLoading(null);
    }
  };

  const disconnectRepo = async (repo: GithubRepo) => {
    if (!repo.noctua_repo_id) return;
    setActionLoading(repo.full_name);
    try {
      const res = await fetch("/api/repos/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repo_id: repo.noctua_repo_id }),
      });
      if (res.ok) {
        setRepos((prev) =>
          prev.map((r) =>
            r.full_name === repo.full_name ? { ...r, connected: false } : r
          )
        );
        toast.success(`Disconnected ${repo.full_name}`);
      } else {
        toast.error("Failed to disconnect repo");
      }
    } finally {
      setActionLoading(null);
    }
  };

  const updatePersona = async (repoId: string, persona: ReviewPersona) => {
    await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ repo_id: repoId, review_persona: persona }),
    });
    setRepos((prev) =>
      prev.map((r) =>
        r.noctua_repo_id === repoId ? { ...r, review_persona: persona } : r
      )
    );
    toast.success(`Persona set to ${persona}`);
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <SettingsIcon className="w-5 h-5 text-noctua-purple" />
          <h1 className="text-lg font-semibold">Settings</h1>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Manage connected repos and review personas.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-3">
          {repos.map((repo) => (
            <div
              key={repo.full_name}
              className="rounded-lg border bg-card p-4 flex items-center gap-4"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {repo.full_name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {repo.connected ? "Connected" : "Not connected"}
                </p>
              </div>

              {repo.connected && repo.noctua_repo_id && (
                <div className="flex gap-1">
                  {PERSONAS.map((p) => (
                    <button
                      key={p.value}
                      onClick={() =>
                        updatePersona(repo.noctua_repo_id!, p.value)
                      }
                      title={p.desc}
                      className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                        repo.review_persona === p.value
                          ? "bg-noctua-purple-light text-noctua-indigo border-noctua-lavender dark:bg-noctua-purple-dark dark:text-noctua-lavender"
                          : "text-muted-foreground border-border hover:bg-muted"
                      }`}
                    >
                      {personaEmoji(p.value)} {p.label}
                    </button>
                  ))}
                </div>
              )}

              {repo.connected ? (
                <button
                  onClick={() => disconnectRepo(repo)}
                  disabled={actionLoading === repo.full_name}
                  className="text-xs px-3 py-1.5 rounded-md border border-red-300 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/30 transition-colors disabled:opacity-50"
                >
                  {actionLoading === repo.full_name ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Unplug className="w-3 h-3" />
                  )}
                </button>
              ) : (
                <button
                  onClick={() => connectRepo(repo)}
                  disabled={actionLoading === repo.full_name}
                  className="text-xs px-3 py-1.5 rounded-md bg-noctua-purple text-white hover:bg-noctua-purple/90 transition-colors disabled:opacity-50"
                >
                  {actionLoading === repo.full_name ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Plus className="w-3 h-3" />
                  )}
                </button>
              )}
            </div>
          ))}

          {repos.length === 0 && (
            <div className="text-center py-12 text-muted-foreground text-sm">
              No repositories found. Make sure your GitHub account has repos.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
