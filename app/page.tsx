import Link from "next/link";
import { AnimalMark } from "@/components/AnimalMark";
import { AutoSelect } from "@/components/AutoSelect";
import { Modal } from "@/components/Modal";
import { PetDetail } from "@/components/PetDetail";
import { PAGE_SIZE, publicMediaUrl } from "@/lib/config";
import { categoryEmoji, REGION_EMOJI } from "@/lib/emoji";
import { SIDO, timeAgo } from "@/lib/format";
import { getViewer } from "@/lib/auth";
import { getPost, listPosts, type CardPost } from "@/lib/posts";

type Search = Record<string, string | string[] | undefined>;

function one(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

function many(v: string | string[] | undefined) {
  if (!v) return [];
  return (Array.isArray(v) ? v : [v]).flatMap((item) => item.split(",")).map((item) => item.trim()).filter(Boolean);
}

export default async function Home({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams;
  const { supabase } = await getViewer();

  const { data: categories } = await supabase.from("categories").select("id, slug, name").order("sort_order");
  const query = one(sp.q)?.trim();
  const requested = one(sp.c);
  const category = requested ? categories?.find((c) => c.slug === requested) : undefined;
  const sido = SIDO.find((s) => s === one(sp.sido));
  const sexParam = one(sp.sex);
  const sex = sexParam === "male" || sexParam === "female" ? sexParam : undefined;
  const listing = one(sp.listing) === "all" || one(sp.listing) === "adopted" ? one(sp.listing)! : "active";
  const sort = one(sp.sort) === "view" ? "view" : "new";
  const page = Math.max(1, Number.parseInt(one(sp.page) ?? "1", 10) || 1);
  const petId = one(sp.pet);
  const breedIds = [...new Set(many(sp.breed).map((id) => Number.parseInt(id, 10)).filter((id) => Number.isFinite(id)))];
  const showcase =
    !requested && !query && breedIds.length === 0 && !sido && !sex && listing === "active" && sort === "new" && page === 1;

  const breedQuery = category
    ? supabase.from("breeds").select("id, name").eq("category_id", category.id).eq("is_banned", false).order("sort_order")
    : Promise.resolve({ data: [] as { id: number; name: string }[] });

  const [{ data: breedRows }, { posts, total }, rails, detail] = await Promise.all([
    breedQuery,
    showcase
      ? Promise.resolve({ posts: [] as CardPost[], total: 0 })
      : listPosts(supabase, {
          categoryId: category?.id,
          breedIds,
          sido,
          sex,
          includeAdopted: listing === "all",
          adoptedOnly: listing === "adopted",
          query,
          sort,
          page,
        }),
    showcase
      ? Promise.all([
          listPosts(supabase, { sort: "view", page: 1, limit: 8 }),
          ...(categories ?? []).map((c) => listPosts(supabase, { categoryId: c.id, sort: "new", page: 1, limit: 8 })),
        ])
      : Promise.resolve(null),
    petId ? getPost(supabase, petId) : Promise.resolve(null),
  ]);

  const breeds = [...(breedRows ?? [])].sort((a, b) => {
    const other = (name: string) => name.startsWith("기타");
    if (other(a.name) !== other(b.name)) return other(a.name) ? 1 : -1;
    return a.name.localeCompare(b.name, "ko");
  });
  const selectedBreeds = breeds.filter((b) => breedIds.includes(b.id));
  const breedLabel =
    selectedBreeds.length === 0
      ? "품종"
      : selectedBreeds.length === 1
        ? selectedBreeds[0].name
        : `${selectedBreeds[0].name} 외 ${selectedBreeds.length - 1}`;

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
  for (const b of selectedBreeds) base.append("breed", String(b.id));
  if (sido) base.set("sido", sido);
  if (sex) base.set("sex", sex);
  if (query) base.set("q", query);
  if (listing !== "active") base.set("listing", listing);
  if (sort !== "new") base.set("sort", sort);
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
  const homeSections = rails
    ? [
        {
          key: "popular",
          kicker: "POPULAR",
          title: "지금 가장 많이 보는 분양글이에요",
          href: "/?sort=view",
          posts: rails[0].posts,
        },
        ...(categories ?? []).map((c, index) => ({
          key: c.slug,
          kicker: c.name,
          title: `새 가족을 기다리는 ${c.name}${particle(c.name)}`,
          href: `/?c=${c.slug}`,
          posts: rails[index + 1]?.posts ?? [],
        })),
      ]
    : [];
  const listTitle = category
    ? `새 가족을 기다리는 ${category.name}${particle(category.name)}`
    : sort === "view"
      ? "지금 가장 많이 보는 분양글이에요"
      : "조건에 맞는 분양글이에요";

  const listings = [
    { id: "all", label: "전체", icon: "paw" },
    { id: "active", label: "분양중", icon: "heart" },
    { id: "adopted", label: "분양완료", icon: "paw" },
  ] as const;

  return (
    <div>
      <section className="border-b border-stone-100 bg-white">
        <div className="mx-auto max-w-7xl px-4 pt-4 pb-5">
          <Link href="/policy/principles" className="block overflow-hidden rounded-3xl">
            <img src="/adoption-notice.png" alt="입양하기 전에 6가지 주의사항. 무료 분양, 건강 확인, 평생 책임." className="h-auto w-full object-cover" />
          </Link>

          <div className="mt-6 flex items-end gap-3">
          <nav className="flex min-w-0 flex-1 items-end gap-3 overflow-x-auto pb-2" aria-label="동물 분류">
            <details className="group relative mb-7 shrink-0 self-center">
              <summary className="flex h-11 cursor-pointer list-none items-center gap-2 rounded-full bg-[#1f8a4c] px-4 text-sm font-bold text-white [&::-webkit-details-marker]:hidden">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
                  <path d="M4 7h16M4 12h16M4 17h16" />
                </svg>
                분양 카테고리
              </summary>
              <div className="absolute z-20 mt-2 w-44 rounded-2xl border border-stone-200 bg-white p-2 shadow-lg">
                {(categories ?? []).map((c) => (
                  <Link
                    key={c.slug}
                    href={withParams({ c: c.slug, breed: null, page: null })}
                    className="block rounded-xl px-3 py-2 text-sm font-semibold text-stone-700 hover:bg-green-50 hover:text-[#1f8a4c]"
                  >
                    {c.name}
                  </Link>
                ))}
              </div>
            </details>
            {(categories ?? []).map((c) => {
              const active = category?.slug === c.slug;
              return (
                <Link key={c.slug} href={withParams({ c: c.slug, breed: null, page: null })} className="flex w-[92px] shrink-0 flex-col items-center gap-2">
                  <span className={`flex items-center justify-center rounded-full ${active ? "h-[92px] w-[92px] bg-[#2ea85a] shadow-md" : "h-[78px] w-[78px] bg-white"}`}>
                    <AnimalMark slug={c.slug} />
                  </span>
                  <span className={`text-sm font-bold ${active ? "text-[#1f8a4c]" : "text-stone-500"}`}>{c.name}</span>
                </Link>
              );
            })}
          </nav>
            <Link href="/posts/new" className="mb-8 hidden h-10 shrink-0 items-center rounded-full border border-[#1f8a4c] px-4 text-sm font-bold text-[#1f8a4c] sm:inline-flex">
              글 올리기
            </Link>
          </div>

          <form method="get" action="/" className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3">
            {category && <input type="hidden" name="c" value={category.slug} />}
            {query && <input type="hidden" name="q" value={query} />}
            <div className="flex flex-wrap items-center gap-4 text-sm font-bold">
              {listings.map((item) => {
                const active = listing === item.id;
                return (
                  <Link
                    key={item.id}
                    href={withParams({ listing: item.id === "active" ? null : item.id, page: null })}
                    className={`inline-flex items-center gap-1.5 ${active ? "text-[#1f8a4c]" : "text-stone-400"}`}
                  >
                    {item.icon === "heart" ? <Heart active={active} /> : <Paw active={active} />}
                    {item.label}
                  </Link>
                );
              })}
            </div>
            {breeds.length > 0 && (
              <details className="relative">
                <summary className="flex h-10 cursor-pointer list-none items-center gap-2 rounded-lg border border-stone-200 bg-white px-3 text-sm text-stone-600 [&::-webkit-details-marker]:hidden">
                  <span aria-hidden>{categoryEmoji(category?.slug)}</span>
                  {breedLabel}
                  <span aria-hidden className="text-xs text-stone-400">▾</span>
                </summary>
                <div className="absolute z-20 mt-2 max-h-80 w-64 overflow-y-auto rounded-xl border border-stone-200 bg-white p-2 shadow-lg">
                  {breeds.map((b) => (
                    <label key={b.id} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-stone-700 hover:bg-green-50">
                      <input
                        type="checkbox"
                        name="breed"
                        value={b.id}
                        defaultChecked={selectedBreeds.some((selected) => selected.id === b.id)}
                        className="accent-[#1f8a4c]"
                      />
                      {b.name}
                    </label>
                  ))}
                  <button type="submit" className="sticky bottom-0 mt-1 h-9 w-full rounded-lg bg-[#1f8a4c] text-sm font-bold text-white">
                    적용
                  </button>
                </div>
              </details>
            )}
            <AutoSelect name="sido" defaultValue={sido ?? ""} className="h-10 rounded-lg border border-stone-200 bg-white px-3 text-sm text-stone-600">
              <option value="">📍 지역</option>
              {SIDO.map((s) => (
                <option key={s} value={s}>
                  {REGION_EMOJI[s]} {s}
                </option>
              ))}
            </AutoSelect>
            <AutoSelect name="sex" defaultValue={sex ?? ""} className="h-10 rounded-lg border border-stone-200 bg-white px-3 text-sm text-stone-600">
              <option value="">💛 상관없음</option>
              <option value="male">💙 수컷</option>
              <option value="female">💗 암컷</option>
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
          {showcase ? (
            <>
              <p className="text-xs font-black tracking-[0.18em] text-[#1f8a4c]">FREE REHOMING</p>
              <h1 className="mt-1 flex items-center gap-2 text-2xl font-black text-stone-900">
                <Heart active />
                무료로 새 가족을 만나는 분양 공간이에요
              </h1>
              <p className="mt-2 text-sm text-stone-500">강아지부터 관상어까지, 분양비 없이 보호자와 입양자를 연결해요.</p>
              <div className="mt-10 space-y-12">
                {homeSections.map((section) => (
                  <section key={section.key}>
                    <p className="text-xs font-black tracking-[0.18em] text-[#1f8a4c]">{section.kicker}</p>
                    <h2 className="mt-1 flex items-center gap-2 text-2xl font-black text-stone-900">
                      <Heart active />
                      {section.title}
                    </h2>
                    {section.posts.length === 0 ? (
                      <p className="mt-5 rounded-3xl bg-white py-10 text-center text-sm font-semibold text-stone-500">아직 기다리는 아이가 없어요</p>
                    ) : (
                      <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
                        {section.posts.map((post) => (
                          <PostCard key={post.id} post={post} href={petHref(post.id)} />
                        ))}
                      </div>
                    )}
                    <div className="mt-4 flex justify-end">
                      <Link href={section.href} className="text-sm font-bold text-[#1f8a4c]">
                        아이들 더보기 →
                      </Link>
                    </div>
                  </section>
                ))}
              </div>
            </>
          ) : (
            <>
              <p className="text-xs font-black tracking-[0.18em] text-[#1f8a4c]">{category?.name ?? (sort === "view" ? "POPULAR" : "SEARCH")}</p>
              <h1 className="mt-1 flex items-center gap-2 text-2xl font-black text-stone-900">
                <Heart active />
                {listTitle}
              </h1>
              {shown.length === 0 ? (
                <div className="mt-6 rounded-3xl bg-white py-20 text-center">
                  <p className="font-bold text-stone-700">조건에 맞는 아이가 아직 없어요</p>
                  <Link href="/posts/new" className="mt-4 inline-block rounded-full bg-[#1f8a4c] px-5 py-2.5 text-sm font-bold text-white">
                    글 올리기
                  </Link>
                </div>
              ) : (
                <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
                  {shown.map((post) => (
                    <PostCard key={post.id} post={post} href={petHref(post.id)} />
                  ))}
                </div>
              )}
            </>
          )}

          {!showcase && totalPages > 1 && (
            <nav className="mt-8 flex flex-wrap justify-center gap-1" aria-label="페이지">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((n) => n === 1 || n === totalPages || Math.abs(n - page) <= 2)
                .map((n, i, arr) => (
                  <span key={n} className="flex items-center gap-1">
                    {i > 0 && n - arr[i - 1] > 1 && <span className="px-1 text-stone-400">…</span>}
                    <Link
                      href={withParams({ page: n === 1 ? null : String(n) })}
                      className={`flex h-9 min-w-9 items-center justify-center rounded-lg px-2 text-sm font-semibold ${
                        n === page ? "bg-[#1f8a4c] text-white" : "bg-white text-stone-600"
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

function particle(name: string) {
  const last = name.charCodeAt(name.length - 1);
  const hasBatchim = last >= 0xac00 && last <= 0xd7a3 && (last - 0xac00) % 28 !== 0;
  return hasBatchim ? "이에요" : "예요";
}

function PostCard({ post, href }: { post: CardPost; href: string }) {
  return (
    <Link href={href} scroll={false} className="overflow-hidden rounded-2xl bg-white shadow-sm">
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
          <span className="rounded-md bg-green-50 px-1.5 py-0.5 text-[11px] font-bold text-[#1f8a4c]">무료분양</span>
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
    <svg width="16" height="16" viewBox="0 0 24 24" fill={active ? "#1f8a4c" : "none"} stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M12 20s-7-4.4-7-9a4 4 0 0 1 7-2 4 4 0 0 1 7 2c0 4.6-7 9-7 9Z" />
    </svg>
  );
}

function Paw({ active }: { active?: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill={active ? "#1f8a4c" : "none"} stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <circle cx="7" cy="8" r="1.6" />
      <circle cx="12" cy="6.5" r="1.6" />
      <circle cx="17" cy="8" r="1.6" />
      <ellipse cx="12" cy="15" rx="4" ry="3.2" />
    </svg>
  );
}
