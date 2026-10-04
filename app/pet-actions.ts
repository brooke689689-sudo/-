"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getViewer, safeNext } from "@/lib/auth";

const UUID = /^[0-9a-f-]{36}$/i;

export async function toggleFavorite(formData: FormData) {
  const postId = String(formData.get("post") ?? "");
  const back = safeNext(String(formData.get("back") ?? "/"));
  const { supabase, user } = await getViewer();
  if (!user) redirect(`/login?next=${encodeURIComponent(back)}`);
  if (!UUID.test(postId)) redirect(back);

  const { data: existing } = await supabase
    .from("favorites")
    .select("post_id")
    .eq("user_id", user.id)
    .eq("post_id", postId)
    .maybeSingle();
  if (existing) {
    await supabase.from("favorites").delete().eq("user_id", user.id).eq("post_id", postId);
  } else {
    await supabase.from("favorites").insert({ user_id: user.id, post_id: postId });
  }
  revalidatePath("/", "layout");
  redirect(back);
}

const CHAT_ERRORS: Record<string, string> = {
  POST_NOT_FOUND: "notfound",
  OWN_POST: "own",
  POST_ADOPTED: "adopted",
  ACCOUNT_RESTRICTED: "restricted",
  BLOCKED: "blocked",
  DAILY_LIMIT: "daily",
  PERIOD_LIMIT: "period",
};

export async function startChat(formData: FormData) {
  const postId = String(formData.get("post") ?? "");
  const back = `/?pet=${postId}`;
  const { supabase, user, profile } = await getViewer();
  if (!user) redirect(`/login?next=${encodeURIComponent(back)}`);
  if (!UUID.test(postId)) redirect("/");
  if (!profile?.is_verified) redirect(`/verify?next=${encodeURIComponent(back)}`);

  const { data: roomId, error } = await supabase.rpc("create_chat_room", { p_post_id: postId });
  if (error || !roomId) {
    const code = error?.message ?? "";
    if (code === "VERIFICATION_REQUIRED") redirect(`/verify?next=${encodeURIComponent(back)}`);
    if (code === "SUBSCRIPTION_REQUIRED") redirect(`/subscribe?post=${postId}`);
    redirect(`/chats?error=${CHAT_ERRORS[code] ?? "unknown"}`);
  }
  revalidatePath("/chats");
  redirect(`/chats/${roomId}`);
}
