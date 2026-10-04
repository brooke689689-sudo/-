import { redirect } from "next/navigation";
import { requireViewer, safeNext } from "@/lib/auth";
import { WelcomeForm } from "./WelcomeForm";

export default async function WelcomePage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const sp = await searchParams;
  const next = safeNext(sp.next);
  const { profile } = await requireViewer("/welcome");
  if (profile?.onboarded_at) redirect(next);

  return (
    <main className="mx-auto max-w-md px-4 py-10">
      <h1 className="text-2xl font-bold text-ink">반가워요!</h1>
      <p className="mt-1 text-sm text-stone-500">안아줌을 이용하기 전에 몇 가지만 정해주세요.</p>
      <div className="mt-8">
        <WelcomeForm next={next} />
      </div>
    </main>
  );
}
