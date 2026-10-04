import Link from "next/link";
import { startChat, toggleFavorite } from "@/app/pet-actions";
import { Gallery } from "@/components/Gallery";
import { SEX_LABEL, SIZE_LABEL, TRI_LABEL, ageLabel, timeAgo } from "@/lib/format";
import type { DetailPost } from "@/lib/posts";

function Row({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex gap-3 py-1.5 text-sm">
      <dt className="w-24 shrink-0 text-stone-500">{label}</dt>
      <dd className="text-stone-800">{value}</dd>
    </div>
  );
}

function tri(v: "yes" | "no" | "unknown") {
  return v === "unknown" ? null : TRI_LABEL[v];
}

export function PetDetail({
  post,
  back,
  favorited = false,
  isOwner = false,
}: {
  post: DetailPost;
  back: string;
  favorited?: boolean;
  isOwner?: boolean;
}) {
  const media = [...(post.post_media ?? [])].sort(
    (a, b) => Number(b.is_cover) - Number(a.is_cover) || a.sort_order - b.sort_order,
  );
  const breed = post.breeds?.name ?? post.breed_text ?? "";
  const adopted = post.status === "adopted";

  return (
    <article>
      <Gallery media={media} alt={post.title} />

      <div className="p-5 sm:p-7">
        <div className="flex flex-wrap items-center gap-1.5">
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${adopted ? "bg-stone-200 text-stone-600" : "bg-ink-soft text-ink"}`}
          >
            {adopted ? "분양완료" : "분양중"}
          </span>
          {post.registered === "yes" && (
            <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700">동물등록 완료</span>
          )}
          {post.visibility !== "visible" && (
            <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-700">
              {post.visibility === "pending_review" ? "검토 대기 중 (나만 보임)" : "숨김 처리됨"}
            </span>
          )}
        </div>

        <h2 className="mt-3 text-2xl font-bold text-stone-900">{post.title}</h2>
        <p className="mt-1 text-sm text-stone-500">
          {post.categories?.name} · {breed} · {post.region_sido} {post.region_sigungu} · {timeAgo(post.created_at)}
        </p>

        <dl className="mt-5 grid gap-x-8 rounded-2xl bg-stone-50 p-4 sm:grid-cols-2">
          <Row label="성별" value={SEX_LABEL[post.sex]} />
          <Row label="나이" value={ageLabel(post.birth_date)} />
          <Row label="크기" value={post.size ? SIZE_LABEL[post.size] : null} />
          <Row label="중성화" value={tri(post.neutered)} />
          <Row label="예방접종" value={tri(post.vaccinated)} />
          <Row label="배변 훈련" value={tri(post.potty_trained)} />
          <Row label="사람 친화" value={tri(post.good_with_people)} />
          <Row label="아이와 지냄" value={tri(post.good_with_kids)} />
          <Row label="다른 동물" value={tri(post.good_with_animals)} />
          <Row label="동반 물품" value={post.included_items} />
        </dl>

        {post.health_note && (
          <section className="mt-6">
            <h3 className="font-bold text-stone-900">건강 상태</h3>
            <p className="mt-2 whitespace-pre-line text-sm leading-7 text-stone-700">{post.health_note}</p>
          </section>
        )}

        <section className="mt-6">
          <h3 className="font-bold text-stone-900">특징</h3>
          <p className="mt-2 whitespace-pre-line text-sm leading-7 text-stone-700">{post.description}</p>
        </section>

        <section className="mt-6">
          <h3 className="font-bold text-stone-900">분양 사유</h3>
          <p className="mt-2 whitespace-pre-line text-sm leading-7 text-stone-700">{post.reason}</p>
        </section>

        {post.breeds?.is_cites && (
          <p className="mt-6 rounded-xl bg-amber-50 p-4 text-sm leading-6 text-amber-800">
            국제적 멸종위기종(CITES)입니다. 입양 시 관련 서류를 확인하고, 관할 기관에 양도·양수 신고를 해야 합니다.
          </p>
        )}

        <p className="mt-6 text-sm text-stone-500">
          보호자 <span className="font-semibold text-stone-700">{post.profiles?.nickname ?? "회원"}</span>
        </p>

        <div className="sticky bottom-0 -mx-5 mt-6 flex gap-2 border-t border-stone-100 bg-white px-5 py-4 sm:-mx-7 sm:px-7">
          <form action={toggleFavorite}>
            <input type="hidden" name="post" value={post.id} />
            <input type="hidden" name="back" value={back} />
            <button
              type="submit"
              className={`flex h-12 w-14 items-center justify-center rounded-xl border text-xl ${
                favorited ? "border-brand bg-brand-soft text-brand" : "border-stone-200 text-stone-500 hover:bg-stone-50"
              }`}
              aria-label={favorited ? "찜 해제" : "찜하기"}
            >
              {favorited ? "♥" : "♡"}
            </button>
          </form>
          {isOwner ? (
            <Link
              href={`/posts/${post.id}/edit`}
              className="flex h-12 flex-1 items-center justify-center rounded-xl bg-ink font-bold text-white"
            >
              내 글 수정하기
            </Link>
          ) : adopted ? (
            <span className="flex h-12 flex-1 items-center justify-center rounded-xl bg-stone-200 font-semibold text-stone-500">
              분양이 완료된 아이예요
            </span>
          ) : (
            <form action={startChat} className="flex flex-1">
              <input type="hidden" name="post" value={post.id} />
              <button
                type="submit"
                className="h-12 flex-1 rounded-xl bg-brand font-bold text-white hover:bg-brand-dark"
              >
                채팅으로 문의하기
              </button>
            </form>
          )}
        </div>
        <div className="flex items-center justify-between text-xs text-stone-400">
          <span>무료 분양만 허용됩니다. 금전 요구 시 신고해 주세요.</span>
          <Link href={`/report?post=${post.id}`} className="underline">
            신고
          </Link>
        </div>
      </div>
    </article>
  );
}
