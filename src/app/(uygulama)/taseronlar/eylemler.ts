"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { oturum } from "@/lib/oturum";
import { IS_TURU_LISTESI } from "@/lib/sabitler";
import { metin, tarihMi, uuidMi, veritabaniHatasi } from "@/lib/denetim";
import type { FormDurumu } from "@/components/form";

export async function taseronKaydet(_: FormDurumu, form: FormData): Promise<FormDurumu> {
  const o = await oturum();
  const id = form.get("id");
  const firmaAdi = metin(form, "firma_adi", 120);
  const isTurleri = [...new Set(form.getAll("is_turleri").map(String))].filter((t) => IS_TURU_LISTESI.includes(t));
  if (!firmaAdi || firmaAdi.length < 2) return { hata: "Firma adı gerekli." };
  if (!isTurleri.length) return { hata: "Yapacağı en az bir işi seçin." };

  const iban = metin(form, "iban", 40)?.replace(/\s+/g, "").toUpperCase() ?? null;
  if (iban && !/^TR\d{24}$/.test(iban)) return { hata: "IBAN TR ile başlamalı ve 26 karakter olmalı." };

  const kayit: Record<string, unknown> = {
    firma_adi: firmaAdi,
    yetkili: metin(form, "yetkili", 80),
    telefon: metin(form, "telefon", 20),
    vergi_no: metin(form, "vergi_no", 20),
    iban,
    is_turleri: isTurleri,
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
    // Satır dönmezse güncelleme yetki yüzünden yapılmamıştır; "kaydedildi" denmez.
    const { data, error } = await o.supabase.from("taseronlar").update(kayit).eq("id", id).select("id");
    if (error) return { hata: veritabaniHatasi(error) };
    if (!data?.length) return { hata: "Bu taşeronu düzenleme yetkiniz yok." };
    revalidatePath(`/taseronlar/${id}`);
    redirect(`/taseronlar/${id}?kayit=1`);
  }

  // Kimlik burada üretilir: eklenen satırı geri okumak gerekmez (şef gibi
  // kapsamı dar kullanıcılar sözleşme bağlanana kadar taşeronu göremez).
  const yeniId = crypto.randomUUID();
  const { error } = await o.supabase.from("taseronlar").insert({ ...kayit, id: yeniId, firma_id: o.firma.id });
  if (error) return { hata: veritabaniHatasi(error) };
  revalidatePath("/taseronlar");
  redirect(o.taseron ? `/taseronlar/${yeniId}?kayit=1` : `/taseronlar/${yeniId}/sozlesme?yeni=1`);
}

/** Yeni sözleşme ya da mevcut sözleşmenin düzeltilmesi (formda id varsa). */
export async function sozlesmeKaydet(_: FormDurumu, form: FormData): Promise<FormDurumu> {
  const o = await oturum();
  if (o.taseron || !o.yetki("taseronlar", true)) return { hata: "Sözleşme düzenleme yetkiniz yok." };
  const id = form.get("id");
  const taseronId = form.get("taseron_id");
  const santiyeId = form.get("santiye_id");
  const isTarifi = metin(form, "is_tarifi", 500);
  const tur = form.get("tur");
  if (!uuidMi(taseronId)) return { hata: "Taşeron belirsiz." };
  if (!uuidMi(santiyeId)) return { hata: "Şantiye seçin." };
  if (!isTarifi || isTarifi.length < 2) return { hata: "İşin tarifini yazın." };

  // Tarih türü değişirse diğer türün alanları boşaltılır; eski değer kalıp
  // bitiş tarihini yanlış hesaplatmasın.
  const kayit: Record<string, unknown> = {
    taseron_id: taseronId,
    santiye_id: santiyeId,
    is_tarifi: isTarifi,
  };
  if (tur === "net") {
    const b = form.get("baslangic");
    const s = form.get("bitis");
    if (!tarihMi(s)) return { hata: "Bitiş tarihi gerekli." };
    if (tarihMi(b) && b > s) return { hata: "Bitiş başlangıçtan önce olamaz." };
    Object.assign(kayit, { baslangic: tarihMi(b) ? b : null, bitis: s, yer_teslim: null, sure_gun: null });
  } else {
    const y = form.get("yer_teslim");
    const gun = Math.round(Number(form.get("sure_gun")));
    if (!tarihMi(y)) return { hata: "Yer teslim tarihi gerekli." };
    if (!(gun >= 1 && gun <= 3650)) return { hata: "Süre 1 ile 3650 gün arasında olmalı." };
    Object.assign(kayit, { baslangic: y, bitis: null, yer_teslim: y, sure_gun: gun });
  }
  const belge = String(form.get("belge") ?? "");
  if (belge.startsWith(o.firma.id + "/") && !belge.includes("..")) kayit.belge_yolu = belge;
  if (form.get("belge_kaldir") === "1") kayit.belge_yolu = null;

  // Aynı şantiyede aynı işi yapan başka taşeron varsa önce uyarılır.
  // Kesin yasak değil: büyük şantiyede iki kalıpçı farklı blokta çalışabilir,
  // ya da bir taşeron işi bırakıp yerine başkası gelmiş olabilir.
  if (form.get("onay") !== "1") {
    const cakisan = await ayniIsiYapanlar(o, taseronId, santiyeId, uuidMi(id) ? id : null);
    if (cakisan.length) {
      return {
        uyari:
          `Bu şantiyede aynı işi yapan başka taşeron var: ${cakisan.join("; ")}. ` +
          "Mükerrer kayıt olabilir. Eski taşeron işi bıraktıysa önce onun sözleşmesinde \"İş bitti\" deyin. " +
          "Gerçekten ikinci bir firma çalışıyorsa \"Yine de kaydet\"e basın.",
      };
    }
  }

  if (uuidMi(id)) {
    const { data, error } = await o.supabase.from("sozlesmeler").update(kayit).eq("id", id).select("id");
    if (error) return { hata: veritabaniHatasi(error) };
    if (!data?.length) return { hata: "Bu sözleşmeyi düzenleme yetkiniz yok." };
  } else {
    const { error } = await o.supabase.from("sozlesmeler").insert({ ...kayit, firma_id: o.firma.id });
    if (error) return { hata: veritabaniHatasi(error) };
  }
  revalidatePath(`/taseronlar/${taseronId}`);
  revalidatePath("/");
  redirect(`/taseronlar/${taseronId}?kayit=1`);
}

