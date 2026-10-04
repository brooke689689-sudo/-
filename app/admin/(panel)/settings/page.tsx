import { requireAdmin } from "@/lib/admin";
import { addBannedWord, addBreed, deleteBannedWord, setTestMode, toggleBreedFlag } from "../../actions";

const FLAGS = [
  ["is_cites", "멸종위기"],
  ["requires_review", "검토"],
  ["is_banned", "금지"],
] as const;

export default async function AdminSettings({ searchParams }: { searchParams: Promise<{ c?: string }> }) {
  const sp = await searchParams;
  const { supabase } = await requireAdmin();
  const [{ data: categories }, { data: words }, { data: testMode }] = await Promise.all([
    supabase.from("categories").select("id, name").order("sort_order"),
    supabase.from("banned_words").select("id, pattern, is_regex, action, scope, label").order("id"),
    supabase.rpc("is_test_mode"),
  ]);
  const categoryId = Number(sp.c) || categories?.[0]?.id || 1;
  const { data: breeds } = await supabase
    .from("breeds")
    .select("id, name, is_cites, is_banned, requires_review")
    .eq("category_id", categoryId)
    .order("sort_order");

  return (
    <div className="space-y-6">
      <section className={`rounded-2xl border p-5 ${testMode ? "border-amber-300 bg-amber-50" : "border-stone-200 bg-white"}`}>
        <h2 className="font-bold text-stone-900">테스트 모드 {testMode ? "켜짐" : "꺼짐"}</h2>
        <p className="mt-1 text-sm leading-6 text-stone-600">
          켜져 있으면 누구나 실제 인증·결제 없이 본인인증과 구독을 할 수 있어요. PortOne 연결 후 정식 출시 전에 반드시 꺼주세요.
        </p>
        <form action={setTestMode} className="mt-3">
          <input type="hidden" name="value" value={testMode ? "0" : "1"} />
          <button type="submit" className={`h-10 rounded-lg px-4 text-sm font-bold text-white ${testMode ? "bg-red-600" : "bg-stone-500"}`}>
            {testMode ? "테스트 모드 끄기" : "테스트 모드 켜기"}
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white p-5">
        <h2 className="font-bold text-stone-900">금지어</h2>
        <p className="text-xs text-stone-400">차단은 저장·전송 자체를 막고, 경고는 글을 검토 대기로 보내거나 채팅에 주의 안내를 띄워요.</p>
        <form action={addBannedWord} className="mt-3 flex flex-wrap gap-1.5 text-sm">
          <input name="pattern" required placeholder="단어 또는 정규식" className="h-9 w-48 rounded-lg border border-stone-200 px-2" />
          <input name="label" required placeholder="분류 (예: 금전 요구)" className="h-9 w-36 rounded-lg border border-stone-200 px-2" />
          <select name="action" className="h-9 rounded-lg border border-stone-200 px-2">
            <option value="warn">경고</option>
            <option value="block">차단</option>
          </select>
          <select name="scope" className="h-9 rounded-lg border border-stone-200 px-2">
            <option value="all">글+채팅</option>
            <option value="post">글만</option>
            <option value="chat">채팅만</option>
          </select>
          <label className="flex items-center gap-1 text-xs text-stone-600">
            <input type="checkbox" name="is_regex" /> 정규식
          </label>
          <button type="submit" className="h-9 rounded-lg bg-ink px-3 font-semibold text-white">
            추가
          </button>
        </form>
        <table className="mt-4 w-full text-sm">
          <tbody>
            {words?.map((w) => (
              <tr key={w.id} className="border-t border-stone-100">
                <td className="py-1.5 font-mono text-xs">{w.pattern}</td>
                <td className="py-1.5 text-xs text-stone-500">{w.is_regex ? "정규식" : "단어"}</td>
                <td className="py-1.5 text-xs">{w.label}</td>
                <td className={`py-1.5 text-xs font-semibold ${w.action === "block" ? "text-red-600" : "text-amber-600"}`}>{w.action === "block" ? "차단" : "경고"}</td>
                <td className="py-1.5 text-xs text-stone-500">{w.scope}</td>
                <td className="py-1.5 text-right">
                  <form action={deleteBannedWord}>
                    <input type="hidden" name="word" value={w.id} />
                    <button type="submit" className="text-xs text-stone-400 hover:text-red-600">
                      삭제
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white p-5">
        <h2 className="font-bold text-stone-900">세부 종</h2>
        <div className="mt-3 flex flex-wrap gap-1.5 text-sm">
          {categories?.map((c) => (
            <a key={c.id} href={`/admin/settings?c=${c.id}`} className={`rounded-full px-3 py-1 font-semibold ${c.id === categoryId ? "bg-ink text-white" : "bg-stone-100 text-stone-600"}`}>
              {c.name}
            </a>
          ))}
        </div>
        <form action={addBreed} className="mt-3 flex flex-wrap items-center gap-1.5 text-sm">
          <input type="hidden" name="category" value={categoryId} />
          <input name="name" required placeholder="새 세부 종" className="h-9 w-48 rounded-lg border border-stone-200 px-2" />
          {FLAGS.map(([k, label]) => (
            <label key={k} className="flex items-center gap-1 text-xs text-stone-600">
              <input type="checkbox" name={k} /> {label}
            </label>
          ))}
          <button type="submit" className="h-9 rounded-lg bg-ink px-3 font-semibold text-white">
            추가
          </button>
        </form>
        <table className="mt-4 w-full text-sm">
          <tbody>
            {breeds?.map((b) => (
              <tr key={b.id} className="border-t border-stone-100">
                <td className="py-1.5">{b.name}</td>
                {FLAGS.map(([k, label]) => (
                  <td key={k} className="py-1.5 text-right">
                    <form action={toggleBreedFlag}>
                      <input type="hidden" name="breed" value={b.id} />
                      <input type="hidden" name="flag" value={k} />
                      <input type="hidden" name="value" value={b[k] ? "0" : "1"} />
                      <button
                        type="submit"
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${b[k] ? (k === "is_banned" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-800") : "bg-stone-100 text-stone-400"}`}
                      >
                        {label}
                      </button>
                    </form>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
