"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function Modal({ closeHref, children }: { closeHref: string; children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    const close = (e: KeyboardEvent) => {
      if (e.key === "Escape") router.push(closeHref, { scroll: false });
    };
    window.addEventListener("keydown", close);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", close);
      document.body.style.overflow = prev;
    };
  }, [closeHref, router]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-6"
      onClick={(e) => {
        if (e.target === e.currentTarget) router.push(closeHref, { scroll: false });
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="relative max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:max-w-3xl sm:rounded-3xl"
      >
        <button
          type="button"
          aria-label="닫기"
          onClick={() => router.push(closeHref, { scroll: false })}
          className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-xl text-stone-600 shadow hover:bg-white"
        >
          ×
        </button>
        {children}
      </div>
    </div>
  );
}
