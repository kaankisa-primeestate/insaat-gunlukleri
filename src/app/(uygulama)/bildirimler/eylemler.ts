"use server";

import { revalidatePath } from "next/cache";
import { oturum } from "@/lib/oturum";
import { supabaseYonetici } from "@/lib/supabase/server";
import { BILDIRIM_TURLERI, denemeBildirimi } from "@/lib/bildirim";
import type { FormDurumu } from "@/components/form";

/** Bu telefonun aboneliği; aynı telefon başka kullanıcıyla açılmışsa yeni kullanıcıya geçer. */
export async function abonelikKaydet(abonelik: { endpoint: string; keys?: { p256dh?: string; auth?: string } }, cihaz: string) {
  const o = await oturum();
  const { endpoint, keys } = abonelik ?? {};
  if (typeof endpoint !== "string" || !endpoint.startsWith("https://") || !keys?.p256dh || !keys.auth) return { hata: "Geçersiz abonelik." };
  const db = supabaseYonetici();
  await db.from("bildirim_abonelikleri").delete().eq("endpoint", endpoint);
  const { error } = await db
    .from("bildirim_abonelikleri")
    .insert({ kullanici_id: o.profil.id, endpoint, p256dh: keys.p256dh, auth: keys.auth, cihaz: String(cihaz).slice(0, 120) });
  if (error) return { hata: error.message };
  revalidatePath("/bildirimler");
  return { tamam: true };
}

export async function abonelikSil(endpoint: string) {
  const o = await oturum();
  await o.supabase.from("bildirim_abonelikleri").delete().eq("endpoint", endpoint);
  revalidatePath("/bildirimler");
}

export async function denemeGonder(): Promise<FormDurumu> {
  const o = await oturum();
  const n = await denemeBildirimi(o.profil.id);
  return n ? { tamam: "Deneme bildirimi gönderildi; birkaç saniye içinde telefona düşer." } : { hata: "Bu hesapta bildirimi açık telefon yok." };
}

/** Hangi türler kapalı, sessiz saatler. İşaretli olmayan tür kapalı sayılır. */
export async function tercihKaydet(_: FormDurumu, form: FormData): Promise<FormDurumu> {
  const o = await oturum();
  const acik = new Set(form.getAll("acik").map(String));
  const kapali = Object.keys(BILDIRIM_TURLERI).filter((t) => !acik.has(t));
  const saat = (ad: string, v: number) => {
    const n = Number(form.get(ad));
    return Number.isInteger(n) && n >= 0 && n <= 23 ? n : v;
  };
  const { error } = await o.supabase.from("bildirim_tercihleri").upsert({
    kullanici_id: o.profil.id,
    kapali,
    sessiz: form.get("sessiz") === "1",
    sessiz_bas: saat("sessiz_bas", 20),
    sessiz_bit: saat("sessiz_bit", 7),
  });
  if (error) return { hata: error.message };
  revalidatePath("/bildirimler");
  return { tamam: "Kaydedildi." };
}
