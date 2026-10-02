"use client";

import { useActionState } from "react";
import { Alan, Form, KaydetButonu, Mesaj } from "@/components/form";
import { tercihKaydet } from "./eylemler";

/** Hangi bildirimler gelsin; sessiz saatlerde ses ve titreşim olmaz. */
export function Tercihler({
  turler,
  kapali,
  sessiz,
  bas,
  bit,
}: {
  turler: [string, string][];
  kapali: string[];
  sessiz: boolean;
  bas: number;
  bit: number;
}) {
  const [durum, eylem, bekliyor] = useActionState(tercihKaydet, undefined);
  const saatler = Array.from({ length: 24 }, (_, i) => i);
  const kutu = "flex min-h-14 items-center gap-3 rounded-xl border-2 border-cizgi px-4 font-semibold";
  return (
    <Form eylem={eylem} bekliyor={bekliyor} className="flex flex-col gap-5">
      <Alan etiket="Hangi bildirimler gelsin?">
        {turler.map(([kod, ad]) => (
          <label key={kod} className={kutu}>
            <input type="checkbox" name="acik" value={kod} defaultChecked={!kapali.includes(kod)} className="size-6 accent-yesil" />
            {ad}
          </label>
        ))}
      </Alan>
      <Alan etiket="Sessiz saatler" ipucu="Bu saatlerde bildirim yine düşer ama ses ve titreşim olmaz.">
        <label className={kutu}>
          <input type="checkbox" name="sessiz" value="1" defaultChecked={sessiz} className="size-6 accent-yesil" />
          Sessiz saatleri kullan
        </label>
        <div className="flex flex-wrap items-center gap-2 text-lg">
          <select name="sessiz_bas" defaultValue={bas} className="min-h-12 rounded-xl border-2 border-cizgi bg-zemin px-3">
            {saatler.map((s) => (
              <option key={s} value={s}>{String(s).padStart(2, "0")}:00</option>
            ))}
          </select>
          ile
          <select name="sessiz_bit" defaultValue={bit} className="min-h-12 rounded-xl border-2 border-cizgi bg-zemin px-3">
            {saatler.map((s) => (
              <option key={s} value={s}>{String(s).padStart(2, "0")}:00</option>
            ))}
          </select>
          arası
        </div>
      </Alan>
      <Mesaj durum={durum} />
      <KaydetButonu>Kaydet</KaydetButonu>
    </Form>
  );
}
