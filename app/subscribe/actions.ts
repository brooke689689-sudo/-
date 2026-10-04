"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getViewer } from "@/lib/auth";
import { POLICY_VERSION } from "@/lib/policy";

const ERRORS: Record<string, string> = {
  TEST_MODE_OFF: "결제 서비스 연결을 준비하고 있어요.",
  CONSENT_REQUIRED: "필수 안내 3개에 모두 동의해 주세요.",
  VERIFICATION_REQUIRED: "본인인증을 먼저 해주세요.",
  ACCOUNT_RESTRICTED: "이용이 제한된 계정은 구독할 수 없어요.",
  UNDER_19: "구독은 만 19세 이상만 가능해요.",
  ALREADY_SUBSCRIBED: "이미 구독 중이에요.",
};

export async function startSubscription(_: string | null, formData: FormData): Promise<string | null> {
  const post = String(formData.get("post") ?? "");
  const { supabase, user } = await getViewer();
  if (!user) redirect("/login?next=/subscribe");

  const { error } = await supabase.rpc("test_start_subscription", {
    p_auto_billing: formData.get("autoBilling") === "on",
    p_no_refund_after_chat: formData.get("noRefund") === "on",
    p_free_rehoming: formData.get("freeRehoming") === "on",
    p_notice_version: POLICY_VERSION,
  });
  if (error) {
    if (error.message === "VERIFICATION_REQUIRED") redirect("/verify?next=/subscribe");
    return ERRORS[error.message] ?? "결제 중 문제가 생겼어요. 다시 시도해 주세요.";
  }
  revalidatePath("/", "layout");
  redirect(`/subscribe/done${/^[0-9a-f-]{36}$/i.test(post) ? `?post=${post}` : ""}`);
}
