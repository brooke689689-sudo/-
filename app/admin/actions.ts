"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin";

const UUID = /^[0-9a-f-]{36}$/i;
const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();

export async function resolveReport(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = str(formData, "report");
  const status = str(formData, "status") === "dismissed" ? "dismissed" : "resolved";
  if (!UUID.test(id)) return;
  await supabase.rpc("admin_resolve_report", { p_report_id: id, p_status: status, p_resolution: str(formData, "resolution") || status });
  revalidatePath("/admin", "layout");
}

export async function sanctionUser(formData: FormData) {
  const { supabase } = await requireAdmin();
  const user = str(formData, "user");
  const report = str(formData, "report");
  const reason = str(formData, "reason") || "운영 정책 위반";
  if (!UUID.test(user)) return;
  await supabase.rpc("admin_apply_violation", {
    p_user: user,
    p_reason: reason,
    p_report_id: UUID.test(report) ? report : undefined,
    p_severe: formData.get("severe") === "1",
  });
  if (UUID.test(report)) {
    await supabase.rpc("admin_resolve_report", { p_report_id: report, p_status: "resolved", p_resolution: `제재: ${reason}` });
  }
  revalidatePath("/admin", "layout");
}

export async function liftSanction(formData: FormData) {
  const { supabase } = await requireAdmin();
  const user = str(formData, "user");
  if (!UUID.test(user)) return;
  await supabase.rpc("admin_lift_sanction", { p_user: user, p_note: str(formData, "note") || "관리자 해제" });
  revalidatePath("/admin", "layout");
}

export async function setPostVisibility(formData: FormData) {
  const { supabase } = await requireAdmin();
  const post = str(formData, "post");
  const v = str(formData, "visibility");
  if (!UUID.test(post) || !["visible", "hidden", "pending_review"].includes(v)) return;
  await supabase.rpc("admin_set_post_visibility", {
    p_post_id: post,
    p_visibility: v as "visible" | "hidden" | "pending_review",
    p_note: str(formData, "note") || (v === "visible" ? "" : "관리자 숨김"),
  });
  revalidatePath("/admin", "layout");
  revalidatePath("/");
}

export async function processRefund(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = str(formData, "refund");
  if (!UUID.test(id)) return;
  await supabase.rpc("admin_process_refund", {
    p_refund_id: id,
    p_approve: formData.get("approve") === "1",
    p_note: str(formData, "note") || "",
  });
  revalidatePath("/admin", "layout");
}

export async function addBreed(formData: FormData) {
  const { supabase } = await requireAdmin();
  const name = str(formData, "name");
  const category = Number(formData.get("category"));
  if (!name || !Number.isInteger(category)) return;
  await supabase.from("breeds").insert({
    category_id: category,
    name,
    is_cites: formData.get("is_cites") === "on",
    is_banned: formData.get("is_banned") === "on",
    requires_review: formData.get("requires_review") === "on",
    sort_order: 900,
  });
  revalidatePath("/admin/settings");
}

export async function toggleBreedFlag(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = Number(formData.get("breed"));
  const flag = str(formData, "flag") as "is_cites" | "is_banned" | "requires_review";
  if (!Number.isInteger(id) || !["is_cites", "is_banned", "requires_review"].includes(flag)) return;
  const value = formData.get("value") === "1";
  const patch = flag === "is_cites" ? { is_cites: value } : flag === "is_banned" ? { is_banned: value } : { requires_review: value };
  await supabase.from("breeds").update(patch).eq("id", id);
  revalidatePath("/admin/settings");
}

export async function addBannedWord(formData: FormData) {
  const { supabase } = await requireAdmin();
  const pattern = str(formData, "pattern");
  const label = str(formData, "label");
  const action = str(formData, "action") === "block" ? "block" : "warn";
  const scope = (["post", "chat", "all"].includes(str(formData, "scope")) ? str(formData, "scope") : "all") as "post" | "chat" | "all";
  const isRegex = formData.get("is_regex") === "on";
  if (!pattern || !label) return;
  if (isRegex) {
    try {
      new RegExp(pattern);
    } catch {
      return;
    }
  }
  await supabase.from("banned_words").insert({ pattern, label, action, scope, is_regex: isRegex });
  revalidatePath("/admin/settings");
}

export async function deleteBannedWord(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = Number(formData.get("word"));
  if (!Number.isInteger(id)) return;
  await supabase.from("banned_words").delete().eq("id", id);
  revalidatePath("/admin/settings");
}

export async function setTestMode(formData: FormData) {
  const { supabase } = await requireAdmin();
  await supabase
    .from("app_settings")
    .update({ value: formData.get("value") === "1", updated_at: new Date().toISOString() })
    .eq("key", "test_mode");
  revalidatePath("/", "layout");
}
