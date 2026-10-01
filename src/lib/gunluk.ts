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

/**
 * Hatalı iş ve talep için aynı kural, bir ek şartla: kayıt henüz işlem
 * görmemiş olmalı (hatalı iş "Tespit", talep "Açıldı"). Merkez her zaman.
 * Veritabanındaki `icerik_degisebilir` ile aynı.
 */
export function kayitDegisebilir(
  o: Oturum,
  k: { olusturan: string; olusturma: string },
  ilkDurumda: boolean,
  sayfa: "hatali" | "talep",
) {
  if (o.merkez) return true;
  return k.olusturan === o.profil.id && Date.now() - Date.parse(k.olusturma) < GUN_MS && ilkDurumda && o.yetki(sayfa, true);
}

/** Revizyon notu: silinmez; yazan 24 saat içinde, merkez her zaman düzeltir. */
export function revizyonDegisebilir(o: Oturum, n: { olusturan: string; olusturma: string }) {
  if (o.merkez) return true;
  return n.olusturan === o.profil.id && Date.now() - Date.parse(n.olusturma) < GUN_MS;
}
