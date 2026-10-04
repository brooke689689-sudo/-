"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { SIDO, SEX_LABEL } from "@/lib/format";
import { MAX_IMAGES, MAX_VIDEO_BYTES, MAX_VIDEO_SECONDS, shrinkImage, videoDuration } from "@/lib/media";
import { createClient } from "@/lib/supabase/client";
import { createPost, updatePost, type PostInput } from "./actions";

type Category = { id: number; name: string };
type Breed = { id: number; category_id: number; name: string; is_cites: boolean; requires_review: boolean };
type Tri = "yes" | "no" | "unknown";
type LocalMedia = { id: string; file?: File; path?: string; preview: string; type: "image" | "video" };
export type PostFormValues = Omit<PostInput, "media" | "ageYears" | "ageMonths" | "breedId"> & {
  breedId: number;
  ageYears: string;
  ageMonths: string;
};
export type PostFormInitial = { id: string; values: PostFormValues; media: { path: string; url: string; type: "image" | "video" }[] };

const STEPS = ["기본 정보", "사진·영상", "건강·성격", "소개", "확인"];
const OTHER = -1;

const input = "h-12 w-full rounded-xl border border-stone-200 bg-white px-4 outline-none focus:border-ink";
const textarea = "w-full rounded-xl border border-stone-200 bg-white p-4 leading-7 outline-none focus:border-ink";

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-sm font-bold text-stone-800">{label}</p>
      {children}
      {hint && <p className="mt-1.5 text-xs text-stone-400">{hint}</p>}
    </div>
  );
}

