"use client";

import { useActionState } from "react";
import { ArrowRight } from "lucide-react";
import { Mesaj } from "@/components/form";
import { TALEP_DURUM, TALEP_SIRASI, type TalepDurum } from "@/lib/sabitler";
import { talepDurum } from "../eylemler";

const EYLEM_ADI: Partial<Record<TalepDurum, string>> = {
  satin_alindi: "Satın Alındı",
  yolda: "Yolda",
  teslim_alindi: "Teslim Aldım",
  kapandi: "Kapat",
};

/** Tek büyük düğme bir sonraki adıma geçirir; gerekirse adım atlanabilir. */
export function TalepIlerlet({ id, durum }: { id: string; durum: TalepDurum }) {
  const [sonuc, eylem, bekliyor] = useActionState(talepDurum, undefined);
  const i = TALEP_SIRASI.indexOf(durum);
  const sonraki = TALEP_SIRASI[i + 1];
  const digerleri = TALEP_SIRASI.slice(i + 2);
  return (
    <form action={eylem} className="flex flex-col gap-2">
      <input type="hidden" name="id" value={id} />
      {sonraki && (
        <button
          name="durum"
          value={sonraki}
          disabled={bekliyor}
          className="flex min-h-18 items-center justify-center gap-2 rounded-2xl bg-yesil text-xl font-extrabold text-white disabled:opacity-60"
        >
          {EYLEM_ADI[sonraki]} <ArrowRight className="size-7" />
        </button>
      )}
      {digerleri.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {digerleri.map((d) => (
            <button key={d} name="durum" value={d} disabled={bekliyor} className="min-h-12 rounded-xl border-2 border-cizgi px-3 font-semibold">
              Doğrudan: {TALEP_DURUM[d].ad}
            </button>
          ))}
        </div>
      )}
      <Mesaj durum={sonuc} />
    </form>
  );
}
