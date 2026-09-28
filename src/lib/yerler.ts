import { katListesi } from "./sabitler";

/** Şantiyenin bir alanı: bina/blok ya da çevre alanı (otopark, peyzaj…). */
export type SantiyeAlani = {
  id?: string;
  tur: "blok" | "cevre";
  ad: string;
  bodrum: number;
  zemin: boolean;
  kat: number;
  cati: boolean;
};

/** Seçim penceresindeki bir yer seçeneği. */
export type Yer = { deger: string; ad: string; grup?: string; secimAdi?: string };

/** Alanın katları; hiç kat yoksa alan tek parçadır (boş liste). */
export function alanKatlari(a: Pick<SantiyeAlani, "bodrum" | "zemin" | "kat" | "cati">): string[] {
  const liste: string[] = [];
  for (let i = a.bodrum; i >= 1; i--) liste.push(`${i}. Bodrum`);
  if (a.zemin) liste.push("Zemin");
  for (let i = 1; i <= a.kat; i++) liste.push(`${i}. Kat`);
  if (a.cati) liste.push("Çatı");
  return liste;
}

/** "2. Bodrum – 5. Kat, Çatı" gibi kısa özet. */
export function alanOzeti(a: SantiyeAlani): string {
  const k = alanKatlari(a);
  if (!k.length) return "tek parça";
  return k.length === 1 ? k[0] : `${k[0]} – ${k[k.length - 1]} (${k.length} kat)`;
}

/**
 * Günlük ve hatalı işteki "Yer" seçenekleri. Tek bloklu şantiyede blok adı
 * yazılmaz ("3. Kat"), çok bloklu şantiyede yazılır ("A Blok · 3. Kat");
 * çevre alanları her zaman adıyla. Tarifi olmayan eski şantiye eski kat
 * listesine düşer.
 */
export function yerSecenekleri(
  alanlar: SantiyeAlani[],
  eski: { bodrum_kat: number; kat_sayisi: number },
): Yer[] {
  if (!alanlar.length) return katListesi(eski.bodrum_kat, eski.kat_sayisi).map((k) => ({ deger: k, ad: k }));
  const blokSayisi = alanlar.filter((a) => a.tur === "blok").length;
  // Sıra: bloklar, katlı çevre alanları (otopark…), en sonda tek parça alanlar.
  const sirali = [
    ...alanlar.filter((a) => a.tur === "blok"),
    ...alanlar.filter((a) => a.tur === "cevre" && alanKatlari(a).length),
    ...alanlar.filter((a) => a.tur === "cevre" && !alanKatlari(a).length),
  ];
  return sirali.flatMap((a) => {
    const katlar = alanKatlari(a);
    if (!katlar.length) return [{ deger: a.ad, ad: a.ad, grup: "Çevre alanları" }];
    const tekBina = a.tur === "blok" && blokSayisi === 1;
    return katlar.map((k) => {
      const deger = tekBina ? k : `${a.ad} · ${k}`;
      return { deger, ad: k, grup: tekBina ? "Bina" : a.ad, secimAdi: deger };
    });
  });
}

/** Kayıttaki değer listede yoksa (şantiye sonradan değişmiş) yine görünsün. */
export function eksikleriEkle(yerler: Yer[], kayittakiler: (string | null | undefined)[]): Yer[] {
  const ek = kayittakiler
    .filter((k): k is string => !!k && !yerler.some((y) => y.deger === k))
    .map((k) => ({ deger: k, ad: k, grup: "Önceki kayıt" }));
  return [...yerler, ...ek];
}
