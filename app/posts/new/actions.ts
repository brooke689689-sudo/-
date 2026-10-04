"use server";

import { revalidatePath } from "next/cache";
import { getViewer } from "@/lib/auth";
import { SIDO } from "@/lib/format";
import type { Database } from "@/lib/database.types";

type Enums = Database["public"]["Enums"];
type Tri = Enums["tri_state"];

export type PostInput = {
  categoryId: number;
  breedId: number | null;
  breedText: string;
  sex: Enums["pet_sex"];
  ageYears: number;
  ageMonths: number;
  size: Enums["pet_size"] | "";
  neutered: Tri;
  vaccinated: Tri;
  registered: Tri;
  registrationNo: string;
  pottyTrained: Tri;
  goodWithPeople: Tri;
  goodWithKids: Tri;
  goodWithAnimals: Tri;
  healthNote: string;
  title: string;
  petName: string;
  description: string;
  reason: string;
  includedItems: string;
  regionSido: string;
  regionSigungu: string;
  isUrgent: boolean;
  urgentDeadline: string;
  citesDocs: boolean;
  pledge: boolean;
  media: { path: string; type: Enums["media_type"] }[];
};

export type CreateResult = { id: string; pending: boolean } | { error: string };

const TRI = new Set(["yes", "no", "unknown"]);

const DB_ERRORS: Record<string, string> = {
  BANNED_SPECIES: "생태계교란종은 분양글을 올릴 수 없어요.",
  CITES_DOCS_REQUIRED: "국제적 멸종위기종은 관련 서류를 갖추고 있어야 올릴 수 있어요.",
  BREED_CATEGORY_MISMATCH: "카테고리와 세부 종이 맞지 않아요.",
};

function birthDate(years: number, months: number) {
  const d = new Date(Date.now() + 9 * 3600_000);
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() - (years * 12 + months));
  return d.toISOString().slice(0, 10);
}

function clean(s: string) {
  const t = s.trim();
  return t.length ? t : null;
}

function dbError(error: { message?: string } | null) {
  const code = error?.message ?? "";
  if (code.startsWith("BANNED_CONTENT")) {
    return `글에 사용할 수 없는 내용이 있어요 (${code.split(":")[1] ?? "금지어"}). 연락처·계좌·금전 관련 내용은 뺀 뒤 다시 올려주세요.`;
  }
  return DB_ERRORS[code] ?? "저장 중 문제가 생겼어요. 잠시 후 다시 시도해 주세요.";
}

function validate(input: PostInput, userId: string) {
  const title = input.title.trim();
  const petName = input.petName.trim();
  const description = input.description.trim();
  const reason = input.reason.trim();
  const sigungu = input.regionSigungu.trim();
  const years = Math.trunc(input.ageYears) || 0;
  const months = Math.trunc(input.ageMonths) || 0;

  if (!Number.isInteger(input.categoryId)) return { error: "카테고리를 선택해 주세요." };
  if (!input.breedId && !input.breedText.trim()) return { error: "세부 종을 선택하거나 입력해 주세요." };
  if (!["male", "female", "unknown"].includes(input.sex)) return { error: "성별을 선택해 주세요." };
  if (years < 0 || years > 40 || months < 0 || months > 11 || years + months === 0) {
    return { error: "나이를 확인해 주세요. (1개월 이상)" };
  }
  if (petName.length < 1 || petName.length > 12) return { error: "아이 이름은 1~12자로 입력해 주세요." };
  if (title.length < 2 || title.length > 60) return { error: "제목은 2~60자로 입력해 주세요." };
  if (description.length < 10 || description.length > 3000) return { error: "특징은 10~3000자로 입력해 주세요." };
  if (reason.length < 5 || reason.length > 2000) return { error: "분양 사유는 5~2000자로 입력해 주세요." };
  if (!SIDO.includes(input.regionSido as (typeof SIDO)[number]) || !sigungu || sigungu.length > 20) {
    return { error: "지역을 확인해 주세요." };
  }
  for (const v of [input.neutered, input.vaccinated, input.registered, input.pottyTrained, input.goodWithPeople, input.goodWithKids, input.goodWithAnimals]) {
    if (!TRI.has(v)) return { error: "선택 항목을 확인해 주세요." };
  }
  if (input.isUrgent && !/^\d{4}-\d{2}-\d{2}$/.test(input.urgentDeadline)) return { error: "긴급 마감일을 선택해 주세요." };
  if (!input.pledge) return { error: "무료 분양 약속에 동의해 주세요." };

  const images = input.media.filter((m) => m.type === "image");
  const videos = input.media.filter((m) => m.type === "video");
  if (images.length === 0) return { error: "대표 사진을 1장 이상 올려주세요." };
  if (images.length > 10 || videos.length > 1) return { error: "사진은 10장, 영상은 1개까지 올릴 수 있어요." };
  if (input.media.some((m) => !m.path.startsWith(`${userId}/`) || m.path.includes(".."))) {
    return { error: "업로드한 파일을 확인할 수 없어요. 다시 올려주세요." };
  }

  return {
    ordered: [...images, ...videos],
    row: {
      category_id: input.categoryId,
      breed_id: input.breedId,
      breed_text: input.breedId ? null : clean(input.breedText),
      sex: input.sex,
      birth_date: birthDate(years, months),
      size: input.size || null,
      neutered: input.neutered,
      vaccinated: input.vaccinated,
      registered: input.registered,
      registration_no: input.registered === "yes" ? clean(input.registrationNo) : null,
      potty_trained: input.pottyTrained,
      good_with_people: input.goodWithPeople,
      good_with_kids: input.goodWithKids,
      good_with_animals: input.goodWithAnimals,
      health_note: clean(input.healthNote),
      title,
      pet_name: petName,
      description,
      reason,
      included_items: clean(input.includedItems),
      region_sido: input.regionSido,
      region_sigungu: sigungu,
      is_urgent: input.isUrgent,
      urgent_deadline: input.isUrgent ? input.urgentDeadline : null,
      cites_docs: input.citesDocs,
    },
  };
}

