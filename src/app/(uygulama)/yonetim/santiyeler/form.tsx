"use client";

import { useActionState, useEffect, useRef } from "react";
import { Alan, Girdi, KaydetButonu, Mesaj } from "@/components/form";
import { santiyeEkle } from "../eylemler";

export function SantiyeFormu() {
  const [durum, eylem] = useActionState(santiyeEkle, undefined);
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (durum?.tamam) form.current?.reset();
  }, [durum]);
  return (
    <form ref={form} action={eylem} className="flex flex-col gap-4">
      <Alan etiket="Şantiye adı" zorunlu>
        <Girdi name="ad" required maxLength={80} placeholder="Örn. Polenium Manzara" />
      </Alan>
      <Alan etiket="Adres">
        <Girdi name="adres" maxLength={200} />
      </Alan>
      <div className="grid grid-cols-2 gap-3">
        <Alan etiket="Bodrum kat">
          <Girdi name="bodrum_kat" type="number" inputMode="numeric" min={0} max={10} defaultValue={2} />
        </Alan>
        <Alan etiket="Normal kat">
          <Girdi name="kat_sayisi" type="number" inputMode="numeric" min={1} max={80} defaultValue={15} />
        </Alan>
      </div>
      <Mesaj durum={durum} />
      <KaydetButonu>Şantiye Ekle</KaydetButonu>
    </form>
  );
}
