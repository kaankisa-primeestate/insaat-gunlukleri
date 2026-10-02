"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { bildir } from "@/lib/bildirim";
import { oturum } from "@/lib/oturum";
import { HATA_DURUM, type HataDurum } from "@/lib/sabitler";
import { fotoYollari, metin, uuidMi, veritabaniHatasi } from "@/lib/denetim";
import type { FormDurumu } from "@/components/form";
import { hataYaz } from "@/lib/kayit/hatali";
import { artikFotolariSil } from "@/lib/dosya";

/** Yeni hatalı iş; formda "duzenle" varsa mevcut kaydın düzeltilmesi. */
export async function hataKaydet(_: FormDurumu, form: FormData): Promise<FormDurumu> {
  const s = await hataYaz(await oturum(), form);
  if (s.git) redirect(s.git);
  return s;
}

export async function hataDurum(_: FormDurumu, form: FormData): Promise<FormDurumu> {
  const o = await oturum();
  const id = form.get("id");
  const durum = String(form.get("durum")) as HataDurum;
  if (!uuidMi(id) || !(durum in HATA_DURUM)) return { hata: "Geçersiz istek." };
  if (o.taseron && durum === "onaylandi") return { hata: "Onay merkez tarafından verilir." };
  const { data, error } = await o.supabase
    .from("hatali_isler")
    .update({ durum })
    .eq("id", id)
    .select("id, olusturan, taseron_id, sorumlu_kullanici_id, aciklama");
  if (error) return { hata: veritabaniHatasi(error) };
  if (!data?.length) return { hata: "Bu kaydı değiştirme yetkiniz yok." };
  const h = data[0];
  after(() =>
    bildir({
      firmaId: o.firma.id,
      tur: "hatali_gelisme",
      yapan: o.profil.id,
      kullanicilar: [h.olusturan, h.sorumlu_kullanici_id],
      taseronlar: [h.taseron_id],
      baslik: `Hatalı iş: ${HATA_DURUM[durum].ad}`,
      govde: h.aciklama,
      url: `/hatali/${id}`,
    }),
  );
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
    const { data: h } = await o.supabase.from("hatali_isler").select("olusturan, taseron_id, sorumlu_kullanici_id").eq("id", hataliId).maybeSingle();
    const rev = sira;
    after(() =>
      bildir({
        firmaId: o.firma.id,
        tur: "hatali_gelisme",
        yapan: o.profil.id,
        kullanicilar: [h?.olusturan, h?.sorumlu_kullanici_id],
        taseronlar: [h?.taseron_id],
        baslik: `Hatalı iş · Rev. ${rev}`,
        govde: yazi,
        url: `/hatali/${hataliId}#rev-${rev}`,
      }),
    );
  }
  revalidatePath(`/hatali/${hataliId}`);
  revalidatePath("/hatali");
  redirect(`/hatali/${hataliId}?rev=${sira}#rev-${sira}`);
}
