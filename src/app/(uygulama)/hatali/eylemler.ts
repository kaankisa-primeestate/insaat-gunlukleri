"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { oturum } from "@/lib/oturum";
import { bugun, HATA_DURUM, ONEM, type HataDurum, type Onem } from "@/lib/sabitler";
import { fotoYollari, metin, tarihMi, uuidMi, veritabaniHatasi } from "@/lib/denetim";
import type { FormDurumu } from "@/components/form";
import { artikFotolariSil } from "@/lib/dosya";

/** Yeni hatalı iş; formda "duzenle" varsa mevcut kaydın düzeltilmesi. */
export async function hataKaydet(_: FormDurumu, form: FormData): Promise<FormDurumu> {
  const o = await oturum();
  if (!o.santiye) return { hata: "Şantiye seçili değil." };
  const id = form.get("id");
  const duzenle = form.get("duzenle") === "1" && uuidMi(id);
  if (o.taseron || (!duzenle && !o.yetki("hatali", true))) return { hata: "Hatalı iş bildirme yetkiniz yok." };

  // "t:<kimlik>" taşeron, "k:<kimlik>" kullanıcı (kalfa, şef…).
  const sorumlu = String(form.get("sorumlu") ?? "");
  const taseronId = sorumlu.startsWith("t:") ? sorumlu.slice(2) : null;
  const kullaniciId = sorumlu.startsWith("k:") ? sorumlu.slice(2) : null;
  const tarih = form.get("is_tarihi");
  const onem = String(form.get("onem")) as Onem;
  const aciklama = metin(form, "aciklama", 300);
  const fotograflar = fotoYollari(form, o.firma.id);

  if (!uuidMi(taseronId) && !uuidMi(kullaniciId)) return { hata: "Kimin işi olduğunu seçin." };
  if (!tarihMi(tarih) || tarih > bugun()) return { hata: "Geçerli bir tarih seçin." };
  if (!(onem in ONEM)) return { hata: "Önem derecesini seçin." };
  if (!aciklama || aciklama.length < 2) return { hata: "Kısa bir açıklama yazın." };

  const alanlar = {
    taseron_id: uuidMi(taseronId) ? taseronId : null,
    sorumlu_kullanici_id: uuidMi(kullaniciId) ? kullaniciId : null,
    is_tarihi: tarih,
    aciklama,
    kat: metin(form, "kat", 30),
    onem,
    fotograflar,
  };

  if (duzenle) {
    const { data: eski } = await o.supabase.from("hatali_isler").select("fotograflar").eq("id", id).maybeSingle();
    // Satır dönmezse yetki yoktur; kuralı veritabanı da uygular.
    const { data, error } = await o.supabase.from("hatali_isler").update(alanlar).eq("id", id).select("id");
    if (error) return { hata: veritabaniHatasi(error) };
    if (!data?.length) return { hata: "Bu kaydı düzeltme yetkiniz yok." };
    await artikFotolariSil(eski?.fotograflar, fotograflar);
    revalidatePath("/hatali");
    redirect(`/hatali/${id}?kayit=duzeltildi`);
  }

  const { error } = await o.supabase.from("hatali_isler").insert({
    ...(uuidMi(id) ? { id } : {}),
    firma_id: o.firma.id,
    santiye_id: o.santiye.id,
    ...alanlar,
  });
  if (error && error.code !== "23505") return { hata: veritabaniHatasi(error) };
  revalidatePath("/hatali");
  redirect("/hatali?kayit=1");
}

export async function hataDurum(_: FormDurumu, form: FormData): Promise<FormDurumu> {
  const o = await oturum();
  const id = form.get("id");
  const durum = String(form.get("durum")) as HataDurum;
  if (!uuidMi(id) || !(durum in HATA_DURUM)) return { hata: "Geçersiz istek." };
  if (o.taseron && durum === "onaylandi") return { hata: "Onay merkez tarafından verilir." };
  const { data, error } = await o.supabase.from("hatali_isler").update({ durum }).eq("id", id).select("id");
  if (error) return { hata: veritabaniHatasi(error) };
  if (!data?.length) return { hata: "Bu kaydı değiştirme yetkiniz yok." };
  revalidatePath(`/hatali/${id}`);
  revalidatePath("/hatali");
  return { tamam: `Durum: ${HATA_DURUM[durum].ad}` };
}

export async function hataSil(_: FormDurumu, form: FormData): Promise<FormDurumu> {
  const o = await oturum();
  const id = form.get("id");
  if (!uuidMi(id)) return { hata: "Geçersiz istek." };
  const { data, error } = await o.supabase.from("hatali_isler").delete().eq("id", id).select("fotograflar");
  if (error) return { hata: veritabaniHatasi(error) };
  if (!data?.length) return { hata: "Bu kaydı silme yetkiniz yok." };
  await artikFotolariSil(data[0].fotograflar, []);
  revalidatePath("/hatali");
  redirect("/hatali?silindi=1");
}
