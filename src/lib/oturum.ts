import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { supabaseSunucu } from "./supabase/server";
import type { Rol, Sayfa } from "./sabitler";
import { varsayilanYetki } from "./sabitler";

export type Profil = {
  id: string;
  firma_id: string;
  kullanici_adi: string;
  ad_soyad: string;
  rol: Rol;
  taseron_id: string | null;
};

export type Santiye = { id: string; ad: string; bodrum_kat: number; kat_sayisi: number; aktif: boolean };

export { SANTIYE_CEREZI } from "./santiye-cerezi";
import { SANTIYE_CEREZI } from "./santiye-cerezi";

/**
 * Oturum bilgisi: kullanıcı, firma, erişilen şantiyeler, seçili şantiye ve
 * yetkiler. İstek başına bir kez okunur. Şantiye seçimi zorlanmaz; bunu
 * `oturum` yapar. Yalnızca şantiye seçim ekranı bunu doğrudan kullanır.
 */
export const oturumTemel = cache(async () => {
  const supabase = await supabaseSunucu();
  // Kimlik, oturum anahtarının imzası doğrulanarak okunur; kimlik sunucusuna
  // her sayfada ayrıca gidilmez. Pasif hesap aşağıdaki profil sorgusunda elenir.
  const { data: kimlik } = await supabase.auth.getClaims();
  const kullaniciId = kimlik?.claims?.sub;
  if (!kullaniciId) redirect("/giris");

  // Tüm oturum bilgisi tek turda, paralel: veritabanına sırayla gidilmez.
  // Firma ve yetki satırlarını RLS zaten kullanıcının kendisine süzer.
  const [{ data: profil }, { data: firma }, { data: santiyeler }, { data: yetkiHepsi }] = await Promise.all([
    supabase
      .from("profiller")
      .select("id, firma_id, kullanici_adi, ad_soyad, rol, taseron_id")
      .eq("id", kullaniciId)
      .eq("aktif", true)
      .maybeSingle<Profil>(),
    supabase.from("firmalar").select("id, ad").maybeSingle(),
    supabase.from("santiyeler").select("id, ad, bodrum_kat, kat_sayisi, aktif").eq("aktif", true).order("ad"),
    supabase.from("yetkiler").select("sayfa, gorur, duzenler, kullanici_id, taseron_id"),
  ]);
  if (!profil || !firma) redirect("/giris?hata=pasif");
  const yetkiSatirlari = (yetkiHepsi ?? []).filter((y) =>
    profil.rol === "taseron" ? y.taseron_id === profil.taseron_id : y.kullanici_id === profil.id,
  );

  const liste = (santiyeler ?? []) as Santiye[];
  // Şantiye girişte bir kez seçilir (çerez). Tek şantiyesi olan seçmez.
  const cerez = (await cookies()).get(SANTIYE_CEREZI)?.value;
  const secili = liste.find((s) => s.id === cerez) ?? (liste.length === 1 ? liste[0] : null);

  const ozel = new Map((yetkiSatirlari ?? []).map((y) => [y.sayfa as Sayfa, y]));
  function yetki(sayfa: Sayfa, duzen = false) {
    if (profil!.rol === "merkez") return true;
    const y = ozel.get(sayfa);
    if (!y) return varsayilanYetki(profil!.rol, sayfa, duzen);
    return duzen ? y.duzenler : y.gorur;
  }

  return {
    supabase,
    profil,
    firma: firma as { id: string; ad: string },
    santiyeler: liste,
    santiye: secili,
    yetki,
    merkez: profil.rol === "merkez",
    taseron: profil.rol === "taseron",
  };
});

/**
 * Uygulama sayfalarının oturumu. Birden çok şantiyesi olup henüz seçmemiş
 * kullanıcı şantiye seçim ekranına gönderilir.
 */
export const oturum = cache(async () => {
  const o = await oturumTemel();
  if (!o.santiye && o.santiyeler.length > 1) redirect("/santiye-sec");
  return o;
});

export type Oturum = Awaited<ReturnType<typeof oturum>>;

/** Sayfayı görme yetkisi yoksa ana sayfaya döndürür. */
export async function yetkiIste(sayfa: Sayfa, duzen = false) {
  const o = await oturum();
  if (!o.yetki(sayfa, duzen)) redirect("/?yetki=yok");
  return o;
}

export async function merkezIste() {
  const o = await oturum();
  if (!o.merkez) redirect("/?yetki=yok");
  return o;
}
