"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function MfaForm({ factorId: existingFactor }: { factorId: string | null }) {
  const [factorId, setFactorId] = useState(existingFactor);
  const [qr, setQr] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (existingFactor) return;
    const supabase = createClient();
    (async () => {
      const { data: list } = await supabase.auth.mfa.listFactors();
      for (const f of list?.all ?? []) {
        if (f.factor_type === "totp" && f.status === "unverified") await supabase.auth.mfa.unenroll({ factorId: f.id });
      }
      const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp", friendlyName: "안아줌 관리자" });
      if (error || !data) return setError("인증 앱 등록을 시작하지 못했어요. 새로고침해 주세요.");
      setFactorId(data.id);
      setQr(data.totp.qr_code);
      setSecret(data.totp.secret);
    })();
  }, [existingFactor]);

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    if (!factorId || !/^\d{6}$/.test(code)) return setError("6자리 숫자를 입력해 주세요.");
    setPending(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId, code });
    setPending(false);
    if (error) {
      setCode("");
      return setError(error.code === "over_request_rate_limit" ? "시도가 너무 많아요. 잠시 후 다시 해주세요." : "코드가 맞지 않아요.");
    }
    window.location.href = "/admin";
  }

  return (
    <form onSubmit={verify} className="mt-8 space-y-4">
      {!existingFactor && (
        <div className="rounded-2xl border border-stone-200 bg-white p-4 text-center">
          {qr ? <img src={qr} alt="인증 앱 등록 QR 코드" className="mx-auto h-48 w-48" /> : <div className="mx-auto h-48 w-48 animate-pulse rounded bg-stone-100" />}
          {secret && <p className="mt-2 break-all font-mono text-xs text-stone-500">{secret}</p>}
        </div>
      )}
      <input
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
        inputMode="numeric"
        autoComplete="one-time-code"
        placeholder="000000"
        className="h-14 w-full rounded-xl border border-stone-200 bg-white text-center font-mono text-2xl tracking-[0.5em] outline-none focus:border-ink"
      />
      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <button type="submit" disabled={pending || !factorId} className="h-12 w-full rounded-xl bg-ink font-bold text-white disabled:opacity-60">
        {pending ? "확인 중" : "확인"}
      </button>
    </form>
  );
}
