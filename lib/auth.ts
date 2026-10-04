import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function getViewer() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return { supabase, user: null, profile: null };
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, nickname, primary_purpose, is_verified, onboarded_at")
    .eq("id", data.user.id)
    .maybeSingle();
  return { supabase, user: data.user, profile };
}

export async function requireViewer(next: string) {
  const viewer = await getViewer();
  if (!viewer.user) redirect(`/login?next=${encodeURIComponent(next)}`);
  return viewer as typeof viewer & { user: NonNullable<typeof viewer.user> };
}

export function safeNext(next: string | null | undefined) {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
}
