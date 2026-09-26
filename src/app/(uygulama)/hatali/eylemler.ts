"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { oturum } from "@/lib/oturum";
import { bugun, HATA_DURUM, ONEM, type HataDurum, type Onem } from "@/lib/sabitler";
import { fotoYollari, metin, tarihMi, uuidMi } from "@/lib/denetim";
import type { FormDurumu } from "@/components/form";

export async function hataKaydet(_: FormDurumu, form: FormData): Promise<FormDurumu> {
  const o = await oturum();
  if (!o.santiye) return { hata: "Şantiye seçili değil." };
  if (o.taseron || !o.yetki("hatali", true)) return { hata: "Hatalı iş bildirme yetkiniz yok." };

  const id = form.get("id");
  const taseronId = form.get("taseron_id");
  const tarih = form.get("is_tarihi");
  const onem = String(form.get("onem")) as Onem;
  const aciklama = metin(form, "aciklama", 300);
  const fotograflar = fotoYollari(form, o.firma.id);

  if (!fotograflar.length) return { hata: "Fotoğraf zorunlu." };
  if (!uuidMi(taseronId)) return { hata: "Taşeron seçin." };
  if (!tarihMi(tarih) || tarih > bugun()) return { hata: "Geçerli bir tarih seçin." };
  if (!(onem in ONEM)) return { hata: "Önem derecesini seçin." };
  if (!aciklama || aciklama.length < 2) return { hata: "Kısa bir açıklama yazın." };

  const { error } = await o.supabase.from("hatali_isler").insert({
    ...(uuidMi(id) ? { id } : {}),
    firma_id: o.firma.id,
    santiye_id: o.santiye.id,
    taseron_id: taseronId,
    is_tarihi: tarih,
    aciklama,
    kat: metin(form, "kat", 30),
    onem,
    fotograflar,
  });
  if (error && error.code !== "23505") return { hata: "Kaydedilemedi: " + error.message };
  revalidatePath("/hatali");
  redirect("/?kayit=1");
}

export async function hataDurum(_: FormDurumu, form: FormData): Promise<FormDurumu> {
  const o = await oturum();
  const id = form.get("id");
  const durum = String(form.get("durum")) as HataDurum;
  if (!uuidMi(id) || !(durum in HATA_DURUM)) return { hata: "Geçersiz istek." };
  if (o.taseron && durum === "onaylandi") return { hata: "Onay merkez tarafından verilir." };
  const { data, error } = await o.supabase.from("hatali_isler").update({ durum }).eq("id", id).select("id");
  if (error) return { hata: "Kaydedilemedi: " + error.message };
  if (!data?.length) return { hata: "Bu kaydı değiştirme yetkiniz yok." };
  revalidatePath(`/hatali/${id}`);
  revalidatePath("/hatali");
  return { tamam: `Durum: ${HATA_DURUM[durum].ad}` };
}
