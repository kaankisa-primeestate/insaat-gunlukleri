import "server-only";
import type { Oturum } from "@/lib/oturum";
import { bugun } from "@/lib/sabitler";

/**
 * Ana sayfanın gösterdiği her şey. Tasarımlar (bugun-karti, grafit) yalnızca
 * bunu çizer; veri tek yerde toplanır, tasarım değiştirmek sorgulara dokunmaz.
 */
export type AnaSayfaVerisi = {
  ad: string;
  basHarfler: string;
  selam: string;
  firma: string;
  santiye: string | null;
  tarih: string;
  merkez: boolean;
  /** Bölümler; yetkisi olmayanınki null. */
  gunluk: { girilen: number; toplam: number; bekleyenler: string[] } | null;
  hata: number | null;
  talep: number | null;
  teslimat: number | null;
  gecikenler: { firma: string; metin: string }[];
  firmaBag: { href: string; ad: string };
};

export async function anaSayfaVerisi(o: Oturum): Promise<AnaSayfaVerisi> {
  const s = o.santiye;
  const gun = bugun();

  const [hatalar, talepler, teslimatlar, taseronlar, gunlukler] = s
    ? await Promise.all([
        o.yetki("hatali")
          ? o.supabase.from("hatali_isler").select("id", { count: "exact", head: true }).eq("santiye_id", s.id).neq("durum", "onaylandi")
          : null,
        o.yetki("talep")
          ? o.supabase.from("talepler").select("id", { count: "exact", head: true }).eq("santiye_id", s.id).not("durum", "in", "(teslim_alindi,kapandi)")
          : null,
        o.yetki("teslimat") ? o.supabase.rpc("teslimat_yogunluk", { p_santiye: s.id, p_tarih: gun }) : null,
        o.supabase.rpc("santiye_taseronlari", { p_santiye: s.id }),
        o.yetki("gunluk") ? o.supabase.from("gunlukler").select("taseron_id").eq("santiye_id", s.id).eq("is_tarihi", gun) : null,
      ])
    : [null, null, null, null, null];

  const liste = (taseronlar?.data ?? []) as { id: string; firma_adi: string; gecikme: number | null }[];
  const girenler = new Set((gunlukler?.data ?? []).map((g) => g.taseron_id as string));

  const ad = o.profil.ad_soyad.trim();
  const saat = Number(new Intl.DateTimeFormat("en-GB", { hour: "numeric", hourCycle: "h23", timeZone: "Europe/Istanbul" }).format(new Date()));
  const selam = saat < 5 ? "İyi geceler" : saat < 12 ? "Günaydın" : saat < 18 ? "İyi günler" : "İyi akşamlar";

  return {
    ad: ad.split(/\s+/)[0],
    basHarfler: ad
      .split(/\s+/)
      .slice(0, 2)
      .map((k) => k[0]?.toLocaleUpperCase("tr-TR") ?? "")
      .join(""),
    selam,
    firma: o.firma.ad,
    santiye: s?.ad ?? null,
    tarih: new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "long", weekday: "long", timeZone: "Europe/Istanbul" }).format(new Date()),
    merkez: o.merkez,
    gunluk:
      s && gunlukler
        ? {
            girilen: liste.filter((t) => girenler.has(t.id)).length,
            toplam: liste.length,
            bekleyenler: liste.filter((t) => !girenler.has(t.id)).map((t) => t.firma_adi),
          }
        : null,
    hata: hatalar ? (hatalar.count ?? 0) : null,
    talep: talepler ? (talepler.count ?? 0) : null,
    teslimat: teslimatlar ? ((teslimatlar.data ?? []) as { adet: number }[]).reduce((a, b) => a + Number(b.adet), 0) : null,
    gecikenler: liste
      .filter((t) => t.gecikme != null && t.gecikme <= 7)
      .map((t) => ({
        firma: t.firma_adi,
        metin: t.gecikme! < 0 ? `${-t.gecikme!} gün gecikti` : t.gecikme === 0 ? "bugün bitiyor" : `${t.gecikme} gün kaldı`,
      })),
    firmaBag: o.taseron ? { href: `/taseronlar/${o.profil.taseron_id}`, ad: "Firmam" } : { href: "/taseronlar", ad: "Taşeronlar" },
  };
}
