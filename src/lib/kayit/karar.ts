import "server-only";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { bildir } from "@/lib/bildirim";
import type { Oturum } from "@/lib/oturum";
import { IS_TURU_LISTESI, MAHALLER } from "@/lib/sabitler";
import { fotoYollari, metin, uuidMi, veritabaniHatasi } from "@/lib/denetim";
import { artikFotolariSil } from "@/lib/dosya";
import { kayitGunu, type Sonuc } from "./ortak";

/** Karar kaydının özü (form eylemi ve çevrimdışı gönderim ortak). */
export async function kararYaz(o: Oturum, form: FormData): Promise<Sonuc> {
  if (!o.santiye) return { hata: "Şantiye seçili değil." };
  const id = form.get("id");
  const duzenle = form.get("duzenle") === "1" && uuidMi(id);
  const onceki = form.get("onceki");
  if (!duzenle && !o.yetki("karar", true)) return { hata: "Karar girme yetkiniz yok." };

  const karar = metin(form, "karar", 1000);
  if (!karar || karar.length < 2) return { hata: "Kararı yazın." };
  // Yer listeden seçilir ya da elle yazılır; ekranda ikisinden biri vardır.
  const yer = form.has("yer_elle") ? metin(form, "yer_elle", 80) : metin(form, "yer", 80);

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
  // Tarih elle girilmez: karar kaydedildiği gün. Düzeltmede ilk gün kalır.
  const alanlar = {
    yer,
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
    if (!data?.length) return { hata: "Bu karar okunmuş ya da size ait değil; düzeltilemez. \"Rev. Yap\" ile revizyon yapın." };
    const { error: sHata } = await o.supabase.from("karar_muhataplari").delete().eq("karar_id", id);
    if (sHata) return { hata: veritabaniHatasi(sHata) };
    if (muhataplar(id as string).length) {
      const { error: mHata } = await o.supabase.from("karar_muhataplari").insert(muhataplar(id as string));
      if (mHata) return { hata: "Muhataplar kaydedilemedi: " + veritabaniHatasi(mHata) };
    }
    await artikFotolariSil(eski?.fotograflar, fotograflar);
    revalidatePath("/karar");
    return { git: "/karar?kayit=duzeltildi" };
  }

  const yeniId = uuidMi(id) ? (id as string) : crypto.randomUUID();
  const { error } = await o.supabase.from("kararlar").insert({
    id: yeniId,
    ...alanlar,
    is_tarihi: kayitGunu(form),
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
  if (!error) {
    const santiye = o.santiye.ad;
    after(() =>
      bildir({
        firmaId: o.firma.id,
        tur: "karar",
        yapan: o.profil.id,
        kullanicilar: kisiler,
        taseronlar,
        baslik: `📝 ${uuidMi(onceki) ? "Karar değişti" : "Yeni karar"} · ${santiye}`,
        govde: karar,
        url: `/karar#k-${yeniId}`,
      }),
    );
  }
  revalidatePath("/karar");
  return { git: uuidMi(onceki) ? `/karar?kayit=degisti#k-${yeniId}` : "/karar?kayit=yeni" };
}
