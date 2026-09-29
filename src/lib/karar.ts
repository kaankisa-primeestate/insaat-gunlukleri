import "server-only";
import type { Oturum } from "./oturum";

/** Kararın muhatabı: bir kişi ya da bir taşeron firma; okuduysa ne zaman, kim. */
export type Muhatap = {
  id: string;
  kullanici_id: string | null;
  taseron_id: string | null;
  okundu: string | null;
  kisi: { ad_soyad: string } | null;
  taseronlar: { firma_adi: string } | null;
  okuyan_kisi: { ad_soyad: string } | null;
};

export type Karar = {
  id: string;
  is_tarihi: string;
  yer: string | null;
  daire: string | null;
  mahal: string | null;
  konu: string | null;
  karar: string;
  fotograflar: string[];
  dis_katilimcilar: string[];
  onceki_id: string | null;
  degisti: boolean;
  olusturan: string;
  olusturan_taseron: string | null;
  olusturma: string;
  duzenleme: string | null;
  profiller: { ad_soyad: string } | null;
  karar_muhataplari: Muhatap[];
};

export const KARAR_ALANLARI =
  "id, is_tarihi, yer, daire, mahal, konu, karar, fotograflar, dis_katilimcilar, onceki_id, degisti, olusturan, olusturan_taseron, olusturma, duzenleme, " +
  "profiller!kararlar_olusturan_fkey(ad_soyad), " +
  "karar_muhataplari(id, kullanici_id, taseron_id, okundu, kisi:profiller!karar_muhataplari_kullanici_id_fkey(ad_soyad), taseronlar(firma_adi), okuyan_kisi:profiller!karar_muhataplari_okuyan_fkey(ad_soyad))";

/** Biri okuduysa ya da yerine yenisi geldiyse içerik kilitlidir (veritabanındaki karar_kilitli). */
export const kilitli = (k: Karar) => k.degisti || k.karar_muhataplari.some((m) => m.okundu);

/** Kaydı giren, kilitlenmeden önce düzeltir. */
export const duzeltebilir = (o: Oturum, k: Karar) => k.olusturan === o.profil.id && !kilitli(k);

/** Silme: kilitlenmeden önce kaydı giren; sonra yalnız merkez. */
export const silebilir = (o: Oturum, k: Karar) => o.merkez || duzeltebilir(o, k);

/** Yeni sürüm ("Kararı değiştir"): merkez tarafı her karar için, taşeron kendi açtığı için. */
export const degistirebilir = (o: Oturum, k: Karar) =>
  !k.degisti && o.yetki("karar", true) && (!o.taseron || k.olusturan_taseron === o.profil.taseron_id);

/** Bu kullanıcının onay bekleyen muhatap satırı var mı. */
export const onayBekliyor = (o: Oturum, k: Karar) =>
  !k.degisti &&
  k.karar_muhataplari.some(
    (m) => !m.okundu && (m.kullanici_id === o.profil.id || (m.taseron_id != null && m.taseron_id === o.profil.taseron_id)),
  );
