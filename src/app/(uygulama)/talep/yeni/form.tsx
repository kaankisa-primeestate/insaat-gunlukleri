"use client";

import { useActionState, useState } from "react";
import { Alan, Form, Girdi, KaydetButonu, Mesaj, Metin } from "@/components/form";
import { SecimPenceresi } from "@/components/secim-penceresi";
import { TaseronSecici, type TaseronSecenek } from "@/components/secimler";
import { BIRIMLER } from "@/lib/sabitler";
import { talepKaydet } from "../eylemler";

const SIK_URUNLER = ["Kum", "Çakıl", "Çimento", "Hazır beton", "İnşaat demiri", "Tuğla", "Bims", "Alçı", "Kablo", "Boru", "Boya", "Seramik"];

export function TalepFormu({ taseronlar }: { taseronlar: TaseronSecenek[] }) {
  const [durum, eylem, bekliyor] = useActionState(talepKaydet, undefined);
  const [id] = useState(() => crypto.randomUUID());
  const [diger, setDiger] = useState(false);
  return (
    <Form eylem={eylem} bekliyor={bekliyor} className="flex flex-col gap-6">
      <input type="hidden" name="id" value={id} />
      <Alan etiket="Hangi taşeron için?" zorunlu>
        <TaseronSecici taseronlar={taseronlar} />
      </Alan>
      <Alan etiket="Ürün" zorunlu>
        <SecimPenceresi
          ad="urun_secim"
          baslik="Ürün"
          zorunlu
          bosYazi="Ürün seçmek için dokunun"
          secenekler={[...SIK_URUNLER, "Diğer"].map((u) => ({ deger: u, ad: u === "Diğer" ? "Diğer (yazarak)" : u }))}
          onChange={(d) => setDiger(d[0] === "Diğer")}
        />
        {diger && <Girdi name="urun_diger" required maxLength={80} placeholder="Ürünü yazın" autoFocus />}
      </Alan>
      <Alan etiket="Miktar" zorunlu>
        <Girdi name="miktar" type="number" inputMode="decimal" step="any" min="0" required className="text-2xl font-bold" />
      </Alan>
      <Alan etiket="Birim" zorunlu>
        <SecimPenceresi ad="birim" baslik="Birim" zorunlu sutun={3} varsayilan={["Adet"]} secenekler={BIRIMLER.map((b) => ({ deger: b, ad: b }))} />
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
