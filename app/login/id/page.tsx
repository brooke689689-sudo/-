import type { Metadata } from "next";
import Link from "next/link";
import { getViewer } from "@/lib/auth";
import { AuthShell } from "../AuthShell";

export const metadata: Metadata = { title: "아이디 안내 - 안아줌" };

export default async function FoundIdPage() {
  const { user } = await getViewer();

  if (!user?.email) {
    return (
      <AuthShell title="아이디 안내" description="메일 인증이 끝나야 아이디를 보여 드릴 수 있어요.">
        <Link href="/login/find-id" className="block h-12 rounded-xl bg-ink text-center leading-[3rem] font-bold text-white">
          아이디 찾기
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="아이디 안내" description="메일 인증이 완료됐어요. 아래 주소가 로그인 아이디예요.">
      <p className="rounded-2xl bg-white px-4 py-6 text-center text-lg font-bold break-all text-ink">{user.email}</p>
      <Link href="/" className="mt-3 block h-12 rounded-xl bg-ink text-center leading-[3rem] font-bold text-white">
        안아줌으로 가기
      </Link>
    </AuthShell>
  );
}
