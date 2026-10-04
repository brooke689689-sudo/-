import Link from "next/link";

export function AuthShell({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto max-w-sm px-4 py-12">
      <div className="text-center">
        <img src="/icon-128.png" alt="" className="mx-auto h-16 w-16" />
        <h1 className="mt-3 text-2xl font-bold text-ink">{title}</h1>
        {description && <p className="mt-2 text-sm leading-6 text-stone-500">{description}</p>}
      </div>
      <div className="mt-8">{children}</div>
      <p className="mt-6 text-center text-sm">
        <Link href="/login" className="text-stone-500 underline">
          로그인으로 돌아가기
        </Link>
      </p>
    </main>
  );
}
