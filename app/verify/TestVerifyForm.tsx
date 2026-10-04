"use client";

import { useActionState } from "react";
import { testVerify } from "./actions";

export function TestVerifyForm({ next }: { next: string }) {
  const [error, action, pending] = useActionState(testVerify, null);
  const thisYear = new Date().getFullYear();

  return (
    <form action={action} className="mt-8 rounded-2xl border-2 border-dashed border-amber-300 bg-amber-50 p-6 text-left">
      <p className="text-sm font-bold text-amber-900">테스트 인증</p>
      <p className="mt-1 text-xs leading-5 text-amber-800">
        정식 출시 전 테스트용이에요. 실제 휴대폰 인증 없이 출생연도만 입력하면 인증된 것으로 처리돼요.
      </p>
      <input type="hidden" name="next" value={next} />
      <label className="mt-4 block text-sm font-semibold text-stone-700">
        출생연도
        <input
          name="birthYear"
          type="number"
          min={1900}
          max={thisYear}
          defaultValue={1995}
          required
          className="mt-1 h-12 w-full rounded-xl border border-stone-200 bg-white px-4 outline-none focus:border-ink"
        />
      </label>
      {error && <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <button type="submit" disabled={pending} className="mt-4 h-12 w-full rounded-xl bg-ink font-bold text-white disabled:opacity-60">
        {pending ? "확인 중" : "테스트로 인증하기"}
      </button>
    </form>
  );
}
