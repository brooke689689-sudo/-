import Link from "next/link";
import { notFound } from "next/navigation";
import { requireViewer } from "@/lib/auth";
import { publicMediaUrl } from "@/lib/config";
import { toggleBlock } from "../actions";
import { AdoptionPanel } from "./AdoptionPanel";
import { ChatRoom, type ChatMessage } from "./ChatRoom";

export default async function ChatRoomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { supabase, user } = await requireViewer(`/chats/${id}`);

  const { data: room } = await supabase
    .from("chat_rooms")
    .select(
      "id, post_id, adopter_id, rehomer_id, adopter:profiles!chat_rooms_adopter_id_fkey(nickname, withdrawn_at), rehomer:profiles!chat_rooms_rehomer_id_fkey(nickname, withdrawn_at), posts(id, title, status, region_sido, region_sigungu, post_media(storage_path, is_cover))",
    )
    .eq("id", id)
    .maybeSingle();
  if (!room || (room.adopter_id !== user.id && room.rehomer_id !== user.id)) notFound();

  const role = room.adopter_id === user.id ? "adopter" : "rehomer";
  const otherId = role === "adopter" ? room.rehomer_id : room.adopter_id;
  const other = role === "adopter" ? room.rehomer : room.adopter;

  const [{ data: messages }, { data: adoption }, { data: blocks }] = await Promise.all([
    supabase
      .from("messages")
      .select("id, sender_id, body, image_path, is_blocked, flag_reason, created_at")
      .eq("room_id", id)
      .order("created_at", { ascending: false })
      .limit(300),
    supabase
      .from("adoptions")
      .select("rehomer_confirmed_at, adopter_confirmed_at, completed_at")
      .eq("room_id", id)
      .maybeSingle(),
    supabase
      .from("blocks")
      .select("blocker_id")
      .eq("blocker_id", user.id)
      .eq("blocked_id", otherId),
  ]);
  await supabase.rpc("mark_room_read", { p_room_id: id });

  const iBlocked = !!blocks?.length;
  const post = room.posts;
  const cover = post?.post_media?.find((m) => m.is_cover) ?? post?.post_media?.[0];

  return (
    <main className="mx-auto flex h-[calc(100dvh-4rem)] max-w-2xl flex-col px-0 sm:px-4 sm:py-4">
      <div className="flex flex-1 flex-col overflow-hidden border-stone-200 bg-white sm:rounded-2xl sm:border">
        <header className="flex items-center gap-3 border-b border-stone-100 p-3">
          <Link href="/chats" className="px-2 text-xl text-stone-400" aria-label="채팅 목록">
            ‹
          </Link>
          <Link href={post ? `/?pet=${post.id}` : "#"} className="flex min-w-0 flex-1 items-center gap-3">
            <div className="h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-stone-100">
              {cover && <img src={publicMediaUrl(cover.storage_path)} alt="" className="h-full w-full object-cover" />}
            </div>
            <div className="min-w-0">
              <p className="truncate font-bold text-stone-900">{other?.nickname ?? "탈퇴한 회원"}</p>
              <p className="truncate text-xs text-stone-500">
                {post ? `${post.status === "adopted" ? "[분양완료] " : ""}${post.title}` : "삭제된 글"}
              </p>
            </div>
          </Link>
          <details className="relative">
            <summary className="cursor-pointer list-none rounded-lg px-3 py-2 text-lg text-stone-400 hover:bg-stone-100" aria-label="메뉴">
              ⋯
            </summary>
            <div className="absolute right-0 z-10 mt-1 w-40 overflow-hidden rounded-xl border border-stone-200 bg-white text-sm shadow-lg">
              <form action={toggleBlock}>
                <input type="hidden" name="room" value={id} />
                <input type="hidden" name="user" value={otherId} />
                <button type="submit" className="block w-full px-4 py-3 text-left hover:bg-stone-50">
                  {iBlocked ? "차단 해제" : "이 회원 차단"}
                </button>
              </form>
              <Link href={`/report?user=${otherId}&room=${id}`} className="block px-4 py-3 text-red-600 hover:bg-stone-50">
                회원 신고
              </Link>
            </div>
          </details>
        </header>

        <p className="border-b border-amber-100 bg-amber-50 px-4 py-2.5 text-xs leading-5 text-amber-900">
          <b>안아줌은 무료 분양만 허용해요.</b> 분양비·책임비 요구와 계좌번호 전송은 차단되고 즉시 영구정지될 수 있어요. 카카오톡 ID 등 연락처 교환은 괜찮아요.
        </p>

        {post && (
          <AdoptionPanel
            roomId={id}
            role={role}
            postAdopted={post.status === "adopted"}
            adoption={adoption ?? null}
          />
        )}

        <ChatRoom
          roomId={id}
          userId={user.id}
          initial={((messages ?? []) as ChatMessage[]).reverse()}
          disabled={iBlocked ? "차단한 회원이에요. 메뉴에서 차단을 해제하면 대화할 수 있어요." : other?.withdrawn_at || !other ? "탈퇴한 회원과는 대화할 수 없어요." : null}
        />
      </div>
    </main>
  );
}
