"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { oturum } from "@/lib/oturum";
import { BIRIMLER, TALEP_DURUM, bugun, type TalepDurum } from "@/lib/sabitler";
import { fotoYollari, metin, uuidMi, veritabaniHatasi } from "@/lib/denetim";
import { artikFotolariSil } from "@/lib/dosya";
import type { FormDurumu } from "@/components/form";

/** Yeni talep; formda "duzenle" varsa mevcut talebin düzeltilmesi. */
export async function talepKaydet(_: FormDurumu, form: FormData): Promise<FormDurumu> {
  const o = await oturum();
  if (!o.santiye) return { hata: "Şantiye seçili değil." };
  const id = form.get("id");
  const duzenle = form.get("duzenle") === "1" && uuidMi(id);
  if (!duzenle && !o.yetki("talep", true)) return { hata: "Talep açma yetkiniz yok." };

  const taseronId = form.get("taseron_id");
  const secim = metin(form, "urun_secim", 80);
  const urun = secim === "Diğer" ? metin(form, "urun_diger", 80) : secim;
  const miktar = Number(String(form.get("miktar") ?? "").replace(",", "."));
  const birim = String(form.get("birim") ?? "");
  if (!uuidMi(taseronId)) return { hata: "Hangi taşeron için olduğunu seçin." };
  if (!urun || urun.length < 2) return { hata: "Ürünü yazın." };
  if (!(miktar > 0 && miktar < 1e9)) return { hata: "Miktarı girin." };
  if (!BIRIMLER.includes(birim)) return { hata: "Birimi seçin." };

  const fotograflar = fotoYollari(form, o.firma.id);
  const alanlar = { taseron_id: taseronId, urun, miktar, birim, notu: metin(form, "notu", 300), fotograflar };

  if (duzenle) {
    const { data: eski } = await o.supabase.from("talepler").select("fotograflar").eq("id", id).maybeSingle();
    const { data, error } = await o.supabase.from("talepler").update(alanlar).eq("id", id).select("id");
    if (error) return { hata: veritabaniHatasi(error) };
    if (!data?.length) return { hata: "Bu talebi düzeltme yetkiniz yok." };
    await artikFotolariSil(eski?.fotograflar, fotograflar);
    revalidatePath("/talep");
    redirect(`/talep/${id}?kayit=duzeltildi`);
  }

  const { error } = await o.supabase.from("talepler").insert({
    ...(uuidMi(id) ? { id } : {}),
    firma_id: o.firma.id,
    santiye_id: o.santiye.id,
    ...alanlar,
    is_tarihi: bugun(),
  });
  if (error && error.code !== "23505") return { hata: "Kaydedilemedi: " + error.message };
  revalidatePath("/talep");
  redirect("/talep?kayit=1");
}

export async function talepDurum(_: FormDurumu, form: FormData): Promise<FormDurumu> {
  const o = await oturum();
  if (o.taseron) return { hata: "Talep durumunu merkez tarafı değiştirir." };
  const id = form.get("id");
  const durum = String(form.get("durum")) as TalepDurum;
  if (!uuidMi(id) || !(durum in TALEP_DURUM)) return { hata: "Geçersiz istek." };
  const { data, error } = await o.supabase.from("talepler").update({ durum }).eq("id", id).select("id");
  if (error) return { hata: "Kaydedilemedi: " + error.message };
  if (!data?.length) return { hata: "Bu talebi değiştirme yetkiniz yok." };
  revalidatePath(`/talep/${id}`);
  revalidatePath("/talep");
  return { tamam: `Durum: ${TALEP_DURUM[durum].ad}` };
}

export async function talepSil(_: FormDurumu, form: FormData): Promise<FormDurumu> {
  const o = await oturum();
  const id = form.get("id");
  if (!uuidMi(id)) return { hata: "Geçersiz istek." };
  const { data, error } = await o.supabase.from("talepler").delete().eq("id", id).select("fotograflar");
  if (error) return { hata: veritabaniHatasi(error) };
  if (!data?.length) return { hata: "Bu talebi silme yetkiniz yok." };
  await artikFotolariSil(data[0].fotograflar, []);
  revalidatePath("/talep");
  redirect("/talep?silindi=1");
}
