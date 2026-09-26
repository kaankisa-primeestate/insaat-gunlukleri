"use client";

import { useActionState } from "react";
import { Trash2 } from "lucide-react";
import { Form, Mesaj } from "@/components/form";
import { gunlukSil } from "./eylemler";

/** Onay sorulduktan sonra günlüğü siler. */
export function GunlukSilDugmesi({ id, buyuk }: { id: string; buyuk?: boolean }) {
  const [durum, eylem, bekliyor] = useActionState(gunlukSil, undefined);
  return (
    <Form eylem={eylem} bekliyor={bekliyor} onayla="Bu günlük kaydı ve fotoğrafları silinsin mi? Geri alınamaz.">
      <input type="hidden" name="id" value={id} />
      <button
        disabled={bekliyor}
        className={
          buyuk
            ? "flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl border-2 border-kirmizi text-lg font-bold text-kirmizi"
            : "flex min-h-11 items-center gap-1.5 rounded-xl border-2 border-kirmizi px-3 font-bold text-kirmizi"
        }
      >
        <Trash2 className={buyuk ? "size-6" : "size-5"} /> Sil
      </button>
      <Mesaj durum={durum} />
    </Form>
  );
}
