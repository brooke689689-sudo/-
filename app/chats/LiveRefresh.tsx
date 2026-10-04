"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export function LiveRefresh({ userId }: { userId: string }) {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const refresh = () => {
      clearTimeout(timer);
      timer = setTimeout(() => router.refresh(), 300);
    };

    supabase.auth.getSession().then(({ data }) => {
      supabase.realtime.setAuth(data.session?.access_token ?? null);
      channel = supabase
        .channel(`rooms:${userId}`)
        .on("postgres_changes", { event: "*", schema: "public", table: "chat_rooms", filter: `adopter_id=eq.${userId}` }, refresh)
        .on("postgres_changes", { event: "*", schema: "public", table: "chat_rooms", filter: `rehomer_id=eq.${userId}` }, refresh)
        .subscribe();
    });

    return () => {
      clearTimeout(timer);
      if (channel) supabase.removeChannel(channel);
    };
  }, [router, userId]);

  return null;
}
