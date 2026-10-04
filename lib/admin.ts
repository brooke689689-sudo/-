import { notFound, redirect } from "next/navigation";
import { getViewer } from "@/lib/auth";

export async function requireAdmin() {
  const viewer = await getViewer();
  if (!viewer.user) redirect("/login?next=/admin");
  const { data: status } = await viewer.supabase
    .from("account_status")
    .select("is_admin")
    .eq("user_id", viewer.user.id)
    .maybeSingle();
  if (!status?.is_admin) notFound();
  const { data: aal } = await viewer.supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal?.currentLevel !== "aal2") redirect("/admin/mfa");
  return viewer as typeof viewer & { user: NonNullable<typeof viewer.user> };
}
