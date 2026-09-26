"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { oturum } from "@/lib/oturum";
import { BIRIMLER, TALEP_DURUM, bugun, type TalepDurum } from "@/lib/sabitler";
import { metin, uuidMi } from "@/lib/denetim";
import type { FormDurumu } from "@/components/form";

export async function talepKaydet(_: FormDurumu, form: FormData): Promise<FormDurumu> {
  const o = await oturum();
  if (!o.santiye) return { hata: "Şantiye seçili değil." };
  if (!o.yetki("talep", true)) return { hata: "Talep açma yetkiniz yok." };

  const id = form.get("id");
  const taseronId = form.get("taseron_id");
  const urun = metin(form, "urun", 80);
  const miktar = Number(String(form.get("miktar") ?? "").replace(",", "."));
  const birim = String(form.get("birim") ?? "");
  if (!uuidMi(taseronId)) return { hata: "Hangi taşeron için olduğunu seçin." };
  if (!urun || urun.length < 2) return { hata: "Ürünü yazın." };
  if (!(miktar > 0 && miktar < 1e9)) return { hata: "Miktarı girin." };
  if (!BIRIMLER.includes(birim)) return { hata: "Birimi seçin." };

  const { error } = await o.supabase.from("talepler").insert({
    ...(uuidMi(id) ? { id } : {}),
    firma_id: o.firma.id,
    santiye_id: o.santiye.id,
    taseron_id: taseronId,
    urun,
    miktar,
    birim,
    notu: metin(form, "notu", 300),
    is_tarihi: bugun(),
  });
  if (error && error.code !== "23505") return { hata: "Kaydedilemedi: " + error.message };
  revalidatePath("/talep");
  redirect("/?kayit=1");
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
