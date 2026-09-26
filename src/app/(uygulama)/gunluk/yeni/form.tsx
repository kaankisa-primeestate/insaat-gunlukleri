"use client";

import { useActionState, useState } from "react";
import { Alan, Form, Girdi, KaydetButonu, Mesaj, Metin, TarihSecici } from "@/components/form";
import { FotoSecici } from "@/components/foto-secici";
import { SecimPenceresi } from "@/components/secim-penceresi";
import { SayiSecici, TaseronSecici, type TaseronSecenek } from "@/components/secimler";
import { IS_TURLERI } from "@/lib/sabitler";
import { gunlukKaydet } from "../eylemler";

export function GunlukFormu({ firmaId, taseronlar, katlar }: { firmaId: string; taseronlar: TaseronSecenek[]; katlar: string[] }) {
  const [durum, eylem, bekliyor] = useActionState(gunlukKaydet, undefined);
  // Kimlik formda üretilir: çift dokunmada aynı kayıt iki kez oluşmaz.
  const [id] = useState(() => crypto.randomUUID());
  const [taseron, setTaseron] = useState<TaseronSecenek | undefined>(taseronlar.length === 1 ? taseronlar[0] : undefined);
  const [digerSecili, setDigerSecili] = useState(false);
  // İşler, taşeronun yaptığı iş türüne göre başlıklara ayrılır; her başlıkta
  // önce "genel" seçeneği, sonra kalemler. Kayıtta "Sıva: Kaba sıva" olarak durur.
  const kalemler = taseron
    ? taseron.is_turleri
        .filter((tur) => tur !== "Diğer")
        .flatMap((tur) => [
          { deger: tur, ad: `${tur} (genel)`, grup: tur },
          ...(IS_TURLERI[tur] ?? []).map((k) => ({ deger: `${tur}: ${k}`, ad: k, grup: tur })),
        ])
    : [];

  return (
    <Form eylem={eylem} bekliyor={bekliyor} className="flex flex-col gap-6">
      <input type="hidden" name="id" value={id} />
      <Alan etiket="Taşeron" zorunlu>
        <TaseronSecici
          taseronlar={taseronlar}
          onChange={(t) => {
            setTaseron(t);
            setDigerSecili(false);
          }}
        />
      </Alan>

      <Alan etiket="Tarih">
        <TarihSecici />
      </Alan>

      <Alan etiket="Kişi sayısı">
        <SayiSecici ad="kisi_sayisi" varsayilan={1} />
      </Alan>

      <Alan etiket="Kat" ipucu="Birden fazla kat seçebilirsiniz.">
        <SecimPenceresi
          ad="katlar"
          baslik="Hangi katlarda çalışıldı?"
          coklu
          sutun={3}
          bosYazi="Kat seçmek için dokunun"
          secenekler={katlar.map((k) => ({ deger: k, ad: k }))}
        />
      </Alan>

      {taseron && (
        <Alan etiket="Yapılan iş" ipucu="Birden fazla iş seçebilirsiniz.">
          <SecimPenceresi
            key={taseron.id}
            ad="is_kalemleri"
            baslik="Hangi işler yapıldı?"
            coklu
            sutun={2}
            bosYazi="Yapılan işi seçmek için dokunun"
            secenekler={[...kalemler, { deger: "Diğer", ad: "Diğer (yazarak)", grup: "Diğer" }]}
            onChange={(d) => setDigerSecili(d.includes("Diğer"))}
          />
          {digerSecili && <Girdi name="is_kalemi_diger" placeholder="Diğer: yapılan işi yazın" maxLength={80} />}
        </Alan>
      )}

      <Alan etiket="Kısa not">
        <Metin name="notu" maxLength={300} placeholder="İsteğe bağlı" />
      </Alan>

      <Alan etiket="Fotoğraf">
        <FotoSecici firmaId={firmaId} klasor="gunluk" />
      </Alan>

      <Mesaj durum={durum} />
      <div className="sticky bottom-3">
        <KaydetButonu />
      </div>
    </Form>
  );
}
