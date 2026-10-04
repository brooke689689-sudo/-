export const SUPABASE_URL = "https://jagppizmcbjolczlgwnm.supabase.co";
export const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_NAlK0pdx2GVgFDmusEEMaA_uVq_YEd3";

export const PAGE_SIZE = 30;

export function publicMediaUrl(path: string) {
  if (path.startsWith("/") || path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${SUPABASE_URL}/storage/v1/object/public/post-media/${path}`;
}
