"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { bildir } from "@/lib/bildirim";
import { oturum } from "@/lib/oturum";
import { BIRIMLER, TALEP_DURUM, bugun, type TalepDurum } from "@/lib/sabitler";
import { fotoYollari, metin, tarihMi, uuidMi, veritabaniHatasi } from "@/lib/denetim";
import { artikFotolariSil } from "@/lib/dosya";
import type { FormDurumu } from "@/components/form";

/** Yeni talep; formda "duzenle" varsa mevcut talebin düzeltilmesi. */
export async function talepKaydet(_: FormDurumu, form: FormData): Promise<FormDurumu> {
  const o = await oturum();
  if (!o.santiye) return { hata: "Şantiye seçili değil." };
  const id = form.get("id");
  const duzenle = form.get("duzenle") === "1" && uuidMi(id);
  if (!duzenle && !o.yetki("talep", true)) return { hata: "Talep açma yetkiniz yok." };

  // Kimin için: listeden taşeron ("kim" = kimlik), daha önce yazılmış ad
  // ("kim" = "ad:<ad>") ya da elle yazılan ad. Taşeron hesabı yalnız seçer.
  const kim = String(form.get("kim") ?? "");
  const taseronId = uuidMi(kim) ? kim : null;
  const taseronAdi = taseronId ? null : kim.startsWith("ad:") ? kim.slice(3).trim().slice(0, 80) : metin(form, "taseron_adi", 80);
  const urun = metin(form, "urun", 80);
  const miktar = Number(String(form.get("miktar") ?? "").replace(",", "."));
  const birim = String(form.get("birim") ?? "");
  const termin = String(form.get("termin") ?? "");
  if (!taseronId && !(taseronAdi && taseronAdi.length >= 2)) return { hata: "Kimin için olduğunu yazın ya da listeden seçin." };
  if (o.taseron && !taseronId) return { hata: "Taşeron hesabı talebi kendi firması ya da alt taşeronu için açar; listeden seçin." };
  if (!urun || urun.length < 2) return { hata: "Ürünü yazın." };
  if (!(miktar > 0 && miktar < 1e9)) return { hata: "Miktarı girin." };
  if (!BIRIMLER.includes(birim)) return { hata: "Birimi seçin." };
  if (termin && !tarihMi(termin)) return { hata: "Geçerli bir termin seçin." };
  if (termin && !duzenle && termin < bugun()) return { hata: "Termin bugünden önce olamaz." };

  const fotograflar = fotoYollari(form, o.firma.id);
  const alanlar = {
    taseron_id: taseronId,
    taseron_adi: taseronAdi,
    urun,
    miktar,
    birim,
    termin: termin || null,
    notu: metin(form, "notu", 300),
    fotograflar,
  };

  if (duzenle) {
    const { data: eski } = await o.supabase.from("talepler").select("fotograflar").eq("id", id).maybeSingle();
    const { data, error } = await o.supabase.from("talepler").update(alanlar).eq("id", id).select("id");
    if (error) return { hata: veritabaniHatasi(error) };
    if (!data?.length) return { hata: "Bu talebi düzeltme yetkiniz yok." };
    await artikFotolariSil(eski?.fotograflar, fotograflar);
    revalidatePath("/talep");
    redirect(`/talep/${id}?kayit=duzeltildi`);
  }

  const { error } = await o.supabase.from("talepler").insert({
    ...(uuidMi(id) ? { id } : {}),
    firma_id: o.firma.id,
    santiye_id: o.santiye.id,
    ...alanlar,
    is_tarihi: bugun(),
  });
  if (error && error.code !== "23505") return { hata: "Kaydedilemedi: " + error.message };
  if (!error && uuidMi(id)) {
    const santiye = o.santiye.ad;
    const { data: t } = taseronId ? await o.supabase.from("taseronlar").select("firma_adi").eq("id", taseronId).maybeSingle() : { data: null };
    after(() =>
      bildir({
        firmaId: o.firma.id,
        tur: "talep_yeni",
        yapan: o.profil.id,
        roller: ["satinalma"],
        baslik: `📦 Yeni talep · ${santiye}`,
        govde: `${Number(miktar).toLocaleString("tr-TR")} ${birim} ${urun} · ${t?.firma_adi ?? taseronAdi} için`,
        url: `/talep/${id}`,
      }),
    );
  }
  revalidatePath("/talep");
  redirect("/talep?kayit=1");
}

export async function talepDurum(_: FormDurumu, form: FormData): Promise<FormDurumu> {
  const o = await oturum();
  if (o.taseron) return { hata: "Talep durumunu merkez tarafı değiştirir." };
  const id = form.get("id");
  const durum = String(form.get("durum")) as TalepDurum;
  if (!uuidMi(id) || !(durum in TALEP_DURUM)) return { hata: "Geçersiz istek." };
  const { data, error } = await o.supabase.from("talepler").update({ durum }).eq("id", id).select("id, olusturan, urun, miktar, birim");
  if (error) return { hata: "Kaydedilemedi: " + error.message };
  if (!data?.length) return { hata: "Bu talebi değiştirme yetkiniz yok." };
  const t = data[0];
  after(() =>
    bildir({
      firmaId: o.firma.id,
      tur: "talep_durum",
      yapan: o.profil.id,
      kullanicilar: [t.olusturan],
      baslik: `Talep: ${TALEP_DURUM[durum].ad}`,
      govde: `${Number(t.miktar).toLocaleString("tr-TR")} ${t.birim} ${t.urun}`,
      url: `/talep/${id}`,
    }),
  );
  revalidatePath(`/talep/${id}`);
  revalidatePath("/talep");
  return { tamam: `Durum: ${TALEP_DURUM[durum].ad}` };
}

export async function talepSil(_: FormDurumu, form: FormData): Promise<FormDurumu> {
  const o = await oturum();
  const id = form.get("id");
  if (!uuidMi(id)) return { hata: "Geçersiz istek." };
  const { data, error } = await o.supabase.from("talepler").delete().eq("id", id).select("fotograflar");
  if (error) return { hata: veritabaniHatasi(error) };
  if (!data?.length) return { hata: "Bu talebi silme yetkiniz yok." };
  await artikFotolariSil(data[0].fotograflar, []);
  revalidatePath("/talep");
  redirect("/talep?silindi=1");
}
