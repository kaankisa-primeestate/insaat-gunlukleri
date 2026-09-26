"use client";

import { useActionState } from "react";
import { Alan, Girdi, KaydetButonu, Mesaj } from "@/components/form";
import { girisYap } from "./eylem";

export function GirisFormu() {
  const [durum, eylem] = useActionState(girisYap, undefined);
  return (
    <form action={eylem} className="flex flex-col gap-5">
      <Alan etiket="Kullanıcı adı">
        <Girdi
          name="kullanici_adi"
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          required
        />
      </Alan>
      <Alan etiket="Şifre">
        <Girdi name="sifre" type="password" autoComplete="current-password" required />
      </Alan>
      <Mesaj durum={durum} />
      <KaydetButonu>Giriş Yap</KaydetButonu>
    </form>
  );
}
