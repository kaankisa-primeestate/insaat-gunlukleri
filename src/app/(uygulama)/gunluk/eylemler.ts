"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { oturum } from "@/lib/oturum";
import { bugun } from "@/lib/sabitler";
import { fotoYollari, metin, tarihMi, uuidMi } from "@/lib/denetim";
import type { FormDurumu } from "@/components/form";

export async function gunlukKaydet(_: FormDurumu, form: FormData): Promise<FormDurumu> {
  const o = await oturum();
  if (!o.santiye) return { hata: "Şantiye seçili değil." };
  if (!o.yetki("gunluk", true)) return { hata: "Günlük girme yetkiniz yok." };

  const id = form.get("id");
  const taseronId = form.get("taseron_id");
  const tarih = form.get("is_tarihi");
  const kisi = Math.round(Number(form.get("kisi_sayisi")));
  if (!uuidMi(taseronId)) return { hata: "Taşeron seçin." };
  if (!tarihMi(tarih) || tarih > bugun()) return { hata: "Geçerli bir tarih seçin (ileri tarih olmaz)." };
  if (!(kisi >= 0 && kisi <= 500)) return { hata: "Kişi sayısını girin." };

  const { error } = await o.supabase.from("gunlukler").insert({
    ...(uuidMi(id) ? { id } : {}),
    firma_id: o.firma.id,
    santiye_id: o.santiye.id,
    taseron_id: taseronId,
    is_tarihi: tarih,
    kisi_sayisi: kisi,
    kat: metin(form, "kat", 30),
    is_kalemi: metin(form, "is_kalemi_diger", 80) ?? metin(form, "is_kalemi", 80),
    notu: metin(form, "notu", 300),
    fotograflar: fotoYollari(form, o.firma.id),
  });
  // Aynı kimlikle ikinci gönderim (çift dokunma) sessizce yok sayılır.
  if (error && error.code !== "23505") return { hata: "Kaydedilemedi: " + error.message };
  revalidatePath("/gunluk");
  redirect("/?kayit=1");
}
