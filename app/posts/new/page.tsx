import Link from "next/link";
import { requireViewer } from "@/lib/auth";
import { PostForm } from "./PostForm";

export default async function NewPostPage() {
  const { supabase, user, profile } = await requireViewer("/posts/new");

  if (!profile?.is_verified) {
    return (
      <main className="mx-auto max-w-md px-4 py-16 text-center">
        <img src="/icon-128.png" alt="" className="mx-auto h-16 w-16" />
        <h1 className="mt-4 text-2xl font-bold text-ink">본인인증이 필요해요</h1>
        <p className="mt-2 text-sm leading-6 text-stone-500">
          안아줌은 안전한 분양을 위해 휴대폰 본인인증을 한 회원만 분양글을 올릴 수 있어요. 인증은 한 번만 하면 돼요.
        </p>
        <Link href="/verify?next=/posts/new" className="mt-8 inline-flex h-12 items-center rounded-xl bg-brand px-8 font-bold text-white">
          본인인증 하기
        </Link>
      </main>
    );
  }

  const [{ data: categories }, { data: breeds }] = await Promise.all([
    supabase.from("categories").select("id, name").order("sort_order"),
    supabase
      .from("breeds")
      .select("id, category_id, name, is_cites, requires_review")
      .eq("is_banned", false)
      .order("sort_order"),
  ]);

  return (
    <main className="mx-auto max-w-xl px-4 py-8">
      <h1 className="text-2xl font-bold text-ink">분양글 쓰기</h1>
      <p className="mt-1 text-sm text-stone-500">아이에게 꼭 맞는 새 가족을 찾을 수 있도록 자세히 적어주세요.</p>
      <div className="mt-8">
        <PostForm userId={user.id} categories={categories ?? []} breeds={breeds ?? []} />
      </div>
    </main>
  );
}
