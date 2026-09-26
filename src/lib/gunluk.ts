import "server-only";
import type { Oturum } from "./oturum";

const GUN_MS = 24 * 60 * 60 * 1000;

/**
 * Günlüğü düzenleme/silme hakkı: merkez her zaman, kaydı giren kişi 24 saat
 * içinde. Veritabanındaki kuralın (RLS) aynısı; ekranda düğmeyi göstermek için.
 */
export function gunlukDegisebilir(o: Oturum, g: { olusturan: string; olusturma: string }) {
  if (o.merkez) return true;
  return g.olusturan === o.profil.id && Date.now() - Date.parse(g.olusturma) < GUN_MS && o.yetki("gunluk", true);
}
