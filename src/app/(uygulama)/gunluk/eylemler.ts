"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { oturum } from "@/lib/oturum";
import { supabaseYonetici } from "@/lib/supabase/server";
import { uuidMi, veritabaniHatasi } from "@/lib/denetim";
import type { FormDurumu } from "@/components/form";
import { gunlukYaz } from "@/lib/kayit/gunluk";

/** Yeni günlük; formda "duzenle" varsa mevcut günlüğün düzeltilmesi. */
export async function gunlukKaydet(_: FormDurumu, form: FormData): Promise<FormDurumu> {
  const s = await gunlukYaz(await oturum(), form);
  if (s.git) redirect(s.git);
  return s;
}

export async function gunlukSil(_: FormDurumu, form: FormData): Promise<FormDurumu> {
  const o = await oturum();
  const id = form.get("id");
  if (!uuidMi(id)) return { hata: "Geçersiz istek." };
  const { data, error } = await o.supabase.from("gunlukler").delete().eq("id", id).select("fotograflar");
  if (error) return { hata: veritabaniHatasi(error) };
  if (!data?.length) return { hata: "Bu günlüğü silme yetkiniz yok. Kaydı giren kişi 24 saat içinde, merkez her zaman silebilir." };
  // Kaydın fotoğrafları da depodan kaldırılır; yer kaplamasın.
  const yollar = data[0].fotograflar as string[];
  if (yollar.length) await supabaseYonetici().storage.from("dosyalar").remove(yollar);
  revalidatePath("/gunluk");
  redirect("/gunluk?silindi=1");
}
