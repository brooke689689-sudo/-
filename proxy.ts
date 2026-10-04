import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/lib/database.types";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "@/lib/config";

const ONBOARDING_FREE = ["/welcome", "/auth", "/login", "/policy"];

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) response.cookies.set(name, value, options);
      },
    },
  });

  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  const path = request.nextUrl.pathname;

  if (userId && !ONBOARDING_FREE.some((p) => path === p || path.startsWith(p + "/"))) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarded_at, withdrawn_at")
      .eq("id", userId)
      .maybeSingle();
    if (profile?.withdrawn_at) {
      await supabase.auth.signOut();
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.search = "?error=withdrawn";
      const redirect = NextResponse.redirect(url);
      for (const c of response.cookies.getAll()) redirect.cookies.set(c);
      return redirect;
    }
    if (profile && !profile.onboarded_at) {
      const url = request.nextUrl.clone();
      url.pathname = "/welcome";
      url.search = `?next=${encodeURIComponent(path + request.nextUrl.search)}`;
      const redirect = NextResponse.redirect(url);
      for (const c of response.cookies.getAll()) redirect.cookies.set(c);
      return redirect;
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next|assets|icon-|logo\\.jpg|favicon).*)"],
};
