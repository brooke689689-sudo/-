"use server";

import { revalidatePath } from "next/cache";
import { getViewer } from "@/lib/auth";

const UUID = /^[0-9a-f-]{36}$/i;

const ADOPTION_ERRORS: Record<string, string> = {
  NOT_PARTICIPANT: "이 채팅방의 참여자가 아니에요.",
  POST_ADOPTED: "이미 다른 분께 분양이 완료된 글이에요.",
  PLEDGE_REQUIRED: "입양 약속에 동의해 주세요.",
};

export async function confirmAdoption(_: string | null, formData: FormData): Promise<string | null> {
  const roomId = String(formData.get("room") ?? "");
  if (!UUID.test(roomId)) return "채팅방을 찾을 수 없어요.";
  const { supabase, user } = await getViewer();
  if (!user) return "로그인이 필요해요.";
  const { error } = await supabase.rpc("confirm_adoption", {
    p_room_id: roomId,
    p_agree_pledge: formData.get("pledge") === "on",
  });
  if (error) return ADOPTION_ERRORS[error.message] ?? "확정 중 문제가 생겼어요. 다시 시도해 주세요.";
  revalidatePath(`/chats/${roomId}`);
  revalidatePath("/");
  return null;
}

export async function toggleBlock(formData: FormData) {
  const roomId = String(formData.get("room") ?? "");
  const target = String(formData.get("user") ?? "");
  if (!UUID.test(roomId) || !UUID.test(target)) return;
  const { supabase, user } = await getViewer();
  if (!user || user.id === target) return;
  const { data: existing } = await supabase
    .from("blocks")
    .select("blocked_id")
    .eq("blocker_id", user.id)
    .eq("blocked_id", target)
    .maybeSingle();
  if (existing) {
    await supabase.from("blocks").delete().eq("blocker_id", user.id).eq("blocked_id", target);
  } else {
    await supabase.from("blocks").insert({ blocker_id: user.id, blocked_id: target });
  }
  revalidatePath(`/chats/${roomId}`);
}
