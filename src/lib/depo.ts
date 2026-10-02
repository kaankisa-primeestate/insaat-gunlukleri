/** Depo: firmaya ait malzeme ve demirbaş dosyaları (göç 16). */

export type DepoKalemi = {
  id: string;
  ad: string;
  ozellik: string | null;
  birim: string;
  depoda: number;
  disarida: number;
  depo_id: string | null;
  yer_adi: string | null;
  fotograflar: string[];
  notu: string | null;
  kapandi: boolean;
  olusturma: string;
  depolar: { ad: string } | null;
};

export const KALEM_ALANLARI = "id, ad, ozellik, birim, depoda, disarida, depo_id, yer_adi, fotograflar, notu, kapandi, olusturma, depolar(ad)";

export type HareketTuru = "kayit" | "giris" | "ver" | "geri" | "kullanildi" | "yer" | "sayim" | "duzeltme" | "kapat" | "ac";

export type DepoHareketi = {
  id: number;
  sira: number;
  tur: HareketTuru;
  miktar: number | null;
  kime: string | null;
  durum: string | null;
  notu: string | null;
  eski: Record<string, string | number> | null;
  yeni: Record<string, string | number> | null;
  depoda: number;
  disarida: number;
  olusturma: string;
  santiyeler: { ad: string } | null;
  profiller: { ad_soyad: string } | null;
};

export const HAREKET_ALANLARI =
  "id, sira, tur, miktar, kime, durum, notu, eski, yeni, depoda, disarida, olusturma, santiyeler(ad), profiller!depo_hareketleri_olusturan_fkey(ad_soyad)";

/** Hareket sayfasındaki seçenekler; sıra sahadaki sıklığa göre. */
export const HAREKETLER = {
  ver: { ad: "Ver", baslik: "Ver", aciklama: "Kime, hangi şantiyeye verildi" },
  geri: { ad: "Geri al", baslik: "Geri Al", aciklama: "Kim getirdi, ne durumda" },
  kullanildi: { ad: "Kullanıldı", baslik: "Kullanıldı", aciklama: "Sarf malzemesi tükendi" },
  giris: { ad: "Depoya ekle", baslik: "Depoya Ekle", aciklama: "Aynı malzemeden yenisi geldi" },
  yer: { ad: "Yer değiştir", baslik: "Yer Değiştir", aciklama: "Başka depoya / yere taşındı" },
  sayim: { ad: "Miktarı düzelt", baslik: "Miktarı Düzelt", aciklama: "Sayınca farklı çıktı" },
  kapat: { ad: "Elden çıktı", baslik: "Elden Çıktı", aciklama: "Satıldı, hurdaya çıktı, kayboldu" },
  ac: { ad: "Yeniden aç", baslik: "Yeniden Aç", aciklama: "Kapanan kayıt geri geldi" },
} as const;
export type HareketKodu = keyof typeof HAREKETLER;

export const sayi = (n: number) => Number(n).toLocaleString("tr-TR", { maximumFractionDigits: 2 });
export const miktarYaz = (n: number, birim: string) => `${sayi(n)} ${birim}`;
export const yerYazisi = (k: Pick<DepoKalemi, "depolar" | "yer_adi">) => k.depolar?.ad ?? k.yer_adi ?? "—";

/** Revizyonun bir cümlelik özeti ("6 paket verildi → Yılmaz Kalıp"). */
export function hareketYazisi(h: DepoHareketi, birim: string): string {
  const m = h.miktar != null ? miktarYaz(h.miktar, birim) : "";
  const santiye = h.santiyeler ? ` · ${h.santiyeler.ad}` : "";
  switch (h.tur) {
    case "kayit":
      return `Kaydedildi · ${m}${h.yeni?.yer ? ` · ${h.yeni.yer}` : ""}`;
    case "giris":
      return `${m} depoya eklendi`;
    case "ver":
      return `${m} verildi → ${h.kime}${santiye}`;
    case "geri":
      return `${m} geri geldi ← ${h.kime}${h.durum ? ` · ${h.durum}` : ""}`;
    case "kullanildi":
      return `${m} kullanıldı${santiye}`;
    case "yer":
      return `Yeri değişti: ${h.eski?.yer ?? "—"} → ${h.yeni?.yer ?? "—"}`;
    case "sayim":
      return `Miktar düzeltildi: ${sayi(Number(h.eski?.depoda ?? 0))} → ${miktarYaz(Number(h.yeni?.depoda ?? 0), birim)}`;
    case "duzeltme":
      return "Kayıt düzeltildi";
    case "kapat":
      return "Elden çıktı, kayıt kapandı";
    case "ac":
      return "Kayıt yeniden açıldı";
  }
}

/** Dışarıda kimde ne kadar var: verilen − geri gelen, kişi/firma adına göre. */
export function kimdeNeVar(hareketler: DepoHareketi[]): { kime: string; miktar: number; son: string }[] {
  const harita = new Map<string, { kime: string; miktar: number; son: string }>();
  for (const h of [...hareketler].sort((a, b) => a.sira - b.sira)) {
    if ((h.tur !== "ver" && h.tur !== "geri") || !h.kime || h.miktar == null) continue;
    const anahtar = h.kime.trim().toLocaleLowerCase("tr");
    const k = harita.get(anahtar) ?? { kime: h.kime, miktar: 0, son: h.olusturma };
    k.miktar += h.tur === "ver" ? Number(h.miktar) : -Number(h.miktar);
    if (h.tur === "ver") k.son = h.olusturma;
    harita.set(anahtar, k);
  }
  return [...harita.values()].filter((k) => k.miktar > 0.0001);
}

/** "bugün", "1 gündür", "12 gündür" (Türkiye saatine göre takvim günü). */
export function kacGundur(t: string): string {
  const gunu = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul" }).format(d);
  const fark = Math.round((Date.parse(gunu(new Date())) - Date.parse(gunu(new Date(t)))) / 864e5);
  return fark <= 0 ? "bugün" : `${fark} gündür`;
}
