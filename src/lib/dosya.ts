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

/**
 * Kayıttan çıkarılan fotoğrafları depodan siler. Yollar, RLS ile okunmuş
 * eski satırdan gelir; çağrı ancak düzeltme ya da silme başarılıysa yapılır.
 */
export async function artikFotolariSil(eski: string[] | null | undefined, yeni: string[]) {
  const kalan = new Set(yeni);
  const silinecek = (eski ?? []).filter((y) => y && !kalan.has(y));
  if (silinecek.length) await supabaseYonetici().storage.from("dosyalar").remove(silinecek);
}
