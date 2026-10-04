import Link from "next/link";
import { PetCard } from "@/components/PetCard";
import { requireViewer } from "@/lib/auth";
import type { CardPost } from "@/lib/posts";

export default async function FavoritesPage() {
  const { supabase, user } = await requireViewer("/me/favorites");
  const { data } = await supabase
    .from("favorites")
    .select(
      "created_at, posts(id, title, birth_date, sex, region_sido, region_sigungu, is_urgent, urgent_deadline, status, created_at, favorite_count, breed_text, breeds(name), categories(name), post_media(storage_path, type, is_cover))",
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const posts = (data ?? [])
    .map((f) => f.posts)
    .filter((p): p is NonNullable<typeof p> => !!p)
    .map((p) => ({ ...p, post_media: p.post_media.filter((m) => m.is_cover) })) as CardPost[];

  if (!posts.length) {
    return (
      <div className="rounded-2xl border border-dashed border-stone-300 bg-white py-16 text-center">
        <p className="font-semibold text-stone-700">찜한 아이가 없어요</p>
        <p className="mt-1 text-sm text-stone-500">마음에 드는 아이의 ♡를 누르면 여기에 모여요.</p>
        <Link href="/" className="mt-5 inline-block rounded-lg bg-brand px-5 py-2.5 text-sm font-bold text-white">
          둘러보기
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {posts.map((p) => (
        <PetCard key={p.id} post={p} href={`/?pet=${p.id}`} />
      ))}
    </div>
  );
}
