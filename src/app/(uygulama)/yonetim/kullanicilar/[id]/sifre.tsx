"use client";

import { useActionState } from "react";
import { Girdi, KaydetButonu, Mesaj } from "@/components/form";
import { sifreSifirla } from "../../eylemler";

export function SifreFormu({ id }: { id: string }) {
  const [durum, eylem] = useActionState(sifreSifirla, undefined);
  return (
    <form action={eylem} className="flex flex-col gap-3">
      <input type="hidden" name="id" value={id} />
      <Girdi name="sifre" placeholder="Yeni şifre" required minLength={6} autoComplete="new-password" />
      <Mesaj durum={durum} />
      <KaydetButonu renk="koyu">Şifreyi Değiştir</KaydetButonu>
    </form>
  );
}
