"use client";

import { useActionState, useState } from "react";
import { Alan, Form, Girdi, KaydetButonu, Mesaj, Metin, TarihSecici } from "@/components/form";
import { FotoSecici } from "@/components/foto-secici";
import { SecimPenceresi } from "@/components/secim-penceresi";
import { SayiSecici, TaseronSecici, type TaseronSecenek } from "@/components/secimler";
import { IS_TURLERI } from "@/lib/sabitler";
import { gunlukKaydet } from "../eylemler";

export type GunlukDeger = {
  id: string;
  taseron_id: string;
  is_tarihi: string;
  kisi_sayisi: number;
  katlar: string[];
  is_kalemleri: string[];
  notu: string | null;
};

/** Yeni günlük; `deger` verilirse mevcut günlüğün düzeltilmesi. */
export function GunlukFormu({
  firmaId,
  taseronlar,
  katlar,
  deger,
  mevcutFotolar = [],
}: {
  firmaId: string;
  taseronlar: TaseronSecenek[];
  katlar: string[];
  deger?: GunlukDeger;
  mevcutFotolar?: { yol: string; adres: string }[];
}) {
  const [durum, eylem, bekliyor] = useActionState(gunlukKaydet, undefined);
  // Kimlik formda üretilir: çift dokunmada aynı kayıt iki kez oluşmaz.
  const [id] = useState(() => deger?.id ?? crypto.randomUUID());
  const [taseron, setTaseron] = useState<TaseronSecenek | undefined>(
    taseronlar.find((t) => t.id === deger?.taseron_id) ?? (taseronlar.length === 1 ? taseronlar[0] : undefined),
  );
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
  // Düzenlenen kayıtta listede olmayan (elle yazılmış) değerler kaybolmasın.
  const ekKalemler = (deger?.is_kalemleri ?? [])
    .filter((k) => !kalemler.some((x) => x.deger === k))
    .map((k) => ({ deger: k, ad: k, grup: "Diğer" }));
  const katSecenekleri = [...katlar, ...(deger?.katlar ?? []).filter((k) => !katlar.includes(k))];

  return (
    <Form eylem={eylem} bekliyor={bekliyor} className="flex flex-col gap-6">
      <input type="hidden" name="id" value={id} />
      {deger && <input type="hidden" name="duzenle" value="1" />}
      <Alan etiket="Taşeron" zorunlu>
        <TaseronSecici
          taseronlar={taseronlar}
          varsayilan={deger?.taseron_id}
          onChange={(t) => {
            setTaseron(t);
            setDigerSecili(false);
          }}
        />
      </Alan>

      <Alan etiket="Tarih">
        <TarihSecici varsayilan={deger?.is_tarihi} />
      </Alan>

      <Alan etiket="Kişi sayısı">
        <SayiSecici ad="kisi_sayisi" varsayilan={deger?.kisi_sayisi ?? 1} />
      </Alan>

      <Alan etiket="Kat" ipucu="Birden fazla kat seçebilirsiniz.">
        <SecimPenceresi
          ad="katlar"
          baslik="Hangi katlarda çalışıldı?"
          coklu
          sutun={3}
          bosYazi="Kat seçmek için dokunun"
          varsayilan={deger?.katlar}
          secenekler={katSecenekleri.map((k) => ({ deger: k, ad: k }))}
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
            varsayilan={taseron.id === deger?.taseron_id ? deger.is_kalemleri : []}
            secenekler={[...kalemler, ...ekKalemler, { deger: "Diğer", ad: "Diğer (yazarak)", grup: "Diğer" }]}
            onChange={(d) => setDigerSecili(d.includes("Diğer"))}
          />
          {digerSecili && <Girdi name="is_kalemi_diger" placeholder="Diğer: yapılan işi yazın" maxLength={80} />}
        </Alan>
      )}

      <Alan etiket="Kısa not">
        <Metin name="notu" maxLength={300} placeholder="İsteğe bağlı" defaultValue={deger?.notu ?? ""} />
      </Alan>

      <Alan etiket="Fotoğraf">
        <FotoSecici firmaId={firmaId} klasor="gunluk" mevcut={mevcutFotolar} />
      </Alan>

      <Mesaj durum={durum} />
      <div className="sticky bottom-3">
        <KaydetButonu>{deger ? "Değişiklikleri Kaydet" : "Kaydet"}</KaydetButonu>
      </div>
    </Form>
  );
}
