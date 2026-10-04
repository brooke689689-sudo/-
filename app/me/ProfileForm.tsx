"use client";

import { useActionState } from "react";
import { updateProfile } from "./actions";

export function ProfileForm({ nickname, purpose }: { nickname: string; purpose: "adopt" | "rehome" | null }) {
  const [message, action, pending] = useActionState(updateProfile, null);
  return (
    <form action={action} className="space-y-4">
      <label className="block text-sm font-semibold text-stone-700">
        닉네임
        <input
          name="nickname"
          defaultValue={nickname}
          maxLength={20}
          className="mt-1 h-12 w-full rounded-xl border border-stone-200 bg-white px-4 font-normal outline-none focus:border-ink"
        />
      </label>
      <fieldset>
        <legend className="text-sm font-semibold text-stone-700">주 목적</legend>
        <div className="mt-1 flex gap-2">
          {(
            [
              ["adopt", "입양하고 싶어요"],
              ["rehome", "분양하고 싶어요"],
            ] as const
          ).map(([v, label]) => (
            <label key={v} className="flex flex-1 items-center gap-2 rounded-xl border border-stone-200 bg-white p-3 text-sm has-checked:border-ink">
              <input type="radio" name="purpose" value={v} defaultChecked={purpose === v} className="accent-brand" />
              {label}
            </label>
          ))}
        </div>
      </fieldset>
      {message && <p className="text-sm text-stone-600">{message}</p>}
      <button type="submit" disabled={pending} className="h-11 rounded-xl bg-ink px-5 text-sm font-bold text-white disabled:opacity-60">
        저장
      </button>
    </form>
  );
}
