"use client";

import { useActionState, useState } from "react";
import { confirmAdoption } from "../actions";

type Adoption = { rehomer_confirmed_at: string | null; adopter_confirmed_at: string | null; completed_at: string | null };

export function AdoptionPanel({
  roomId,
  role,
  postAdopted,
  adoption,
}: {
  roomId: string;
  role: "adopter" | "rehomer";
  postAdopted: boolean;
  adoption: Adoption | null;
}) {
  const [error, action, pending] = useActionState(confirmAdoption, null);
  const [open, setOpen] = useState(false);

  if (adoption?.completed_at) {
    return (
      <div className="border-b border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
        <b>입양이 확정됐어요.</b>{" "}
        {role === "adopter"
          ? "30일 이내에 동물등록 변경 신고를 꼭 해주세요. (정부24 또는 동물병원)"
          : "새 가족을 찾아주셔서 고마워요."}
      </div>
    );
  }
  if (postAdopted) return null;

  const mineDone = role === "adopter" ? !!adoption?.adopter_confirmed_at : !!adoption?.rehomer_confirmed_at;
  const otherDone = role === "adopter" ? !!adoption?.rehomer_confirmed_at : !!adoption?.adopter_confirmed_at;

  return (
    <div className="border-b border-stone-100 px-4 py-2.5 text-sm">
      {mineDone ? (
        <p className="text-stone-600">
          입양 확정을 눌렀어요. {role === "adopter" ? "분양자" : "입양자"}도 확정하면 분양이 완료돼요.
        </p>
      ) : !open ? (
        <div className="flex items-center justify-between gap-2">
          <span className="text-stone-600">
            {otherDone
              ? `${role === "adopter" ? "분양자" : "입양자"}가 입양 확정을 눌렀어요.`
              : "만나서 입양하기로 했나요?"}
          </span>
          <button type="button" onClick={() => setOpen(true)} className="shrink-0 rounded-lg bg-ink px-3 py-1.5 text-xs font-bold text-white">
            입양 확정하기
          </button>
        </div>
      ) : (
        <form action={action} className="space-y-2 py-1">
          <input type="hidden" name="room" value={roomId} />
          {role === "adopter" ? (
            <label className="flex gap-2 rounded-lg bg-brand-soft p-3 text-xs leading-5 text-stone-800">
              <input type="checkbox" name="pledge" required className="mt-0.5 h-4 w-4 shrink-0 accent-brand" />
              <span>
                <b>입양 약속</b> — 평생 책임지고 돌보겠습니다. 다시 보내야 할 사정이 생기면 원래 보호자에게 먼저 연락하고, 학대·유기하지 않으며, 30일 이내에 동물등록 변경 신고를 하겠습니다.
              </span>
            </label>
          ) : (
            <p className="text-xs leading-5 text-stone-600">
              이 분께 아이를 보내기로 확정해요. 두 사람 모두 확정하면 글이 분양완료로 바뀌고 새 채팅을 받지 않아요.
            </p>
          )}
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button type="button" onClick={() => setOpen(false)} className="h-9 flex-1 rounded-lg border border-stone-200 text-xs font-semibold text-stone-600">
              취소
            </button>
            <button type="submit" disabled={pending} className="h-9 flex-1 rounded-lg bg-brand text-xs font-bold text-white disabled:opacity-60">
              {pending ? "처리 중" : "확정"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
