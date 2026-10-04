import { redirect } from "next/navigation";
import { getViewer, safeNext } from "@/lib/auth";
import { oauthLogin } from "./actions";
import { EmailForm } from "./EmailForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const sp = await searchParams;
  const next = safeNext(sp.next);
  const { user } = await getViewer();
  if (user) redirect(next);

  return (
    <main className="mx-auto max-w-sm px-4 py-12">
      <div className="text-center">
        <img src="/icon-128.png" alt="" className="mx-auto h-16 w-16" />
        <h1 className="mt-3 text-2xl font-bold text-ink">안아줌 시작하기</h1>
        <p className="mt-1 text-sm text-stone-500">가입은 무료예요. 분양글 열람과 찜은 바로 할 수 있어요.</p>
      </div>

      {sp.error && (
        <p className="mt-6 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {sp.error === "provider"
            ? "해당 로그인 방식은 준비 중이에요. 이메일로 가입해 주세요."
            : sp.error === "withdrawn"
              ? "탈퇴한 계정이에요."
              : "로그인을 완료하지 못했어요. 다시 시도해 주세요."}
        </p>
      )}

      <div className="mt-8 space-y-2">
        <form action={oauthLogin}>
          <input type="hidden" name="provider" value="kakao" />
          <input type="hidden" name="next" value={next} />
          <button type="submit" className="h-12 w-full rounded-xl bg-[#FEE500] font-bold text-[#191919]">
            카카오로 시작하기
          </button>
        </form>
        <form action={oauthLogin}>
          <input type="hidden" name="provider" value="naver" />
          <input type="hidden" name="next" value={next} />
          <button type="submit" className="h-12 w-full rounded-xl bg-[#03C75A] font-bold text-white">
            네이버로 시작하기
          </button>
        </form>
      </div>

      <div className="my-6 flex items-center gap-3 text-xs text-stone-400">
        <span className="h-px flex-1 bg-stone-200" />또는<span className="h-px flex-1 bg-stone-200" />
      </div>

      <EmailForm next={next} />

      <p className="mt-6 text-center text-xs leading-5 text-stone-400">
        채팅을 하려면 가입 후 휴대폰 본인인증이 필요해요.
      </p>
    </main>
  );
}
