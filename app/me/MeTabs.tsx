"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/me", label: "내 정보" },
  { href: "/me/posts", label: "내 분양글" },
  { href: "/me/favorites", label: "찜" },
  { href: "/me/subscription", label: "구독·결제" },
];

export function MeTabs() {
  const path = usePathname();
  return (
    <nav className="-mx-4 flex gap-1 overflow-x-auto border-b border-stone-200 px-4">
      {TABS.map((t) => {
        const active = path === t.href;
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`shrink-0 border-b-2 px-3 py-3 text-sm font-semibold ${
              active ? "border-ink text-ink" : "border-transparent text-stone-400 hover:text-stone-600"
            }`}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
