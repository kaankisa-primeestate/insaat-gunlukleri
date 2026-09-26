"use client";

import { useActionState, useState } from "react";
import { Alan, Form, KaydetButonu, Mesaj, Metin, Secim, TarihSecici } from "@/components/form";
import { FotoSecici } from "@/components/foto-secici";
import { TaseronSecici, type TaseronSecenek } from "@/components/secimler";
import { ONEM } from "@/lib/sabitler";
import { hataKaydet } from "../eylemler";

export function HataFormu({ firmaId, taseronlar, katlar }: { firmaId: string; taseronlar: TaseronSecenek[]; katlar: string[] }) {
  const [durum, eylem, bekliyor] = useActionState(hataKaydet, undefined);
  const [id] = useState(() => crypto.randomUUID());
  return (
    <Form eylem={eylem} bekliyor={bekliyor} className="flex flex-col gap-6">
      <input type="hidden" name="id" value={id} />
      <Alan etiket="Fotoğraf" zorunlu>
        <FotoSecici firmaId={firmaId} klasor="hatali" zorunlu />
      </Alan>
      <Alan etiket="Taşeron" zorunlu>
        <TaseronSecici taseronlar={taseronlar} />
      </Alan>
      <Alan etiket="Önem derecesi" zorunlu>
        <Secim
          ad="onem"
          zorunlu
          sutun={3}
          varsayilan="normal"
          secenekler={(Object.keys(ONEM) as (keyof typeof ONEM)[]).map((k) => ({
            deger: k,
            ad: ONEM[k].ad,
            renk: ONEM[k].secili,
          }))}
        />
      </Alan>
      <Alan etiket="Açıklama" zorunlu>
        <Metin name="aciklama" required maxLength={300} placeholder="Ne eksik / hatalı?" />
      </Alan>
      <Alan etiket="Tarih">
        <TarihSecici />
      </Alan>
      <Alan etiket="Kat">
        <Secim ad="kat" sutun={4} secenekler={katlar.map((k) => ({ deger: k, ad: k }))} />
      </Alan>
      <Mesaj durum={durum} />
      <div className="sticky bottom-3">
        <KaydetButonu renk="kirmizi" />
      </div>
    </Form>
  );
}
