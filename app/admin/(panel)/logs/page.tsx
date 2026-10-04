import { requireAdmin } from "@/lib/admin";
import { dateLabel } from "@/lib/format";

export default async function AdminLogs() {
  const { supabase } = await requireAdmin();
  const { data: logs } = await supabase
    .from("admin_logs")
    .select("id, action, target_type, target_id, detail, created_at, profiles(nickname)")
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <div className="overflow-x-auto rounded-2xl border border-stone-200 bg-white">
      <table className="w-full text-sm">
        <thead className="bg-stone-50 text-left text-xs text-stone-500">
          <tr>
            <th className="px-3 py-2 font-medium">시각</th>
            <th className="px-3 py-2 font-medium">관리자</th>
            <th className="px-3 py-2 font-medium">작업</th>
            <th className="px-3 py-2 font-medium">대상</th>
            <th className="px-3 py-2 font-medium">내용</th>
          </tr>
        </thead>
        <tbody>
          {logs?.map((l) => (
            <tr key={l.id} className="border-t border-stone-100 align-top">
              <td className="whitespace-nowrap px-3 py-2 text-xs text-stone-400">{dateLabel(l.created_at, true)}</td>
              <td className="px-3 py-2">{l.profiles?.nickname ?? "시스템"}</td>
              <td className="px-3 py-2 font-semibold">{l.action}</td>
              <td className="px-3 py-2 text-xs text-stone-500">
                {l.target_type} <span className="font-mono">{l.target_id?.slice(0, 8)}</span>
              </td>
              <td className="max-w-md truncate px-3 py-2 font-mono text-xs text-stone-500">{JSON.stringify(l.detail)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {!logs?.length && <p className="p-6 text-sm text-stone-400">기록이 없어요.</p>}
    </div>
  );
}
