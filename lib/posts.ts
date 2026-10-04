import type { createClient } from "@/lib/supabase/server";
import { PAGE_SIZE } from "@/lib/config";

type Client = Awaited<ReturnType<typeof createClient>>;

export type ListFilters = {
  categoryId?: number;
  sido?: string;
  sex?: "male" | "female";
  urgentOnly?: boolean;
  includeAdopted?: boolean;
  adoptedOnly?: boolean;
  breedId?: number;
  sort?: "new" | "view";
  query?: string;
  page: number;
};

const CARD_FIELDS =
  "id, title, pet_name, birth_date, sex, region_sido, region_sigungu, is_urgent, urgent_deadline, status, created_at, favorite_count, view_count, breed_text, breeds(name), categories(name), profiles!posts_author_id_fkey(nickname), post_media(storage_path, type, is_cover)";

export async function listPosts(supabase: Client, f: ListFilters) {
  let q = supabase
    .from("posts")
    .select(CARD_FIELDS, { count: "exact" })
    .eq("visibility", "visible")
    .is("deleted_at", null)
    .eq("post_media.is_cover", true);

  if (f.categoryId) q = q.eq("category_id", f.categoryId);
  if (f.sido) q = q.eq("region_sido", f.sido);
  if (f.sex) q = q.eq("sex", f.sex);
  if (f.breedId) q = q.eq("breed_id", f.breedId);
  if (f.urgentOnly) q = q.eq("is_urgent", true);
  if (f.adoptedOnly) q = q.eq("status", "adopted");
  else if (!f.includeAdopted) q = q.eq("status", "active");
  const query = f.query?.replace(/[%_\\]/g, "").trim();
  if (query) q = q.ilike("title", `%${query}%`);

  const from = (f.page - 1) * PAGE_SIZE;
  const ordered = q.order("status", { ascending: true });
  const { data, count, error } = await (f.sort === "view"
    ? ordered.order("view_count", { ascending: false })
    : ordered.order("created_at", { ascending: false })
  ).range(from, from + PAGE_SIZE - 1);

  if (error) throw error;
  return { posts: data ?? [], total: count ?? 0 };
}

export async function listUrgent(supabase: Client, categoryId?: number) {
  const today = new Date(Date.now() + 9 * 3600_000).toISOString().slice(0, 10);
  let q = supabase
    .from("posts")
    .select(CARD_FIELDS)
    .eq("visibility", "visible")
    .is("deleted_at", null)
    .eq("status", "active")
    .eq("is_urgent", true)
    .gte("urgent_deadline", today)
    .eq("post_media.is_cover", true);
  if (categoryId) q = q.eq("category_id", categoryId);
  const { data } = await q.order("urgent_deadline", { ascending: true }).limit(12);
  return data ?? [];
}

export async function getPost(supabase: Client, id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const { data, error } = await supabase
    .from("posts")
    .select("*, breeds(name, is_cites), categories(name), profiles!posts_author_id_fkey(nickname), post_media(id, storage_path, type, is_cover, sort_order)")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();
  if (error) console.error("getPost", error);
  return data;
}

export type CardPost = Awaited<ReturnType<typeof listPosts>>["posts"][number];
export type DetailPost = NonNullable<Awaited<ReturnType<typeof getPost>>>;
