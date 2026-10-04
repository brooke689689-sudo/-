import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-md px-4 py-20 text-center">
      <h1 className="text-2xl font-bold text-ink">페이지를 찾을 수 없어요</h1>
      <p className="mt-2 text-sm text-stone-500">주소가 바뀌었거나 삭제된 페이지예요.</p>
      <Link href="/" className="mt-6 inline-flex h-11 items-center rounded-xl bg-ink px-5 text-sm font-bold text-white">
        홈으로
      </Link>
    </main>
  );
}
