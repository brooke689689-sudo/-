import { requireViewer } from "@/lib/auth";
import { WithdrawForm } from "./WithdrawForm";

export default async function WithdrawPage() {
  await requireViewer("/me/withdraw");
  return (
    <div className="mx-auto max-w-md">
      <h2 className="text-xl font-bold text-stone-900">회원 탈퇴</h2>
      <ul className="mt-4 list-disc space-y-1.5 pl-5 text-sm leading-6 text-stone-600">
        <li>올린 분양글은 모두 삭제되고, 찜 목록이 지워져요.</li>
        <li>구독 중이라면 다음 결제부터 멈춰요. 남은 기간에 대한 환불은 없어요.</li>
        <li>채팅 기록은 분쟁 대응을 위해 6개월간 보관한 뒤 삭제해요.</li>
        <li>결제 기록은 전자상거래법에 따라 5년간 보관해요.</li>
        <li>이용 제한 중 탈퇴해도 같은 명의로는 다시 가입할 수 없어요.</li>
      </ul>
      <WithdrawForm />
    </div>
  );
}
