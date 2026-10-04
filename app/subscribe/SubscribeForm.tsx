"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { startSubscription } from "./actions";

const CONSENTS = [
  {
    name: "autoBilling",
    text: "매달 같은 날 5,900원이 자동 결제되는 것에 동의합니다. 언제든 해지할 수 있어요.",
  },
  {
    name: "noRefund",
    text: "이번 결제 기간에 채팅방을 1개라도 만들면 이번 달 결제는 환불되지 않는 것을 확인했습니다.",
  },
  {
    name: "freeRehoming",
    text: "무료 분양 원칙에 동의합니다. 분양비·책임비 등 금전을 요구하거나 계좌번호를 보내지 않겠습니다.",
  },
] as const;

export function SubscribeForm({ post, testMode }: { post: string; testMode: boolean }) {
  const [error, action, pending] = useActionState(startSubscription, null);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const all = CONSENTS.every((c) => checked[c.name]);

  return (
    <form action={action} className="mt-6">
      <input type="hidden" name="post" value={post} />
      <div className="space-y-2">
        <label className="flex items-center gap-3 rounded-xl bg-stone-100 p-4 text-sm font-bold text-stone-800">
          <input
            type="checkbox"
            checked={all}
            onChange={(e) => setChecked(Object.fromEntries(CONSENTS.map((c) => [c.name, e.target.checked])))}
            className="h-4 w-4 accent-brand"
          />
          아래 내용을 모두 확인하고 동의합니다
        </label>
        {CONSENTS.map((c) => (
          <label key={c.name} className="flex gap-3 rounded-xl border border-stone-200 bg-white p-4 text-sm leading-6 text-stone-700">
            <input
              type="checkbox"
              name={c.name}
              checked={!!checked[c.name]}
              onChange={(e) => setChecked((s) => ({ ...s, [c.name]: e.target.checked }))}
              className="mt-1 h-4 w-4 shrink-0 accent-brand"
            />
            <span>
              <b className="text-brand-dark">[필수]</b> {c.text}
            </span>
          </label>
        ))}
      </div>
      <p className="mt-3 text-xs text-stone-400">
        자세한 내용은 <Link href="/policy/refund" className="underline">환불정책</Link>과{" "}
        <Link href="/policy/terms" className="underline">이용약관</Link>에서 확인할 수 있어요.
      </p>

      {error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      {testMode ? (
        <>
          <button
            type="submit"
            disabled={!all || pending}
            className="mt-5 h-14 w-full rounded-xl bg-brand text-lg font-bold text-white disabled:bg-stone-300"
          >
            {pending ? "결제 중" : "월 5,900원 결제하고 시작하기"}
          </button>
          <p className="mt-2 text-center text-xs font-semibold text-amber-700">
            테스트 모드: 실제로 결제되지 않아요.
          </p>
        </>
      ) : (
        <p className="mt-5 rounded-xl border border-dashed border-stone-300 bg-white p-5 text-center text-sm text-stone-500">
          결제 서비스 연결을 준비하고 있어요.
        </p>
      )}
    </form>
  );
}
