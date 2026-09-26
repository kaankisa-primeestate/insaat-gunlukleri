"use client";

import { useActionState, useState } from "react";
import { Alan, Form, Girdi, KaydetButonu, Mesaj, Secim } from "@/components/form";
import { TaseronSecici, type TaseronSecenek } from "@/components/secimler";
import { ARACLAR } from "@/lib/sabitler";
import { teslimatKaydet } from "./eylemler";

export function TeslimatFormu({
  tarih,
  taseronlar,
  doluluk,
  saatler,
  talep,
}: {
  tarih: string;
  taseronlar: TaseronSecenek[];
  doluluk: Record<number, number>;
  saatler: number[];
  talep?: { id: string; urun: string; miktar: number; birim: string; taseron_id: string };
}) {
  const [durum, eylem, bekliyor] = useActionState(teslimatKaydet, undefined);
  const [saat, setSaat] = useState<number | null>(null);
  const dolu = saat != null ? (doluluk[saat] ?? 0) : 0;

  return (
    <Form eylem={eylem} bekliyor={bekliyor} className="flex flex-col gap-5">
      <input type="hidden" name="tarih" value={tarih} />
      {talep && <input type="hidden" name="talep_id" value={talep.id} />}
      <Alan etiket="Taşeron" zorunlu>
        <TaseronSecici taseronlar={taseronlar} varsayilan={talep?.taseron_id} />
      </Alan>
      <Alan etiket="Saat" zorunlu>
        <div className="grid grid-cols-4 gap-2">
          {saatler.map((s) => {
            const n = doluluk[s] ?? 0;
            return (
              <label key={s} className="cursor-pointer">
                <input type="radio" name="saat" value={s} required className="peer sr-only" onChange={() => setSaat(s)} />
                <span
                  className={`flex min-h-14 flex-col items-center justify-center rounded-xl border-2 font-bold peer-checked:ring-4 peer-checked:ring-yazi ${
                    n === 0 ? "border-cizgi bg-yuzey" : n === 1 ? "border-sari bg-sari text-black" : "border-kirmizi bg-kirmizi text-white"
                  }`}
                >
                  {String(s).padStart(2, "0")}:00
                  {n > 0 && <span className="text-xs">{n} araç</span>}
                </span>
              </label>
            );
          })}
        </div>
        {dolu > 0 && (
          <p className="rounded-xl bg-sari px-4 py-3 font-semibold text-black">
            Bu saatte {dolu} teslimat daha var. Mümkünse boş bir saat seçin.
          </p>
        )}
      </Alan>
      <Alan etiket="Araç" zorunlu>
        <Secim ad="arac" zorunlu sutun={3} secenekler={ARACLAR.map((a) => ({ deger: a, ad: a }))} />
      </Alan>
      <Alan etiket="Ürün" zorunlu>
        <Girdi name="urun" required maxLength={80} defaultValue={talep ? `${Number(talep.miktar).toLocaleString("tr-TR")} ${talep.birim} ${talep.urun}` : ""} />
      </Alan>
      <Mesaj durum={durum} />
      <KaydetButonu />
    </Form>
  );
}
