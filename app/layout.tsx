import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import "./globals.css";

export const metadata: Metadata = {
  title: "안아줌 - 무료 분양·입양",
  description: "버려지는 아이가 없도록, 개인 간 무료 분양·입양을 안전하게 연결합니다.",
  icons: { icon: "/icon-128.png", apple: "/icon-512.png" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>
      <body className="min-h-screen bg-white">
        <SiteHeader />
        {children}
        <footer className="mt-16 border-t border-stone-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-8 text-xs leading-6 text-stone-500">
            <p className="font-semibold text-stone-700">안아줌은 무료 분양만 허용합니다.</p>
            <p>분양비·책임비 등 금전 요구, 계좌번호 전송은 금지되며 적발 시 이용이 제한됩니다.</p>
            <div className="mt-3 flex flex-wrap gap-x-4">
              <Link href="/policy/terms">이용약관</Link>
              <Link href="/policy/privacy" className="font-semibold">개인정보처리방침</Link>
              <Link href="/policy/refund">환불정책</Link>
              <Link href="/policy/principles">무료분양 원칙</Link>
              <Link href="/policy/faq">자주 묻는 질문</Link>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
