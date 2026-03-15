"use client";

import { useEffect, useRef, useCallback } from "react";
import { createBrowserClient } from "@/lib/supabase";
import type { PRFeedItem } from "@noctua/types";

export function useRealtimePRs(
  onUpdate: (pr: Partial<PRFeedItem> & { id: string }) => void
) {
  const clientRef = useRef(createBrowserClient());

  const stableOnUpdate = useCallback(onUpdate, []);

  useEffect(() => {
    const supabase = clientRef.current;
    if (!supabase) return;

    const channel = supabase
      .channel("pr-updates")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "pull_requests",
        },
        (payload) => {
          const updated = payload.new as Partial<PRFeedItem> & { id: string };
          stableOnUpdate(updated);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [stableOnUpdate]);
}