type O = Awaited<ReturnType<typeof oturum>>;

/** Aynı şantiyede, devam eden sözleşmesi olan ve aynı iş türünü yapan diğer taşeronlar. */
async function ayniIsiYapanlar(o: O, taseronId: string, santiyeId: string, haricSozlesme: string | null) {
  const { data: bu } = await o.supabase.from("taseronlar").select("is_turleri, ust_taseron_id").eq("id", taseronId).single();
  if (!bu) return [];
  let sorgu = o.supabase
    .from("sozlesmeler")
    .select("id, taseronlar!inner(id, firma_adi, is_turleri, ust_taseron_id)")
    .eq("santiye_id", santiyeId)
    .eq("tamamlandi", false)
    .neq("taseron_id", taseronId);
  if (haricSozlesme) sorgu = sorgu.neq("id", haricSozlesme);
  const { data } = await sorgu;
  const turler = new Set((bu.is_turleri as string[]).filter((t) => t !== "Diğer"));
  const sonuc: string[] = [];
  for (const s of data ?? []) {
    const t = s.taseronlar as unknown as { id: string; firma_adi: string; is_turleri: string[]; ust_taseron_id: string | null };
    // Ana taşeron ile kendi alt taşeronu aynı işi yapabilir; bu mükerrer değildir.
    if (t.id === bu.ust_taseron_id || t.ust_taseron_id === taseronId) continue;
    const ortak = t.is_turleri.filter((x) => turler.has(x));
    if (ortak.length) sonuc.push(`${t.firma_adi} (${ortak.join(", ")})`);
  }
  return sonuc;
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

export async function sozlesmeSil(_: FormDurumu, form: FormData): Promise<FormDurumu> {
  const o = await oturum();
  const id = form.get("id");
  const taseronId = form.get("taseron_id");
  if (!uuidMi(id) || !uuidMi(taseronId) || o.taseron) return { hata: "Geçersiz istek." };
  const { data, error } = await o.supabase.from("sozlesmeler").delete().eq("id", id).select("id");
  if (error) return { hata: veritabaniHatasi(error) };
  if (!data?.length) return { hata: "Bu sözleşmeyi silme yetkiniz yok." };
  revalidatePath(`/taseronlar/${taseronId}`);
  revalidatePath("/");
  redirect(`/taseronlar/${taseronId}?kayit=1`);
}

export async function taseronSil(_: FormDurumu, form: FormData): Promise<FormDurumu> {
  const o = await oturum();
  const id = form.get("id");
  if (!uuidMi(id) || o.taseron) return { hata: "Geçersiz istek." };
  const { error } = await o.supabase.rpc("taseron_sil", { p_id: id });
  if (error) return { hata: veritabaniHatasi(error) };
  revalidatePath("/taseronlar");
  redirect("/taseronlar?hepsi=1&silindi=1");
}

export async function taseronDurum(_: FormDurumu, form: FormData): Promise<FormDurumu> {
  const o = await oturum();
  const id = form.get("id");
  if (!uuidMi(id) || o.taseron || !o.yetki("taseronlar", true)) return { hata: "Yetkiniz yok." };
  const aktif = form.get("aktif") === "1";
  const { data, error } = await o.supabase.from("taseronlar").update({ aktif }).eq("id", id).select("id");
  if (error) return { hata: veritabaniHatasi(error) };
  if (!data?.length) return { hata: "Bu taşeronu değiştirme yetkiniz yok." };
  revalidatePath(`/taseronlar/${id}`);
  revalidatePath("/");
  return { tamam: aktif ? "Taşeron yeniden aktif." : "Taşeron pasife alındı; artık seçim listelerinde çıkmaz." };
}
