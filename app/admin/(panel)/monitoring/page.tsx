import Link from "next/link";
import { requireAdmin } from "@/lib/admin";

type Row = { user_id: string; nickname: string | null; cnt?: number; today_cnt?: number; period_cnt?: number };

function Table({ title, hint, rows, cols }: { title: string; hint: string; rows: Row[]; cols: [keyof Row, string][] }) {
  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-5">
      <h2 className="font-bold text-stone-900">{title}</h2>
      <p className="text-xs text-stone-400">{hint}</p>
      {!rows.length ? (
        <p className="mt-3 text-sm text-stone-400">해당 계정이 없어요.</p>
      ) : (
        <table className="mt-3 w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-stone-400">
              <th className="py-1 font-medium">회원</th>
              {cols.map(([, label]) => (
                <th key={label} className="py-1 text-right font-medium">
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.user_id} className="border-t border-stone-100">
                <td className="py-2">
                  <Link href={`/admin/members?q=${r.user_id}`} className="font-semibold text-ink underline">
                    {r.nickname ?? "탈퇴 회원"}
                  </Link>
                </td>
                {cols.map(([k]) => (
                  <td key={k} className="py-2 text-right font-mono">
                    {String(r[k] ?? 0)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

export default async function AdminMonitoring() {
  const { supabase } = await requireAdmin();
  const { data } = await supabase.rpc("admin_monitoring");
  const m = (data ?? { adoptions: [], posts: [], quota: [] }) as { adoptions: Row[]; posts: Row[]; quota: Row[] };

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Table title="입양 확정이 많은 계정" hint="최근 90일 3건 이상 (재분양·업자 의심)" rows={m.adoptions} cols={[["cnt", "확정"]]} />
      <Table title="글을 많이 올린 계정" hint="최근 30일 5건 이상 (번식·판매 의심)" rows={m.posts} cols={[["cnt", "글"]]} />
      <Table
        title="채팅방 한도 소진 계정"
        hint="오늘 20개 또는 최근 31일 150개 이상"
        rows={m.quota}
        cols={[
          ["today_cnt", "오늘"],
          ["period_cnt", "31일"],
        ]}
      />
    </div>
  );
}
