import "server-only";
import type { Oturum } from "./oturum";

/**
 * Bu şantiyenin önceki taleplerinde elle yazılmış "kimin için" adları ve
 * ürünler; formda "Daha önce yazılanlar" olarak çıkar, herkes aynı yazımı
 * kullanır. Ayrı liste tutulmaz, talepler kendisi kaynaktır.
 */
export async function oncekiTalepler(o: Oturum) {
  if (!o.santiye) return { oncekiAdlar: [], oncekiUrunler: [] };
  const { data } = await o.supabase
    .from("talepler")
    .select("taseron_adi, urun")
    .eq("santiye_id", o.santiye.id)
    .order("olusturma", { ascending: false })
    .limit(300);
  const tekil = (liste: (string | null)[]) => [...new Set(liste.filter((x): x is string => Boolean(x)))].slice(0, 20);
  return {
    oncekiAdlar: tekil((data ?? []).map((t) => t.taseron_adi)),
    oncekiUrunler: tekil((data ?? []).map((t) => t.urun)),
  };
}
