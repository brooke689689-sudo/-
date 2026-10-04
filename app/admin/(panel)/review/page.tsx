import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { publicMediaUrl } from "@/lib/config";
import { dateLabel } from "@/lib/format";
import { setPostVisibility } from "../../actions";

export default async function AdminReview({ searchParams }: { searchParams: Promise<{ v?: string }> }) {
  const sp = await searchParams;
  const visibility = sp.v === "hidden" ? "hidden" : "pending_review";
  const { supabase } = await requireAdmin();
  const { data: posts } = await supabase
    .from("posts")
    .select("id, title, description, breed_text, review_note, created_at, author_id, breeds(name), categories(name), profiles!posts_author_id_fkey(nickname), post_media(storage_path, is_cover)")
    .eq("visibility", visibility)
    .is("deleted_at", null)
    .order("created_at", { ascending: true })
    .limit(100);

  return (
    <div>
      <div className="flex gap-2 text-sm">
        <Link href="/admin/review" className={`rounded-full px-3 py-1.5 font-semibold ${visibility === "pending_review" ? "bg-ink text-white" : "bg-white text-stone-500 ring-1 ring-stone-200"}`}>
          검토 대기
        </Link>
        <Link href="/admin/review?v=hidden" className={`rounded-full px-3 py-1.5 font-semibold ${visibility === "hidden" ? "bg-ink text-white" : "bg-white text-stone-500 ring-1 ring-stone-200"}`}>
          숨김
        </Link>
      </div>
      {!posts?.length ? (
        <p className="mt-6 text-sm text-stone-400">대상 글이 없어요.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {posts.map((p) => {
            const cover = p.post_media?.find((m) => m.is_cover) ?? p.post_media?.[0];
            return (
              <li key={p.id} className="flex gap-4 rounded-2xl border border-stone-200 bg-white p-4 text-sm">
                <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-stone-100">
                  {cover && <img src={publicMediaUrl(cover.storage_path)} alt="" className="h-full w-full object-cover" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-amber-700">{p.review_note}</p>
                  <Link href={`/?pet=${p.id}`} target="_blank" className="mt-0.5 block font-bold text-stone-900 underline">
                    {p.title}
                  </Link>
                  <p className="text-xs text-stone-500">
                    {p.categories?.name} · {p.breeds?.name ?? `기타: ${p.breed_text}`} · {p.profiles?.nickname} · {dateLabel(p.created_at, true)}
                  </p>
                  <p className="mt-1 line-clamp-2 text-stone-600">{p.description}</p>
                  <div className="mt-2 flex gap-2">
                    <form action={setPostVisibility}>
                      <input type="hidden" name="post" value={p.id} />
                      <input type="hidden" name="visibility" value="visible" />
                      <button type="submit" className="h-8 rounded-lg bg-emerald-600 px-3 text-xs font-bold text-white">
                        승인하고 공개
                      </button>
                    </form>
                    {visibility === "pending_review" && (
                      <form action={setPostVisibility} className="flex gap-1">
                        <input type="hidden" name="post" value={p.id} />
                        <input type="hidden" name="visibility" value="hidden" />
                        <input name="note" placeholder="숨김 사유" className="h-8 w-36 rounded-lg border border-stone-200 px-2 text-xs" />
                        <button type="submit" className="h-8 rounded-lg border border-stone-300 px-3 text-xs font-semibold text-stone-700">
                          숨기기
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
