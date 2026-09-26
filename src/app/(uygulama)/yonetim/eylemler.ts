"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { merkezIste, oturum } from "@/lib/oturum";
import { supabaseYonetici } from "@/lib/supabase/server";
import { girisEpostasi, SAYFALAR, type Rol } from "@/lib/sabitler";
import { kullaniciAdiDenetle, metin, uuidMi } from "@/lib/denetim";
import type { FormDurumu } from "@/components/form";

const ROLLER: Rol[] = ["merkez", "personel", "sef", "satinalma", "taseron"];

export async function santiyeEkle(_: FormDurumu, form: FormData): Promise<FormDurumu> {
  const o = await merkezIste();
  const ad = metin(form, "ad", 80);
  if (!ad || ad.length < 2) return { hata: "Şantiye adı gerekli." };
  const bodrum = Math.min(10, Math.max(0, Number(form.get("bodrum_kat") ?? 2) || 0));
  const kat = Math.min(80, Math.max(1, Number(form.get("kat_sayisi") ?? 15) || 1));
  const { error } = await o.supabase
    .from("santiyeler")
    .insert({ ad, adres: metin(form, "adres", 200), bodrum_kat: bodrum, kat_sayisi: kat, firma_id: o.firma.id });
  if (error) return { hata: "Kaydedilemedi: " + error.message };
  revalidatePath("/", "layout");
  return { tamam: `${ad} eklendi.` };
}

export async function santiyeGuncelle(form: FormData) {
  const o = await merkezIste();
  const id = form.get("id");
  if (!uuidMi(id)) return;
  const guncel: Record<string, unknown> = {};
  if (form.has("aktif")) guncel.aktif = form.get("aktif") === "1";
  if (form.has("kat_sayisi")) guncel.kat_sayisi = Math.min(80, Math.max(1, Number(form.get("kat_sayisi")) || 1));
  if (form.has("bodrum_kat")) guncel.bodrum_kat = Math.min(10, Math.max(0, Number(form.get("bodrum_kat")) || 0));
  await o.supabase.from("santiyeler").update(guncel).eq("id", id);
  revalidatePath("/", "layout");
}

export async function kullaniciEkle(_: FormDurumu, form: FormData): Promise<FormDurumu> {
  const o = await merkezIste();
  const adSoyad = metin(form, "ad_soyad", 80);
  const kullaniciAdi = String(form.get("kullanici_adi") ?? "").trim().toLowerCase();
  const sifre = String(form.get("sifre") ?? "");
  const rol = String(form.get("rol")) as Rol;
  const taseronId = form.get("taseron_id");
  const santiyeler = form.getAll("santiye").filter(uuidMi);

  if (!adSoyad || adSoyad.length < 2) return { hata: "Ad soyad gerekli." };
  const kHata = kullaniciAdiDenetle(kullaniciAdi);
  if (kHata) return { hata: kHata };
  if (sifre.length < 6) return { hata: "Şifre en az 6 karakter olmalı." };
  if (!ROLLER.includes(rol)) return { hata: "Rol seçin." };
  if (rol === "taseron" && !uuidMi(taseronId)) return { hata: "Taşeron firmasını seçin." };

  // Taşeron ve şantiyeler çağıranın firmasına ait mi? RLS ile okunarak doğrulanır.
  if (rol === "taseron") {
    const { data } = await o.supabase.from("taseronlar").select("id").eq("id", taseronId as string).maybeSingle();
    if (!data) return { hata: "Taşeron bulunamadı." };
  }
  const gecerliSantiyeler = santiyeler.filter((id) => o.santiyeler.some((s) => s.id === id));

  const yonetici = supabaseYonetici();
  const { data: mevcut } = await yonetici.from("profiller").select("id").eq("kullanici_adi", kullaniciAdi).maybeSingle();
  if (mevcut) return { hata: "Bu kullanıcı adı alınmış, başka bir ad deneyin." };

  const { data: kul, error } = await yonetici.auth.admin.createUser({
    email: girisEpostasi(kullaniciAdi),
    password: sifre,
    email_confirm: true,
  });
  if (error || !kul.user) return { hata: "Hesap oluşturulamadı: " + (error?.message ?? "") };

  const { error: pHata } = await yonetici.from("profiller").insert({
    id: kul.user.id,
    firma_id: o.firma.id,
    kullanici_adi: kullaniciAdi,
    ad_soyad: adSoyad,
    telefon: metin(form, "telefon", 20),
    rol,
    taseron_id: rol === "taseron" ? taseronId : null,
  });
  if (pHata) {
    await yonetici.auth.admin.deleteUser(kul.user.id);
    return { hata: "Profil oluşturulamadı: " + pHata.message };
  }
  if (gecerliSantiyeler.length && rol !== "taseron") {
    await yonetici
      .from("kullanici_santiye")
      .insert(gecerliSantiyeler.map((santiye_id) => ({ kullanici_id: kul.user!.id, santiye_id })));
  }
  revalidatePath("/yonetim/kullanicilar");
  if (rol === "taseron") redirect(`/taseronlar/${taseronId}?sekme=hesaplar&kayit=1`);
  redirect(`/yonetim/kullanicilar/${kul.user.id}?kayit=1`);
}

