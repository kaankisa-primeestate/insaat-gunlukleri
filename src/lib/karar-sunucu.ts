import "server-only";
import type { Oturum } from "./oturum";
import type { Rol } from "./sabitler";
import type { TaseronSecenek } from "@/components/secimler";
import { yerler } from "./yerler-sunucu";

/**
 * Karar formunun seçenekleri. Merkez tarafı şantiyedeki bütün taşeronları ve
 * personeli seçer; taşeron yalnız kendi alt taşeronlarını (kural veritabanında da).
 */
export async function kararSecenekleri(o: Oturum) {
  const s = o.santiye!;
  const [{ data: taseronlar }, { data: personel }, yerListesi] = await Promise.all([
    o.supabase.rpc("santiye_taseronlari", { p_santiye: s.id }),
    o.taseron ? Promise.resolve({ data: [] }) : o.supabase.rpc("santiye_personeli", { p_santiye: s.id }),
    yerler(o),
  ]);
  const liste = ((taseronlar ?? []) as (TaseronSecenek & { ust_taseron_id: string | null })[]).filter(
    (t) => !o.taseron || t.ust_taseron_id === o.profil.taseron_id,
  );
  return {
    taseronlar: liste as TaseronSecenek[],
    personel: (personel ?? []) as { id: string; ad_soyad: string; rol: Rol }[],
    yerler: yerListesi,
  };
}
