import Link from "next/link";
import { requireAdmin } from "@/lib/admin";

export default async function AdminDashboard() {
  const { supabase } = await requireAdmin();
  const todayKst = new Date(Date.now() + 9 * 3600_000).toISOString().slice(0, 10);
  const todayStart = new Date(`${todayKst}T00:00:00+09:00`).toISOString();
  const head = { count: "exact" as const, head: true };

  const [reports, review, refunds, postsToday, rooms, subs, members, blockedMsgs] = await Promise.all([
    supabase.from("reports").select("id", head).eq("status", "open"),
    supabase.from("posts").select("id", head).eq("visibility", "pending_review").is("deleted_at", null),
    supabase.from("refunds").select("id", head).eq("status", "requested"),
    supabase.from("posts").select("id", head).gte("created_at", todayStart),
    supabase.from("chat_rooms").select("id", head).gte("created_at", todayStart),
    supabase.from("subscriptions").select("id", head).eq("status", "active"),
    supabase.from("profiles").select("id", head).is("withdrawn_at", null),
    supabase.from("messages").select("id", head).eq("is_blocked", true).gte("created_at", todayStart),
  ]);

  const todo = [
    { label: "처리 안 된 신고", value: reports.count ?? 0, href: "/admin/reports" },
    { label: "검토 대기 글", value: review.count ?? 0, href: "/admin/review" },
    { label: "환불 확인 요청", value: refunds.count ?? 0, href: "/admin/payments" },
  ];
  const stats = [
    { label: "오늘 새 글", value: postsToday.count ?? 0 },
    { label: "오늘 새 채팅방", value: rooms.count ?? 0 },
    { label: "오늘 차단된 메시지", value: blockedMsgs.count ?? 0 },
    { label: "구독 중", value: subs.count ?? 0 },
    { label: "전체 회원", value: members.count ?? 0 },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-3">
        {todo.map((t) => (
          <Link
            key={t.label}
            href={t.href}
            className={`rounded-2xl border p-5 ${t.value ? "border-brand bg-brand-soft" : "border-stone-200 bg-white"}`}
          >
            <p className="text-sm text-stone-600">{t.label}</p>
            <p className={`mt-1 text-3xl font-bold ${t.value ? "text-brand-dark" : "text-stone-300"}`}>{t.value}</p>
          </Link>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-stone-200 bg-white p-4">
            <p className="text-xs text-stone-500">{s.label}</p>
            <p className="mt-1 text-2xl font-bold text-ink">{s.value.toLocaleString("ko-KR")}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
