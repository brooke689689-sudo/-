import Link from "next/link";
import { requireViewer } from "@/lib/auth";
import { dateLabel, won } from "@/lib/format";
import { cancelSubscription, resumeSubscription } from "../actions";
import { RefundForm } from "./RefundForm";

const PAYMENT_STATUS = { paid: "결제 완료", failed: "결제 실패", refunded: "환불 완료" } as const;
const REFUND_STATUS = { requested: "환불 확인 중", completed: "환불 완료", rejected: "환불 거절" } as const;
const INELIGIBLE: Record<string, string> = {
  CHAT_USED: "이번 기간에 채팅방을 만들어 단순 환불은 안 돼요.",
  EXPIRED: "결제 후 7일이 지났어요.",
};

type Quota = { subscribed: boolean; today_used: number; today_limit: number; period_used: number; period_limit: number };

export default async function SubscriptionPage() {
  const { supabase, user } = await requireViewer("/me/subscription");
  const [{ data: sub }, { data: payments }, { data: quota }] = await Promise.all([
    supabase
      .from("subscriptions")
      .select("id, status, price, current_period_start, current_period_end, cancel_at_period_end")
      .eq("user_id", user.id)
      .in("status", ["active", "past_due"])
      .maybeSingle(),
    supabase
      .from("payments")
      .select("id, amount, status, period_start, period_end, paid_at, refunds(status, reason)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(24),
    supabase.rpc("chat_quota"),
  ]);
  const q = quota as Quota | null;

  const eligibility = await Promise.all(
    (payments ?? []).map(async (p) => {
      if (p.status !== "paid" || p.refunds) return null;
      const { data } = await supabase.rpc("refund_eligibility", { p_payment_id: p.id });
      return data as { eligible: boolean; reason?: string } | null;
    }),
  );

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-stone-200 bg-white p-5">
        <h2 className="font-bold text-stone-900">본인인증 기반 안심 채팅</h2>
        {sub ? (
          <>
            <p className="mt-2 text-sm text-stone-600">
              {sub.cancel_at_period_end ? (
                <>
                  <b className="text-stone-800">{dateLabel(sub.current_period_end)}</b>까지 이용할 수 있고, 이후 자동 결제되지 않아요.
                </>
              ) : (
                <>
                  다음 결제일 <b className="text-stone-800">{dateLabel(sub.current_period_end)}</b> · 월 {won(sub.price)}
                </>
              )}
            </p>
            {q && (
              <div className="mt-4 grid grid-cols-2 gap-2 text-center">
                <div className="rounded-xl bg-stone-50 p-3">
                  <p className="text-xs text-stone-500">오늘 새 채팅방</p>
                  <p className="mt-1 text-lg font-bold text-ink">
                    {q.today_used} / {q.today_limit}
                  </p>
                </div>
                <div className="rounded-xl bg-stone-50 p-3">
                  <p className="text-xs text-stone-500">이번 결제 기간</p>
                  <p className="mt-1 text-lg font-bold text-ink">
                    {q.period_used} / {q.period_limit}
                  </p>
                </div>
              </div>
            )}
            <form action={sub.cancel_at_period_end ? resumeSubscription : cancelSubscription} className="mt-4">
              <button type="submit" className="h-11 w-full rounded-xl border border-stone-200 text-sm font-semibold text-stone-600">
                {sub.cancel_at_period_end ? "해지 취소하고 계속 이용하기" : "구독 해지하기"}
              </button>
            </form>
            {!sub.cancel_at_period_end && (
              <p className="mt-2 text-xs leading-5 text-stone-400">
                해지해도 {dateLabel(sub.current_period_end)}까지 이용할 수 있어요. 남은 기간에 대한 일할 환불은 없고, 만든 채팅방은 계속 남아요.
              </p>
            )}
          </>
        ) : (
          <>
            <p className="mt-2 text-sm text-stone-500">구독하지 않았어요. 분양자에게 먼저 채팅을 걸려면 구독이 필요해요. 받은 채팅에 답장하는 건 무료예요.</p>
            <Link href="/subscribe" className="mt-4 flex h-11 items-center justify-center rounded-xl bg-brand text-sm font-bold text-white">
              구독 안내 보기
            </Link>
          </>
        )}
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white p-5">
        <h2 className="font-bold text-stone-900">결제 내역</h2>
        {!payments?.length ? (
          <p className="mt-2 text-sm text-stone-400">결제 내역이 없어요.</p>
        ) : (
          <ul className="mt-3 divide-y divide-stone-100">
            {payments.map((p, i) => {
              const elig = eligibility[i];
              return (
                <li key={p.id} className="py-3 text-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-stone-800">{won(p.amount)}</p>
                      <p className="text-xs text-stone-400">
                        {dateLabel(p.period_start)} ~ {dateLabel(p.period_end)}
                      </p>
                    </div>
                    <span className={`text-xs font-semibold ${p.status === "paid" ? "text-emerald-700" : "text-stone-500"}`}>
                      {p.refunds ? REFUND_STATUS[p.refunds.status] : PAYMENT_STATUS[p.status]}
                    </span>
                  </div>
                  {p.status === "paid" && !p.refunds && (
                    <RefundForm
                      paymentId={p.id}
                      simpleEligible={!!elig?.eligible}
                      simpleReason={elig && !elig.eligible ? (INELIGIBLE[elig.reason ?? ""] ?? null) : null}
                    />
                  )}
                </li>
              );
            })}
          </ul>
        )}
        <p className="mt-3 text-xs text-stone-400">
          <Link href="/policy/refund" className="underline">
            환불정책
          </Link>{" "}
          · 결제 기록은 관련 법령에 따라 5년간 보관돼요.
        </p>
      </section>
    </div>
  );
}
