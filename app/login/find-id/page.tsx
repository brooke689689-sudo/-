import type { Metadata } from "next";
import { AuthShell } from "../AuthShell";
import { FindIdForm } from "./FindIdForm";

export const metadata: Metadata = { title: "아이디 찾기 - 안아줌" };

export default function FindIdPage() {
  return (
    <AuthShell title="아이디 찾기" description="이메일로 인증번호를 보내요. 번호를 확인하면 아이디를 보여 드려요.">
      <FindIdForm />
    </AuthShell>
  );
}
