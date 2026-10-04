import type { Metadata } from "next";
import Link from "next/link";
import { getViewer } from "@/lib/auth";
import { AuthShell } from "../AuthShell";
import { ResetForm } from "./ResetForm";

export const metadata: Metadata = { title: "비밀번호 재설정 - 안아줌" };

export default async function ResetPage() {
  const { user } = await getViewer();

  if (!user) {
    return (
      <AuthShell title="비밀번호 재설정" description="메일 인증이 끝나야 비밀번호를 바꿀 수 있어요.">
        <Link href="/login/forgot" className="block h-12 rounded-xl bg-ink text-center leading-[3rem] font-bold text-white">
          비밀번호 찾기
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="비밀번호 재설정" description="메일 인증이 완료됐어요. 새 비밀번호를 입력해 주세요.">
      <ResetForm />
    </AuthShell>
  );
}
