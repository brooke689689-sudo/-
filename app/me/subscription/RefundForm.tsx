"use client";

import { useActionState, useState } from "react";
import { requestRefund } from "../actions";

export function RefundForm({
  paymentId,
  simpleEligible,
  simpleReason,
}: {
  paymentId: string;
  simpleEligible: boolean;
  simpleReason: string | null;
}) {
  const [message, action, pending] = useActionState(requestRefund, null);
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState(simpleEligible ? "mistake" : "duplicate");

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="mt-2 text-xs text-stone-400 underline">
        환불 신청
      </button>
    );
  }

  return (
    <form action={action} className="mt-3 space-y-2 rounded-xl bg-stone-50 p-3">
      <input type="hidden" name="payment" value={paymentId} />
      {(
        [
          ["mistake", "잘못 결제했어요 (채팅방을 만들지 않음)", !simpleEligible],
          ["duplicate", "같은 결제가 두 번 됐어요", false],
          ["system_error", "시스템 오류로 결제됐어요", false],
        ] as const
      ).map(([v, label, disabled]) => (
        <label key={v} className={`flex items-center gap-2 text-sm ${disabled ? "text-stone-300" : "text-stone-700"}`}>
          <input type="radio" name="reason" value={v} checked={reason === v} disabled={disabled} onChange={() => setReason(v)} className="accent-brand" />
          {label}
        </label>
      ))}
      {!simpleEligible && simpleReason && <p className="text-xs text-stone-500">{simpleReason}</p>}
      {reason !== "mistake" && (
        <textarea
          name="note"
          rows={2}
          maxLength={500}
          required
          placeholder="어떤 문제가 있었는지 적어주세요"
          className="w-full rounded-lg border border-stone-200 bg-white p-2 text-sm outline-none focus:border-ink"
        />
      )}
      {message && <p className="text-xs font-semibold text-stone-700">{message}</p>}
      <div className="flex gap-2">
        <button type="button" onClick={() => setOpen(false)} className="h-9 flex-1 rounded-lg border border-stone-200 bg-white text-xs font-semibold text-stone-600">
          닫기
        </button>
        <button type="submit" disabled={pending} className="h-9 flex-1 rounded-lg bg-ink text-xs font-bold text-white disabled:opacity-60">
          {pending ? "처리 중" : "환불 신청"}
        </button>
      </div>
    </form>
  );
}
