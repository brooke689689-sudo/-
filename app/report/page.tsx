import Link from "next/link";
import { notFound } from "next/navigation";
import { requireViewer } from "@/lib/auth";
import { REPORT_REASONS } from "@/lib/report";
import { ReportForm } from "./ReportForm";

type Search = { post?: string; message?: string; user?: string; room?: string };

export default async function ReportPage({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams;
  const qs = new URLSearchParams(Object.entries(sp).filter(([, v]) => typeof v === "string") as [string, string][]);
  await requireViewer(`/report?${qs}`);

  const uuid = (v?: string) => (v && /^[0-9a-f-]{36}$/i.test(v) ? v : undefined);
  const target = {
    post: uuid(sp.post),
    message: sp.message && /^\d+$/.test(sp.message) ? sp.message : undefined,
    user: uuid(sp.user),
  };
  if (!target.post && !target.message && !target.user) notFound();
  const room = uuid(sp.room);
  const back = target.post ? `/?pet=${target.post}` : room ? `/chats/${room}` : "/";
  const label = target.post ? "분양글" : target.message ? "메시지" : "회원";

  return (
    <main className="mx-auto max-w-md px-4 py-10">
      <h1 className="text-2xl font-bold text-ink">{label} 신고</h1>
      <p className="mt-2 text-sm leading-6 text-stone-500">
        신고 내용은 상대방에게 알려지지 않아요. 확인 후 경고·이용 정지 등 조치하고, 금전 요구가 확인되면 즉시 영구정지해요.
      </p>
      <ReportForm reasons={REPORT_REASONS} target={target} back={back} />
      <Link href={back} className="mt-4 block text-center text-sm text-stone-400 underline">
        취소
      </Link>
    </main>
  );
}
