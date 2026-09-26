"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { oturum } from "@/lib/oturum";
import { bugun } from "@/lib/sabitler";
import { metin, tarihMi, uuidMi } from "@/lib/denetim";
import type { FormDurumu } from "@/components/form";

export async function teslimatKaydet(_: FormDurumu, form: FormData): Promise<FormDurumu> {
  const o = await oturum();
  if (!o.santiye) return { hata: "Şantiye seçili değil." };
  if (!o.yetki("teslimat", true)) return { hata: "Teslimat girme yetkiniz yok." };
  const taseronId = form.get("taseron_id");
  const tarih = form.get("tarih");
  const saat = Number(form.get("saat"));
  const arac = metin(form, "arac", 40);
  const urun = metin(form, "urun", 80);
  const talep = form.get("talep_id");
  if (!uuidMi(taseronId)) return { hata: "Taşeron seçin." };
  if (!tarihMi(tarih) || tarih < bugun()) return { hata: "Bugün veya ileri bir tarih seçin." };
  if (!(Number.isInteger(saat) && saat >= 0 && saat <= 23)) return { hata: "Saat seçin." };
  if (!arac) return { hata: "Aracı seçin." };
  if (!urun) return { hata: "Ürünü yazın." };

  const { error } = await o.supabase.from("teslimatlar").insert({
    firma_id: o.firma.id,
    santiye_id: o.santiye.id,
    taseron_id: taseronId,
    talep_id: uuidMi(talep) ? talep : null,
    tarih,
    saat,
    arac,
    urun,
  });
  if (error) return { hata: "Kaydedilemedi: " + error.message };
  revalidatePath("/teslimat");
  redirect("/?kayit=1");
}

export async function teslimatSil(form: FormData) {
  const o = await oturum();
  const id = form.get("id");
  const tarih = form.get("tarih");
  if (!uuidMi(id)) return;
  await o.supabase.from("teslimatlar").delete().eq("id", id);
  revalidatePath("/teslimat");
  redirect(`/teslimat?tarih=${tarihMi(tarih) ? tarih : bugun()}`);
}
