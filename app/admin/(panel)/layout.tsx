import Link from "next/link";
import { requireAdmin } from "@/lib/admin";

export const metadata = { robots: { index: false, follow: false } };

const NAV = [
  ["/admin", "대시보드"],
  ["/admin/reports", "신고"],
  ["/admin/review", "검토 대기"],
  ["/admin/members", "회원"],
  ["/admin/monitoring", "모니터링"],
  ["/admin/payments", "결제·환불"],
  ["/admin/settings", "설정"],
  ["/admin/logs", "처리 기록"],
] as const;

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="flex items-center gap-2">
        <span className="rounded bg-ink px-2 py-0.5 text-xs font-bold text-white">ADMIN</span>
        <h1 className="text-xl font-bold text-ink">안아줌 관리자</h1>
      </div>
      <nav className="-mx-4 mt-4 flex gap-1 overflow-x-auto border-b border-stone-200 px-4 text-sm">
        {NAV.map(([href, label]) => (
          <Link key={href} href={href} className="shrink-0 px-3 py-2.5 font-semibold text-stone-500 hover:text-ink">
            {label}
          </Link>
        ))}
      </nav>
      <div className="pt-6">{children}</div>
    </div>
  );
}
