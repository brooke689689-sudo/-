import Link from "next/link";
import { publicMediaUrl } from "@/lib/config";
import { SEX_LABEL, ageLabel, timeAgo } from "@/lib/format";
import type { CardPost } from "@/lib/posts";

export function PetCard({ post, href }: { post: CardPost; href: string }) {
  const cover = post.post_media?.[0];
  const breed = post.breeds?.name ?? post.breed_text ?? post.categories?.name;
  const adopted = post.status === "adopted";

  return (
    <Link
      href={href}
      scroll={false}
      className="group block overflow-hidden rounded-2xl border border-stone-200 bg-white transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="relative aspect-square bg-stone-100">
        {cover ? (
          cover.type === "video" ? (
            <video src={publicMediaUrl(cover.storage_path)} muted playsInline preload="metadata" className="h-full w-full object-cover" />
          ) : (
            <img src={publicMediaUrl(cover.storage_path)} alt={post.title} loading="lazy" className="h-full w-full object-cover" />
          )
        ) : (
          <div className="flex h-full items-center justify-center">
            <img src="/icon-128.png" alt="" className="h-14 w-14 opacity-30" />
          </div>
        )}
        {adopted && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/45">
            <span className="rounded-full bg-white px-3 py-1 text-sm font-bold text-ink">분양완료</span>
          </div>
        )}
      </div>
      <div className="p-3">
        <p className="text-xs font-semibold text-brand-dark">{breed}</p>
        <p className="mt-0.5 line-clamp-1 font-semibold text-stone-900 group-hover:text-ink">{post.title}</p>
        <p className="mt-1 text-xs text-stone-500">
          {SEX_LABEL[post.sex]} · {ageLabel(post.birth_date)}
        </p>
        <div className="mt-2 flex items-center justify-between text-xs text-stone-400">
          <span>
            {post.region_sido} {post.region_sigungu}
          </span>
          <span>{timeAgo(post.created_at)}</span>
        </div>
      </div>
    </Link>
  );
}
