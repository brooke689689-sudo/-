"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getViewer } from "@/lib/auth";

const UUID = /^[0-9a-f-]{36}$/i;

async function viewerOrLogin(next: string) {
  const viewer = await getViewer();
  if (!viewer.user) redirect(`/login?next=${encodeURIComponent(next)}`);
  return viewer as typeof viewer & { user: NonNullable<typeof viewer.user> };
}

export async function updateProfile(_: string | null, formData: FormData): Promise<string | null> {
  const { supabase, user } = await viewerOrLogin("/me");
  const nickname = String(formData.get("nickname") ?? "").trim();
  const purpose = formData.get("purpose");
  if (!/^[가-힣a-zA-Z0-9_]{2,20}$/.test(nickname)) return "닉네임은 2~20자 한글·영문·숫자·밑줄만 쓸 수 있어요.";
  if (purpose !== "adopt" && purpose !== "rehome") return "주 목적을 선택해 주세요.";
  const { data: check } = await supabase.rpc("check_text", { p_text: nickname, p_scope: "all" });
  if ((check as { action?: string } | null)?.action !== "ok") return "닉네임에 사용할 수 없는 표현이 있어요.";
  const { error } = await supabase.from("profiles").update({ nickname, primary_purpose: purpose }).eq("id", user.id);
  if (error) return error.code === "23505" ? "이미 사용 중인 닉네임이에요." : "저장하지 못했어요. 다시 시도해 주세요.";
  revalidatePath("/", "layout");
  return "저장했어요.";
}

export async function setPostStatus(formData: FormData) {
  const postId = String(formData.get("post") ?? "");
  const status = formData.get("status") === "adopted" ? "adopted" : "active";
  if (!UUID.test(postId)) return;
  const { supabase, user } = await viewerOrLogin("/me/posts");
  await supabase.from("posts").update({ status }).eq("id", postId).eq("author_id", user.id);
  revalidatePath("/me/posts");
  revalidatePath("/");
}

export async function confirmStillActive(formData: FormData) {
  const postId = String(formData.get("post") ?? "");
  if (!UUID.test(postId)) return;
  const { supabase } = await viewerOrLogin("/me/posts");
  await supabase.rpc("confirm_post_active", { p_post_id: postId });
  revalidatePath("/me/posts");
  revalidatePath("/");
}

export async function deletePost(formData: FormData) {
  const postId = String(formData.get("post") ?? "");
  if (!UUID.test(postId)) return;
  const { supabase, user } = await viewerOrLogin("/me/posts");
  await supabase.from("posts").update({ deleted_at: new Date().toISOString() }).eq("id", postId).eq("author_id", user.id);
  revalidatePath("/me/posts");
  revalidatePath("/");
}

export async function cancelSubscription() {
  const { supabase } = await viewerOrLogin("/me/subscription");
  await supabase.rpc("cancel_subscription");
  revalidatePath("/me/subscription");
}

export async function resumeSubscription() {
  const { supabase } = await viewerOrLogin("/me/subscription");
  await supabase.rpc("resume_subscription");
  revalidatePath("/me/subscription");
}

const REFUND_ERRORS: Record<string, string> = {
  NOT_FOUND: "환불할 결제를 찾을 수 없어요.",
  ALREADY_REQUESTED: "이미 환불을 신청한 결제예요.",
  ACCOUNT_RESTRICTED: "약관 위반으로 이용이 제한된 계정은 환불되지 않아요.",
  REFUND_CHAT_USED: "이번 결제 기간에 채팅방을 만들어서 환불할 수 없어요.",
  REFUND_EXPIRED: "결제 후 7일이 지나 환불할 수 없어요.",
  REFUND_NOT_PAID: "환불할 수 있는 결제가 아니에요.",
  REFUND_ALREADY_REQUESTED: "이미 환불을 신청한 결제예요.",
};

export async function requestRefund(_: string | null, formData: FormData): Promise<string | null> {
  const paymentId = String(formData.get("payment") ?? "");
  const reason = String(formData.get("reason") ?? "");
  const note = String(formData.get("note") ?? "").trim() || null;
  if (!UUID.test(paymentId)) return "환불할 결제를 찾을 수 없어요.";
  if (reason !== "mistake" && reason !== "duplicate" && reason !== "system_error") return "환불 사유를 선택해 주세요.";
  if (reason !== "mistake" && !note) return "어떤 문제가 있었는지 적어주세요.";
  const { supabase } = await viewerOrLogin("/me/subscription");
  const { data, error } = await supabase.rpc("request_refund", { p_payment_id: paymentId, p_reason: reason, p_note: note ?? undefined });
  if (error) return REFUND_ERRORS[error.message] ?? "환불 신청 중 문제가 생겼어요. 다시 시도해 주세요.";
  revalidatePath("/me/subscription");
  return (data as { status: string }).status === "completed"
    ? "환불이 완료됐어요. 결제 수단으로 3영업일 이내에 돌려드려요."
    : "환불 신청이 접수됐어요. 확인 후 3영업일 이내에 처리해 드려요.";
}

export async function withdraw(_: string | null, formData: FormData): Promise<string | null> {
  if (String(formData.get("confirm") ?? "").trim() !== "탈퇴합니다") return "'탈퇴합니다'를 정확히 입력해 주세요.";
  const { supabase } = await viewerOrLogin("/me/withdraw");
  const { error } = await supabase.rpc("withdraw_account");
  if (error) return "탈퇴 처리 중 문제가 생겼어요. 다시 시도해 주세요.";
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/?bye=1");
}