function Choice<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`h-10 rounded-full border px-4 text-sm font-semibold ${
            value === o.value ? "border-ink bg-ink text-white" : "border-stone-200 bg-white text-stone-600"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

const TRI_OPTIONS: { value: Tri; label: string }[] = [
  { value: "yes", label: "예" },
  { value: "no", label: "아니요" },
  { value: "unknown", label: "모름" },
];

export function PostForm({
  userId,
  categories,
  breeds,
  initial,
}: {
  userId: string;
  categories: Category[];
  breeds: Breed[];
  initial?: PostFormInitial;
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string | null>(null);
  const [media, setMedia] = useState<LocalMedia[]>(
    () => initial?.media.map((m) => ({ id: m.path, path: m.path, preview: m.url, type: m.type })) ?? [],
  );
  const [f, setF] = useState<PostFormValues>(() => initial?.values ?? {
    categoryId: categories[0]?.id ?? 1,
    breedId: 0,
    breedText: "",
    sex: "unknown" as PostInput["sex"],
    ageYears: "",
    ageMonths: "",
    size: "" as PostInput["size"],
    neutered: "unknown" as Tri,
    vaccinated: "unknown" as Tri,
    registered: "unknown" as Tri,
    registrationNo: "",
    pottyTrained: "unknown" as Tri,
    goodWithPeople: "unknown" as Tri,
    goodWithKids: "unknown" as Tri,
    goodWithAnimals: "unknown" as Tri,
    healthNote: "",
    petName: "",
    title: "",
    description: "",
    reason: "",
    includedItems: "",
    regionSido: "",
    regionSigungu: "",
    isUrgent: false,
    urgentDeadline: "",
    citesDocs: false,
    pledge: false,
  } as PostFormValues);
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((s) => ({ ...s, [k]: v }));

  const categoryBreeds = useMemo(() => breeds.filter((b) => b.category_id === f.categoryId), [breeds, f.categoryId]);
  const breed = breeds.find((b) => b.id === f.breedId);
  const needsReview = f.breedId === OTHER || breed?.requires_review;
  const images = media.filter((m) => m.type === "image");
  const video = media.find((m) => m.type === "video");

  function validate(s: number): string | null {
    if (s === 0) {
      if (!f.breedId) return "세부 종을 선택해 주세요.";
      if (f.breedId === OTHER && !f.breedText.trim()) return "동물 종류를 입력해 주세요.";
      const y = Number(f.ageYears || 0);
      const m = Number(f.ageMonths || 0);
      if (y + m <= 0) return "나이를 입력해 주세요. 정확하지 않아도 괜찮아요.";
      if (m > 11) return "개월은 0~11 사이로 입력해 주세요.";
      if (!f.regionSido || !f.regionSigungu.trim()) return "지역을 입력해 주세요.";
    }
    if (s === 1 && images.length === 0) return "사진을 1장 이상 올려주세요. 첫 번째 사진이 대표 사진이 돼요.";
    if (s === 3) {
      if (f.petName.trim().length < 1) return "아이 이름을 입력해 주세요.";
      if (f.title.trim().length < 2) return "제목을 2자 이상 입력해 주세요.";
      if (f.description.trim().length < 10) return "특징을 10자 이상 적어주세요.";
      if (f.reason.trim().length < 5) return "분양 사유를 5자 이상 적어주세요.";
    }
    if (s === 4) {
      if (breed?.is_cites && !f.citesDocs) return "멸종위기종 서류 보유 여부를 확인해 주세요.";
      if (!f.pledge) return "무료 분양 약속에 동의해 주세요.";
    }
    return null;
  }

  function go(next: number) {
    if (next > step) {
      const msg = validate(step);
      if (msg) return setError(msg);
    }
    setError(null);
    setStep(next);
    window.scrollTo({ top: 0 });
  }

  async function addFiles(files: FileList | null) {
    if (!files) return;
    setError(null);
    const added: LocalMedia[] = [];
    let imageCount = images.length;
    let hasVideo = !!video;
    for (const file of Array.from(files)) {
      if (file.type.startsWith("video/")) {
        if (hasVideo) {
          setError("영상은 1개까지 올릴 수 있어요.");
          continue;
        }
        if (file.size > MAX_VIDEO_BYTES) {
          setError("영상은 50MB 이하만 올릴 수 있어요.");
          continue;
        }
        const sec = await videoDuration(file);
        if (sec > MAX_VIDEO_SECONDS + 1) {
          setError("영상은 1분 이하만 올릴 수 있어요.");
          continue;
        }
        hasVideo = true;
        added.push({ id: crypto.randomUUID(), file, preview: URL.createObjectURL(file), type: "video" });
      } else if (file.type.startsWith("image/") || /\.(heic|heif)$/i.test(file.name)) {
        if (imageCount >= MAX_IMAGES) {
          setError("사진은 10장까지 올릴 수 있어요.");
          continue;
        }
        imageCount++;
        added.push({ id: crypto.randomUUID(), file, preview: URL.createObjectURL(file), type: "image" });
      }
    }
    setMedia((m) => [...m, ...added]);
  }

  function makeCover(id: string) {
    setMedia((m) => {
      const target = m.find((x) => x.id === id);
      return target ? [target, ...m.filter((x) => x.id !== id)] : m;
    });
  }

  async function submit() {
    const msg = validate(4);
    if (msg) return setError(msg);
    setError(null);

    const supabase = createClient();
    const uploaded: PostInput["media"] = [];
    const all: PostInput["media"] = [];
    const ordered = [...images, ...(video ? [video] : [])];
    const fresh = ordered.filter((m) => m.file);
    try {
      for (const m of ordered) {
        if (m.path || !m.file) {
          all.push({ path: m.path!, type: m.type });
          continue;
        }
        setProgress(`${m.type === "video" ? "영상" : "사진"} 올리는 중 (${uploaded.length + 1}/${fresh.length})`);
        const body = m.type === "image" ? await shrinkImage(m.file) : m.file;
        const isJpeg = body.type === "image/jpeg";
        const ext = m.type === "image" ? (isJpeg ? "jpg" : (m.file.name.split(".").pop() ?? "jpg")) : (m.file.name.split(".").pop() ?? "mp4");
        const path = `${userId}/${crypto.randomUUID()}.${ext.toLowerCase()}`;
        const { error: upErr } = await supabase.storage
          .from("post-media")
          .upload(path, body, { contentType: body.type || m.file.type, upsert: false });
        if (upErr) throw upErr;
        uploaded.push({ path, type: m.type });
        all.push({ path, type: m.type });
      }

      setProgress("글 저장 중");
      const input = {
        ...f,
        breedId: f.breedId === OTHER ? null : f.breedId,
        ageYears: Number(f.ageYears || 0),
        ageMonths: Number(f.ageMonths || 0),
        media: all,
      };
      const result = initial ? await updatePost(initial.id, input) : await createPost(input);
      if ("error" in result) {
        if (uploaded.length) await supabase.storage.from("post-media").remove(uploaded.map((u) => u.path));
        setProgress(null);
        return setError(result.error);
      }
      router.push(`/?pet=${result.id}&new=${result.pending ? "review" : initial ? "edited" : "1"}`);
    } catch {
      if (uploaded.length) await supabase.storage.from("post-media").remove(uploaded.map((u) => u.path));
      setProgress(null);
      setError("파일을 올리지 못했어요. 인터넷 연결을 확인하고 다시 시도해 주세요.");
    }
  }

  return (
    <div>
      <ol className="flex gap-1">
        {STEPS.map((s, i) => (
          <li key={s} className="flex-1">
            <div className={`h-1.5 rounded-full ${i <= step ? "bg-brand" : "bg-stone-200"}`} />
            <p className={`mt-1.5 text-center text-xs ${i === step ? "font-bold text-ink" : "text-stone-400"}`}>{s}</p>
          </li>
        ))}
      </ol>

      <div className="mt-8 space-y-7">
        {step === 0 && (
          <>
            <Field label="어떤 동물인가요?">
              <Choice
                value={String(f.categoryId)}
                onChange={(v) => setF((s) => ({ ...s, categoryId: Number(v), breedId: 0, breedText: "", citesDocs: false }))}
                options={categories.map((c) => ({ value: String(c.id), label: c.name }))}
              />
            </Field>
            <Field label="세부 종" hint="생태계교란종(붉은귀거북 등)은 분양글을 올릴 수 없어요.">
              <select className={input} value={f.breedId} onChange={(e) => set("breedId", Number(e.target.value))}>
                <option value={0}>선택해 주세요</option>
                {categoryBreeds.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                    {b.is_cites ? " (멸종위기종)" : ""}
                  </option>
                ))}
                <option value={OTHER}>목록에 없어요 (직접 입력)</option>
              </select>
              {f.breedId === OTHER && (
                <input
                  className={`${input} mt-2`}
                  maxLength={40}
                  placeholder="동물 종류를 입력해 주세요"
                  value={f.breedText}
                  onChange={(e) => set("breedText", e.target.value)}
                />
              )}
              {needsReview && (
                <p className="mt-2 rounded-lg bg-amber-50 p-3 text-xs leading-5 text-amber-800">
                  목록에 없는 동물은 관리자 확인 후 목록에 공개돼요. 보통 하루 안에 처리돼요.
                </p>
              )}
            </Field>
            <Field label="성별">
              <Choice
                value={f.sex}
                onChange={(v) => set("sex", v)}
                options={(["male", "female", "unknown"] as const).map((v) => ({ value: v, label: SEX_LABEL[v] }))}
              />
            </Field>
            <Field label="나이" hint="정확하지 않으면 대략적으로 적어주세요.">
              <div className="flex items-center gap-2">
                <input className={`${input} w-24`} inputMode="numeric" placeholder="0" value={f.ageYears} onChange={(e) => set("ageYears", e.target.value.replace(/\D/g, "").slice(0, 2))} />
                <span className="text-sm text-stone-600">살</span>
                <input className={`${input} ml-2 w-24`} inputMode="numeric" placeholder="0" value={f.ageMonths} onChange={(e) => set("ageMonths", e.target.value.replace(/\D/g, "").slice(0, 2))} />
                <span className="text-sm text-stone-600">개월</span>
              </div>
            </Field>
            <Field label="지역" hint="동네 단위까지만 적어주세요. 상세 주소는 채팅으로 안내하세요.">
              <div className="flex gap-2">
                <select className={`${input} w-32`} value={f.regionSido} onChange={(e) => set("regionSido", e.target.value)}>
                  <option value="">시·도</option>
                  {SIDO.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <input className={input} maxLength={20} placeholder="시·군·구 (예: 마포구)" value={f.regionSigungu} onChange={(e) => set("regionSigungu", e.target.value)} />
              </div>
            </Field>
          </>
        )}

        {step === 1 && (
          <>
            <Field label={`사진 (${images.length}/${MAX_IMAGES})`} hint="첫 번째 사진이 대표 사진이에요. 사진을 누르면 대표로 바꿀 수 있어요.">
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {images.map((m, i) => (
                  <div key={m.id} className="relative aspect-square overflow-hidden rounded-xl bg-stone-100">
                    <button type="button" onClick={() => makeCover(m.id)} className="h-full w-full">
                      <img src={m.preview} alt="" className="h-full w-full object-cover" />
                    </button>
                    {i === 0 && <span className="absolute left-1.5 top-1.5 rounded-full bg-brand px-2 py-0.5 text-xs font-bold text-white">대표</span>}
                    <button
                      type="button"
                      aria-label="삭제"
                      onClick={() => setMedia((all) => all.filter((x) => x.id !== m.id))}
                      className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-sm text-white"
                    >
                      ×
                    </button>
                  </div>
                ))}
                {images.length < MAX_IMAGES && (
                  <label className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-stone-300 bg-white text-stone-400 hover:border-brand hover:text-brand">
                    <span className="text-3xl leading-none">+</span>
                    <span className="mt-1 text-xs">사진 추가</span>
                    <input type="file" accept="image/*,.heic,.heif" multiple className="sr-only" onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} />
                  </label>
                )}
              </div>
            </Field>
            <Field label="영상 (선택)" hint="1분 이하, 50MB 이하 영상 1개를 올릴 수 있어요.">
              {video ? (
                <div className="relative overflow-hidden rounded-xl bg-black">
                  <video src={video.preview} controls playsInline className="max-h-72 w-full" />
                  <button
                    type="button"
                    onClick={() => setMedia((all) => all.filter((x) => x.id !== video.id))}
                    className="absolute right-2 top-2 rounded-full bg-black/60 px-3 py-1 text-xs text-white"
                  >
                    삭제
                  </button>
                </div>
              ) : (
                <label className="flex h-24 cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-stone-300 bg-white text-sm text-stone-400 hover:border-brand hover:text-brand">
                  + 영상 추가
                  <input type="file" accept="video/mp4,video/quicktime,video/webm" className="sr-only" onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} />
                </label>
              )}
            </Field>
          </>
        )}

        {step === 2 && (
          <>
            <Field label="크기">
              <Choice
                value={f.size}
                onChange={(v) => set("size", v)}
                options={[
                  { value: "small", label: "소형" },
                  { value: "medium", label: "중형" },
                  { value: "large", label: "대형" },
                  { value: "", label: "해당 없음" },
                ]}
              />
            </Field>
            {(
              [
                ["neutered", "중성화"],
                ["vaccinated", "예방접종"],
                ["pottyTrained", "배변 훈련"],
                ["goodWithPeople", "사람을 좋아해요"],
                ["goodWithKids", "아이와 잘 지내요"],
                ["goodWithAnimals", "다른 동물과 잘 지내요"],
              ] as const
            ).map(([key, label]) => (
              <Field key={key} label={label}>
                <Choice value={f[key]} onChange={(v) => set(key, v)} options={TRI_OPTIONS} />
              </Field>
            ))}
            <Field label="동물등록" hint="등록번호는 선택이에요. 입력하면 가운데 숫자를 가려서 보관해요.">
              <Choice value={f.registered} onChange={(v) => set("registered", v)} options={TRI_OPTIONS} />
              {f.registered === "yes" && (
                <input className={`${input} mt-2`} inputMode="numeric" maxLength={20} placeholder="등록번호 (선택)" value={f.registrationNo} onChange={(e) => set("registrationNo", e.target.value)} />
              )}
            </Field>
            <Field label="건강 상태 (선택)">
              <textarea className={textarea} rows={3} maxLength={1000} placeholder="지병, 복용 중인 약, 최근 진료 등을 적어주세요." value={f.healthNote} onChange={(e) => set("healthNote", e.target.value)} />
            </Field>
          </>
        )}

        {step === 3 && (
          <>
            <Field label="아이 이름">
              <input className={input} maxLength={12} placeholder="예: 코코" value={f.petName} onChange={(e) => set("petName", e.target.value)} />
            </Field>
            <Field label="제목">
              <input className={input} maxLength={60} placeholder="예: 사람 좋아하는 2살 말티즈 초코" value={f.title} onChange={(e) => set("title", e.target.value)} />
            </Field>
            <Field label="특징" hint={`${f.description.length}/3000`}>
              <textarea className={textarea} rows={6} maxLength={3000} placeholder="성격, 좋아하는 것, 생활 습관 등 새 가족이 알아야 할 내용을 적어주세요." value={f.description} onChange={(e) => set("description", e.target.value)} />
            </Field>
            <Field label="분양 사유" hint="솔직하게 적어주시면 맞는 가족을 찾는 데 도움이 돼요.">
              <textarea className={textarea} rows={4} maxLength={2000} value={f.reason} onChange={(e) => set("reason", e.target.value)} />
            </Field>
            <Field label="함께 보내는 물품 (선택)">
              <input className={input} maxLength={300} placeholder="예: 켄넬, 사료 반 포대, 장난감" value={f.includedItems} onChange={(e) => set("includedItems", e.target.value)} />
            </Field>
            <p className="rounded-lg bg-stone-100 p-3 text-xs leading-5 text-stone-600">
              전화번호, 카카오톡 ID, 계좌번호, 분양비·책임비 같은 금전 내용은 글에 쓸 수 없어요. 연락은 채팅으로 해주세요.
            </p>
          </>
        )}

        {step === 4 && (
          <>
            <div className="flex gap-4 rounded-2xl border border-stone-200 bg-white p-4">
              {images[0] && <img src={images[0].preview} alt="" className="h-24 w-24 shrink-0 rounded-xl object-cover" />}
              <div className="min-w-0 text-sm">
                <p className="font-semibold text-brand-dark">{breed?.name ?? f.breedText}</p>
                <p className="truncate font-bold text-stone-900">{f.title}</p>
                <p className="mt-1 text-stone-500">
                  {SEX_LABEL[f.sex]} · {f.ageYears ? `${f.ageYears}살 ` : ""}
                  {f.ageMonths ? `${f.ageMonths}개월` : ""} · {f.regionSido} {f.regionSigungu}
                </p>
                <p className="mt-1 text-stone-400">사진 {images.length}장{video ? " · 영상 1개" : ""}</p>
              </div>
            </div>

            {breed?.is_cites && (
              <label className="flex gap-3 rounded-xl bg-amber-50 p-4 text-sm leading-6 text-amber-900">
                <input type="checkbox" checked={f.citesDocs} onChange={(e) => set("citesDocs", e.target.checked)} className="mt-1 h-4 w-4 accent-brand" />
                국제적 멸종위기종 인공증식증명서 등 관련 서류를 가지고 있으며, 입양자에게 양도·양수 신고를 안내하겠습니다.
              </label>
            )}

            <label className="flex gap-3 rounded-xl border-2 border-brand bg-brand-soft p-4 text-sm leading-6 text-stone-800">
              <input type="checkbox" checked={f.pledge} onChange={(e) => set("pledge", e.target.checked)} className="mt-1 h-4 w-4 accent-brand" />
              <span>
                <b>무료로 분양합니다.</b> 분양비·책임비 등 어떤 명목으로도 돈을 받지 않으며, 위반 시 이용이 제한되는 것에 동의합니다.
              </span>
            </label>
          </>
        )}
      </div>

      {error && <p className="mt-6 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <div className="mt-8 flex gap-2">
        {step > 0 && (
          <button type="button" disabled={!!progress} onClick={() => go(step - 1)} className="h-12 w-28 rounded-xl border border-stone-200 bg-white font-semibold text-stone-600">
            이전
          </button>
        )}
        {step < STEPS.length - 1 ? (
          <button type="button" onClick={() => go(step + 1)} className="h-12 flex-1 rounded-xl bg-ink font-bold text-white">
            다음
          </button>
        ) : (
          <button type="button" disabled={!!progress} onClick={submit} className="h-12 flex-1 rounded-xl bg-brand font-bold text-white disabled:opacity-70">
            {progress ?? (initial ? "수정 완료" : "분양글 올리기")}
          </button>
        )}
      </div>
    </div>
  );
}