export async function createPost(input: PostInput): Promise<CreateResult> {
  const { supabase, user, profile } = await getViewer();
  if (!user) return { error: "로그인이 필요해요." };
  if (!profile?.is_verified) return { error: "본인인증을 먼저 해주세요." };

  const v = validate(input, user.id);
  if (v.error !== undefined) return { error: v.error };
  const { ordered, row } = v;

  const { data: post, error } = await supabase
    .from("posts")
    .insert({ ...row, author_id: user.id })
    .select("id, visibility")
    .single();
  if (error || !post) return { error: dbError(error) };

  const { error: mediaError } = await supabase.from("post_media").insert(
    ordered.map((m, i) => ({
      post_id: post.id,
      storage_path: m.path,
      type: m.type,
      sort_order: i,
      is_cover: i === 0,
    })),
  );
  if (mediaError) {
    await supabase.from("posts").update({ deleted_at: new Date().toISOString() }).eq("id", post.id);
    return { error: "사진을 저장하지 못했어요. 다시 시도해 주세요." };
  }

  revalidatePath("/");
  return { id: post.id, pending: post.visibility !== "visible" };
}

export async function updatePost(postId: string, input: PostInput): Promise<CreateResult> {
  const { supabase, user } = await getViewer();
  if (!user) return { error: "로그인이 필요해요." };
  if (!/^[0-9a-f-]{36}$/i.test(postId)) return { error: "글을 찾을 수 없어요." };

  const { data: existing } = await supabase
    .from("posts")
    .select("id, post_media(id, storage_path)")
    .eq("id", postId)
    .eq("author_id", user.id)
    .is("deleted_at", null)
    .maybeSingle();
  if (!existing) return { error: "수정할 수 있는 글이 아니에요." };

  const v = validate(input, user.id);
  if (v.error !== undefined) return { error: v.error };
  const { ordered, row } = v;

  const { data: post, error } = await supabase
    .from("posts")
    .update(row)
    .eq("id", postId)
    .select("id, visibility")
    .single();
  if (error || !post) return { error: dbError(error) };

  const { error: mediaError } = await supabase.from("post_media").insert(
    ordered.map((m, i) => ({
      post_id: postId,
      storage_path: m.path,
      type: m.type,
      sort_order: i,
      is_cover: i === 0,
    })),
  );
  if (mediaError) return { error: "사진을 저장하지 못했어요. 다시 시도해 주세요." };

  const oldMedia = existing.post_media ?? [];
  if (oldMedia.length) {
    await supabase.from("post_media").delete().in("id", oldMedia.map((m) => m.id));
    const kept = new Set(ordered.map((m) => m.path));
    const removed = oldMedia.map((m) => m.storage_path).filter((p) => !kept.has(p));
    if (removed.length) await supabase.storage.from("post-media").remove(removed);
  }

  revalidatePath("/");
  revalidatePath("/me/posts");
  return { id: post.id, pending: post.visibility !== "visible" };
}
