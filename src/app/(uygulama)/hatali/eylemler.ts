"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { oturum } from "@/lib/oturum";
import { bugun, HATA_DURUM, ONEM, type HataDurum, type Onem } from "@/lib/sabitler";
import { fotoYollari, metin, uuidMi, veritabaniHatasi } from "@/lib/denetim";
import type { FormDurumu } from "@/components/form";
import { artikFotolariSil } from "@/lib/dosya";

/** Yeni hatalı iş; formda "duzenle" varsa mevcut kaydın düzeltilmesi. */
export async function hataKaydet(_: FormDurumu, form: FormData): Promise<FormDurumu> {
  const o = await oturum();
  if (!o.santiye) return { hata: "Şantiye seçili değil." };
  const id = form.get("id");
  const duzenle = form.get("duzenle") === "1" && uuidMi(id);
  if (!duzenle && !o.yetki("hatali", true)) return { hata: "Hatalı iş bildirme yetkiniz yok." };

  // "t:<kimlik>" taşeron, "k:<kimlik>" kullanıcı (kalfa, şef…).
  const sorumlu = String(form.get("sorumlu") ?? "");
  const taseronId = sorumlu.startsWith("t:") ? sorumlu.slice(2) : null;
  const kullaniciId = sorumlu.startsWith("k:") ? sorumlu.slice(2) : null;
  const onem = String(form.get("onem")) as Onem;
  const aciklama = metin(form, "aciklama", 300);
  const fotograflar = fotoYollari(form, o.firma.id);

  if (!uuidMi(taseronId) && !uuidMi(kullaniciId)) return { hata: "Kimin işi olduğunu seçin." };
  // Taşeron yalnız kendi firmasına ya da alt taşeronuna iş yazar; kuralı veritabanı da uygular.
  if (o.taseron && uuidMi(kullaniciId)) return { hata: "Taşeron personele iş yazamaz; bir taşeron seçin." };
  if (!(onem in ONEM)) return { hata: "Önem derecesini seçin." };
  if (!aciklama || aciklama.length < 2) return { hata: "Kısa bir açıklama yazın." };

  // Tarih sorulmaz: yeni kayıt bugünü alır, düzeltmede ilk gün kalır.
  // Yer listeden seçilir ya da elle yazılır; ekranda ikisinden biri vardır.
  const alanlar = {
    taseron_id: uuidMi(taseronId) ? taseronId : null,
    sorumlu_kullanici_id: uuidMi(kullaniciId) ? kullaniciId : null,
    aciklama,
    kat: form.has("kat_elle") ? metin(form, "kat_elle", 80) : metin(form, "kat", 80),
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
    is_tarihi: bugun(),
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
  // Revizyon notları kayıtla birlikte silinir; fotoğrafları da depoda kalmasın.
  const { data: notlar } = await o.supabase.from("hatali_notlar").select("fotograflar").eq("hatali_id", id);
  const { data, error } = await o.supabase.from("hatali_isler").delete().eq("id", id).select("fotograflar");
  if (error) return { hata: veritabaniHatasi(error) };
  if (!data?.length) {
    return {
      hata: notlar?.length
        ? "Bu işin revizyonları var; geçmişi olan kaydı yalnız merkez silebilir."
        : "Bu kaydı silme yetkiniz yok.",
    };
  }
  await artikFotolariSil([...data[0].fotograflar, ...(notlar ?? []).flatMap((n) => n.fotograflar as string[])], []);
  revalidatePath("/hatali");
  redirect("/hatali?silindi=1");
}

/**
 * Hatalı işe revizyon notu (Rev. 1, Rev. 2…); formda "id" varsa var olan notun
 * düzeltilmesi. Ekleme yetkisi ve sıra numarası veritabanında belirlenir.
 */
export async function revizyonKaydet(_: FormDurumu, form: FormData): Promise<FormDurumu> {
  const o = await oturum();
  const hataliId = form.get("hatali_id");
  const id = form.get("id");
  if (!uuidMi(hataliId)) return { hata: "Geçersiz istek." };
  const yazi = metin(form, "metin", 1000);
  if (!yazi || yazi.length < 2) return { hata: "Ne geliştiğini kısaca yazın." };
  const fotograflar = fotoYollari(form, o.firma.id);

  let sira: number;
  if (uuidMi(id)) {
    const { data: eski } = await o.supabase.from("hatali_notlar").select("fotograflar").eq("id", id).maybeSingle();
    // Satır dönmezse yetki yoktur (yazan 24 saat içinde, merkez her zaman).
    const { data, error } = await o.supabase
      .from("hatali_notlar")
      .update({ metin: yazi, fotograflar })
      .eq("id", id)
      .eq("hatali_id", hataliId)
      .select("sira");
    if (error) return { hata: veritabaniHatasi(error) };
    if (!data?.length) return { hata: "Bu notu düzeltme yetkiniz yok. Yazan 24 saat içinde, merkez her zaman düzeltebilir." };
    await artikFotolariSil(eski?.fotograflar, fotograflar);
    sira = data[0].sira;
  } else {
    if (!o.yetki("hatali", true)) return { hata: "Bu işe not ekleme yetkiniz yok." };
    const { data, error } = await o.supabase
      .from("hatali_notlar")
      .insert({ hatali_id: hataliId, metin: yazi, fotograflar })
      .select("sira");
    if (error) return { hata: error.code === "42501" ? "Bu işe not ekleme yetkiniz yok." : veritabaniHatasi(error) };
    sira = data[0].sira;
  }
  revalidatePath(`/hatali/${hataliId}`);
  revalidatePath("/hatali");
  redirect(`/hatali/${hataliId}?rev=${sira}#rev-${sira}`);
}
