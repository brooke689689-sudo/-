import Link from "next/link";
import { requireViewer } from "@/lib/auth";
import { dateLabel } from "@/lib/format";

export default async function SubscribeDonePage({ searchParams }: { searchParams: Promise<{ post?: string }> }) {
  const sp = await searchParams;
  const post = sp.post && /^[0-9a-f-]{36}$/i.test(sp.post) ? sp.post : null;
  const { supabase, user } = await requireViewer("/subscribe/done");
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("current_period_end, price")
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  return (
    <main className="mx-auto max-w-md px-4 py-16 text-center">
      <img src="/icon-128.png" alt="" className="mx-auto h-16 w-16" />
      <h1 className="mt-4 text-2xl font-bold text-ink">구독이 시작됐어요</h1>
      {sub && (
        <p className="mt-2 text-sm leading-6 text-stone-500">
          다음 결제일은 {dateLabel(sub.current_period_end)}이에요.
          <br />
          구독 관리와 해지는 내 정보에서 할 수 있어요.
        </p>
      )}
      <div className="mt-8 flex flex-col gap-2">
        {post && (
          <Link href={`/?pet=${post}`} className="flex h-12 items-center justify-center rounded-xl bg-brand font-bold text-white">
            보던 아이에게 채팅하러 가기
          </Link>
        )}
        <Link href="/" className="flex h-12 items-center justify-center rounded-xl border border-stone-200 bg-white font-semibold text-stone-600">
          둘러보기
        </Link>
      </div>
    </main>
  );
}
