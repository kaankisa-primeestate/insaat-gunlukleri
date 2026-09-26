"use client";

import { useActionState } from "react";
import { Alan, Girdi, KaydetButonu, Mesaj } from "@/components/form";
import { kurulumYap } from "./eylem";

export function KurulumFormu() {
  const [durum, eylem] = useActionState(kurulumYap, undefined);
  return (
    <form action={eylem} className="flex flex-col gap-5">
      <Alan etiket="Firma adı" zorunlu>
        <Girdi name="firma" defaultValue="Kısa İnşaat" required maxLength={120} />
      </Alan>
      <Alan etiket="Adınız soyadınız" zorunlu>
        <Girdi name="ad_soyad" required maxLength={80} autoComplete="name" />
      </Alan>
      <Alan etiket="Kullanıcı adı" zorunlu ipucu="Küçük harf, Türkçe karakter olmadan. Örnek: kaan.kisa">
        <Girdi name="kullanici_adi" required autoCapitalize="none" autoCorrect="off" spellCheck={false} autoComplete="username" />
      </Alan>
      <Alan etiket="Şifre" zorunlu ipucu="En az 8 karakter.">
        <Girdi name="sifre" type="password" required minLength={8} autoComplete="new-password" />
      </Alan>
      <Mesaj durum={durum} />
      <KaydetButonu>Kurulumu Tamamla</KaydetButonu>
    </form>
  );
}
