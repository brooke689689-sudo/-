"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { completeOnboarding, type WelcomeState } from "./actions";

const REQUIRED = [
  { name: "terms", label: "이용약관 동의", href: "/policy/terms" },
  { name: "privacy", label: "개인정보 수집·이용 동의", href: "/policy/privacy" },
  { name: "age", label: "만 14세 이상입니다" },
];

export function WelcomeForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<WelcomeState, FormData>(completeOnboarding, {});
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const all = [...REQUIRED.map((r) => r.name), "marketing"].every((n) => checked[n]);

  const toggleAll = () => {
    const value = !all;
    setChecked(Object.fromEntries([...REQUIRED.map((r) => r.name), "marketing"].map((n) => [n, value])));
  };

  return (
    <form action={action} className="space-y-8">
      <input type="hidden" name="next" value={next} />

      <section>
        <h2 className="font-bold text-stone-900">약관 동의</h2>
        <label className="mt-3 flex items-center gap-3 rounded-xl border border-stone-200 p-4 font-semibold">
          <input type="checkbox" checked={all} onChange={toggleAll} className="h-5 w-5 accent-brand" />
          전체 동의
        </label>
        <div className="mt-2 space-y-1 px-1">
          {[...REQUIRED, { name: "marketing", label: "이벤트·소식 알림 받기", href: undefined }].map((item) => (
            <label key={item.name} className="flex items-center gap-3 py-1.5 text-sm">
              <input
                type="checkbox"
                name={item.name}
                checked={!!checked[item.name]}
                onChange={(e) => setChecked((c) => ({ ...c, [item.name]: e.target.checked }))}
                className="h-4 w-4 accent-brand"
              />
              <span className="flex-1">
                <span className={item.name === "marketing" ? "text-stone-400" : "text-brand-dark"}>
                  {item.name === "marketing" ? "(선택)" : "(필수)"}
                </span>{" "}
                {item.label}
              </span>
              {item.href && (
                <Link href={item.href} target="_blank" className="text-xs text-stone-400 underline">
                  보기
                </Link>
              )}
            </label>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-bold text-stone-900">닉네임</h2>
        <input
          name="nickname"
          required
          minLength={2}
          maxLength={20}
          placeholder="한글·영문·숫자 2~20자"
          className="mt-3 h-12 w-full rounded-xl border border-stone-200 px-4 outline-none focus:border-ink"
        />
      </section>

      <section>
        <h2 className="font-bold text-stone-900">어떤 목적으로 오셨나요?</h2>
        <p className="mt-1 text-xs text-stone-500">나중에 언제든 두 가지 모두 이용할 수 있어요.</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {[
            { value: "adopt", title: "입양하고 싶어요", desc: "새 가족이 될 아이를 찾아요" },
            { value: "rehome", title: "분양하고 싶어요", desc: "아이의 새 가족을 찾아요" },
          ].map((o) => (
            <label
              key={o.value}
              className="cursor-pointer rounded-xl border-2 border-stone-200 p-4 has-[:checked]:border-brand has-[:checked]:bg-brand-soft"
            >
              <input type="radio" name="purpose" value={o.value} required className="sr-only" />
              <p className="font-bold text-stone-900">{o.title}</p>
              <p className="mt-1 text-xs text-stone-500">{o.desc}</p>
            </label>
          ))}
        </div>
      </section>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button type="submit" disabled={pending} className="h-12 w-full rounded-xl bg-brand font-bold text-white disabled:opacity-60">
        {pending ? "저장 중…" : "시작하기"}
      </button>
    </form>
  );
}
