"use client";

import { useState } from "react";
import { publicMediaUrl } from "@/lib/config";

type Media = { id: string; storage_path: string; type: "image" | "video" };

export function Gallery({ media, alt }: { media: Media[]; alt: string }) {
  const [index, setIndex] = useState(0);

  if (media.length === 0) {
    return (
      <div className="flex aspect-[4/3] items-center justify-center bg-stone-100">
        <img src="/icon-128.png" alt="" className="h-20 w-20 opacity-30" />
      </div>
    );
  }

  const current = media[Math.min(index, media.length - 1)];
  const url = publicMediaUrl(current.storage_path);

  return (
    <div className="bg-stone-900">
      <div className="relative flex aspect-[4/3] items-center justify-center">
        {current.type === "video" ? (
          <video key={url} src={url} controls playsInline className="h-full w-full object-contain" />
        ) : (
          <img src={url} alt={alt} className="h-full w-full object-contain" />
        )}
        {media.length > 1 && (
          <>
            <button
              type="button"
              aria-label="이전 사진"
              onClick={() => setIndex((i) => (i - 1 + media.length) % media.length)}
              className="absolute left-2 flex h-9 w-9 items-center justify-center rounded-full bg-white/80 text-lg"
            >
              ‹
            </button>
            <button
              type="button"
              aria-label="다음 사진"
              onClick={() => setIndex((i) => (i + 1) % media.length)}
              className="absolute right-2 flex h-9 w-9 items-center justify-center rounded-full bg-white/80 text-lg"
            >
              ›
            </button>
            <span className="absolute bottom-2 right-3 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white">
              {index + 1} / {media.length}
            </span>
          </>
        )}
      </div>
      {media.length > 1 && (
        <div className="flex gap-1.5 overflow-x-auto bg-stone-900 p-2">
          {media.map((m, i) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setIndex(i)}
              className={`h-14 w-14 shrink-0 overflow-hidden rounded-md border-2 ${i === index ? "border-brand" : "border-transparent opacity-60"}`}
            >
              {m.type === "video" ? (
                <div className="flex h-full items-center justify-center bg-stone-700 text-xs text-white">영상</div>
              ) : (
                <img src={publicMediaUrl(m.storage_path)} alt="" className="h-full w-full object-cover" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
