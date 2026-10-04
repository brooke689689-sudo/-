"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getViewer, safeNext } from "@/lib/auth";

const ERRORS: Record<string, string> = {
  TEST_MODE_OFF: "지금은 테스트 인증을 사용할 수 없어요.",
  INVALID_BIRTH_YEAR: "출생연도를 확인해 주세요.",
  BANNED_IDENTITY: "이용이 제한된 명의예요. 고객센터로 문의해 주세요.",
};

export async function testVerify(_: string | null, formData: FormData): Promise<string | null> {
  const next = safeNext(String(formData.get("next") ?? "/"));
  const birthYear = Number(formData.get("birthYear"));
  const { supabase, user } = await getViewer();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/verify?next=${next}`)}`);

  const { error } = await supabase.rpc("test_verify_identity", { p_birth_year: birthYear });
  if (error) return ERRORS[error.message] ?? "인증 중 문제가 생겼어요. 다시 시도해 주세요.";
  revalidatePath("/", "layout");
  redirect(next);
}
