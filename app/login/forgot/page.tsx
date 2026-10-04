import type { Metadata } from "next";
import { AuthShell } from "../AuthShell";
import { ForgotForm } from "./ForgotForm";

export const metadata: Metadata = { title: "비밀번호 찾기 - 안아줌" };

export default function ForgotPage() {
  return (
    <AuthShell title="비밀번호 찾기" description="이메일로 받은 인증번호를 확인하면, 이 사이트에서 비밀번호를 바꿀 수 있어요.">
      <ForgotForm />
    </AuthShell>
  );
}
