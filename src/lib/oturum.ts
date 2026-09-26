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

export const SANTIYE_CEREZI = "santiye";

/**
 * Oturum bilgisi: kullanıcı, firma, erişilen şantiyeler, seçili şantiye ve
 * yetkiler. İstek başına bir kez okunur.
 */
export const oturum = cache(async () => {
  const supabase = await supabaseSunucu();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/giris");

  const { data: profil } = await supabase
    .from("profiller")
    .select("id, firma_id, kullanici_adi, ad_soyad, rol, taseron_id")
    .eq("id", auth.user.id)
    .eq("aktif", true)
    .maybeSingle<Profil>();
  if (!profil) redirect("/giris?hata=pasif");

  const [{ data: firma }, { data: santiyeler }, { data: yetkiSatirlari }] = await Promise.all([
    supabase.from("firmalar").select("id, ad").eq("id", profil.firma_id).single(),
    supabase.from("santiyeler").select("id, ad, bodrum_kat, kat_sayisi, aktif").eq("aktif", true).order("ad"),
    profil.rol === "taseron"
      ? supabase.from("yetkiler").select("sayfa, gorur, duzenler").eq("taseron_id", profil.taseron_id!)
      : supabase.from("yetkiler").select("sayfa, gorur, duzenler").eq("kullanici_id", profil.id),
  ]);

  const liste = (santiyeler ?? []) as Santiye[];
  const cerez = (await cookies()).get(SANTIYE_CEREZI)?.value;
  const secili = liste.find((s) => s.id === cerez) ?? liste[0] ?? null;

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
