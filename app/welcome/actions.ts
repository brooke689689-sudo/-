"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getViewer, safeNext } from "@/lib/auth";
import { POLICY_VERSION } from "@/lib/policy";

export type WelcomeState = { error?: string };

export async function completeOnboarding(_: WelcomeState, form: FormData): Promise<WelcomeState> {
  const { supabase, user, profile } = await getViewer();
  if (!user) redirect("/login?next=/welcome");
  const next = safeNext(String(form.get("next") ?? "/"));
  if (profile?.onboarded_at) redirect(next);

  const nickname = String(form.get("nickname") ?? "").trim();
  const purpose = form.get("purpose");

  if (form.get("terms") !== "on" || form.get("privacy") !== "on" || form.get("age") !== "on") {
    return { error: "필수 항목에 모두 동의해 주세요." };
  }
  if (!/^[가-힣a-zA-Z0-9_]{2,20}$/.test(nickname)) {
    return { error: "닉네임은 한글·영문·숫자 2~20자로 입력해 주세요." };
  }
  if (purpose !== "adopt" && purpose !== "rehome") return { error: "이용 목적을 선택해 주세요." };

  const { data: check } = await supabase.rpc("check_text", { p_text: nickname, p_scope: "all" });
  if ((check as { action?: string } | null)?.action === "block") return { error: "사용할 수 없는 닉네임이에요." };

  const { error: consentError } = await supabase.from("consents").insert({
    user_id: user.id,
    terms_version: POLICY_VERSION,
    privacy_version: POLICY_VERSION,
    marketing: form.get("marketing") === "on",
  });
  if (consentError) return { error: "저장 중 문제가 생겼어요. 다시 시도해 주세요." };

  const { error } = await supabase
    .from("profiles")
    .update({ nickname, primary_purpose: purpose, onboarded_at: new Date().toISOString() })
    .eq("id", user.id);
  if (error) {
    return { error: error.code === "23505" ? "이미 사용 중인 닉네임이에요." : "저장 중 문제가 생겼어요. 다시 시도해 주세요." };
  }

  revalidatePath("/", "layout");
  redirect(purpose === "rehome" && next === "/" ? "/posts/new" : next);
}
