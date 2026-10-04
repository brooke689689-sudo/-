import Link from "next/link";
import { logout } from "@/app/login/actions";
import { requireViewer } from "@/lib/auth";
import { dateLabel } from "@/lib/format";
import { ProfileForm } from "./ProfileForm";

const SANCTION_LABEL = { warning: "경고", suspend_7d: "7일 이용 정지", ban: "영구 정지" } as const;

export default async function MePage() {
  const { supabase, user, profile } = await requireViewer("/me");
  const [{ data: status }, { data: sanctions }] = await Promise.all([
    supabase.from("account_status").select("status, suspended_until, warning_count").eq("user_id", user.id).maybeSingle(),
    supabase.from("sanctions").select("id, type, reason, starts_at, ends_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(10),
  ]);
  const suspended = status?.status === "suspended" && status.suspended_until && status.suspended_until > new Date().toISOString();

  return (
    <div className="space-y-8">
      {(status?.status === "banned" || suspended) && (
        <p className="rounded-xl bg-red-50 p-4 text-sm leading-6 text-red-700">
          {status?.status === "banned"
            ? "운영 정책 위반으로 영구 정지된 계정이에요. 글 작성과 채팅을 이용할 수 없어요."
            : `운영 정책 위반으로 ${dateLabel(status!.suspended_until!, true)}까지 이용이 정지됐어요.`}
        </p>
      )}

      <section className="rounded-2xl border border-stone-200 bg-white p-5">
        <h2 className="font-bold text-stone-900">계정</h2>
        <dl className="mt-3 space-y-2 text-sm">
          <div className="flex gap-3">
            <dt className="w-24 text-stone-500">로그인</dt>
            <dd className="text-stone-800">{user.email ?? `${user.app_metadata.provider ?? ""} 계정`}</dd>
          </div>
          <div className="flex gap-3">
            <dt className="w-24 text-stone-500">본인인증</dt>
            <dd>
              {profile?.is_verified ? (
                <span className="font-semibold text-emerald-700">인증 완료</span>
              ) : (
                <Link href="/verify?next=/me" className="font-semibold text-brand-dark underline">
                  인증하기
                </Link>
              )}
            </dd>
          </div>
          <div className="flex gap-3">
            <dt className="w-24 text-stone-500">경고</dt>
            <dd className="text-stone-800">{status?.warning_count ?? 0}회</dd>
          </div>
        </dl>
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white p-5">
        <h2 className="mb-4 font-bold text-stone-900">프로필</h2>
        <ProfileForm nickname={profile?.nickname ?? ""} purpose={profile?.primary_purpose ?? null} />
      </section>

      {!!sanctions?.length && (
        <section className="rounded-2xl border border-stone-200 bg-white p-5">
          <h2 className="font-bold text-stone-900">제재 이력</h2>
          <ul className="mt-3 divide-y divide-stone-100 text-sm">
            {sanctions.map((s) => (
              <li key={s.id} className="py-2">
                <span className="font-semibold text-red-600">{SANCTION_LABEL[s.type]}</span>{" "}
                <span className="text-stone-700">{s.reason}</span>
                <span className="ml-2 text-xs text-stone-400">{dateLabel(s.starts_at)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="flex items-center justify-between text-sm">
        <form action={logout}>
          <button type="submit" className="rounded-lg border border-stone-200 bg-white px-4 py-2 text-stone-600">
            로그아웃
          </button>
        </form>
        <Link href="/me/withdraw" className="text-stone-400 underline">
          회원 탈퇴
        </Link>
      </div>
    </div>
  );
}
