"use client";

import { useActionState, useState } from "react";
import { Alan, Form, Girdi, KaydetButonu, Mesaj, Metin } from "@/components/form";
import { ElleDugmesi, FotoEki, TarihEki, ilerle } from "@/components/hizli";
import { SecimPenceresi } from "@/components/secim-penceresi";
import { SayiSecici, TaseronSecici, type TaseronSecenek } from "@/components/secimler";
import { IS_TURLERI } from "@/lib/sabitler";
import { eksikleriEkle, type Yer } from "@/lib/yerler";
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

/**
 * Yeni günlük; `deger` verilirse mevcut günlüğün düzeltilmesi. Sıra sahadaki
 * cümleyle aynı ("4 sıvacı Bodrum katta iç sıva"): taşeron, kaç kişi, ne iş,
 * nerede. Fotoğraf ve tarih ek: dokunulmazsa kayıt bugünün tarihini alır.
 */
export function GunlukFormu({
  firmaId,
  taseronlar,
  katlar,
  deger,
  mevcutFotolar = [],
}: {
  firmaId: string;
  taseronlar: TaseronSecenek[];
  katlar: Yer[];
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
  const [elleYer, setElleYer] = useState(false);
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
  const katSecenekleri = eksikleriEkle(katlar, deger?.katlar ?? []);

  return (
    <Form
      eylem={eylem}
      bekliyor={bekliyor}
      cevrimdisi={{ tur: "gunluk", ozet: (v) => `${taseron?.firma_adi ?? "Taşeron"} · ${v.get("kisi_sayisi")} kişi · ${v.getAll("katlar").join(", ") || v.get("kat_elle") || ""}` }}
      className="flex flex-col gap-6"
    >
      <input type="hidden" name="id" value={id} />
      {deger && <input type="hidden" name="duzenle" value="1" />}
      <div id="g-taseron">
        <Alan etiket="Taşeron" zorunlu>
          <TaseronSecici
            taseronlar={taseronlar}
            varsayilan={deger?.taseron_id}
            onChange={(t) => {
              setTaseron(t);
              setDigerSecili(false);
              ilerle("g-kisi");
            }}
          />
        </Alan>
      </div>

      <div id="g-kisi">
        <Alan etiket="Kaç kişi?" zorunlu>
          <SayiSecici ad="kisi_sayisi" varsayilan={deger?.kisi_sayisi ?? 1} />
        </Alan>
      </div>

      {taseron && (
        <div id="g-is">
          <Alan etiket="Ne iş yaptı?" ipucu="Birden fazla iş seçebilirsiniz.">
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
              sonra={() => ilerle("g-yer", false)}
            />
            {digerSecili && <Girdi name="is_kalemi_diger" placeholder="Diğer: yapılan işi yazın" maxLength={80} />}
          </Alan>
        </div>
      )}

      <div id="g-yer">
        <Alan etiket="Nerede?" zorunlu ipucu="Birden fazla yer seçebilirsiniz.">
          <SecimPenceresi
            ad="katlar"
            baslik="Nerede çalışıldı?"
            coklu
            zorunlu={!elleYer}
            sutun={3}
            bosYazi="Yer seçmek için dokunun"
            varsayilan={deger?.katlar}
            secenekler={katSecenekleri}
            sonra={() => ilerle("g-not", false)}
          />
          {elleYer && (
            <Girdi name="kat_elle" required maxLength={80} placeholder="Örn. Bahçe duvarı, otopark rampası" autoFocus />
          )}
          <ElleDugmesi elle={elleYer} onClick={() => setElleYer((x) => !x)} />
        </Alan>
      </div>

      <div id="g-not">
        <Alan etiket="Not">
          <Metin name="notu" maxLength={300} placeholder="İsteğe bağlı" defaultValue={deger?.notu ?? ""} />
        </Alan>
      </div>

      <div className="flex flex-wrap gap-2">
        <FotoEki firmaId={firmaId} klasor="gunluk" mevcut={mevcutFotolar} cevrimdisi />
        <TarihEki varsayilan={deger?.is_tarihi} />
      </div>

      <Mesaj durum={durum} />
      <div className="sticky bottom-3">
        <KaydetButonu>{deger ? "Değişiklikleri Kaydet" : "Kaydet"}</KaydetButonu>
      </div>
    </Form>
  );
}
