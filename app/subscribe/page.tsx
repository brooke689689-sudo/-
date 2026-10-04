import { redirect } from "next/navigation";
import { requireViewer } from "@/lib/auth";
import { SubscribeForm } from "./SubscribeForm";

function Item({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 py-3">
      <dt className="w-24 shrink-0 text-sm font-semibold text-stone-500">{title}</dt>
      <dd className="text-sm leading-6 text-stone-800">{children}</dd>
    </div>
  );
}

export default async function SubscribePage({ searchParams }: { searchParams: Promise<{ post?: string }> }) {
  const sp = await searchParams;
  const post = sp.post && /^[0-9a-f-]{36}$/i.test(sp.post) ? sp.post : "";
  const { supabase, profile } = await requireViewer(`/subscribe${post ? `?post=${post}` : ""}`);
  if (!profile?.is_verified) redirect(`/verify?next=${encodeURIComponent(`/subscribe${post ? `?post=${post}` : ""}`)}`);

  const [{ data: quota }, { data: testMode }] = await Promise.all([
    supabase.rpc("chat_quota"),
    supabase.rpc("is_test_mode"),
  ]);
  if ((quota as { subscribed?: boolean } | null)?.subscribed) redirect(post ? `/?pet=${post}` : "/me");

  return (
    <main className="mx-auto max-w-lg px-4 py-10">
      <p className="text-sm font-bold text-brand">입양을 원하시나요?</p>
      <h1 className="mt-1 text-2xl font-bold text-ink">본인인증 기반 안심 채팅</h1>
      <p className="mt-2 text-sm leading-6 text-stone-500">
        분양자에게 먼저 채팅을 걸려면 구독이 필요해요. 분양은 언제나 무료이고, 이용료는 본인인증한 회원끼리 안전하게 대화하는 서비스에 대한 비용이에요.
      </p>

      <div className="mt-6 rounded-2xl border border-stone-200 bg-white p-5">
        <div className="flex items-baseline justify-between border-b border-stone-100 pb-4">
          <span className="font-bold text-stone-900">본인인증 기반 안심 채팅 서비스 이용료</span>
          <span className="text-xl font-bold text-brand-dark">월 5,900원</span>
        </div>
        <dl className="divide-y divide-stone-100">
          <Item title="결제">매달 같은 날 자동 결제돼요. 결제 3일 전에 알림을 보내드려요.</Item>
          <Item title="새 채팅방">하루 20개(한국 시간 자정 기준), 결제 기간마다 200개까지 만들 수 있어요.</Item>
          <Item title="채팅방 유지">구독 중에 만든 채팅방은 해지한 뒤에도 계속 대화할 수 있어요. 같은 글에 다시 들어가도 개수가 줄지 않아요.</Item>
          <Item title="해지">언제든 해지할 수 있고, 남은 기간까지 이용한 뒤 다음 결제부터 멈춰요. 남은 기간에 대한 일할 환불은 없어요.</Item>
          <Item title="환불">
            결제 후 7일 이내이고 이번 결제 기간에 새 채팅방을 하나도 만들지 않았다면 전액 환불돼요. 채팅방을 만들었거나 7일이 지나면 환불되지 않아요. 중복 결제·시스템 오류는 언제나 전액 환불해 드려요.
          </Item>
          <Item title="이용 조건">만 19세 이상, 본인인증을 마친 회원</Item>
        </dl>
      </div>

      <SubscribeForm post={post} testMode={!!testMode} />
    </main>
  );
}
