import Link from "next/link";
import { redirect } from "next/navigation";
import { requireViewer, safeNext } from "@/lib/auth";
import { TestVerifyForm } from "./TestVerifyForm";

export default async function VerifyPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const sp = await searchParams;
  const next = safeNext(sp.next);
  const { supabase, profile } = await requireViewer(`/verify?next=${encodeURIComponent(next)}`);
  if (profile?.is_verified) redirect(next);
  const { data: testMode } = await supabase.rpc("is_test_mode");

  return (
    <main className="mx-auto max-w-md px-4 py-16 text-center">
      <h1 className="text-2xl font-bold text-ink">휴대폰 본인인증</h1>
      <p className="mt-2 text-sm leading-6 text-stone-500">
        본인 명의 휴대폰으로 한 번만 인증하면 분양글 작성과 채팅을 이용할 수 있어요. 인증 정보는 중복 가입과 재가입 방지에만 사용돼요.
      </p>
      {testMode ? (
        <TestVerifyForm next={next} />
      ) : (
        <div className="mt-8 rounded-2xl border border-dashed border-stone-300 bg-white p-6 text-sm text-stone-500">
          본인인증 서비스 연결을 준비하고 있어요.
        </div>
      )}
      <Link href={next} className="mt-6 inline-block text-sm text-stone-400 underline">
        돌아가기
      </Link>
    </main>
  );
}