/** Hedef kullanıcı çağıranın firmasında mı? */
async function firmaKullanicisi(id: unknown) {
  const o = await merkezIste();
  if (!uuidMi(id)) return null;
  const { data } = await o.supabase.from("profiller").select("id, rol, kullanici_adi").eq("id", id).maybeSingle();
  return data ? { o, hedef: data } : null;
}

export async function sifreSifirla(_: FormDurumu, form: FormData): Promise<FormDurumu> {
  const k = await firmaKullanicisi(form.get("id"));
  if (!k) return { hata: "Kullanıcı bulunamadı." };
  const sifre = String(form.get("sifre") ?? "");
  if (sifre.length < 6) return { hata: "Şifre en az 6 karakter olmalı." };
  const { error } = await supabaseYonetici().auth.admin.updateUserById(k.hedef.id, { password: sifre });
  if (error) return { hata: "Şifre değiştirilemedi." };
  return { tamam: "Yeni şifre kaydedildi. Kullanıcıya iletin." };
}

export async function kullaniciDurum(form: FormData) {
  const k = await firmaKullanicisi(form.get("id"));
  if (!k || k.hedef.id === k.o.profil.id) return;
  const aktif = form.get("aktif") === "1";
  const yonetici = supabaseYonetici();
  await yonetici.from("profiller").update({ aktif }).eq("id", k.hedef.id);
  // Pasif kullanıcının açık oturumu da kapansın.
  await yonetici.auth.admin.updateUserById(k.hedef.id, { ban_duration: aktif ? "none" : "876000h" });
  revalidatePath(`/yonetim/kullanicilar/${k.hedef.id}`);
}

export async function santiyeAta(form: FormData) {
  const k = await firmaKullanicisi(form.get("id"));
  if (!k) return;
  const secilen = form.getAll("santiye").filter(uuidMi).filter((id) => k.o.santiyeler.some((s) => s.id === id));
  const yonetici = supabaseYonetici();
  await yonetici.from("kullanici_santiye").delete().eq("kullanici_id", k.hedef.id);
  if (secilen.length) {
    await yonetici.from("kullanici_santiye").insert(secilen.map((santiye_id) => ({ kullanici_id: k.hedef.id, santiye_id })));
  }
  revalidatePath(`/yonetim/kullanicilar/${k.hedef.id}`);
}

/**
 * Yetki matrisini kaydeder. Hedef ya kullanıcı ya taşeron firmasıdır.
 * Yazma RLS ile yapılır: yalnızca merkez yetki tablosuna yazabilir.
 */
export async function yetkiKaydet(_: FormDurumu, form: FormData): Promise<FormDurumu> {
  const o = await oturum();
  if (!o.merkez) return { hata: "Yetkileri yalnızca merkez değiştirebilir." };
  const kullaniciId = form.get("kullanici_id");
  const taseronId = form.get("taseron_id");
  const hedef = uuidMi(kullaniciId) ? { kullanici_id: kullaniciId } : uuidMi(taseronId) ? { taseron_id: taseronId } : null;
  if (!hedef) return { hata: "Hedef belirsiz." };

  const satirlar = SAYFALAR.map(({ kod }) => {
    const duzenler = form.get(`${kod}_d`) === "on";
    const gorur = duzenler || form.get(`${kod}_g`) === "on";
    return { ...hedef, firma_id: o.firma.id, sayfa: kod, gorur, duzenler };
  });

  const sil = o.supabase.from("yetkiler").delete();
  const { error: sHata } = await ("kullanici_id" in hedef
    ? sil.eq("kullanici_id", hedef.kullanici_id as string)
    : sil.eq("taseron_id", hedef.taseron_id as string));
  if (sHata) return { hata: "Kaydedilemedi: " + sHata.message };
  const { error } = await o.supabase.from("yetkiler").insert(satirlar);
  if (error) return { hata: "Kaydedilemedi: " + error.message };
  revalidatePath("/", "layout");
  return { tamam: "Yetkiler kaydedildi." };
}

export async function yetkiSifirla(form: FormData) {
  const o = await merkezIste();
  const k = form.get("kullanici_id");
  const t = form.get("taseron_id");
  if (uuidMi(k)) await o.supabase.from("yetkiler").delete().eq("kullanici_id", k);
  else if (uuidMi(t)) await o.supabase.from("yetkiler").delete().eq("taseron_id", t);
  revalidatePath("/", "layout");
}
