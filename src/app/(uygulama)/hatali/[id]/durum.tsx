"use client";

import { useActionState } from "react";
import { Form, Mesaj } from "@/components/form";
import { HATA_DURUM, type HataDurum } from "@/lib/sabitler";
import { hataDurum } from "../eylemler";

/** Üç aşamalı durum: Tespit → Düzeltiliyor → Onaylandı. Taşeron onaylayamaz. */
export function DurumDugmeleri({ id, durum, taseron }: { id: string; durum: HataDurum; taseron: boolean }) {
  const [sonuc, eylem, bekliyor] = useActionState(hataDurum, undefined);
  const secenekler: HataDurum[] = taseron ? ["tespit", "duzeltiliyor"] : ["tespit", "duzeltiliyor", "onaylandi"];
  return (
    <Form eylem={eylem} bekliyor={bekliyor} className="flex flex-col gap-2">
      <input type="hidden" name="id" value={id} />
      <p className="text-lg font-bold">Durumu değiştir</p>
      <div className={`grid gap-2 ${taseron ? "grid-cols-2" : "grid-cols-3"}`}>
        {secenekler.map((d) => (
          <button
            key={d}
            name="durum"
            value={d}
            disabled={bekliyor || d === durum}
            className={`min-h-16 rounded-xl px-2 text-base font-bold ${
              d === durum ? `${HATA_DURUM[d].renk} ring-4 ring-yazi` : "border-2 border-cizgi bg-yuzey"
            } disabled:cursor-default`}
          >
            {HATA_DURUM[d].ad}
          </button>
        ))}
      </div>
      <Mesaj durum={sonuc} />
    </Form>
  );
}
