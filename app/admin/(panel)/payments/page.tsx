import { requireAdmin } from "@/lib/admin";
import { dateLabel, won } from "@/lib/format";
import { processRefund } from "../../actions";

const REASON = { mistake: "단순 실수", duplicate: "중복 결제", system_error: "시스템 오류" } as const;
const PAY = { paid: "결제", failed: "실패", refunded: "환불" } as const;

export default async function AdminPayments() {
  const { supabase } = await requireAdmin();
  const [{ data: refunds }, { data: payments }] = await Promise.all([
    supabase
      .from("refunds")
      .select("id, reason, status, note, created_at, profiles(nickname), payments(amount, paid_at, pg_payment_id)")
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("payments")
      .select("id, amount, status, pg_payment_id, paid_at, created_at, profiles(nickname)")
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-stone-200 bg-white p-5">
        <h2 className="font-bold text-stone-900">환불</h2>
        {!refunds?.length ? (
          <p className="mt-2 text-sm text-stone-400">환불 신청이 없어요.</p>
        ) : (
          <ul className="mt-3 divide-y divide-stone-100 text-sm">
            {refunds.map((r) => (
              <li key={r.id} className="py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <b>{r.profiles?.nickname ?? "탈퇴 회원"}</b>
                  <span className="text-stone-600">{REASON[r.reason]}</span>
                  <span className="text-stone-500">{r.payments ? won(r.payments.amount) : ""}</span>
                  <span className={`text-xs font-semibold ${r.status === "requested" ? "text-brand-dark" : "text-stone-400"}`}>{r.status}</span>
                  <span className="text-xs text-stone-400">{dateLabel(r.created_at, true)}</span>
                </div>
                {r.note && <p className="mt-1 text-stone-600">{r.note}</p>}
                {r.status === "requested" && (
                  <form action={processRefund} className="mt-2 flex flex-wrap gap-1.5">
                    <input type="hidden" name="refund" value={r.id} />
                    <input name="note" placeholder="처리 메모" className="h-8 w-48 rounded-lg border border-stone-200 px-2 text-xs" />
                    <button type="submit" name="approve" value="1" className="h-8 rounded-lg bg-emerald-600 px-3 text-xs font-bold text-white">
                      환불 승인
                    </button>
                    <button type="submit" name="approve" value="0" className="h-8 rounded-lg border border-stone-300 px-3 text-xs font-semibold text-stone-700">
                      거절
                    </button>
                  </form>
                )}
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3 text-xs text-stone-400">실제 결제 연동 후에는 승인 시 PortOne 결제 취소가 함께 처리돼야 해요.</p>
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white p-5">
        <h2 className="font-bold text-stone-900">최근 결제</h2>
        <table className="mt-3 w-full text-sm">
          <tbody>
            {payments?.map((p) => (
              <tr key={p.id} className="border-t border-stone-100">
                <td className="py-2">{p.profiles?.nickname ?? "탈퇴 회원"}</td>
                <td className="py-2">{won(p.amount)}</td>
                <td className="py-2 text-stone-500">{PAY[p.status]}</td>
                <td className="py-2 font-mono text-xs text-stone-400">{p.pg_payment_id}</td>
                <td className="py-2 text-right text-xs text-stone-400">{dateLabel(p.paid_at ?? p.created_at, true)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
