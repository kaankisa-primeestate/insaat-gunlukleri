"use client";

import { useActionState, useState } from "react";
import { Alan, Form, KaydetButonu, Mesaj, Metin, Secim, TarihSecici } from "@/components/form";
import { FotoSecici } from "@/components/foto-secici";
import { SecimPenceresi } from "@/components/secim-penceresi";
import { taseronSecenekleri, type TaseronSecenek } from "@/components/secimler";
import { ONEM, ROL_ADI, type Rol } from "@/lib/sabitler";
import { hataKaydet } from "../eylemler";

export function HataFormu({
  firmaId,
  taseronlar,
  personel,
  katlar,
}: {
  firmaId: string;
  taseronlar: TaseronSecenek[];
  personel: { id: string; ad_soyad: string; rol: Rol }[];
  katlar: string[];
}) {
  const [durum, eylem, bekliyor] = useActionState(hataKaydet, undefined);
  const [id] = useState(() => crypto.randomUUID());
  return (
    <Form eylem={eylem} bekliyor={bekliyor} className="flex flex-col gap-6">
      <input type="hidden" name="id" value={id} />
      <Alan etiket="Fotoğraf" zorunlu>
        <FotoSecici firmaId={firmaId} klasor="hatali" zorunlu />
      </Alan>
      <Alan etiket="Kimin işi?" zorunlu ipucu="Bir taşeron ya da bir kişi (kalfa, şef…) seçin.">
        {/* Değer "t:" ile taşeron, "k:" ile kullanıcı kimliği taşır. */}
        <SecimPenceresi
          ad="sorumlu"
          baslik="Kimin işi?"
          zorunlu
          bosYazi="Taşeron ya da kişi seçmek için dokunun"
          secenekler={[
            ...taseronSecenekleri(taseronlar, "Taşeronlar", "t:"),
            ...personel.map((p) => ({ deger: "k:" + p.id, ad: p.ad_soyad, alt: ROL_ADI[p.rol], grup: "Personel" })),
          ]}
        />
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
        <SecimPenceresi ad="kat" baslik="Hangi kat?" sutun={3} bosYazi="Kat seçmek için dokunun" secenekler={katlar.map((k) => ({ deger: k, ad: k }))} />
      </Alan>
      <Mesaj durum={durum} />
      <div className="sticky bottom-3">
        <KaydetButonu renk="kirmizi" />
      </div>
    </Form>
  );
}
