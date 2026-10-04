"use client";

import { useActionState, useState } from "react";
import { requestPasswordReset, verifyResetCode, type AuthState } from "../actions";

const input = "h-12 w-full rounded-xl border border-stone-200 px-4 outline-none focus:border-ink";

export function ForgotForm() {
  const [email, setEmail] = useState("");
  const [sent, send, sending] = useActionState<AuthState, FormData>(requestPasswordReset, {});
  const [checked, verify, verifying] = useActionState<AuthState, FormData>(verifyResetCode, {});

  if (!sent.message) {
    return (
      <form action={send} className="space-y-3">
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="가입한 이메일"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={input}
        />
        {sent.error && <p className="text-sm text-red-600">{sent.error}</p>}
        <button type="submit" disabled={sending} className="h-12 w-full rounded-xl bg-ink font-bold text-white disabled:opacity-60">
          {sending ? "보내는 중…" : "인증번호 받기"}
        </button>
      </form>
    );
  }

  return (
    <form action={verify} className="space-y-3">
      <input type="hidden" name="email" value={email} />
      <p className="rounded-lg bg-emerald-50 p-3 text-sm leading-6 text-emerald-700">{sent.message}</p>
      <input
        name="token"
        required
        inputMode="numeric"
        autoComplete="one-time-code"
        minLength={6}
        maxLength={8}
        pattern="[0-9]{6,8}"
        placeholder="인증번호 6자리"
        className={input}
      />
      {checked.error && <p className="text-sm text-red-600">{checked.error}</p>}
      <button type="submit" disabled={verifying} className="h-12 w-full rounded-xl bg-ink font-bold text-white disabled:opacity-60">
        {verifying ? "확인 중…" : "인증하고 비밀번호 재설정"}
      </button>
    </form>
  );
}
