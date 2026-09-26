"use client";

import { useActionState, useState } from "react";
import { Alan, Form, Girdi, KaydetButonu, Mesaj } from "@/components/form";
import { SecimPenceresi } from "@/components/secim-penceresi";
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
        <SecimPenceresi
          ad="saat"
          baslik={`Saat seçin`}
          zorunlu
          sutun={3}
          bosYazi="Saat seçmek için dokunun"
          onChange={(d) => setSaat(d[0] ? Number(d[0]) : null)}
          secenekler={saatler.map((s) => {
            const n = doluluk[s] ?? 0;
            return {
              deger: String(s),
              ad: `${String(s).padStart(2, "0")}:00`,
              // Doluluk pencerede de görünür: boş saati seçmek kolaylaşsın.
              etiket: (
                <span
                  className={`mt-1 w-fit rounded-md px-1.5 text-xs font-bold ${
                    n === 0 ? "bg-yesil text-white" : n === 1 ? "bg-sari text-black" : "bg-kirmizi text-white"
                  }`}
                >
                  {n === 0 ? "Boş" : `${n} araç`}
                </span>
              ),
            };
          })}
        />
        {dolu > 0 && (
          <p className="rounded-xl bg-sari px-4 py-3 font-semibold text-black">
            Bu saatte {dolu} teslimat daha var. Mümkünse boş bir saat seçin.
          </p>
        )}
      </Alan>
      <Alan etiket="Araç" zorunlu>
        <SecimPenceresi ad="arac" baslik="Araç" zorunlu sutun={2} bosYazi="Araç seçmek için dokunun" secenekler={ARACLAR.map((a) => ({ deger: a, ad: a }))} />
      </Alan>
      <Alan etiket="Ürün" zorunlu>
        <Girdi name="urun" required maxLength={80} defaultValue={talep ? `${Number(talep.miktar).toLocaleString("tr-TR")} ${talep.birim} ${talep.urun}` : ""} />
      </Alan>
      <Mesaj durum={durum} />
      <KaydetButonu />
    </Form>
  );
}
