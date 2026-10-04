import { requireAdmin } from "@/lib/admin";
import { dateLabel } from "@/lib/format";
import { liftSanction } from "../../actions";
import { SanctionButtons } from "../SanctionButtons";

const STATUS = { active: "정상", suspended: "정지", banned: "영구정지" } as const;

export default async function AdminMembers({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim().slice(0, 30);
  const { supabase } = await requireAdmin();
  let query = supabase
    .from("profiles")
    .select("id, nickname, is_verified, primary_purpose, created_at, withdrawn_at, account_status(status, warning_count, suspended_until, is_admin)")
    .order("created_at", { ascending: false })
    .limit(50);
  if (q) query = /^[0-9a-f-]{36}$/i.test(q) ? query.eq("id", q) : query.ilike("nickname", `%${q.replace(/[%_]/g, "")}%`);
  const { data: members } = await query;

  return (
    <div>
      <form className="flex gap-2">
        <input name="q" defaultValue={q} placeholder="닉네임 또는 회원 ID" className="h-10 flex-1 rounded-lg border border-stone-200 bg-white px-3 text-sm" />
        <button type="submit" className="h-10 rounded-lg bg-ink px-4 text-sm font-semibold text-white">
          검색
        </button>
      </form>
      <ul className="mt-4 space-y-2">
        {members?.map((m) => {
          const s = m.account_status;
          const restricted = s && s.status !== "active";
          return (
            <li key={m.id} className="rounded-2xl border border-stone-200 bg-white p-4 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <b className="text-stone-900">{m.nickname ?? (m.withdrawn_at ? "탈퇴 회원" : "(설정 전)")}</b>
                {s?.is_admin && <span className="rounded bg-ink px-1.5 text-[11px] font-bold text-white">관리자</span>}
                <span className={`text-xs font-semibold ${restricted ? "text-red-600" : "text-emerald-700"}`}>
                  {s ? STATUS[s.status] : "-"}
                  {s?.status === "suspended" && s.suspended_until ? ` (~${dateLabel(s.suspended_until)})` : ""}
                </span>
                <span className="text-xs text-stone-400">
                  경고 {s?.warning_count ?? 0}회 · {m.is_verified ? "본인인증" : "미인증"} · 가입 {dateLabel(m.created_at)}
                </span>
              </div>
              <p className="mt-1 font-mono text-[11px] text-stone-300">{m.id}</p>
              {!m.withdrawn_at && !s?.is_admin && (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <SanctionButtons userId={m.id} />
                  {restricted && (
                    <form action={liftSanction}>
                      <input type="hidden" name="user" value={m.id} />
                      <button type="submit" className="h-8 rounded-lg border border-stone-300 px-2.5 text-xs font-semibold text-stone-700">
                        제재 해제
                      </button>
                    </form>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
      <p className="mt-4 text-xs text-stone-400">관리자 지정은 보안을 위해 Supabase 대시보드에서만 할 수 있어요.</p>
    </div>
  );
}
