"use server";

import { redirect } from "next/navigation";
import { supabaseSunucu, supabaseYonetici } from "@/lib/supabase/server";
import { girisEpostasi } from "@/lib/sabitler";
import type { FormDurumu } from "@/components/form";
import { kullaniciAdiDenetle } from "@/lib/denetim";

/**
 * İlk kurulum: firma ve merkez (süper yönetici) hesabı. Yalnızca hiç firma
 * yokken çalışır; ilk firmadan sonra bu sayfa kapanır.
 */
export async function kurulumYap(_: FormDurumu, form: FormData): Promise<FormDurumu> {
  const yonetici = supabaseYonetici();
  const { count } = await yonetici.from("firmalar").select("id", { count: "exact", head: true });
  if (count !== 0) return { hata: "Kurulum zaten yapılmış." };

  const firmaAdi = String(form.get("firma") ?? "").trim();
  const adSoyad = String(form.get("ad_soyad") ?? "").trim();
  const kullaniciAdi = String(form.get("kullanici_adi") ?? "").trim().toLowerCase();
  const sifre = String(form.get("sifre") ?? "");

  if (firmaAdi.length < 2) return { hata: "Firma adı gerekli." };
  if (adSoyad.length < 2) return { hata: "Ad soyad gerekli." };
  const kHata = kullaniciAdiDenetle(kullaniciAdi);
  if (kHata) return { hata: kHata };
  if (sifre.length < 8) return { hata: "Şifre en az 8 karakter olmalı." };

  const { data: firma, error: fHata } = await yonetici.from("firmalar").insert({ ad: firmaAdi }).select("id").single();
  if (fHata || !firma) return { hata: "Firma oluşturulamadı." };

  const { data: kul, error: kHata2 } = await yonetici.auth.admin.createUser({
    email: girisEpostasi(kullaniciAdi),
    password: sifre,
    email_confirm: true,
  });
  if (kHata2 || !kul.user) {
    await yonetici.from("firmalar").delete().eq("id", firma.id);
    return { hata: "Hesap oluşturulamadı: " + (kHata2?.message ?? "") };
  }

  const { error: pHata } = await yonetici.from("profiller").insert({
    id: kul.user.id,
    firma_id: firma.id,
    kullanici_adi: kullaniciAdi,
    ad_soyad: adSoyad,
    rol: "merkez",
  });
  if (pHata) {
    await yonetici.auth.admin.deleteUser(kul.user.id);
    await yonetici.from("firmalar").delete().eq("id", firma.id);
    return { hata: "Profil oluşturulamadı." };
  }

  const supabase = await supabaseSunucu();
  await supabase.auth.signInWithPassword({ email: girisEpostasi(kullaniciAdi), password: sifre });
  redirect("/yonetim");
}
