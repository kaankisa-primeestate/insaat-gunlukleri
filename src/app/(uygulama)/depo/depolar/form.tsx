"use client";

import { useActionState } from "react";
import { Form, Girdi, KaydetButonu, Mesaj } from "@/components/form";
import { depoDurum, depoEkle } from "../eylemler";

export function DepoEkleFormu() {
  const [durum, eylem, bekliyor] = useActionState(depoEkle, undefined);
  return (
    <Form eylem={eylem} bekliyor={bekliyor} className="flex flex-col gap-3">
      <Girdi name="ad" required minLength={2} maxLength={60} placeholder="Örn. Merkez depo, Celayir konteyner" />
      <Mesaj durum={durum} />
      <KaydetButonu>Depo Ekle</KaydetButonu>
    </Form>
  );
}

/** Depo silinmez: kullanılmayan pasife alınır, kayıtlar yerinde durur. */
export function DepoDurumDugmesi({ id, aktif }: { id: string; aktif: boolean }) {
  const [durum, eylem, bekliyor] = useActionState(depoDurum, undefined);
  return (
    <Form eylem={eylem} bekliyor={bekliyor} className="flex flex-col items-end gap-1">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="aktif" value={aktif ? "0" : "1"} />
      <button disabled={bekliyor} className="min-h-11 rounded-xl border-2 border-cizgi px-3 font-bold">
        {aktif ? "Pasife al" : "Yeniden kullan"}
      </button>
      <Mesaj durum={durum} />
    </Form>
  );
}
