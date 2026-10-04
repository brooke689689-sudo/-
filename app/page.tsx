import Link from "next/link";
import { AnimalMark } from "@/components/AnimalMark";
import { AutoSelect } from "@/components/AutoSelect";
import { Modal } from "@/components/Modal";
import { PetDetail } from "@/components/PetDetail";
import { PAGE_SIZE, publicMediaUrl } from "@/lib/config";
import { SIDO, timeAgo } from "@/lib/format";
import { getViewer } from "@/lib/auth";
import { getPost, listPosts, type CardPost } from "@/lib/posts";

type Search = Record<string, string | string[] | undefined>;

function one(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

export default async function Home({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams;
  const { supabase } = await getViewer();

  const { data: categories } = await supabase.from("categories").select("id, slug, name").order("sort_order");
  const query = one(sp.q)?.trim();
  const requested = one(sp.c);
  const category = requested
    ? categories?.find((c) => c.slug === requested)
    : query
      ? undefined
      : categories?.find((c) => c.slug === "dog");
  const sido = SIDO.find((s) => s === one(sp.sido));
  const sexParam = one(sp.sex);
  const sex = sexParam === "male" || sexParam === "female" ? sexParam : undefined;
  const listing = one(sp.listing) === "all" || one(sp.listing) === "adopted" ? one(sp.listing)! : "active";
  const sort = one(sp.sort) === "view" ? "view" : "new";
  const page = Math.max(1, Number.parseInt(one(sp.page) ?? "1", 10) || 1);
  const petId = one(sp.pet);
  const showAllBreeds = one(sp.more) === "1";
  const breedParam = Number.parseInt(one(sp.breed) ?? "", 10);

  const breedQuery = category
    ? supabase.from("breeds").select("id, name").eq("category_id", category.id).eq("is_banned", false).order("sort_order")
    : Promise.resolve({ data: [] as { id: number; name: string }[] });

  const [{ data: breedRows }, { posts, total }, detail] = await Promise.all([
    breedQuery,
    listPosts(supabase, {
      categoryId: category?.id,
      breedId: Number.isFinite(breedParam) ? breedParam : undefined,
      sido,
      sex,
      includeAdopted: listing === "all",
      adoptedOnly: listing === "adopted",
      query,
      sort,
      page,
    }),
    petId ? getPost(supabase, petId) : Promise.resolve(null),
  ]);

  const breeds = breedRows ?? [];
  const breed = breeds.find((b) => b.id === breedParam);
  const visibleBreeds = showAllBreeds ? breeds : breeds.slice(0, 7);

  let favorited = false;
  let viewerId: string | null = null;
  if (detail) {
    const [, { data: auth }] = await Promise.all([
      supabase.rpc("increment_view", { p_post_id: detail.id }),
      supabase.auth.getUser(),
    ]);
    viewerId = auth.user?.id ?? null;
    if (viewerId) {
      const { data: fav } = await supabase
        .from("favorites")
        .select("post_id")
        .eq("user_id", viewerId)
        .eq("post_id", detail.id)
        .maybeSingle();
      favorited = !!fav;
    }
  }

  const base = new URLSearchParams();
  if (category) base.set("c", category.slug);
  if (breed) base.set("breed", String(breed.id));
  if (sido) base.set("sido", sido);
  if (sex) base.set("sex", sex);
  if (query) base.set("q", query);
  if (listing !== "active") base.set("listing", listing);
  if (sort !== "new") base.set("sort", sort);
  if (showAllBreeds) base.set("more", "1");
  if (page > 1) base.set("page", String(page));

  const withParams = (patch: Record<string, string | null>) => {
    const p = new URLSearchParams(base);
    for (const [k, v] of Object.entries(patch)) {
      if (v === null) p.delete(k);
      else p.set(k, v);
    }
    const s = p.toString();
    return s ? `/?${s}` : "/";
  };
  const petHref = (id: string) => withParams({ pet: id });
  const closeHref = withParams({});
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const shown = posts;

  const listings = [
    { id: "all", label: "전체", icon: "paw" },
    { id: "active", label: "분양중", icon: "heart" },
    { id: "adopted", label: "분양완료", icon: "paw" },
  ] as const;

  return (
    <div>
      <section className="border-b border-stone-100 bg-white">
        <div className="mx-auto max-w-7xl px-4 pt-2 pb-5">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <details className="group relative">
              <summary className="flex h-10 cursor-pointer list-none items-center gap-2 rounded-full bg-[#ff6a00] px-4 text-sm font-bold text-white">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
                  <path d="M4 7h16M4 12h16M4 17h16" />
                </svg>
                분양 카테고리
              </summary>
              <div className="absolute z-20 mt-2 w-44 rounded-2xl border border-stone-200 bg-white p-2 shadow-lg">
                {(categories ?? []).map((c) => (
                  <Link
                    key={c.slug}
                    href={withParams({ c: c.slug, breed: null, page: null, more: null })}
                    className="block rounded-xl px-3 py-2 text-sm font-semibold text-stone-700 hover:bg-orange-50 hover:text-[#ff6a00]"
                  >
                    {c.name}
                  </Link>
                ))}
              </div>
            </details>
            <nav className="flex flex-wrap items-center gap-5 text-sm font-bold text-stone-800">
              <Link href={withParams({ c: "dog", breed: null, page: null, q: null })} className="hover:text-[#ff6a00]">
                강아지분양
              </Link>
              <Link href={withParams({ c: "cat", breed: null, page: null, q: null })} className="hover:text-[#ff6a00]">
                고양이분양
              </Link>
              <Link href="/chats" className="hover:text-[#ff6a00]">
                채팅
              </Link>
              <Link href="/me/favorites" className="hover:text-[#ff6a00]">
                찜
              </Link>
            </nav>
            <div className="ml-auto flex gap-2">
              <Link href="/me/posts" className="hidden h-10 items-center rounded-full border border-[#ff6a00] px-4 text-sm font-bold text-[#ff6a00] sm:inline-flex">
                내 글
              </Link>
              <Link href="/posts/new" className="inline-flex h-10 items-center rounded-full border border-[#ff6a00] px-4 text-sm font-bold text-[#ff6a00]">
                글 올리기
              </Link>
            </div>
          </div>

          <nav className="mt-6 flex items-end gap-3 overflow-x-auto pb-2" aria-label="동물 분류">
            {(categories ?? []).map((c) => {
              const active = category?.slug === c.slug;
              return (
                <Link key={c.slug} href={withParams({ c: c.slug, breed: null, page: null, more: null })} className="flex w-[92px] shrink-0 flex-col items-center gap-2">
                  <span className={`flex items-center justify-center rounded-full ${active ? "h-[92px] w-[92px] bg-[#ff7a18] shadow-md" : "h-[78px] w-[78px] bg-white"}`}>
                    <AnimalMark slug={c.slug} />
                  </span>
                  <span className={`text-sm font-bold ${active ? "text-[#ff6a00]" : "text-stone-500"}`}>{c.name}</span>
                </Link>
              );
            })}
          </nav>

          {breeds.length > 0 && (
            <div className="mt-5 flex items-center gap-3 overflow-x-auto">
              <span className="flex shrink-0 items-center gap-2 text-sm font-black text-stone-900">
                <span className="h-4 w-1 rounded-full bg-[#ff6a00]" />
                품종 탐색
              </span>
              <Link
                href={withParams({ breed: null, page: null })}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold ${breed ? "bg-stone-100 text-stone-600" : "bg-[#ff6a00] text-white"}`}
              >
                전체
              </Link>
              {visibleBreeds.map((b) => (
                <Link
                  key={b.id}
                  href={withParams({ breed: String(b.id), page: null })}
                  className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold ${breed?.id === b.id ? "bg-[#ff6a00] text-white" : "bg-stone-100 text-stone-600 hover:bg-orange-50"}`}
                >
                  {b.name}
                </Link>
              ))}
              {breeds.length > 7 && (
                <Link
                  href={withParams({ more: showAllBreeds ? null : "1", page: null })}
                  className="ml-auto shrink-0 rounded-full border border-[#ffb27a] px-4 py-2 text-sm font-bold text-[#ff6a00]"
                >
                  {showAllBreeds ? "접기" : "전체보기"}
                </Link>
              )}
            </div>
          )}

          <form method="get" action="/" className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3">
            {category && <input type="hidden" name="c" value={category.slug} />}
            {breed && <input type="hidden" name="breed" value={breed.id} />}
            {query && <input type="hidden" name="q" value={query} />}
            {showAllBreeds && <input type="hidden" name="more" value="1" />}
            <div className="flex flex-wrap items-center gap-4 text-sm font-bold">
              {listings.map((item) => {
                const active = listing === item.id;
                return (
                  <Link
                    key={item.id}
                    href={withParams({ listing: item.id === "active" ? null : item.id, page: null })}
                    className={`inline-flex items-center gap-1.5 ${active ? "text-[#ff6a00]" : "text-stone-400"}`}
                  >
                    {item.icon === "heart" ? <Heart active={active} /> : <Paw active={active} />}
                    {item.label}
                  </Link>
                );
              })}
            </div>
            <AutoSelect name="sido" defaultValue={sido ?? ""} className="h-10 rounded-lg border border-stone-200 bg-white px-3 text-sm text-stone-600">
              <option value="">지역</option>
              {SIDO.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </AutoSelect>
            <AutoSelect name="sex" defaultValue={sex ?? ""} className="h-10 rounded-lg border border-stone-200 bg-white px-3 text-sm text-stone-600">
              <option value="">성별</option>
              <option value="male">수컷</option>
              <option value="female">암컷</option>
            </AutoSelect>
            <AutoSelect name="sort" defaultValue={sort} className="ml-auto h-10 rounded-lg border border-stone-200 bg-white px-3 text-sm text-stone-600">
              <option value="new">최신순</option>
              <option value="view">조회순</option>
            </AutoSelect>
          </form>
        </div>
      </section>

      <main className="bg-[#f6f6f6]">
        <div className="mx-auto max-w-7xl px-4 py-8">
          <p className="text-xs font-black tracking-[0.18em] text-[#ff6a00]">TOP RECOMMENDATION</p>
          <h1 className="mt-1 flex items-center gap-2 text-2xl font-black text-stone-900">
            <Heart active />
            가장 추천하는 분양글이에요
          </h1>
          {shown.length === 0 ? (
            <div className="mt-6 rounded-3xl bg-white py-20 text-center">
              <p className="font-bold text-stone-700">조건에 맞는 아이가 아직 없어요</p>
              <Link href="/posts/new" className="mt-4 inline-block rounded-full bg-[#ff6a00] px-5 py-2.5 text-sm font-bold text-white">
                글 올리기
              </Link>
            </div>
          ) : (
            <>
              <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-4">
                {shown.map((post) => (
                  <Link key={post.id} href={petHref(post.id)} scroll={false} className="overflow-hidden rounded-2xl bg-white shadow-sm">
                    <div className="aspect-[4/3] bg-stone-200">
                      <Thumb post={post} />
                    </div>
                    <div className="px-3 pt-3 pb-3.5">
                      <div className="flex items-center gap-2">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-pink-100 text-xs text-pink-400">☺</span>
                        <span className="min-w-0 flex-1 truncate text-xs text-stone-500">{authorName(post)}</span>
                        <span className="shrink-0 text-xs text-stone-400">{timeAgo(post.created_at)}</span>
                      </div>
                      <p className="mt-2 line-clamp-2 text-base font-black leading-snug text-stone-950">{post.title}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <span className="rounded-md bg-pink-50 px-1.5 py-0.5 text-[11px] font-bold text-pink-500">무료분양</span>
                        <span className="text-xs font-semibold text-stone-600">{post.breeds?.name ?? post.breed_text ?? post.categories?.name}</span>
                      </div>
                      <p className="mt-1 text-xs text-stone-500">
                        {post.region_sido} {post.region_sigungu}
                        {post.pet_name ? ` · ${post.pet_name}` : ""}
                      </p>
                      <p className="mt-2 flex items-center gap-3 text-xs text-stone-400">
                        <span>♡ {post.favorite_count}</span>
                        <span>조회 {post.view_count}</span>
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}

          {totalPages > 1 && (
            <nav className="mt-8 flex flex-wrap justify-center gap-1" aria-label="페이지">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((n) => n === 1 || n === totalPages || Math.abs(n - page) <= 2)
                .map((n, i, arr) => (
                  <span key={n} className="flex items-center gap-1">
                    {i > 0 && n - arr[i - 1] > 1 && <span className="px-1 text-stone-400">…</span>}
                    <Link
                      href={withParams({ page: n === 1 ? null : String(n) })}
                      className={`flex h-9 min-w-9 items-center justify-center rounded-lg px-2 text-sm font-semibold ${
                        n === page ? "bg-[#ff6a00] text-white" : "bg-white text-stone-600"
                      }`}
                    >
                      {n}
                    </Link>
                  </span>
                ))}
            </nav>
          )}
        </div>
      </main>

      {petId && (
        <Modal closeHref={closeHref}>
          {detail ? (
            <>
              {one(sp.new) && (
                <p className={`px-5 py-3 text-sm font-semibold ${one(sp.new) === "review" ? "bg-amber-50 text-amber-800" : "bg-emerald-50 text-emerald-700"}`}>
                  {one(sp.new) === "review"
                    ? "분양글이 저장됐어요. 관리자 확인 후 목록에 공개돼요."
                    : one(sp.new) === "edited"
                      ? "수정한 내용이 저장됐어요."
                      : "분양글이 등록됐어요. 좋은 가족을 만나길 바랄게요!"}
                </p>
              )}
              <PetDetail post={detail} back={petHref(detail.id)} favorited={favorited} isOwner={viewerId === detail.author_id} />
            </>
          ) : (
            <div className="p-10 text-center">
              <p className="font-semibold text-stone-700">게시글을 찾을 수 없어요</p>
              <p className="mt-1 text-sm text-stone-500">삭제되었거나 비공개 처리된 글입니다.</p>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}

function authorName(post: CardPost) {
  const profile = post.profiles as { nickname: string | null } | { nickname: string | null }[] | null;
  if (Array.isArray(profile)) return profile[0]?.nickname ?? "보호자";
  return profile?.nickname ?? "보호자";
}

function Thumb({ post }: { post: CardPost }) {
  const cover = post.post_media?.[0];
  if (cover && cover.type !== "video") {
    return <img src={publicMediaUrl(cover.storage_path)} alt="" className="h-full w-full object-cover" />;
  }
  return (
    <span className="flex h-full w-full items-center justify-center bg-stone-100">
      <img src="/icon-128.png" alt="" className="h-10 w-10 opacity-30" />
    </span>
  );
}

function Heart({ active }: { active?: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill={active ? "#ff6a00" : "none"} stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M12 20s-7-4.4-7-9a4 4 0 0 1 7-2 4 4 0 0 1 7 2c0 4.6-7 9-7 9Z" />
    </svg>
  );
}

function Paw({ active }: { active?: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill={active ? "#ff6a00" : "none"} stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <circle cx="7" cy="8" r="1.6" />
      <circle cx="12" cy="6.5" r="1.6" />
      <circle cx="17" cy="8" r="1.6" />
      <ellipse cx="12" cy="15" rx="4" ry="3.2" />
    </svg>
  );
}
