"use client";

import { useActionState, useState } from "react";
import { Alan, Form, Girdi, KaydetButonu, Mesaj, Metin, TarihSecici } from "@/components/form";
import { FotoSecici } from "@/components/foto-secici";
import { SecimPenceresi } from "@/components/secim-penceresi";
import { taseronSecenekleri, type TaseronSecenek } from "@/components/secimler";
import { IS_TURU_LISTESI, MAHALLER, ROL_ADI, type Rol } from "@/lib/sabitler";
import { eksikleriEkle, type Yer } from "@/lib/yerler";
import { kararKaydet } from "../eylemler";

export type KararDeger = {
  id?: string;
  is_tarihi?: string;
  yer: string | null;
  daire: string | null;
  mahal: string | null;
  konu: string | null;
  karar: string;
  dis_katilimcilar: string[];
  muhataplar: string[];
};

/**
 * Yeni karar; `deger` kimlikle gelirse düzeltme, `onceki` verilirse eski
 * kararın yeni sürümü ("Kararı değiştir"). Düzeni Yeni Günlük ile aynı.
 */
export function KararFormu({
  firmaId,
  taseronlar,
  personel,
  yerler,
  deger,
  onceki,
  mevcutFotolar = [],
}: {
  firmaId: string;
  taseronlar: TaseronSecenek[];
  personel: { id: string; ad_soyad: string; rol: Rol }[];
  yerler: Yer[];
  deger?: KararDeger;
  onceki?: string;
  mevcutFotolar?: { yol: string; adres: string }[];
}) {
  const [durum, eylem, bekliyor] = useActionState(kararKaydet, undefined);
  const duzenle = Boolean(deger?.id);
  const [id] = useState(() => deger?.id ?? crypto.randomUUID());
  const listedeMahal = !deger?.mahal || MAHALLER.includes(deger.mahal);
  const [digerMahal, setDigerMahal] = useState(!listedeMahal);

  return (
    <Form eylem={eylem} bekliyor={bekliyor} className="flex flex-col gap-6">
      <input type="hidden" name="id" value={id} />
      {duzenle && <input type="hidden" name="duzenle" value="1" />}
      {onceki && <input type="hidden" name="onceki" value={onceki} />}

      <Alan etiket="Fotoğraf" ipucu="İsteğe bağlı: yerin, ölçünün ya da eskizin fotoğrafı.">
        <FotoSecici firmaId={firmaId} klasor="karar" mevcut={mevcutFotolar} />
      </Alan>

      <Alan etiket="Kiminle karar verildi?" ipucu="Seçilenler kendi hesaplarından “Okudum” der.">
        <SecimPenceresi
          ad="muhatap"
          baslik="Kiminle karar verildi?"
          coklu
          bosYazi="Taşeron ya da kişi seçmek için dokunun"
          varsayilan={deger?.muhataplar}
          secenekler={[
            ...taseronSecenekleri(taseronlar, "Taşeronlar", "t:"),
            ...personel.map((p) => ({ deger: "k:" + p.id, ad: p.ad_soyad, alt: ROL_ADI[p.rol], grup: "Personel" })),
          ]}
        />
        <Girdi
          name="dis_katilimcilar"
          maxLength={300}
          placeholder="Dışarıdan: Mimar Ayşe Hanım, Mal sahibi…"
          defaultValue={deger?.dis_katilimcilar.join(", ") ?? ""}
        />
      </Alan>

      <Alan etiket="Tarih">
        <TarihSecici varsayilan={deger?.is_tarihi} />
      </Alan>

      <Alan etiket="Yer">
        <SecimPenceresi
          ad="yer"
          baslik="Nerede?"
          sutun={3}
          bosYazi="Yer seçmek için dokunun"
          varsayilan={deger?.yer ? [deger.yer] : []}
          secenekler={eksikleriEkle(yerler, [deger?.yer])}
        />
      </Alan>

      <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-3">
        <Alan etiket="Daire no">
          <Girdi name="daire" maxLength={20} placeholder="Örn. 12" defaultValue={deger?.daire ?? ""} />
        </Alan>
        <Alan etiket="Mahal">
          <SecimPenceresi
            ad="mahal"
            baslik="Mahal"
            sutun={2}
            bosYazi="Seçin"
            varsayilan={deger?.mahal ? [listedeMahal ? deger.mahal : "Diğer"] : []}
            secenekler={[...MAHALLER, "Diğer"].map((m) => ({ deger: m, ad: m === "Diğer" ? "Diğer (yazarak)" : m }))}
            onChange={(d) => setDigerMahal(d[0] === "Diğer")}
          />
        </Alan>
      </div>
      {digerMahal && (
        <Girdi
          name="mahal_diger"
          maxLength={60}
          placeholder="Örn. 6. kat merdiveni, otopark rampası"
          defaultValue={!listedeMahal ? (deger?.mahal ?? "") : ""}
          autoFocus={!duzenle}
        />
      )}

      <Alan etiket="Konu">
        <SecimPenceresi
          ad="konu"
          baslik="Konu"
          sutun={2}
          bosYazi="İş türü seçmek için dokunun"
          varsayilan={deger?.konu ? [deger.konu] : []}
          secenekler={IS_TURU_LISTESI.map((t) => ({ deger: t, ad: t }))}
        />
      </Alan>

      <Alan etiket="Karar" zorunlu>
        <Metin
          name="karar"
          required
          maxLength={1000}
          placeholder="Ne kararlaştırıldı? Ölçü, malzeme, yöntem…"
          defaultValue={deger?.karar ?? ""}
        />
      </Alan>

      <Mesaj durum={durum} />
      <div className="sticky bottom-3">
        <KaydetButonu>{duzenle ? "Değişiklikleri Kaydet" : onceki ? "Yeni Kararı Kaydet" : "Kaydet"}</KaydetButonu>
      </div>
    </Form>
  );
}
