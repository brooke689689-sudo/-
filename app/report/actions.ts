"use server";

import { redirect } from "next/navigation";
import { getViewer } from "@/lib/auth";
import { REPORT_REASONS } from "@/lib/report";

const UUID = /^[0-9a-f-]{36}$/i;

export async function createReport(_: string | null, formData: FormData): Promise<string | null> {
  const { supabase, user } = await getViewer();
  if (!user) return "로그인이 필요해요.";

  const reason = String(formData.get("reason") ?? "");
  const detail = String(formData.get("detail") ?? "").trim().slice(0, 1000) || null;
  const postId = String(formData.get("post") ?? "");
  const messageId = Number(formData.get("message") ?? 0);
  const userId = String(formData.get("user") ?? "");
  const back = String(formData.get("back") ?? "/");
  if (!REPORT_REASONS.includes(reason as (typeof REPORT_REASONS)[number])) return "신고 사유를 선택해 주세요.";
  if (reason === "기타" && !detail) return "기타 사유를 적어주세요.";

  let row: {
    target_type: "post" | "message" | "user";
    target_post_id?: string;
    target_message_id?: number;
    target_user_id?: string;
  };
  if (UUID.test(postId)) {
    const { data: post } = await supabase.from("posts").select("id, author_id").eq("id", postId).maybeSingle();
    if (!post) return "신고할 글을 찾을 수 없어요.";
    row = { target_type: "post", target_post_id: post.id, target_user_id: post.author_id };
  } else if (Number.isInteger(messageId) && messageId > 0) {
    const { data: msg } = await supabase.from("messages").select("id, sender_id").eq("id", messageId).maybeSingle();
    if (!msg) return "신고할 메시지를 찾을 수 없어요.";
    row = { target_type: "message", target_message_id: msg.id, target_user_id: msg.sender_id ?? undefined };
  } else if (UUID.test(userId)) {
    row = { target_type: "user", target_user_id: userId };
  } else {
    return "신고 대상을 찾을 수 없어요.";
  }
  if (row.target_user_id === user.id) return "본인은 신고할 수 없어요.";

  const { error } = await supabase.from("reports").insert({ ...row, reporter_id: user.id, reason, detail });
  if (error) return "신고를 접수하지 못했어요. 잠시 후 다시 시도해 주세요.";
  redirect(`/report/done?back=${encodeURIComponent(back.startsWith("/") && !back.startsWith("//") ? back : "/")}`);
}
