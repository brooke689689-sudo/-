"use client";

import { useActionState } from "react";
import { createReport } from "./actions";

export function ReportForm({
  reasons,
  target,
  back,
}: {
  reasons: readonly string[];
  target: { post?: string; message?: string; user?: string };
  back: string;
}) {
  const [error, action, pending] = useActionState(createReport, null);

  return (
    <form action={action} className="mt-6 space-y-4">
      {target.post && <input type="hidden" name="post" value={target.post} />}
      {target.message && <input type="hidden" name="message" value={target.message} />}
      {target.user && <input type="hidden" name="user" value={target.user} />}
      <input type="hidden" name="back" value={back} />
      <fieldset className="space-y-2">
        {reasons.map((r) => (
          <label key={r} className="flex items-center gap-3 rounded-xl border border-stone-200 bg-white p-4 text-sm text-stone-800 has-checked:border-ink">
            <input type="radio" name="reason" value={r} required className="h-4 w-4 accent-brand" />
            {r}
          </label>
        ))}
      </fieldset>
      <textarea
        name="detail"
        rows={4}
        maxLength={1000}
        placeholder="자세한 상황을 적어주시면 빠르게 확인할 수 있어요. (선택)"
        className="w-full rounded-xl border border-stone-200 bg-white p-4 text-sm leading-6 outline-none focus:border-ink"
      />
      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <button type="submit" disabled={pending} className="h-12 w-full rounded-xl bg-red-500 font-bold text-white disabled:opacity-60">
        {pending ? "접수 중" : "신고하기"}
      </button>
    </form>
  );
}
