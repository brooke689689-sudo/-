"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { safeNext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type AuthState = { error?: string; message?: string };

async function origin() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? (host?.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

const AUTH_ERRORS: Record<string, string> = {
  invalid_credentials: "이메일 또는 비밀번호가 올바르지 않아요.",
  email_not_confirmed: "메일함에서 가입 인증 링크를 먼저 눌러주세요.",
  user_already_exists: "이미 가입된 이메일이에요. 로그인해 주세요.",
  weak_password: "비밀번호가 너무 쉬워요. 8자 이상으로 영문과 숫자를 섞어주세요.",
  over_email_send_rate_limit: "잠시 후 다시 시도해 주세요.",
  over_request_rate_limit: "요청이 너무 많아요. 잠시 후 다시 시도해 주세요.",
};

function message(error: { code?: string; message?: string; status?: number }, fallback: string) {
  const code = error.code ?? "";
  const text = error.message ?? "";
  if (error.status === 429 || code === "over_email_send_rate_limit" || code === "over_request_rate_limit" || /rate limit/i.test(text)) {
    return "요청이 너무 많아요. 잠시 후 다시 시도해 주세요.";
  }
  return AUTH_ERRORS[code] || fallback;
}

async function finishLogin(supabase: Awaited<ReturnType<typeof createClient>>, next: string) {
  const { data } = await supabase.auth.getUser();
  const { data: profile } = data.user
    ? await supabase.from("profiles").select("onboarded_at").eq("id", data.user.id).maybeSingle()
    : { data: null };
  revalidatePath("/", "layout");
  redirect(profile && !profile.onboarded_at ? `/welcome?next=${encodeURIComponent(next)}` : next);
}

export async function emailAuth(_: AuthState, form: FormData): Promise<AuthState> {
  const mode = form.get("mode") === "signup" ? "signup" : "login";
  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");
  const next = safeNext(String(form.get("next") ?? "/"));

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "이메일 주소를 확인해 주세요." };
  if (password.length < 8) return { error: "비밀번호는 8자 이상이어야 해요." };

  const supabase = await createClient();

  if (mode === "signup") {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${await origin()}/auth/callback?next=${encodeURIComponent(next)}` },
    });
    if (error) return { error: message(error, "가입 중 문제가 생겼어요. 다시 시도해 주세요.") };
    if (data.user && data.user.identities?.length === 0) return { error: AUTH_ERRORS.user_already_exists };
    if (!data.session) return { message: `${email}로 인증 메일을 보냈어요. 메일의 링크를 누르면 가입이 완료됩니다.` };
    await finishLogin(supabase, next);
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: message(error, "로그인 중 문제가 생겼어요. 다시 시도해 주세요.") };
  await finishLogin(supabase, next);
  return {};
}

export async function oauthLogin(form: FormData) {
  const provider = form.get("provider");
  const next = safeNext(String(form.get("next") ?? "/"));
  if (provider !== "kakao") redirect(`/login?error=provider&next=${encodeURIComponent(next)}`);

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "kakao",
    options: { redirectTo: `${await origin()}/auth/callback?next=${encodeURIComponent(next)}` },
  });
  if (error || !data.url) redirect(`/login?error=provider&next=${encodeURIComponent(next)}`);
  redirect(data.url);
}

function sameForUnknown(error: { code?: string; message?: string }) {
  const code = error.code ?? "";
  const text = `${code} ${error.message ?? ""}`;
  return code === "user_not_found" || /user not found|signups not allowed/i.test(text);
}

export async function requestIdEmail(_: AuthState, form: FormData): Promise<AuthState> {
  const email = String(form.get("email") ?? "").trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "이메일 주소를 확인해 주세요." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: false },
  });
  if (error && !sameForUnknown(error)) return { error: message(error, "메일을 보내지 못했어요. 잠시 후 다시 시도해 주세요.") };
  return { message: "가입된 이메일이면 인증번호 6자리를 보냈어요. 메일에 있는 숫자를 입력해 주세요." };
}

export async function verifyIdCode(_: AuthState, form: FormData): Promise<AuthState> {
  const email = String(form.get("email") ?? "").trim();
  const token = String(form.get("token") ?? "").replace(/\s/g, "");
  if (!/^\d{6,8}$/.test(token)) return { error: "메일로 받은 인증코드를 입력해 주세요." };

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ email, token, type: "email" });
  if (error) return { error: "인증코드가 맞지 않거나 만료됐어요." };
  revalidatePath("/", "layout");
  redirect("/login/id");
}

export async function requestPasswordReset(_: AuthState, form: FormData): Promise<AuthState> {
  const email = String(form.get("email") ?? "").trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "이메일 주소를 확인해 주세요." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: false },
  });
  if (error && !sameForUnknown(error)) return { error: message(error, "메일을 보내지 못했어요. 잠시 후 다시 시도해 주세요.") };
  return { message: "가입된 이메일이면 인증번호 6자리를 보냈어요. 확인되면 이 사이트에서 비밀번호를 바꿀 수 있어요." };
}

export async function verifyResetCode(_: AuthState, form: FormData): Promise<AuthState> {
  const email = String(form.get("email") ?? "").trim();
  const token = String(form.get("token") ?? "").replace(/\s/g, "");
  if (!/^\d{6,8}$/.test(token)) return { error: "메일로 받은 인증코드를 입력해 주세요." };

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ email, token, type: "email" });
  if (error) return { error: "인증코드가 맞지 않거나 만료됐어요." };
  revalidatePath("/", "layout");
  redirect("/login/reset");
}

export async function updatePassword(_: AuthState, form: FormData): Promise<AuthState> {
  const password = String(form.get("password") ?? "");
  const confirm = String(form.get("confirm") ?? "");
  if (password.length < 8) return { error: "비밀번호는 8자 이상이어야 해요." };
  if (password !== confirm) return { error: "비밀번호가 서로 달라요." };

  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return { error: "메일 인증이 만료됐어요. 비밀번호 찾기부터 다시 해 주세요." };

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: message(error, "비밀번호를 바꾸지 못했어요. 다시 시도해 주세요.") };
  revalidatePath("/", "layout");
  redirect("/");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}
