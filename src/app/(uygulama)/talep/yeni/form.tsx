"use client";

import { useActionState, useState } from "react";
import { Alan, Form, Girdi, KaydetButonu, Mesaj, Metin, Secim } from "@/components/form";
import { TaseronSecici, type TaseronSecenek } from "@/components/secimler";
import { BIRIMLER } from "@/lib/sabitler";
import { talepKaydet } from "../eylemler";

const SIK_URUNLER = ["Kum", "Çakıl", "Çimento", "Hazır beton", "İnşaat demiri", "Tuğla", "Bims", "Alçı", "Kablo", "Boru", "Boya", "Seramik"];

export function TalepFormu({ taseronlar }: { taseronlar: TaseronSecenek[] }) {
  const [durum, eylem, bekliyor] = useActionState(talepKaydet, undefined);
  const [id] = useState(() => crypto.randomUUID());
  const [urun, setUrun] = useState("");
  return (
    <Form eylem={eylem} bekliyor={bekliyor} className="flex flex-col gap-6">
      <input type="hidden" name="id" value={id} />
      <Alan etiket="Hangi taşeron için?" zorunlu>
        <TaseronSecici taseronlar={taseronlar} />
      </Alan>
      <Alan etiket="Ürün" zorunlu>
        <div className="flex flex-wrap gap-2">
          {SIK_URUNLER.map((u) => (
            <button
              key={u}
              type="button"
              onClick={() => setUrun(u)}
              className={`min-h-12 rounded-xl border-2 px-3 font-semibold ${urun === u ? "border-yazi bg-koyu text-white" : "border-cizgi bg-yuzey"}`}
            >
              {u}
            </button>
          ))}
        </div>
        <Girdi name="urun" required maxLength={80} value={urun} onChange={(e) => setUrun(e.target.value)} placeholder="veya yazın" />
      </Alan>
      <Alan etiket="Miktar" zorunlu>
        <Girdi name="miktar" type="number" inputMode="decimal" step="any" min="0" required className="text-2xl font-bold" />
      </Alan>
      <Alan etiket="Birim" zorunlu>
        <Secim ad="birim" zorunlu sutun={4} varsayilan="Adet" secenekler={BIRIMLER.map((b) => ({ deger: b, ad: b }))} />
      </Alan>
      <Alan etiket="Not">
        <Metin name="notu" maxLength={300} placeholder="İsteğe bağlı: marka, ölçü, aciliyet" />
      </Alan>
      <Mesaj durum={durum} />
      <div className="sticky bottom-3">
        <KaydetButonu>Talebi Aç</KaydetButonu>
      </div>
    </Form>
  );
}
