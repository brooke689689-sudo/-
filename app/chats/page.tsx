import Link from "next/link";
import { requireViewer } from "@/lib/auth";
import { publicMediaUrl } from "@/lib/config";
import { timeAgo } from "@/lib/format";
import { LiveRefresh } from "./LiveRefresh";

const ERRORS: Record<string, string> = {
  notfound: "글을 찾을 수 없어요. 삭제되었거나 비공개 처리된 글이에요.",
  own: "내가 올린 글에는 채팅을 걸 수 없어요.",
  adopted: "분양이 완료된 글이라 새 채팅을 시작할 수 없어요.",
  restricted: "이용이 제한된 계정이에요. 내 정보에서 제재 내용을 확인해 주세요.",
  blocked: "차단 관계인 회원과는 채팅할 수 없어요.",
  daily: "오늘 만들 수 있는 새 채팅방 20개를 모두 사용했어요. 내일 다시 시도해 주세요.",
  period: "이번 결제 기간의 새 채팅방 200개를 모두 사용했어요.",
  unknown: "채팅을 시작하지 못했어요. 잠시 후 다시 시도해 주세요.",
};

export default async function ChatsPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const sp = await searchParams;
  const { supabase, user } = await requireViewer("/chats");

  const [{ data: rooms }, { data: quota }] = await Promise.all([
    supabase
      .from("chat_rooms")
      .select(
        "id, adopter_id, rehomer_id, last_message_at, last_message_preview, adopter_last_read_at, rehomer_last_read_at, created_at, adopter:profiles!chat_rooms_adopter_id_fkey(nickname), rehomer:profiles!chat_rooms_rehomer_id_fkey(nickname), posts(title, status, post_media(storage_path, is_cover))",
      )
      .or(`adopter_id.eq.${user.id},rehomer_id.eq.${user.id}`)
      .order("last_message_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(300),
    supabase.rpc("chat_quota"),
  ]);
  const q = quota as { subscribed: boolean; today_used: number; today_limit: number; period_used: number; period_limit: number } | null;

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <LiveRefresh userId={user.id} />
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-bold text-ink">채팅</h1>
        {q?.subscribed ? (
          <span className="text-xs text-stone-500">
            오늘 새 채팅 {q.today_used}/{q.today_limit} · 이번 기간 {q.period_used}/{q.period_limit}
          </span>
        ) : (
          <Link href="/subscribe" className="text-xs font-semibold text-brand-dark underline">
            입양 문의하려면 구독하기
          </Link>
        )}
      </div>

      {sp.error && (
        <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{ERRORS[sp.error] ?? ERRORS.unknown}</p>
      )}

      {!rooms?.length ? (
        <div className="mt-6 rounded-2xl border border-dashed border-stone-300 bg-white py-16 text-center">
          <p className="font-semibold text-stone-700">아직 대화가 없어요</p>
          <p className="mt-1 text-sm text-stone-500">마음에 드는 아이를 찾으면 채팅으로 문의해 보세요.</p>
          <Link href="/" className="mt-5 inline-block rounded-lg bg-brand px-5 py-2.5 text-sm font-bold text-white">
            아이들 보러 가기
          </Link>
        </div>
      ) : (
        <ul className="mt-6 divide-y divide-stone-100 overflow-hidden rounded-2xl border border-stone-200 bg-white">
          {rooms.map((r) => {
            const mine = r.adopter_id === user.id ? "adopter" : "rehomer";
            const other = mine === "adopter" ? r.rehomer : r.adopter;
            const readAt = mine === "adopter" ? r.adopter_last_read_at : r.rehomer_last_read_at;
            const unread = !!r.last_message_at && (!readAt || r.last_message_at > readAt);
            const cover = r.posts?.post_media?.find((m) => m.is_cover) ?? r.posts?.post_media?.[0];
            return (
              <li key={r.id}>
                <Link href={`/chats/${r.id}`} className="flex items-center gap-3 p-4 hover:bg-stone-50">
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-stone-100">
                    {cover && <img src={publicMediaUrl(cover.storage_path)} alt="" className="h-full w-full object-cover" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-stone-900">{other?.nickname ?? "탈퇴한 회원"}</span>
                      <span className={`rounded px-1.5 py-0.5 text-[11px] font-semibold ${mine === "adopter" ? "bg-ink-soft text-ink" : "bg-brand-soft text-brand-dark"}`}>
                        {mine === "adopter" ? "분양자" : "입양 희망"}
                      </span>
                      {r.posts?.status === "adopted" && <span className="text-[11px] text-stone-400">분양완료</span>}
                    </div>
                    <p className="truncate text-xs text-stone-400">{r.posts?.title ?? "삭제된 글"}</p>
                    <p className={`mt-0.5 truncate text-sm ${unread ? "font-semibold text-stone-800" : "text-stone-500"}`}>
                      {r.last_message_preview ?? "아직 메시지가 없어요"}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span className="text-xs text-stone-400">{timeAgo(r.last_message_at ?? r.created_at)}</span>
                    {unread && <span className="h-2.5 w-2.5 rounded-full bg-brand" aria-label="읽지 않음" />}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
