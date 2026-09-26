import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { SUPABASE_URL, SUPABASE_KEY, supabaseHazir } from "@/lib/supabase/env";

const ACIK_YOLLAR = ["/giris", "/kurulum"];

// Oturum çerezini tazeler, girişi olmayanı giriş ekranına yollar.
export async function proxy(request: NextRequest) {
  if (!supabaseHazir) return NextResponse.next();

  let response = NextResponse.next({ request });
  const supabase = createServerClient(SUPABASE_URL, SUPABASE_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(list) {
        for (const { name, value } of list) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of list) response.cookies.set(name, value, options);
      },
    },
  });

  const { data } = await supabase.auth.getClaims();
  const girisli = Boolean(data?.claims);
  const yol = request.nextUrl.pathname;
  const acik = ACIK_YOLLAR.some((y) => yol === y || yol.startsWith(y + "/"));

  if (!girisli && !acik) {
    const url = request.nextUrl.clone();
    url.pathname = "/giris";
    url.search = "";
    return NextResponse.redirect(url);
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|ikon.*|.*\\.(?:png|svg|jpg|ico)$).*)"],
};
