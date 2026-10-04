import { notFound } from "next/navigation";
import { PostForm, type PostFormInitial } from "@/app/posts/new/PostForm";
import { requireViewer } from "@/lib/auth";
import { publicMediaUrl } from "@/lib/config";

function ageParts(birthDate: string) {
  const birth = new Date(birthDate);
  const now = new Date(Date.now() + 9 * 3600_000);
  const months = Math.max(1, (now.getUTCFullYear() - birth.getUTCFullYear()) * 12 + (now.getUTCMonth() - birth.getUTCMonth()));
  return { years: Math.floor(months / 12), months: months % 12 };
}

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { supabase, user } = await requireViewer(`/posts/${id}/edit`);

  const [{ data: post }, { data: categories }, { data: breeds }] = await Promise.all([
    supabase
      .from("posts")
      .select("*, post_media(storage_path, type, sort_order, is_cover)")
      .eq("id", id)
      .eq("author_id", user.id)
      .is("deleted_at", null)
      .maybeSingle(),
    supabase.from("categories").select("id, name").order("sort_order"),
    supabase.from("breeds").select("id, category_id, name, is_cites, requires_review").eq("is_banned", false).order("sort_order"),
  ]);
  if (!post) notFound();

  const age = ageParts(post.birth_date);
  const media = [...(post.post_media ?? [])].sort(
    (a, b) => Number(b.is_cover) - Number(a.is_cover) || a.sort_order - b.sort_order,
  );
  const initial: PostFormInitial = {
    id: post.id,
    media: media.map((m) => ({ path: m.storage_path, url: publicMediaUrl(m.storage_path), type: m.type })),
    values: {
      categoryId: post.category_id,
      breedId: post.breed_id ?? -1,
      breedText: post.breed_text ?? "",
      sex: post.sex,
      ageYears: age.years ? String(age.years) : "",
      ageMonths: age.months ? String(age.months) : "",
      size: post.size ?? "",
      neutered: post.neutered,
      vaccinated: post.vaccinated,
      registered: post.registered,
      registrationNo: post.registration_no ?? "",
      pottyTrained: post.potty_trained,
      goodWithPeople: post.good_with_people,
      goodWithKids: post.good_with_kids,
      goodWithAnimals: post.good_with_animals,
      healthNote: post.health_note ?? "",
      petName: post.pet_name ?? "",
      title: post.title,
      description: post.description,
      reason: post.reason,
      includedItems: post.included_items ?? "",
      regionSido: post.region_sido,
      regionSigungu: post.region_sigungu,
      isUrgent: post.is_urgent,
      urgentDeadline: post.urgent_deadline ?? "",
      citesDocs: !!post.cites_docs,
      pledge: false,
    },
  };

  return (
    <main className="mx-auto max-w-xl px-4 py-8">
      <h1 className="text-2xl font-bold text-ink">분양글 수정</h1>
      <p className="mt-1 text-sm text-stone-500">동물 종류를 바꾸거나 주의가 필요한 표현이 있으면 다시 검토를 받아요.</p>
      <div className="mt-8">
        <PostForm userId={user.id} categories={categories ?? []} breeds={breeds ?? []} initial={initial} />
      </div>
    </main>
  );
}
