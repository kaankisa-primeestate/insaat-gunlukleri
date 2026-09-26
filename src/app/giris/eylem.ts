"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { CEREZ_AYARI, SANTIYE_CEREZI } from "@/lib/santiye-cerezi";
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

  // Şantiye girişte bir kez seçilir. Tek şantiyesi olan doğrudan girer;
  // birden çoksa seçim ekranı, önceki oturumun seçimi silinir.
  const cerezler = await cookies();
  cerezler.delete(SANTIYE_CEREZI);
  const { data: santiyeler } = await supabase.from("santiyeler").select("id").eq("aktif", true);
  if ((santiyeler ?? []).length === 1) {
    cerezler.set(SANTIYE_CEREZI, santiyeler![0].id, CEREZ_AYARI);
    redirect("/");
  }
  redirect((santiyeler ?? []).length > 1 ? "/santiye-sec" : "/");
}

export async function cikisYap() {
  const supabase = await supabaseSunucu();
  await supabase.auth.signOut();
  (await cookies()).delete(SANTIYE_CEREZI);
  redirect("/giris");
}
