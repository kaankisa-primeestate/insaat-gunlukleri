"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { oturum } from "@/lib/oturum";
import { IS_TURU_LISTESI } from "@/lib/sabitler";
import { metin, tarihMi, uuidMi } from "@/lib/denetim";
import type { FormDurumu } from "@/components/form";

export async function taseronKaydet(_: FormDurumu, form: FormData): Promise<FormDurumu> {
  const o = await oturum();
  const id = form.get("id");
  const firmaAdi = metin(form, "firma_adi", 120);
  const isTuru = String(form.get("is_turu") ?? "");
  if (!firmaAdi || firmaAdi.length < 2) return { hata: "Firma adı gerekli." };
  if (!IS_TURU_LISTESI.includes(isTuru)) return { hata: "Yapacağı işi seçin." };

  const iban = metin(form, "iban", 40)?.replace(/\s+/g, "").toUpperCase() ?? null;
  if (iban && !/^TR\d{24}$/.test(iban)) return { hata: "IBAN TR ile başlamalı ve 26 karakter olmalı." };

  const kayit: Record<string, unknown> = {
    firma_adi: firmaAdi,
    yetkili: metin(form, "yetkili", 80),
    telefon: metin(form, "telefon", 20),
    vergi_no: metin(form, "vergi_no", 20),
    iban,
    is_turu: isTuru,
  };

  if (o.taseron) {
    // Ana taşeron yalnızca kendi altına alt taşeron açabilir; RLS de denetler.
    if (uuidMi(id)) return { hata: "Taşeron bilgilerini merkez düzenler." };
    kayit.ust_taseron_id = o.profil.taseron_id;
  } else {
    if (!o.yetki("taseronlar", true)) return { hata: "Taşeron ekleme yetkiniz yok." };
    const ust = form.get("ust_taseron_id");
    kayit.ust_taseron_id = uuidMi(ust) && ust !== id ? ust : null;
    kayit.alt_taseron_yetkisi = form.get("alt_taseron_yetkisi") === "on";
  }

  if (uuidMi(id)) {
    const { error } = await o.supabase.from("taseronlar").update(kayit).eq("id", id);
    if (error) return { hata: "Kaydedilemedi: " + error.message };
    revalidatePath(`/taseronlar/${id}`);
    redirect(`/taseronlar/${id}?kayit=1`);
  }

  // Kimlik burada üretilir: eklenen satırı geri okumak gerekmez (şef gibi
  // kapsamı dar kullanıcılar sözleşme bağlanana kadar taşeronu göremez).
  const yeniId = crypto.randomUUID();
  const { error } = await o.supabase.from("taseronlar").insert({ ...kayit, id: yeniId, firma_id: o.firma.id });
  if (error) return { hata: "Kaydedilemedi: " + error.message };
  revalidatePath("/taseronlar");
  redirect(o.taseron ? `/taseronlar/${yeniId}?kayit=1` : `/taseronlar/${yeniId}/sozlesme?yeni=1`);
}

export async function sozlesmeEkle(_: FormDurumu, form: FormData): Promise<FormDurumu> {
  const o = await oturum();
  if (o.taseron || !o.yetki("taseronlar", true)) return { hata: "Sözleşme ekleme yetkiniz yok." };
  const taseronId = form.get("taseron_id");
  const santiyeId = form.get("santiye_id");
  const isTarifi = metin(form, "is_tarifi", 500);
  const tur = form.get("tur");
  if (!uuidMi(taseronId)) return { hata: "Taşeron belirsiz." };
  if (!uuidMi(santiyeId)) return { hata: "Şantiye seçin." };
  if (!isTarifi || isTarifi.length < 2) return { hata: "İşin tarifini yazın." };

  const kayit: Record<string, unknown> = {
    firma_id: o.firma.id,
    taseron_id: taseronId,
    santiye_id: santiyeId,
    is_tarifi: isTarifi,
  };
  if (tur === "net") {
    const b = form.get("baslangic");
    const s = form.get("bitis");
    if (!tarihMi(s)) return { hata: "Bitiş tarihi gerekli." };
    if (tarihMi(b) && b > s) return { hata: "Bitiş başlangıçtan önce olamaz." };
    kayit.baslangic = tarihMi(b) ? b : null;
    kayit.bitis = s;
  } else {
    const y = form.get("yer_teslim");
    const gun = Math.round(Number(form.get("sure_gun")));
    if (!tarihMi(y)) return { hata: "Yer teslim tarihi gerekli." };
    if (!(gun >= 1 && gun <= 3650)) return { hata: "Süre 1 ile 3650 gün arasında olmalı." };
    kayit.yer_teslim = y;
    kayit.baslangic = y;
    kayit.sure_gun = gun;
  }
  const belge = String(form.get("belge") ?? "");
  if (belge.startsWith(o.firma.id + "/") && !belge.includes("..")) kayit.belge_yolu = belge;

  const { error } = await o.supabase.from("sozlesmeler").insert(kayit);
  if (error) return { hata: "Kaydedilemedi: " + error.message };
  revalidatePath(`/taseronlar/${taseronId}`);
  redirect(`/taseronlar/${taseronId}?kayit=1`);
}

export async function sozlesmeTamamla(form: FormData) {
  const o = await oturum();
  const id = form.get("id");
  const taseronId = form.get("taseron_id");
  if (!uuidMi(id) || o.taseron) return;
  await o.supabase.from("sozlesmeler").update({ tamamlandi: form.get("tamamlandi") === "1" }).eq("id", id);
  revalidatePath(`/taseronlar/${taseronId}`);
  revalidatePath("/");
}
