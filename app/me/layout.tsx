import { MeTabs } from "./MeTabs";

export default function MeLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-4 text-2xl font-bold text-ink">마이페이지</h1>
      <MeTabs />
      <div className="pt-6">{children}</div>
    </main>
  );
}
