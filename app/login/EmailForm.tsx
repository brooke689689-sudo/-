"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { PasswordField } from "@/components/PasswordField";
import { emailAuth, type AuthState } from "./actions";

export function EmailForm({ next }: { next: string }) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [state, action, pending] = useActionState<AuthState, FormData>(emailAuth, {});

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="mode" value={mode} />
      <input type="hidden" name="next" value={next} />
      <div className="grid grid-cols-2 rounded-xl bg-stone-100 p-1 text-sm font-semibold">
        {(["login", "signup"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={`rounded-lg py-2 ${mode === m ? "bg-white text-ink shadow-sm" : "text-stone-500"}`}
          >
            {m === "login" ? "로그인" : "이메일로 가입"}
          </button>
        ))}
      </div>
      <input
        name="email"
        type="email"
        required
        autoComplete="email"
        placeholder="이메일"
        className="h-12 w-full rounded-xl border border-stone-200 px-4 outline-none focus:border-ink"
      />
      {mode === "signup" ? (
        <PasswordField name="password" autoComplete="new-password" placeholder="비밀번호 (8자 이상)" />
      ) : (
        <input
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="current-password"
          placeholder="비밀번호"
          className="h-12 w-full rounded-xl border border-stone-200 px-4 outline-none focus:border-ink"
        />
      )}
      {mode === "login" && (
        <div className="flex justify-end gap-4 text-sm">
          <Link href="/login/find-id" className="text-stone-500 underline">
            아이디 찾기
          </Link>
          <Link href="/login/forgot" className="text-stone-500 underline">
            비밀번호 찾기
          </Link>
        </div>
      )}
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state.message && <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">{state.message}</p>}
      <button
        type="submit"
        disabled={pending}
        className="h-12 w-full rounded-xl bg-ink font-bold text-white disabled:opacity-60"
      >
        {pending ? "처리 중…" : mode === "login" ? "이메일로 로그인" : "가입하기"}
      </button>
    </form>
  );
}
