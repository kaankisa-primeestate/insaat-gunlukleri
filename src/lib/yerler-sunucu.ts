import "server-only";
import type { Oturum } from "./oturum";
import { yerSecenekleri, type SantiyeAlani, type Yer } from "./yerler";

/** Seçili şantiyenin etkin alanları, sırasıyla. */
export async function santiyeAlanlari(o: Oturum, santiyeId: string): Promise<SantiyeAlani[]> {
  const { data } = await o.supabase
    .from("santiye_alanlari")
    .select("id, tur, ad, bodrum, zemin, kat, cati")
    .eq("santiye_id", santiyeId)
    .eq("aktif", true)
    .order("sira");
  return (data ?? []) as SantiyeAlani[];
}

/** Formlardaki "Yer" seçenekleri, seçili şantiye için. */
export async function yerler(o: Oturum): Promise<Yer[]> {
  if (!o.santiye) return [];
  return yerSecenekleri(await santiyeAlanlari(o, o.santiye.id), o.santiye);
}
