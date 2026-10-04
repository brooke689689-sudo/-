import Link from "next/link";
import { requireViewer } from "@/lib/auth";
import { publicMediaUrl } from "@/lib/config";
import { timeAgo } from "@/lib/format";
import { confirmStillActive, setPostStatus } from "../actions";
import { DeletePostButton } from "./DeletePostButton";

export default async function MyPostsPage() {
  const { supabase, user } = await requireViewer("/me/posts");
  const { data: posts } = await supabase
    .from("posts")
    .select("id, title, status, visibility, review_note, view_count, favorite_count, last_confirmed_at, created_at, post_media(storage_path, is_cover)")
    .eq("author_id", user.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  const staleBefore = new Date(Date.now() - 25 * 86400_000).toISOString();

  if (!posts?.length) {
    return (
      <div className="rounded-2xl border border-dashed border-stone-300 bg-white py-16 text-center">
        <p className="font-semibold text-stone-700">올린 분양글이 없어요</p>
        <Link href="/posts/new" className="mt-5 inline-block rounded-lg bg-brand px-5 py-2.5 text-sm font-bold text-white">
          분양글 쓰기
        </Link>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {posts.map((p) => {
        const cover = p.post_media?.find((m) => m.is_cover) ?? p.post_media?.[0];
        const needsConfirm = p.status === "active" && (p.review_note === "장기 미확인" || p.last_confirmed_at < staleBefore);
        return (
          <li key={p.id} className="rounded-2xl border border-stone-200 bg-white p-4">
            <div className="flex gap-3">
              <Link href={`/?pet=${p.id}`} className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-stone-100">
                {cover && <img src={publicMediaUrl(cover.storage_path)} alt="" className="h-full w-full object-cover" />}
              </Link>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${p.status === "adopted" ? "bg-stone-200 text-stone-600" : "bg-ink-soft text-ink"}`}>
                    {p.status === "adopted" ? "분양완료" : "분양중"}
                  </span>
                  {p.visibility === "pending_review" && (
                    <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-700">검토 대기</span>
                  )}
                  {p.visibility === "hidden" && (
                    <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-bold text-red-600">
                      숨김{p.review_note ? ` · ${p.review_note}` : ""}
                    </span>
                  )}
                </div>
                <Link href={`/?pet=${p.id}`} className="mt-1 block truncate font-bold text-stone-900">
                  {p.title}
                </Link>
                <p className="mt-0.5 text-xs text-stone-400">
                  {timeAgo(p.created_at)} · 조회 {p.view_count} · 찜 {p.favorite_count}
                </p>
              </div>
            </div>

            {needsConfirm && (
              <form action={confirmStillActive} className="mt-3 flex items-center justify-between gap-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
                <input type="hidden" name="post" value={p.id} />
                <span>아직 새 가족을 찾고 있나요? 확인하지 않으면 목록에서 숨겨져요.</span>
                <button type="submit" className="shrink-0 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-bold text-white">
                  아직 분양 중이에요
                </button>
              </form>
            )}

            <div className="mt-3 flex flex-wrap gap-2 text-sm">
              <Link href={`/posts/${p.id}/edit`} className="rounded-lg border border-stone-200 px-3 py-1.5 font-semibold text-stone-700">
                수정
              </Link>
              <form action={setPostStatus}>
                <input type="hidden" name="post" value={p.id} />
                <input type="hidden" name="status" value={p.status === "adopted" ? "active" : "adopted"} />
                <button type="submit" className="rounded-lg border border-stone-200 px-3 py-1.5 font-semibold text-stone-700">
                  {p.status === "adopted" ? "분양중으로 되돌리기" : "분양완료로 바꾸기"}
                </button>
              </form>
              <DeletePostButton postId={p.id} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
