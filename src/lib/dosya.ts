import "server-only";
import { supabaseYonetici } from "./supabase/server";

/**
 * Depodaki dosyalar için süreli imzalı adres üretir. Yalnızca RLS ile
 * okunmuş satırlardan gelen yollarla çağrılmalıdır; yetki denetimi o
 * okumadadır.
 */
export async function imzala(yollar: string[]): Promise<Record<string, string>> {
  const tekil = [...new Set(yollar.filter(Boolean))];
  if (!tekil.length) return {};
  const { data } = await supabaseYonetici().storage.from("dosyalar").createSignedUrls(tekil, 60 * 60);
  const sonuc: Record<string, string> = {};
  for (const d of data ?? []) if (d.path && d.signedUrl) sonuc[d.path] = d.signedUrl;
  return sonuc;
}
