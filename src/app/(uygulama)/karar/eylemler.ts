"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { oturum } from "@/lib/oturum";
import { bugun, IS_TURU_LISTESI, MAHALLER } from "@/lib/sabitler";
import { fotoYollari, metin, tarihMi, uuidMi, veritabaniHatasi } from "@/lib/denetim";
import { artikFotolariSil } from "@/lib/dosya";
import type { FormDurumu } from "@/components/form";

/**
 * Yeni karar, yeni sürüm ("onceki" doluysa) ya da okunmamış kararın
 * düzeltilmesi ("duzenle"). Muhataplar "t:<taşeron>" / "k:<kişi>" gelir.
 */
export async function kararKaydet(_: FormDurumu, form: FormData): Promise<FormDurumu> {
  const o = await oturum();
  if (!o.santiye) return { hata: "Şantiye seçili değil." };
  const id = form.get("id");
  const duzenle = form.get("duzenle") === "1" && uuidMi(id);
  const onceki = form.get("onceki");
  if (!duzenle && !o.yetki("karar", true)) return { hata: "Karar girme yetkiniz yok." };

  const karar = metin(form, "karar", 1000);
  const tarih = form.get("is_tarihi");
  if (!karar || karar.length < 2) return { hata: "Kararı yazın." };
  if (!tarihMi(tarih) || tarih > bugun()) return { hata: "Geçerli bir tarih seçin." };

  const mahalSecim = metin(form, "mahal", 60);
  const mahal = mahalSecim === "Diğer" ? metin(form, "mahal_diger", 60) : mahalSecim && MAHALLER.includes(mahalSecim) ? mahalSecim : null;
  const konu = metin(form, "konu", 40);
  const disKatilimcilar = String(form.get("dis_katilimcilar") ?? "")
    .split(",")
    .map((x) => x.trim().slice(0, 60))
    .filter(Boolean)
    .slice(0, 10);

  const secilen = [...new Set(form.getAll("muhatap").map(String))];
  const taseronlar = secilen.filter((x) => x.startsWith("t:")).map((x) => x.slice(2)).filter(uuidMi);
  const kisiler = secilen.filter((x) => x.startsWith("k:")).map((x) => x.slice(2)).filter(uuidMi);
  if (o.taseron && kisiler.length) return { hata: "Taşeron yalnız kendi alt taşeronuna karar yazabilir." };

  const fotograflar = fotoYollari(form, o.firma.id);
  const alanlar = {
    is_tarihi: tarih,
    yer: metin(form, "yer", 80),
    daire: metin(form, "daire", 20),
    mahal,
    konu: konu && IS_TURU_LISTESI.includes(konu) ? konu : null,
    karar,
    fotograflar,
    dis_katilimcilar: disKatilimcilar,
  };
  const muhataplar = (kararId: string) => [
    ...taseronlar.map((t) => ({ karar_id: kararId, taseron_id: t })),
    ...kisiler.map((k) => ({ karar_id: kararId, kullanici_id: k })),
  ];

  if (duzenle) {
    const { data: eski } = await o.supabase.from("kararlar").select("fotograflar").eq("id", id).maybeSingle();
    // Satır dönmezse ya başkasının kaydıdır ya da biri okumuştur; kural veritabanında.
    const { data, error } = await o.supabase.from("kararlar").update(alanlar).eq("id", id).select("id");
    if (error) return { hata: veritabaniHatasi(error) };
    if (!data?.length) return { hata: "Bu karar okunmuş ya da size ait değil; düzeltilemez. \"Kararı değiştir\" ile yeni sürüm açın." };
    const { error: sHata } = await o.supabase.from("karar_muhataplari").delete().eq("karar_id", id);
    if (sHata) return { hata: veritabaniHatasi(sHata) };
    if (muhataplar(id as string).length) {
      const { error: mHata } = await o.supabase.from("karar_muhataplari").insert(muhataplar(id as string));
      if (mHata) return { hata: "Muhataplar kaydedilemedi: " + veritabaniHatasi(mHata) };
    }
    await artikFotolariSil(eski?.fotograflar, fotograflar);
    revalidatePath("/karar");
    redirect("/karar?kayit=duzeltildi");
  }

  const yeniId = uuidMi(id) ? (id as string) : crypto.randomUUID();
  const { error } = await o.supabase.from("kararlar").insert({
    id: yeniId,
    ...alanlar,
    firma_id: o.firma.id,
    santiye_id: o.santiye.id,
    olusturan: o.profil.id,
    olusturan_taseron: o.profil.taseron_id ?? null,
    onceki_id: uuidMi(onceki) ? onceki : null,
  });
  // Aynı kimlikle ikinci gönderim (çift dokunma) yok sayılır.
  if (error && error.code !== "23505") return { hata: veritabaniHatasi(error) };
  if (!error && muhataplar(yeniId).length) {
    const { error: mHata } = await o.supabase.from("karar_muhataplari").insert(muhataplar(yeniId));
    if (mHata) {
      // Yarım kayıt kalmasın.
      await o.supabase.from("kararlar").delete().eq("id", yeniId);
      return { hata: "Muhataplar kaydedilemedi: " + veritabaniHatasi(mHata) };
    }
  }
  revalidatePath("/karar");
  redirect(uuidMi(onceki) ? "/karar?kayit=degisti" : "/karar?kayit=yeni");
}

export async function kararSil(_: FormDurumu, form: FormData): Promise<FormDurumu> {
  const o = await oturum();
  const id = form.get("id");
  if (!uuidMi(id)) return { hata: "Geçersiz istek." };
  const { data, error } = await o.supabase.from("kararlar").delete().eq("id", id).select("fotograflar");
  if (error) return { hata: veritabaniHatasi(error) };
  if (!data?.length) return { hata: "Bu kararı silme yetkiniz yok. Okunmuş kararı yalnız merkez silebilir." };
  await artikFotolariSil(data[0].fotograflar, []);
  revalidatePath("/karar");
  redirect("/karar?silindi=1");
}

/** "Okudum": kullanıcı kendisine ya da firmasına yazılmış kararı onaylar. */
export async function kararOkudum(_: FormDurumu, form: FormData): Promise<FormDurumu> {
  const o = await oturum();
  const id = form.get("id");
  if (!uuidMi(id)) return { hata: "Geçersiz istek." };
  const { data, error } = await o.supabase.rpc("karar_okudum", { p_karar: id });
  if (error) return { hata: veritabaniHatasi(error) };
  if (!data) return { hata: "Bu kararda onay bekleyen bir muhatap değilsiniz." };
  revalidatePath("/karar");
  revalidatePath("/");
  return { tamam: "✓ Okudum olarak işaretlendi." };
}
