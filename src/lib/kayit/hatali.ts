import "server-only";

import { revalidatePath } from "next/cache";
import type { Oturum } from "@/lib/oturum";
import { ONEM, type Onem } from "@/lib/sabitler";
import { fotoYollari, metin, uuidMi, veritabaniHatasi } from "@/lib/denetim";
import { kayitGunu, type Sonuc } from "./ortak";
import { artikFotolariSil } from "@/lib/dosya";

/** Hatalı iş kaydının özü (form eylemi ve çevrimdışı gönderim ortak). */
export async function hataYaz(o: Oturum, form: FormData): Promise<Sonuc> {
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
    return { git: `/hatali/${id}?kayit=duzeltildi` };
  }

  const { error } = await o.supabase.from("hatali_isler").insert({
    ...(uuidMi(id) ? { id } : {}),
    firma_id: o.firma.id,
    santiye_id: o.santiye.id,
    ...alanlar,
    is_tarihi: kayitGunu(form),
  });
  if (error && error.code !== "23505") return { hata: veritabaniHatasi(error) };
  revalidatePath("/hatali");
  return { git: "/hatali?kayit=1" };
}
