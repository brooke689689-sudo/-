import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { dateLabel } from "@/lib/format";
import { resolveReport, setPostVisibility } from "../../actions";
import { SanctionButtons } from "../SanctionButtons";

const TARGET = { post: "분양글", message: "메시지", user: "회원" } as const;
const STATUS = { open: "미처리", resolved: "조치 완료", dismissed: "기각" } as const;

export default async function AdminReports({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const sp = await searchParams;
  const status = sp.status === "resolved" || sp.status === "dismissed" ? sp.status : "open";
  const { supabase } = await requireAdmin();
  const { data: reports } = await supabase
    .from("reports")
    .select(
      "id, target_type, reason, detail, status, resolution, created_at, target_user_id, reporter:profiles!reports_reporter_id_fkey(nickname), target:profiles!reports_target_user_id_fkey(nickname, account_status(status, warning_count)), posts(id, title, visibility), messages(body, is_blocked, room_id)",
    )
    .eq("status", status)
    .order("created_at", { ascending: status === "open" })
    .limit(100);

  return (
    <div>
      <div className="flex gap-2 text-sm">
        {(["open", "resolved", "dismissed"] as const).map((s) => (
          <Link key={s} href={`/admin/reports?status=${s}`} className={`rounded-full px-3 py-1.5 font-semibold ${s === status ? "bg-ink text-white" : "bg-white text-stone-500 ring-1 ring-stone-200"}`}>
            {STATUS[s]}
          </Link>
        ))}
      </div>

      {!reports?.length ? (
        <p className="mt-6 text-sm text-stone-400">신고가 없어요.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {reports.map((r) => (
            <li key={r.id} className="rounded-2xl border border-stone-200 bg-white p-4 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded bg-stone-100 px-2 py-0.5 text-xs font-bold text-stone-600">{TARGET[r.target_type]}</span>
                <span className="font-bold text-red-600">{r.reason}</span>
                <span className="text-xs text-stone-400">
                  {dateLabel(r.created_at, true)} · 신고자 {r.reporter?.nickname ?? "-"}
                </span>
              </div>
              {r.detail && <p className="mt-2 whitespace-pre-line text-stone-700">{r.detail}</p>}

              <div className="mt-3 rounded-xl bg-stone-50 p-3 text-xs leading-5 text-stone-600">
                {r.posts && (
                  <p>
                    글:{" "}
                    <Link href={`/?pet=${r.posts.id}`} className="font-semibold text-ink underline" target="_blank">
                      {r.posts.title}
                    </Link>{" "}
                    ({r.posts.visibility})
                  </p>
                )}
                {r.messages && (
                  <p>
                    메시지: <span className="font-semibold text-stone-800">{r.messages.body ?? "사진"}</span>
                    {r.messages.is_blocked && " (자동 차단됨)"}
                  </p>
                )}
                {r.target && (
                  <p>
                    대상 회원: <b>{r.target.nickname ?? "탈퇴 회원"}</b> · 상태 {r.target.account_status?.status} · 경고{" "}
                    {r.target.account_status?.warning_count ?? 0}회
                  </p>
                )}
                {r.resolution && <p>처리: {r.resolution}</p>}
              </div>

              {r.status === "open" && (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {r.target_user_id && <SanctionButtons userId={r.target_user_id} reportId={r.id} defaultReason={r.reason} />}
                  {r.posts && r.posts.visibility === "visible" && (
                    <form action={setPostVisibility}>
                      <input type="hidden" name="post" value={r.posts.id} />
                      <input type="hidden" name="visibility" value="hidden" />
                      <input type="hidden" name="note" value={`신고: ${r.reason}`} />
                      <button type="submit" className="h-8 rounded-lg border border-stone-300 px-2.5 text-xs font-semibold text-stone-700">
                        글 숨기기
                      </button>
                    </form>
                  )}
                  <form action={resolveReport}>
                    <input type="hidden" name="report" value={r.id} />
                    <input type="hidden" name="status" value="dismissed" />
                    <button type="submit" className="h-8 rounded-lg px-2.5 text-xs font-semibold text-stone-400 hover:bg-stone-100">
                      기각
                    </button>
                  </form>
                  <form action={resolveReport}>
                    <input type="hidden" name="report" value={r.id} />
                    <input type="hidden" name="status" value="resolved" />
                    <input type="hidden" name="resolution" value="확인 완료 (제재 없음)" />
                    <button type="submit" className="h-8 rounded-lg px-2.5 text-xs font-semibold text-stone-500 hover:bg-stone-100">
                      처리 완료
                    </button>
                  </form>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
