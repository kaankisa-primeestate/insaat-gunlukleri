"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { oturum } from "@/lib/oturum";
import { uuidMi, veritabaniHatasi } from "@/lib/denetim";
import { artikFotolariSil } from "@/lib/dosya";
import type { FormDurumu } from "@/components/form";
import { kararYaz } from "@/lib/kayit/karar";

/**
 * Yeni karar, yeni sürüm ("onceki" doluysa) ya da okunmamış kararın
 * düzeltilmesi ("duzenle"). Muhataplar "t:<taşeron>" / "k:<kişi>" gelir.
 */
export async function kararKaydet(_: FormDurumu, form: FormData): Promise<FormDurumu> {
  const s = await kararYaz(await oturum(), form);
  if (s.git) redirect(s.git);
  return s;
}

export async function kararSil(_: FormDurumu, form: FormData): Promise<FormDurumu> {
  const o = await oturum();
  const id = form.get("id");
  if (!uuidMi(id)) return { hata: "Geçersiz istek." };
  const { data, error } = await o.supabase.from("kararlar").delete().eq("id", id).select("fotograflar");
  if (error) return { hata: veritabaniHatasi(error) };
  if (!data?.length) return { hata: "Bu kararı silme yetkiniz yok. Okunmuş kararı yalnız merkez silebilir; eski revizyonlar silinmez." };
  await artikFotolariSil(data[0].fotograflar, []);
  revalidatePath("/karar");
  redirect("/karar?silindi=1");
}

/** "Okudum": kullanıcı kendisine ya da firmasına yazılmış kararı onaylar. */
export async function kararOkudum(_: FormDurumu, form: FormData): Promise<FormDurumu> {
  const o = await oturum();
  const id = form.get("id");
  if (!uuidMi(id)) return { hata: "Geçersiz istek." };
  const { data, error } = await o.supabase.rpc("karar_okudum", { p_karar: id });
  if (error) return { hata: veritabaniHatasi(error) };
  if (!data) return { hata: "Bu kararda onay bekleyen bir muhatap değilsiniz." };
  revalidatePath("/karar");
  revalidatePath("/");
  return { tamam: "✓ Okudum olarak işaretlendi." };
}
