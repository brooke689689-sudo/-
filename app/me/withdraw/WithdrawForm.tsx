"use client";

import { useActionState } from "react";
import { withdraw } from "../actions";

export function WithdrawForm() {
  const [error, action, pending] = useActionState(withdraw, null);
  return (
    <form action={action} className="mt-6 space-y-3">
      <label className="block text-sm font-semibold text-stone-700">
        확인을 위해 <b className="text-red-600">탈퇴합니다</b>를 입력해 주세요
        <input
          name="confirm"
          autoComplete="off"
          className="mt-1 h-12 w-full rounded-xl border border-stone-200 bg-white px-4 font-normal outline-none focus:border-red-400"
        />
      </label>
      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <button type="submit" disabled={pending} className="h-12 w-full rounded-xl bg-red-500 font-bold text-white disabled:opacity-60">
        {pending ? "처리 중" : "탈퇴하기"}
      </button>
    </form>
  );
}
