import Link from "next/link";
import { logout } from "@/app/login/actions";
import { getViewer } from "@/lib/auth";

export async function SiteHeader() {
  const { supabase, user, profile } = await getViewer();
  const { data: testMode } = await supabase.rpc("is_test_mode");

  return (
    <header className="sticky top-0 z-30 bg-white">
      <p className={`px-4 py-1.5 text-center text-xs font-semibold ${testMode ? "bg-[#1c2744] text-white" : "bg-[#1c2744] text-white"}`}>
        {testMode ? "테스트 운영 중이에요. 실제 결제와 본인인증은 이루어지지 않아요." : "안아줌은 무료 분양만 연결해요."}
      </p>
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-4">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <img src="/icon-128.png" alt="" className="h-10 w-10" />
          <span className="text-3xl font-black tracking-tight text-[#ff6a00]">안아줌</span>
        </Link>
        <form action="/" className="flex min-w-0 flex-1 items-center">
          <div className="flex h-12 min-w-0 flex-1 items-center rounded-full border border-stone-200 bg-white pr-1 pl-5 shadow-sm">
            <input
              name="q"
              aria-label="분양글 검색"
              placeholder="원하는 아이를 검색해 보세요"
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-stone-400"
            />
            <span className="mx-2 hidden text-stone-300 sm:block" aria-hidden>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M4 7h16M4 12h16M4 17h10" />
              </svg>
            </span>
            <button type="submit" className="h-10 shrink-0 rounded-full bg-[#ff6a00] px-5 text-sm font-bold text-white">
              검색
            </button>
          </div>
        </form>
        <div className="hidden shrink-0 flex-col items-end gap-2 sm:flex">
          <div className="flex items-center gap-2 text-xs text-stone-500">
            {user ? (
              <>
                <span className="max-w-24 truncate font-semibold text-stone-700">{profile?.nickname ?? "보호자"}</span>
                <span className="text-stone-300">|</span>
                <form action={logout}>
                  <button type="submit" className="hover:text-[#ff6a00]">
                    로그아웃
                  </button>
                </form>
              </>
            ) : (
              <>
                <Link href="/login" className="hover:text-[#ff6a00]">
                  로그인
                </Link>
                <span className="text-stone-300">|</span>
                <Link href="/login" className="hover:text-[#ff6a00]">
                  회원가입
                </Link>
              </>
            )}
            <span className="text-stone-300">|</span>
            <Link href="/policy/faq" className="hover:text-[#ff6a00]">
              고객센터
            </Link>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-stone-500">
            <Link href="/chats" className="flex flex-col items-center gap-0.5 hover:text-[#ff6a00]">
              <ChatIcon />
              채팅
            </Link>
            <Link href="/me" className="flex flex-col items-center gap-0.5 hover:text-[#ff6a00]">
              <UserIcon />
              마이페이지
            </Link>
          </div>
        </div>
        <Link href={user ? "/me" : "/login"} className="shrink-0 text-sm font-bold text-[#ff6a00] sm:hidden">
          {user ? "내 정보" : "로그인"}
        </Link>
      </div>
    </header>
  );
}

function ChatIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
      <path d="M6 16.5 4 20l4.2-1.4A8 8 0 1 0 6 16.5Z" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
      <circle cx="12" cy="8" r="3.2" />
      <path d="M5 19.2c1.4-3 3.8-4.4 7-4.4s5.6 1.4 7 4.4" />
    </svg>
  );
}
