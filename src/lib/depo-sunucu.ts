import "server-only";
import { redirect } from "next/navigation";
import { oturum, type Oturum } from "./oturum";

/** Depo yalnız şirket tarafına açık; taşeron hiçbir durumda giremez. */
export async function depoIste(duzen = false) {
  const o = await oturum();
  if (o.taseron || !o.yetki("depo", duzen)) redirect("/?yetki=yok");
  return o;
}

/** Yer seçimi: tanımlı depolar ve daha önce elle yazılmış yerler. */
export async function yerSecenekleri(o: Oturum) {
  const [{ data: depolar }, { data: yerler }] = await Promise.all([
    o.supabase.from("depolar").select("id, ad").eq("aktif", true).order("ad"),
    o.supabase.from("depo_kalemleri").select("yer_adi").not("yer_adi", "is", null).order("olusturma", { ascending: false }).limit(300),
  ]);
  return {
    depolar: (depolar ?? []) as { id: string; ad: string }[],
    oncekiYerler: [...new Set((yerler ?? []).map((y) => y.yer_adi as string))].slice(0, 20),
  };
}

/** Kime verildi / kim getirdi: taşeronlar, şirket çalışanları ve daha önce yazılan adlar. */
export async function kisiSecenekleri(o: Oturum) {
  const [{ data: taseronlar }, { data: kisiler }, { data: onceki }] = await Promise.all([
    o.supabase.from("taseronlar").select("firma_adi").eq("aktif", true).order("firma_adi"),
    o.supabase.from("profiller").select("ad_soyad").eq("aktif", true).neq("rol", "taseron").order("ad_soyad"),
    o.supabase.from("depo_hareketleri").select("kime").not("kime", "is", null).order("olusturma", { ascending: false }).limit(300),
  ]);
  const tas = (taseronlar ?? []).map((t) => t.firma_adi as string);
  const kis = (kisiler ?? []).map((k) => k.ad_soyad as string);
  const bilinen = new Set([...tas, ...kis]);
  return {
    taseronlar: tas,
    kisiler: kis,
    oncekiAdlar: [...new Set((onceki ?? []).map((h) => h.kime as string))].filter((k) => !bilinen.has(k)).slice(0, 20),
  };
}
