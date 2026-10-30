"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { oturum } from "@/lib/oturum";
import { supabaseYonetici } from "@/lib/supabase/server";
import { uuidMi, veritabaniHatasi } from "@/lib/denetim";
import { bugun } from "@/lib/sabitler";
import { havaTamamla } from "@/lib/hava";
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

/**
 * D5 "Dünden devam" — öneri kartındaki üç hızlı eylem. Hiçbiri form
 * doğrulaması gerektirmez (kaynak zaten geçerli bir günlükten geliyor),
 * bu yüzden `gunlukYaz`'ı kullanmazlar; doğrudan yazar, sayfayı tazelerler.
 */

/** "Aynen devam": kaynak günlüğün bilgilerini bugüne, fotoğrafsız kopyalar. */
export async function gunlukDevamEt(form: FormData) {
  const o = await oturum();
  if (o.santiye && o.yetki("gunluk", true)) {
    const kaynakId = form.get("kaynak_id");
    if (uuidMi(kaynakId)) {
      const { data: kaynak } = await o.supabase
        .from("gunlukler")
        .select("taseron_id, kisi_sayisi, katlar, is_kalemleri, notu")
        .eq("id", kaynakId)
        .eq("santiye_id", o.santiye.id)
        .maybeSingle();
      if (kaynak) {
        const tarih = bugun();
        const { error } = await o.supabase.from("gunlukler").insert({
          firma_id: o.firma.id,
          santiye_id: o.santiye.id,
          taseron_id: kaynak.taseron_id,
          is_tarihi: tarih,
          kisi_sayisi: kaynak.kisi_sayisi,
          katlar: kaynak.katlar,
          is_kalemleri: kaynak.is_kalemleri,
          notu: kaynak.notu,
          devam: true,
        });
        if (!error) {
          const santiye = o.santiye;
          after(() => havaTamamla(santiye, o.firma.id, [tarih]));
        }
      }
    }
  }
  revalidatePath("/gunluk");
}

/** "Gelmedi": o gün için boş bir kayıt düşer (D5 kararı: tutulsun — evet). */
export async function gunlukGelmedi(form: FormData) {
  const o = await oturum();
  const taseronId = form.get("taseron_id");
  if (o.santiye && o.yetki("gunluk", true) && uuidMi(taseronId)) {
    await o.supabase.from("gunlukler").insert({
      firma_id: o.firma.id,
      santiye_id: o.santiye.id,
      taseron_id: taseronId,
      is_tarihi: bugun(),
      kisi_sayisi: 0,
      katlar: [],
      is_kalemleri: [],
      gelmedi: true,
    });
  }
  revalidatePath("/gunluk");
}

/** "Bu işi bitirdi": öneri susturulur; elle (gelmedi olmayan) yeni günlük girilince kendiliğinden döner. */
export async function gunlukOneriKapat(form: FormData) {
  const o = await oturum();
  const taseronId = form.get("taseron_id");
  if (o.santiye && o.yetki("gunluk", true) && uuidMi(taseronId)) {
    await o.supabase
      .from("gunluk_oneri_kapatildi")
      .upsert(
        { firma_id: o.firma.id, santiye_id: o.santiye.id, taseron_id: taseronId, kapatma: new Date().toISOString() },
        { onConflict: "santiye_id,taseron_id" },
      );
  }
  revalidatePath("/gunluk");
}
