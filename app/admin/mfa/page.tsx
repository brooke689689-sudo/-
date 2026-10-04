import { notFound, redirect } from "next/navigation";
import { getViewer } from "@/lib/auth";
import { MfaForm } from "./MfaForm";

export default async function AdminMfaPage() {
  const { supabase, user } = await getViewer();
  if (!user) redirect("/login?next=/admin");
  const { data: status } = await supabase.from("account_status").select("is_admin").eq("user_id", user.id).maybeSingle();
  if (!status?.is_admin) notFound();
  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal?.currentLevel === "aal2") redirect("/admin");
  const { data: factors } = await supabase.auth.mfa.listFactors();
  const totp = factors?.totp?.[0];

  return (
    <main className="mx-auto max-w-sm px-4 py-16">
      <h1 className="text-center text-2xl font-bold text-ink">관리자 2단계 인증</h1>
      <p className="mt-2 text-center text-sm leading-6 text-stone-500">
        {totp
          ? "인증 앱(Google Authenticator 등)에 표시된 6자리 코드를 입력해 주세요."
          : "처음 한 번 인증 앱을 등록해야 해요. QR 코드를 인증 앱으로 스캔해 주세요."}
      </p>
      <MfaForm factorId={totp?.id ?? null} />
    </main>
  );
}
