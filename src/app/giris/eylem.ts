"use server";

import { redirect } from "next/navigation";
import { supabaseSunucu } from "@/lib/supabase/server";
import { girisEpostasi } from "@/lib/sabitler";
import type { FormDurumu } from "@/components/form";

export async function girisYap(_: FormDurumu, form: FormData): Promise<FormDurumu> {
  const kullaniciAdi = String(form.get("kullanici_adi") ?? "").trim().toLowerCase();
  const sifre = String(form.get("sifre") ?? "");
  if (!kullaniciAdi || !sifre) return { hata: "Kullanıcı adı ve şifre gerekli." };

  const supabase = await supabaseSunucu();
  const { error } = await supabase.auth.signInWithPassword({ email: girisEpostasi(kullaniciAdi), password: sifre });
  if (error) return { hata: "Kullanıcı adı veya şifre hatalı." };
  redirect("/");
}

export async function cikisYap() {
  const supabase = await supabaseSunucu();
  await supabase.auth.signOut();
  redirect("/giris");
}
