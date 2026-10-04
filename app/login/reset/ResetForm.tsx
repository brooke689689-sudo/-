"use client";

import { useActionState } from "react";
import { PasswordField } from "@/components/PasswordField";
import { updatePassword, type AuthState } from "../actions";

export function ResetForm() {
  const [state, action, pending] = useActionState<AuthState, FormData>(updatePassword, {});

  return (
    <form action={action} className="space-y-3">
      <PasswordField name="password" autoComplete="new-password" placeholder="새 비밀번호 (8자 이상)" />
      <PasswordField name="confirm" autoComplete="new-password" placeholder="새 비밀번호 확인" />
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button type="submit" disabled={pending} className="h-12 w-full rounded-xl bg-ink font-bold text-white disabled:opacity-60">
        {pending ? "저장 중…" : "비밀번호 변경"}
      </button>
    </form>
  );
}
