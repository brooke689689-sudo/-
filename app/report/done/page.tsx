import Link from "next/link";
import { safeNext } from "@/lib/auth";

export default async function ReportDonePage({ searchParams }: { searchParams: Promise<{ back?: string }> }) {
  const { back } = await searchParams;
  return (
    <main className="mx-auto max-w-md px-4 py-16 text-center">
      <h1 className="text-2xl font-bold text-ink">신고가 접수됐어요</h1>
      <p className="mt-2 text-sm leading-6 text-stone-500">
        알려주셔서 고마워요. 운영팀이 확인 후 조치할게요. 위험하다고 느껴지면 대화를 멈추고 상대를 차단해 주세요.
      </p>
      <Link href={safeNext(back)} className="mt-8 inline-flex h-12 items-center rounded-xl bg-ink px-6 font-bold text-white">
        돌아가기
      </Link>
    </main>
  );
}
