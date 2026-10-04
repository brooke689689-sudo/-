import { sanctionUser } from "../actions";

export function SanctionButtons({ userId, reportId, defaultReason }: { userId: string; reportId?: string; defaultReason?: string }) {
  return (
    <form action={sanctionUser} className="flex flex-wrap items-center gap-1.5">
      <input type="hidden" name="user" value={userId} />
      {reportId && <input type="hidden" name="report" value={reportId} />}
      <input
        name="reason"
        defaultValue={defaultReason}
        placeholder="제재 사유"
        className="h-8 w-40 rounded-lg border border-stone-200 px-2 text-xs outline-none focus:border-ink"
      />
      <button type="submit" name="severe" value="0" className="h-8 rounded-lg bg-amber-500 px-2.5 text-xs font-bold text-white">
        위반 1회 (경고→정지→영구)
      </button>
      <button type="submit" name="severe" value="1" className="h-8 rounded-lg bg-red-600 px-2.5 text-xs font-bold text-white">
        즉시 영구정지
      </button>
    </form>
  );
}
