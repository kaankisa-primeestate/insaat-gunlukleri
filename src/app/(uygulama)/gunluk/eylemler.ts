"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { oturum } from "@/lib/oturum";
import { supabaseYonetici } from "@/lib/supabase/server";
import { bugun, kisaTarih } from "@/lib/sabitler";
import { fotoYollari, metin, tarihMi, uuidMi, veritabaniHatasi } from "@/lib/denetim";
import type { FormDurumu } from "@/components/form";

/** Yeni günlük; formda "duzenle" varsa mevcut günlüğün düzeltilmesi. */
export async function gunlukKaydet(_: FormDurumu, form: FormData): Promise<FormDurumu> {
  const o = await oturum();
  if (!o.santiye) return { hata: "Şantiye seçili değil." };

  const id = form.get("id");
  const duzenle = form.get("duzenle") === "1" && uuidMi(id);
  if (!duzenle && !o.yetki("gunluk", true)) return { hata: "Günlük girme yetkiniz yok." };

  const taseronId = form.get("taseron_id");
  const tarih = form.get("is_tarihi");
  const kisi = Math.round(Number(form.get("kisi_sayisi")));
  if (!uuidMi(taseronId)) return { hata: "Taşeron seçin." };
  if (!tarihMi(tarih) || tarih > bugun()) return { hata: "Geçerli bir tarih seçin (ileri tarih olmaz)." };
  if (!(kisi >= 0 && kisi <= 500)) return { hata: "Kişi sayısını girin." };

  // Aynı gün aynı taşerona ikinci günlük açılmaz. Veritabanı da reddeder;
  // burada kullanıcıya mevcut kaydın ne olduğu söylenir.
  let mevcut = o.supabase
    .from("gunlukler")
    .select("id, kisi_sayisi, katlar, taseronlar(firma_adi)")
    .eq("santiye_id", o.santiye.id)
    .eq("taseron_id", taseronId)
    .eq("is_tarihi", tarih)
    .limit(1);
  if (uuidMi(id)) mevcut = mevcut.neq("id", id);
  const { data: ayniGun } = await mevcut;
  if (ayniGun?.length) {
    const m = ayniGun[0];
    const firma = (m.taseronlar as unknown as { firma_adi: string } | null)?.firma_adi ?? "Bu taşeron";
    return {
      hata:
        `${firma} için ${kisaTarih(tarih)} günlüğü zaten var (${m.kisi_sayisi} kişi${m.katlar.length ? ", " + m.katlar.join(", ") : ""}). ` +
        "Aynı gün ikinci günlük açılmaz; eksik bir şey varsa Günlükler'den o kaydı düzenleyin.",
    };
  }

  // Seçimler listeden gelir; boyu ve uzunluğu sınırlanır. "Diğer" seçildiyse
  // yazılan iş onun yerine geçer.
  const katlar = [...new Set(form.getAll("katlar").map(String))].filter((k) => k.length <= 30).slice(0, 100);
  const diger = metin(form, "is_kalemi_diger", 80);
  const isKalemleri = [...new Set(form.getAll("is_kalemleri").map(String))]
    .filter((k) => k.length <= 80)
    .map((k) => (k === "Diğer" && diger ? diger : k))
    .filter((k) => k !== "Diğer")
    .slice(0, 30);

  const alanlar = {
    taseron_id: taseronId,
    is_tarihi: tarih,
    kisi_sayisi: kisi,
    katlar,
    is_kalemleri: isKalemleri,
    notu: metin(form, "notu", 300),
    fotograflar: fotoYollari(form, o.firma.id),
  };

  if (duzenle) {
    // Satır dönmezse yetki yoktur (24 saat geçmiş ya da başkasının kaydı).
    const { data, error } = await o.supabase.from("gunlukler").update(alanlar).eq("id", id).select("id");
    if (error) return { hata: veritabaniHatasi(error) };
    if (!data?.length) return { hata: "Bu günlüğü düzenleme yetkiniz yok. Kaydı giren kişi 24 saat içinde, merkez her zaman düzenleyebilir." };
    revalidatePath("/gunluk");
    redirect("/gunluk?kayit=1");
  }

  const { error } = await o.supabase.from("gunlukler").insert({
    ...(uuidMi(id) ? { id } : {}),
    ...alanlar,
    firma_id: o.firma.id,
    santiye_id: o.santiye.id,
  });
  // Aynı kimlikle ikinci gönderim (çift dokunma) sessizce yok sayılır.
  if (error && error.code !== "23505") return { hata: veritabaniHatasi(error) };
  revalidatePath("/gunluk");
  redirect("/?kayit=1");
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
