"use client";

import { useActionState } from "react";
import { Trash2 } from "lucide-react";
import { Form, Mesaj, type FormDurumu } from "./form";

/** Onay sorulduktan sonra kaydı silen düğme; eylem sayfadan gelir. */
export function SilDugmesi({
  id,
  eylem: sunucuEylemi,
  soru,
}: {
  id: string;
  eylem: (d: FormDurumu, f: FormData) => Promise<FormDurumu>;
  soru: string;
}) {
  const [durum, eylem, bekliyor] = useActionState(sunucuEylemi, undefined);
  return (
    <Form eylem={eylem} bekliyor={bekliyor} onayla={soru}>
      <input type="hidden" name="id" value={id} />
      <button
        disabled={bekliyor}
        className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl border-2 border-kirmizi text-lg font-bold text-kirmizi"
      >
        <Trash2 className="size-6" /> Sil
      </button>
      <Mesaj durum={durum} />
    </Form>
  );
}
