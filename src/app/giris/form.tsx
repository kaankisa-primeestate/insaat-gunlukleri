"use client";

import { useActionState, useEffect } from "react";
import { Alan, Form, Girdi, KaydetButonu, Mesaj } from "@/components/form";
import { girisYap } from "./eylem";

export function GirisFormu() {
  const [durum, eylem, bekliyor] = useActionState(girisYap, undefined);
  // Giriş ekranı: telefonda saklanan önceki kullanıcının sayfaları silinir.
  useEffect(() => {
    navigator.serviceWorker?.controller?.postMessage({ tip: "temizle" });
  }, []);
  return (
    <Form eylem={eylem} bekliyor={bekliyor} className="flex flex-col gap-5">
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
    </Form>
  );
}
